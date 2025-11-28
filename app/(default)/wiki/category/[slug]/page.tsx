import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ArticleCard from '@/components/wiki/ArticleCard';
import WikiBreadcrumb from '@/components/wiki/WikiBreadcrumb';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;

  const category = await prisma.wikiCategory.findUnique({
    where: { slug },
    include: {
      articles: {
        where: { article: { status: 'PUBLISHED' } },
        include: {
          article: {
            include: {
              author: true,
              categories: {
                include: { category: true },
                orderBy: { isPrimary: 'desc' },
              },
              tags: true,
            },
          },
        },
      },
      children: true,
    },
  });

  if (!category) {
    notFound();
  }

  const breadcrumbItems = [
    { label: category.name, href: `/wiki/category/${category.slug}` },
  ];

  return (
    <div className="p-6">
      <WikiBreadcrumb items={breadcrumbItems} />

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">{category.name}</h2>
        {category.description && (
          <p className="text-gray-600">{category.description}</p>
        )}
      </div>

      {category.children && category.children.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Subcategories</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {category.children.map((child) => (
              <a
                key={child.id}
                href={`/wiki/category/${child.slug}`}
                className="p-4 bg-gray-50 border border-gray-200 rounded-lg hover:border-violet-500 hover:shadow-md transition-all"
              >
                <h4 className="font-semibold text-gray-900">{child.name}</h4>
                {child.description && (
                  <p className="text-sm text-gray-600 mt-1">{child.description}</p>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {category.articles && category.articles.length > 0 ? (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Articles ({category.articles.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {category.articles.map((ac) => (
              <ArticleCard key={ac.article.id} article={ac.article as any} />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-600">No articles in this category yet.</p>
        </div>
      )}
    </div>
  );
}
