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
        where: { status: 'PUBLISHED' },
        include: {
          author: true,
          category: true,
          tags: true,
        },
        orderBy: { order: 'asc' },
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
    <div className="max-w-7xl mx-auto px-6 py-8">
      <WikiBreadcrumb items={breadcrumbItems} />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{category.name}</h1>
        {category.description && (
          <p className="text-gray-600">{category.description}</p>
        )}
      </div>

      {category.children && category.children.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Subcategories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {category.children.map((child) => (
              <a
                key={child.id}
                href={`/wiki/category/${child.slug}`}
                className="p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
              >
                <h3 className="font-semibold text-gray-900">{child.name}</h3>
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Articles ({category.articles.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {category.articles.map((article) => (
              <ArticleCard key={article.id} article={article as any} />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-600">No articles in this category yet.</p>
        </div>
      )}
    </div>
  );
}
