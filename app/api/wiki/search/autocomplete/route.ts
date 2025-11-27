import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const articles = await prisma.wikiArticle.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { contentPlain: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        category: { select: { name: true } },
      },
      take: 6,
      orderBy: { views: 'desc' },
    });

    return NextResponse.json({ suggestions: articles });
  } catch (error) {
    console.error('Error in autocomplete:', error);
    return NextResponse.json({ suggestions: [] });
  }
}
