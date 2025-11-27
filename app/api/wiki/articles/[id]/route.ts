import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateExcerpt, stripHtml } from '@/lib/wiki/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const isCuid = /^c[a-z0-9]{24}$/.test(id);
    
    const article = await prisma.wikiArticle.findFirst({
      where: isCuid ? { id } : { slug: id },
      include: {
        author: true,
        category: true,
        tags: true,
        versions: {
          include: { author: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, content, categoryId, tags, coverImage, status, authorId } = body;

    const contentPlain = content ? stripHtml(content) : undefined;
    const excerpt = content ? generateExcerpt(content) : undefined;

    const article = await prisma.wikiArticle.update({
      where: { id },
      data: {
        title,
        content,
        contentPlain,
        excerpt,
        categoryId,
        coverImage,
        status,
        publishedAt: status === 'PUBLISHED' ? new Date() : undefined,
        tags: tags
          ? {
              set: [],
              connectOrCreate: tags.map((tag: string) => ({
                where: { slug: tag },
                create: { name: tag, slug: tag },
              })),
            }
          : undefined,
      },
      include: {
        author: true,
        category: true,
        tags: true,
      },
    });

    // Create version entry
    if (title && content && authorId) {
      await prisma.wikiArticleVersion.create({
        data: {
          articleId: id,
          title,
          content,
          authorId,
        },
      });
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error('Error updating article:', error);
    return NextResponse.json(
      { error: 'Failed to update article' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.wikiArticle.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting article:', error);
    return NextResponse.json(
      { error: 'Failed to delete article' },
      { status: 500 }
    );
  }
}
