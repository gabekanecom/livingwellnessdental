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

async function getAdjacentArticles(categoryId: string, currentTitle: string) {
  const articlesInCategory = await prisma.wikiArticle.findMany({
    where: {
      categoryId,
      status: 'PUBLISHED',
    },
    select: {
      id: true,
      title: true,
      slug: true,
    },
    orderBy: { title: 'asc' },
  });

  const currentIndex = articlesInCategory.findIndex(a => a.title === currentTitle);
  
  return {
    previous: currentIndex > 0 ? articlesInCategory[currentIndex - 1] : null,
    next: currentIndex < articlesInCategory.length - 1 ? articlesInCategory[currentIndex + 1] : null,
  };
}

async function getRelatedArticles(articleId: string, tagIds: string[], categoryId: string) {
  const related = await prisma.wikiArticle.findMany({
    where: {
      id: { not: articleId },
      status: 'PUBLISHED',
      OR: [
        { tags: { some: { id: { in: tagIds } } } },
        { categoryId },
      ],
    },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      category: { select: { name: true } },
    },
    take: 5,
    orderBy: { views: 'desc' },
  });

  return related;
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;

  const article = await prisma.wikiArticle.findUnique({
    where: { slug },
    include: {
      author: true,
      category: true,
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
  const [adjacentArticles, relatedArticles] = await Promise.all([
    getAdjacentArticles(article.categoryId, article.title),
    getRelatedArticles(article.id, tagIds, article.categoryId),
  ]);

  const breadcrumbItems = [
    { label: article.category.name, href: `/wiki/category/${article.category.slug}` },
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
