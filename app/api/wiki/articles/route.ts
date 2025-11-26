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
    if (categoryId) where.categoryId = categoryId;
    if (status) where.status = status;

    const articles = await prisma.wikiArticle.findMany({
      where,
      include: {
        author: true,
        category: true,
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
    const { title, content, categoryId, authorId, tags, coverImage, status } = body;

    if (!title || !content || !categoryId || !authorId) {
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
        categoryId,
        authorId,
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
        category: true,
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

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    console.error('Error creating article:', error);
    return NextResponse.json(
      { error: 'Failed to create article' },
      { status: 500 }
    );
  }
}
