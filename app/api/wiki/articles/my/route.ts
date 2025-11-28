import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    const [drafts, inReview, published, totalViews] = await Promise.all([
      prisma.wikiArticle.findMany({
        where: {
          authorId: userId,
          status: 'DRAFT',
        },
        include: {
          categories: {
            include: { category: { select: { id: true, name: true, slug: true } } },
            orderBy: { isPrimary: 'desc' },
          },
          reviews: {
            where: { status: 'REJECTED' },
            orderBy: { reviewedAt: 'desc' },
            take: 1,
            select: {
              id: true,
              status: true,
              feedback: true,
              submittedAt: true,
              reviewedAt: true,
              reviewedBy: { select: { name: true } },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.wikiArticle.findMany({
        where: {
          authorId: userId,
          status: 'IN_REVIEW',
        },
        include: {
          categories: {
            include: { category: { select: { id: true, name: true, slug: true } } },
            orderBy: { isPrimary: 'desc' },
          },
          reviews: {
            where: { status: 'PENDING' },
            orderBy: { submittedAt: 'desc' },
            take: 1,
            select: {
              id: true,
              status: true,
              submittedAt: true,
              assignedTo: { select: { name: true } },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.wikiArticle.findMany({
        where: {
          authorId: userId,
          status: 'PUBLISHED',
        },
        include: {
          categories: {
            include: { category: { select: { id: true, name: true, slug: true } } },
            orderBy: { isPrimary: 'desc' },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.wikiArticle.aggregate({
        where: {
          authorId: userId,
          status: 'PUBLISHED',
        },
        _sum: { views: true },
      }),
    ]);

    return NextResponse.json({
      drafts,
      inReview,
      published,
      stats: {
        totalArticles: drafts.length + inReview.length + published.length,
        totalPublished: published.length,
        totalViews: totalViews._sum.views || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching user articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}
