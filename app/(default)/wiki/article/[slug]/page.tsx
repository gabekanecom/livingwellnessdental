import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ArticleView from '@/components/wiki/ArticleView';
import WikiBreadcrumb from '@/components/wiki/WikiBreadcrumb';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
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

  // Increment view count
  await prisma.wikiArticle.update({
    where: { id: article.id },
    data: { views: { increment: 1 } },
  });

  const breadcrumbItems = [
    { label: article.category.name, href: `/wiki/category/${article.category.slug}` },
    { label: article.title, href: `/wiki/article/${article.slug}` },
  ];

  return (
    <div className="p-6">
      <WikiBreadcrumb items={breadcrumbItems} />
      <ArticleView article={article as any} />
    </div>
  );
}
