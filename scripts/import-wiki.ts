import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { prisma } from '../lib/prisma';
import slugify from 'slugify';

const IMPORT_DIR = './import-data';

interface FrontMatter {
  title?: string;
  tags?: string[];
  order?: number;
  status?: 'DRAFT' | 'PUBLISHED';
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function generateExcerpt(text: string, length = 200): string {
  if (text.length <= length) return text;
  return text.substring(0, length).trim() + '...';
}

async function importMarkdownFiles() {
  if (!fs.existsSync(IMPORT_DIR)) {
    console.log(`❌ Directory ${IMPORT_DIR} does not exist. Creating it...`);
    fs.mkdirSync(IMPORT_DIR, { recursive: true });
    console.log(`📁 Please place your markdown files in ${IMPORT_DIR}/ organized by category folders.`);
    return;
  }

  const categories = fs.readdirSync(IMPORT_DIR).filter(f => {
    const stat = fs.statSync(path.join(IMPORT_DIR, f));
    return stat.isDirectory();
  });

  console.log(`📚 Found ${categories.length} category folders`);

  if (categories.length === 0) {
    console.log(`📁 No category folders found in ${IMPORT_DIR}/`);
    console.log(`Create folders like: ${IMPORT_DIR}/getting-started/, ${IMPORT_DIR}/hr-policies/, etc.`);
    return;
  }

  // Get or create default author
  let author = await prisma.user.findFirst();
  if (!author) {
    author = await prisma.user.create({
      data: {
        email: 'import@system.local',
        name: 'Wiki Import',
      },
    });
    console.log(`👤 Created default author: ${author.name}`);
  }

  let totalImported = 0;
  let totalSkipped = 0;

  for (const categoryFolder of categories) {
    const categoryPath = path.join(IMPORT_DIR, categoryFolder);
    const categorySlug = slugify(categoryFolder, { lower: true, strict: true });

    // Get or create category
    let category = await prisma.wikiCategory.findUnique({
      where: { slug: categorySlug },
    });

    if (!category) {
      category = await prisma.wikiCategory.create({
        data: {
          name: categoryFolder.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          slug: categorySlug,
        },
      });
      console.log(`✅ Created category: ${category.name}`);
    }

    // Process markdown files
    const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.md'));

    if (files.length === 0) {
      console.log(`⚠️  No .md files found in ${categoryPath}`);
      continue;
    }

    console.log(`\n📂 Processing ${files.length} files in ${category.name}...`);

    for (const file of files) {
      const filePath = path.join(categoryPath, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');

      // Parse frontmatter and content
      const { data, content } = matter(fileContent);
      const frontmatter = data as FrontMatter;

      // Convert markdown to HTML
      const htmlContent = await marked(content);
      const plainText = stripHtml(htmlContent);

      // Generate title from frontmatter or filename
      const title = frontmatter.title || file.replace('.md', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const slug = slugify(title, { lower: true, strict: true });

      // Check if article already exists
      const existing = await prisma.wikiArticle.findUnique({
        where: { slug },
      });

      if (existing) {
        console.log(`  ⏭️  Skipped: ${title} (already exists)`);
        totalSkipped++;
        continue;
      }

      // Create article
      const article = await prisma.wikiArticle.create({
        data: {
          title,
          slug,
          content: htmlContent,
          contentPlain: plainText,
          excerpt: generateExcerpt(plainText),
          status: frontmatter.status || 'PUBLISHED',
          order: frontmatter.order || 0,
          categoryId: category.id,
          authorId: author.id,
          publishedAt: frontmatter.status === 'PUBLISHED' || !frontmatter.status ? new Date() : null,
          tags: frontmatter.tags?.length
            ? {
                connectOrCreate: frontmatter.tags.map(tag => ({
                  where: { slug: slugify(tag, { lower: true, strict: true }) },
                  create: {
                    name: tag,
                    slug: slugify(tag, { lower: true, strict: true }),
                  },
                })),
              }
            : undefined,
        },
      });

      // Create initial version
      await prisma.wikiArticleVersion.create({
        data: {
          articleId: article.id,
          title: article.title,
          content: article.content,
          authorId: author.id,
        },
      });

      console.log(`  ✅ Imported: ${article.title}`);
      totalImported++;
    }
  }

  console.log(`\n🎉 Import complete!`);
  console.log(`   Imported: ${totalImported} articles`);
  console.log(`   Skipped: ${totalSkipped} articles`);
}

importMarkdownFiles()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
