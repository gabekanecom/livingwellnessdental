import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { canViewReviewQueue, canReviewArticles } from '@/lib/wiki/permissions';
import { notifyAuthorOfApproval, notifyAuthorOfRejection } from '@/lib/notifications';

// GET - Get review details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check permission
    const hasPermission = await canViewReviewQueue(user.id);
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'You do not have permission to view reviews' },
        { status: 403 }
      );
    }

    const review = await prisma.articleReview.findUnique({
      where: { id },
      include: {
        article: {
          include: {
            categories: {
              include: { category: { select: { name: true } } },
              orderBy: { isPrimary: 'desc' },
            },
            author: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
        submittedBy: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        assignedBy: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        reviewedBy: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error('Error fetching review:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review' },
      { status: 500 }
    );
  }
}

// PATCH - Approve or reject review
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { action, feedback, internalNotes } = await request.json();

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Check permission
    const hasPermission = await canReviewArticles(user.id);
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'You do not have permission to review articles' },
        { status: 403 }
      );
    }

    // Get the review
    const review = await prisma.articleReview.findUnique({
      where: { id },
      include: {
        article: {
          select: { id: true, title: true, slug: true, authorId: true },
        },
      },
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (review.status !== 'PENDING' && review.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'This review has already been completed' },
        { status: 400 }
      );
    }

    // Reject requires feedback
    if (action === 'reject' && !feedback) {
      return NextResponse.json(
        { error: 'Feedback is required when rejecting an article' },
        { status: 400 }
      );
    }

    // Get reviewer details
    const reviewer = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, email: true },
    });

    if (!reviewer) {
      return NextResponse.json({ error: 'Reviewer not found' }, { status: 404 });
    }

    // Update review and article in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update review
      const updatedReview = await tx.articleReview.update({
        where: { id },
        data: {
          status: action === 'approve' ? 'APPROVED' : 'REJECTED',
          reviewedById: user.id,
          reviewedAt: new Date(),
          feedback: feedback || null,
          internalNotes: internalNotes || null,
        },
      });

      // Update article status
      const updatedArticle = await tx.wikiArticle.update({
        where: { id: review.article.id },
        data: {
          status: action === 'approve' ? 'PUBLISHED' : 'DRAFT',
          ...(action === 'approve' ? { publishedAt: new Date() } : {}),
        },
        include: {
          categories: {
            include: { category: { select: { name: true } } },
            orderBy: { isPrimary: 'desc' },
          },
          author: { select: { name: true } },
        },
      });

      return { review: updatedReview, article: updatedArticle };
    });

    // Send notification to author
    if (action === 'approve') {
      await notifyAuthorOfApproval(
        { id: review.article.id, title: review.article.title, slug: review.article.slug },
        review.article.authorId,
        { name: reviewer.name }
      );
    } else {
      await notifyAuthorOfRejection(
        { id: review.article.id, title: review.article.title, slug: review.article.slug },
        review.article.authorId,
        { name: reviewer.name },
        feedback
      );
    }

    return NextResponse.json({
      message: action === 'approve' ? 'Article approved and published' : 'Article returned for revision',
      review: result.review,
      article: result.article,
    });
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    );
  }
}
