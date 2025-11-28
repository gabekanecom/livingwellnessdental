import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const categoryId = searchParams.get('category');
    const tagName = searchParams.get('tag');
    const sort = searchParams.get('sort') || 'relevance';
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const whereConditions: any = {
      status: 'PUBLISHED',
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { contentPlain: { contains: query, mode: 'insensitive' } },
      ],
    };

    if (categoryId) {
      whereConditions.categories = {
        some: { categoryId },
      };
    }

    if (tagName) {
      whereConditions.tags = {
        some: { name: { equals: tagName, mode: 'insensitive' } },
      };
    }

    const orderBy = sort === 'date' 
      ? { updatedAt: 'desc' as const }
      : sort === 'views'
      ? { views: 'desc' as const }
      : { views: 'desc' as const };

    const articles = await prisma.wikiArticle.findMany({
      where: whereConditions,
      include: {
        categories: {
          include: { category: { select: { id: true, name: true, slug: true } } },
          orderBy: { isPrimary: 'desc' },
        },
        author: { select: { name: true } },
        tags: { select: { id: true, name: true } },
      },
      orderBy,
      take: limit,
    });

    const resultsWithHighlight = articles.map(article => {
      const lowerQuery = query.toLowerCase();
      const titleMatch = article.title.toLowerCase().includes(lowerQuery);
      const contentMatch = article.contentPlain?.toLowerCase().includes(lowerQuery);
      
      let snippet = article.excerpt || '';
      if (contentMatch && article.contentPlain) {
        const index = article.contentPlain.toLowerCase().indexOf(lowerQuery);
        if (index !== -1) {
          const start = Math.max(0, index - 60);
          const end = Math.min(article.contentPlain.length, index + query.length + 60);
          snippet = (start > 0 ? '...' : '') + 
                   article.contentPlain.slice(start, end) + 
                   (end < article.contentPlain.length ? '...' : '');
        }
      }

      // Get primary category (first in sorted list)
      const primaryCategory = article.categories[0]?.category || null;

      return {
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: snippet,
        coverImage: article.coverImage,
        views: article.views,
        updatedAt: article.updatedAt,
        category: primaryCategory,
        categories: article.categories.map(c => c.category),
        author: article.author,
        tags: article.tags,
        matchType: titleMatch ? 'title' : 'content',
      };
    });

    await prisma.wikiSearchLog.create({
      data: {
        query,
        results: articles.length,
      },
    });

    const categories = await prisma.wikiCategory.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    const tags = await prisma.wikiTag.findMany({
      where: {
        articles: { some: { status: 'PUBLISHED' } },
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ 
      results: resultsWithHighlight,
      filters: { categories, tags },
      total: articles.length,
    });
  } catch (error) {
    console.error('Error searching articles:', error);
    return NextResponse.json(
      { error: 'Failed to search articles' },
      { status: 500 }
    );
  }
}
