import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

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
    const { status } = await request.json();

    const validStatuses = ['DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const article = await prisma.wikiArticle.findUnique({
      where: { id },
      select: { authorId: true, status: true },
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    const isAuthor = article.authorId === user.id;

    if (status === 'IN_REVIEW') {
      if (!isAuthor) {
        return NextResponse.json({ error: 'Only the author can submit for review' }, { status: 403 });
      }
    }

    const updateData: { status: 'DRAFT' | 'IN_REVIEW' | 'PUBLISHED' | 'ARCHIVED'; publishedAt?: Date } = { 
      status: status as 'DRAFT' | 'IN_REVIEW' | 'PUBLISHED' | 'ARCHIVED'
    };
    
    if (status === 'PUBLISHED' && article.status !== 'PUBLISHED') {
      updateData.publishedAt = new Date();
    }

    const updated = await prisma.wikiArticle.update({
      where: { id },
      data: updateData,
      include: {
        category: { select: { name: true } },
        author: { select: { name: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating article status:', error);
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    );
  }
}
