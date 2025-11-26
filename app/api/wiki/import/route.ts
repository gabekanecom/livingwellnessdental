import { NextRequest, NextResponse } from 'next/server';
import matter from 'gray-matter';
import { marked } from 'marked';
import { prisma } from '@/lib/prisma';
import slugify from 'slugify';
import { stripHtml, generateExcerpt } from '@/lib/wiki/utils';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const categoryId = formData.get('categoryId') as string;
    const authorId = formData.get('authorId') as string || 'temp-user-id'; // TODO: Get from auth

    if (!files.length || !categoryId) {
      return NextResponse.json(
        { error: 'Files and categoryId required' },
        { status: 400 }
      );
    }

    const results = { imported: 0, skipped: 0, errors: [] as string[] };

    for (const file of files) {
      try {
        const content = await file.text();
        const { data, content: markdown } = matter(content);

        const htmlContent = await marked(markdown);
        const plainText = stripHtml(htmlContent);

        const title = data.title || file.name.replace('.md', '').replace(/-/g, ' ');
        const slug = slugify(title, { lower: true, strict: true });

        // Check for existing
        const existing = await prisma.wikiArticle.findUnique({ where: { slug } });
        if (existing) {
          results.skipped++;
          continue;
        }

        // Get author
        let author = await prisma.user.findFirst();
        if (!author) {
          author = await prisma.user.create({
            data: {
              email: 'import@system.local',
              name: 'Wiki Import',
            },
          });
        }

        await prisma.wikiArticle.create({
          data: {
            title,
            slug,
            content: htmlContent,
            contentPlain: plainText,
            excerpt: generateExcerpt(plainText),
            status: data.status || 'DRAFT',
            categoryId,
            authorId: author.id,
            publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
            tags: data.tags?.length
              ? {
                  connectOrCreate: data.tags.map((tag: string) => ({
                    where: { slug: slugify(tag, { lower: true, strict: true }) },
                    create: { name: tag, slug: slugify(tag, { lower: true, strict: true }) },
                  })),
                }
              : undefined,
          },
        });

        results.imported++;
      } catch (err) {
        results.errors.push(`${file.name}: ${err}`);
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Import failed:', error);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}
