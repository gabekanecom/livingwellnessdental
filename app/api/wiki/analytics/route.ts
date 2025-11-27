import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalArticles,
      publishedArticles,
      draftArticles,
      inReviewArticles,
      totalViews,
      totalCategories,
      totalTags,
      topArticles,
      recentSearches,
      topSearches,
      articlesByCategory,
      recentlyUpdated,
    ] = await Promise.all([
      prisma.wikiArticle.count(),
      prisma.wikiArticle.count({ where: { status: 'PUBLISHED' } }),
      prisma.wikiArticle.count({ where: { status: 'DRAFT' } }),
      prisma.wikiArticle.count({ where: { status: 'IN_REVIEW' } }),
      prisma.wikiArticle.aggregate({
        _sum: { views: true },
        where: { status: 'PUBLISHED' },
      }),
      prisma.wikiCategory.count(),
      prisma.wikiTag.count(),
      prisma.wikiArticle.findMany({
        where: { status: 'PUBLISHED' },
        select: {
          id: true,
          title: true,
          slug: true,
          views: true,
          category: { select: { name: true } },
        },
        orderBy: { views: 'desc' },
        take: 10,
      }),
      prisma.wikiSearchLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.wikiSearchLog.groupBy({
        by: ['query'],
        _count: { query: true },
        orderBy: { _count: { query: 'desc' } },
        take: 10,
      }),
      prisma.wikiCategory.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: { articles: { where: { status: 'PUBLISHED' } } },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.wikiArticle.findMany({
        where: { status: 'PUBLISHED' },
        select: {
          id: true,
          title: true,
          slug: true,
          updatedAt: true,
          author: { select: { name: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      overview: {
        totalArticles,
        publishedArticles,
        draftArticles,
        inReviewArticles,
        totalViews: totalViews._sum.views || 0,
        totalCategories,
        totalTags,
      },
      topArticles,
      recentSearches,
      topSearches: topSearches.map((s) => ({
        query: s.query,
        count: s._count.query,
      })),
      articlesByCategory: articlesByCategory.map((c) => ({
        id: c.id,
        name: c.name,
        count: c._count.articles,
      })),
      recentlyUpdated,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
