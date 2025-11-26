import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const categoryId = searchParams.get('categoryId');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Full-text search using PostgreSQL
    const articles = await prisma.$queryRaw`
      SELECT
        a.id,
        a.title,
        a.slug,
        a.excerpt,
        a."coverImage",
        c.name as "categoryName",
        c.slug as "categorySlug",
        ts_rank(
          to_tsvector('english', coalesce(a.title, '') || ' ' || coalesce(a."contentPlain", '')),
          plainto_tsquery('english', ${query})
        ) as score
      FROM "WikiArticle" a
      JOIN "WikiCategory" c ON c.id = a."categoryId"
      WHERE
        a.status = 'PUBLISHED'
        AND to_tsvector('english', coalesce(a.title, '') || ' ' || coalesce(a."contentPlain", ''))
            @@ plainto_tsquery('english', ${query})
        ${categoryId ? prisma.$queryRaw`AND a."categoryId" = ${categoryId}` : prisma.$queryRaw``}
      ORDER BY score DESC
      LIMIT ${limit}
    `;

    // Log search
    await prisma.wikiSearchLog.create({
      data: {
        query,
        results: (articles as any[]).length,
      },
    });

    return NextResponse.json({ results: articles });
  } catch (error) {
    console.error('Error searching articles:', error);
    return NextResponse.json(
      { error: 'Failed to search articles' },
      { status: 500 }
    );
  }
}
