import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { canAssignReviewers, canReviewArticles } from '@/lib/wiki/permissions';
import { notifyReviewerOfAssignment } from '@/lib/notifications';

export async function POST(
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
    const { assigneeId } = await request.json();

    if (!assigneeId) {
      return NextResponse.json(
        { error: 'Assignee ID is required' },
        { status: 400 }
      );
    }

    // Check permission to assign reviewers
    const hasPermission = await canAssignReviewers(user.id);
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'You do not have permission to assign reviewers' },
        { status: 403 }
      );
    }

    // Get the review
    const review = await prisma.articleReview.findUnique({
      where: { id },
      include: {
        article: {
          select: { id: true, title: true, slug: true },
        },
      },
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (review.status !== 'PENDING' && review.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Cannot assign reviewer to a completed review' },
        { status: 400 }
      );
    }

    // Verify assignee has review permission
    const assigneeCanReview = await canReviewArticles(assigneeId);
    if (!assigneeCanReview) {
      return NextResponse.json(
        { error: 'The selected user does not have permission to review articles' },
        { status: 400 }
      );
    }

    // Get assigner details
    const assigner = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true },
    });

    if (!assigner) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update review with assignment
    const updatedReview = await prisma.articleReview.update({
      where: { id },
      data: {
        assignedToId: assigneeId,
        assignedById: user.id,
        assignedAt: new Date(),
        status: 'IN_PROGRESS',
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        assignedBy: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    // Notify the assigned reviewer
    await notifyReviewerOfAssignment(
      { id: review.article.id, title: review.article.title, slug: review.article.slug },
      review.id,
      { id: assigneeId },
      { name: assigner.name }
    );

    return NextResponse.json({
      message: 'Reviewer assigned successfully',
      review: updatedReview,
    });
  } catch (error) {
    console.error('Error assigning reviewer:', error);
    return NextResponse.json(
      { error: 'Failed to assign reviewer' },
      { status: 500 }
    );
  }
}
