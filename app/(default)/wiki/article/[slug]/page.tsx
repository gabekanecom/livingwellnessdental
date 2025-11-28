import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ArticleView from '@/components/wiki/ArticleView';
import WikiBreadcrumb from '@/components/wiki/WikiBreadcrumb';
import TableOfContents from '@/components/wiki/TableOfContents';
import ArticleNavigation from '@/components/wiki/ArticleNavigation';
import RelatedArticles from '@/components/wiki/RelatedArticles';
import ReadingProgress from '@/components/wiki/ReadingProgress';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getAdjacentArticles(categoryIds: string[], currentTitle: string) {
  // Get articles in any of the article's categories
  const articlesInCategories = await prisma.wikiArticle.findMany({
    where: {
      categories: {
        some: { categoryId: { in: categoryIds } },
      },
      status: 'PUBLISHED',
    },
    select: {
      id: true,
      title: true,
      slug: true,
    },
    orderBy: { title: 'asc' },
    distinct: ['id'],
  });

  const currentIndex = articlesInCategories.findIndex(a => a.title === currentTitle);

  return {
    previous: currentIndex > 0 ? articlesInCategories[currentIndex - 1] : null,
    next: currentIndex < articlesInCategories.length - 1 ? articlesInCategories[currentIndex + 1] : null,
  };
}

async function getRelatedArticles(articleId: string, tagIds: string[], categoryIds: string[]) {
  const related = await prisma.wikiArticle.findMany({
    where: {
      id: { not: articleId },
      status: 'PUBLISHED',
      OR: [
        { tags: { some: { id: { in: tagIds } } } },
        { categories: { some: { categoryId: { in: categoryIds } } } },
      ],
    },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      categories: {
        include: { category: { select: { name: true } } },
        orderBy: { isPrimary: 'desc' },
        take: 1,
      },
    },
    take: 5,
    orderBy: { views: 'desc' },
  });

  // Map to format expected by RelatedArticles component
  return related.map(article => ({
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    category: article.categories[0]?.category || { name: 'Uncategorized' },
  }));
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;

  const article = await prisma.wikiArticle.findUnique({
    where: { slug },
    include: {
      author: true,
      categories: {
        include: { category: true },
        orderBy: { isPrimary: 'desc' },
      },
      tags: true,
    },
  });

  if (!article || article.status !== 'PUBLISHED') {
    notFound();
  }

  await prisma.wikiArticle.update({
    where: { id: article.id },
    data: { views: { increment: 1 } },
  });

  const tagIds = article.tags.map(t => t.id);
  const categoryIds = article.categories.map(c => c.categoryId);
  const primaryCategory = article.categories.find(c => c.isPrimary)?.category || article.categories[0]?.category;

  const [adjacentArticles, relatedArticles] = await Promise.all([
    getAdjacentArticles(categoryIds, article.title),
    getRelatedArticles(article.id, tagIds, categoryIds),
  ]);

  // Build breadcrumb from primary category
  const breadcrumbItems = primaryCategory ? [
    { label: primaryCategory.name, href: `/wiki/category/${primaryCategory.slug}` },
    { label: article.title, href: `/wiki/article/${article.slug}` },
  ] : [
    { label: article.title, href: `/wiki/article/${article.slug}` },
  ];

  return (
    <>
      <ReadingProgress />
      <div className="p-4 md:p-6">
        <WikiBreadcrumb items={breadcrumbItems} />
        
        <div className="xl:hidden mb-6">
          <TableOfContents content={article.content} className="bg-gray-50 rounded-lg p-4" />
        </div>

        <div className="flex gap-8">
          <div className="flex-1 min-w-0">
            <ArticleView article={article as any} />
            <ArticleNavigation 
              previous={adjacentArticles.previous} 
              next={adjacentArticles.next} 
            />
          </div>
          <aside className="hidden xl:block w-64 shrink-0">
            <div className="sticky top-24 space-y-8">
              <TableOfContents content={article.content} />
              {relatedArticles.length > 0 && (
                <RelatedArticles articles={relatedArticles} />
              )}
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
