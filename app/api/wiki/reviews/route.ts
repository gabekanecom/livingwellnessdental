import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { canViewReviewQueue } from '@/lib/wiki/permissions';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission
    const hasPermission = await canViewReviewQueue(user.id);
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'You do not have permission to view the review queue' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING';
    const assignedToId = searchParams.get('assignedToId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Record<string, unknown> = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    const [reviews, total] = await Promise.all([
      prisma.articleReview.findMany({
        where,
        include: {
          article: {
            select: {
              id: true,
              title: true,
              slug: true,
              excerpt: true,
              status: true,
              categories: {
                include: { category: { select: { name: true } } },
                orderBy: { isPrimary: 'desc' },
                take: 1,
              },
            },
          },
          submittedBy: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          assignedTo: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          reviewedBy: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
        orderBy: { submittedAt: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.articleReview.count({ where }),
    ]);

    // Map reviews to have category in expected format
    const mappedReviews = reviews.map(review => ({
      ...review,
      article: {
        ...review.article,
        category: review.article.categories[0]?.category || null,
      },
    }));

    return NextResponse.json({
      reviews: mappedReviews,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + reviews.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
