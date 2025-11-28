import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { canSubmitForReview, getReviewers } from '@/lib/wiki/permissions';
import { notifyReviewersOfSubmission } from '@/lib/notifications';

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

    // Get article details
    const article = await prisma.wikiArticle.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, email: true } },
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true },
        },
      },
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Check if user is the author
    if (article.authorId !== user.id) {
      return NextResponse.json(
        { error: 'Only the author can submit their article for review' },
        { status: 403 }
      );
    }

    // Check article status
    if (article.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Only draft articles can be submitted for review' },
        { status: 400 }
      );
    }

    // Check permission
    const hasPermission = await canSubmitForReview(user.id);
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'You do not have permission to submit articles for review' },
        { status: 403 }
      );
    }

    // Get current user details
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, email: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create review record and update article status in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create article review
      const review = await tx.articleReview.create({
        data: {
          articleId: article.id,
          articleVersionId: article.versions[0]?.id,
          submittedById: user.id,
          status: 'PENDING',
        },
      });

      // Update article status
      const updatedArticle = await tx.wikiArticle.update({
        where: { id },
        data: { status: 'IN_REVIEW' },
        include: {
          categories: {
            include: { category: { select: { name: true } } },
            orderBy: { isPrimary: 'desc' },
          },
          author: { select: { name: true } },
        },
      });

      return { review, article: updatedArticle };
    });

    // Send notifications to reviewers
    const reviewers = await getReviewers();
    if (reviewers.length > 0) {
      await notifyReviewersOfSubmission(
        { id: article.id, title: article.title, slug: article.slug },
        { id: currentUser.id, name: currentUser.name },
        reviewers.map((r) => r.id)
      );
    }

    return NextResponse.json({
      message: 'Article submitted for review',
      review: result.review,
      article: result.article,
    });
  } catch (error) {
    console.error('Error submitting article for review:', error);
    return NextResponse.json(
      { error: 'Failed to submit article for review' },
      { status: 500 }
    );
  }
}
