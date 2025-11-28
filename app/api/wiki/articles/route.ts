import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSlug, generateExcerpt, stripHtml } from '@/lib/wiki/utils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get('categoryId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    if (categoryId) {
      where.categories = {
        some: { categoryId },
      };
    }
    if (status) where.status = status;

    const articles = await prisma.wikiArticle.findMany({
      where,
      include: {
        author: true,
        categories: {
          include: { category: true },
          orderBy: { isPrimary: 'desc' },
        },
        tags: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.wikiArticle.count({ where });

    return NextResponse.json({ articles, total });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, categoryIds, authorId, tags, coverImage, status } = body;

    // Support both old categoryId and new categoryIds array
    const categories = categoryIds || (body.categoryId ? [body.categoryId] : []);

    if (!title || !content || categories.length === 0 || !authorId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const slug = generateSlug(title);
    const contentPlain = stripHtml(content);
    const excerpt = generateExcerpt(content);

    const article = await prisma.wikiArticle.create({
      data: {
        title,
        slug,
        content,
        contentPlain,
        excerpt,
        coverImage,
        status: status || 'DRAFT',
        authorId,
        categories: {
          create: categories.map((catId: string, index: number) => ({
            categoryId: catId,
            isPrimary: index === 0, // First category is primary
          })),
        },
        tags: tags
          ? {
              connectOrCreate: tags.map((tag: string) => ({
                where: { slug: generateSlug(tag) },
                create: { name: tag, slug: generateSlug(tag) },
              })),
            }
          : undefined,
      },
      include: {
        author: true,
        categories: {
          include: { category: true },
          orderBy: { isPrimary: 'desc' },
        },
        tags: true,
      },
    });

    // Create initial version
    await prisma.wikiArticleVersion.create({
      data: {
        articleId: article.id,
        title,
        content,
        authorId,
      },
    });

    // Sync media usage
    try {
      await fetch(`${request.nextUrl.origin}/api/wiki/articles/${article.id}/sync-media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
    } catch (syncError) {
      console.error('Failed to sync media:', syncError);
      // Don't fail the request if media sync fails
    }

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    console.error('Error creating article:', error);
    return NextResponse.json(
      { error: 'Failed to create article' },
      { status: 500 }
    );
  }
}
