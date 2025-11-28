import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateExcerpt, generateSlug, stripHtml } from '@/lib/wiki/utils';

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
        categories: {
          include: { category: true },
          orderBy: { isPrimary: 'desc' },
        },
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
    const { title, content, categoryIds, tags, coverImage, status, authorId } = body;

    // Support both old categoryId and new categoryIds array
    const categories = categoryIds || (body.categoryId ? [body.categoryId] : null);

    const contentPlain = content ? stripHtml(content) : undefined;
    const excerpt = content ? generateExcerpt(content) : undefined;

    // First update the article
    const article = await prisma.wikiArticle.update({
      where: { id },
      data: {
        title,
        content,
        contentPlain,
        excerpt,
        coverImage,
        status,
        publishedAt: status === 'PUBLISHED' ? new Date() : undefined,
        tags: tags
          ? {
              set: [],
              connectOrCreate: tags.map((tag: string) => ({
                where: { slug: generateSlug(tag) },
                create: { name: tag, slug: generateSlug(tag) },
              })),
            }
          : undefined,
      },
    });

    // Update categories if provided
    if (categories && categories.length > 0) {
      // Delete existing category associations
      await prisma.wikiArticleCategory.deleteMany({
        where: { articleId: id },
      });

      // Create new category associations
      await prisma.wikiArticleCategory.createMany({
        data: categories.map((catId: string, index: number) => ({
          articleId: id,
          categoryId: catId,
          isPrimary: index === 0,
        })),
      });
    }

    // Fetch the updated article with all relations
    const updatedArticle = await prisma.wikiArticle.findUnique({
      where: { id },
      include: {
        author: true,
        categories: {
          include: { category: true },
          orderBy: { isPrimary: 'desc' },
        },
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

    return NextResponse.json(updatedArticle);
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
