import Link from 'next/link';
import prisma from '@/lib/prisma';
import { 
  DocumentTextIcon, 
  EyeIcon, 
  ClockIcon,
  ArrowsUpDownIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

export const dynamic = 'force-dynamic';

interface SearchParams {
  sort?: string;
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

async function getArticles(sort: string = 'recent') {
  const orderBy = sort === 'views' 
    ? { views: 'desc' as const }
    : sort === 'title'
    ? { title: 'asc' as const }
    : { updatedAt: 'desc' as const };

  return prisma.wikiArticle.findMany({
    where: {
      status: 'PUBLISHED',
    },
    include: {
      category: true,
      author: { select: { name: true } },
      tags: true,
    },
    orderBy,
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

export default async function BrowsePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { sort = 'recent' } = params;

  const articles = await getArticles(sort);

  const sortOptions = [
    { value: 'recent', label: 'Most Recent' },
    { value: 'views', label: 'Most Viewed' },
    { value: 'title', label: 'Title A-Z' },
  ];

  const currentSort = sortOptions.find(o => o.value === sort) || sortOptions[0];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Articles</h1>
          <p className="text-gray-600">
            {articles.length} {articles.length === 1 ? 'article' : 'articles'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ArrowsUpDownIcon className="h-4 w-4 text-gray-400" />
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {sortOptions.map((option) => (
              <Link
                key={option.value}
                href={`/wiki/browse?sort=${option.value}`}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  sort === option.value
                    ? 'bg-white text-violet-700 font-medium shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {option.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div>
          {articles.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/wiki/article/${article.slug}`}
                  className="block p-5 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-violet-100 transition-colors">
                      <DocumentTextIcon className="h-5 w-5 text-gray-400 group-hover:text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-lg font-semibold text-gray-900 group-hover:text-violet-700">
                          {article.title}
                        </h2>
                        {article.isFeatured && (
                          <StarIconSolid className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      {article.excerpt && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {article.excerpt}
                        </p>
                      )}
                      <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">
                        <span className="text-violet-600 font-medium">
                          {article.category.name}
                        </span>
                        <span>{article.author.name}</span>
                        <span className="flex items-center gap-1">
                          <EyeIcon className="h-3 w-3" />
                          {article.views} views
                        </span>
                        <span className="flex items-center gap-1">
                          <ClockIcon className="h-3 w-3" />
                          {formatDate(article.updatedAt)}
                        </span>
                      </div>
                      {article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {article.tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag.id}
                              className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                            >
                              {tag.name}
                            </span>
                          ))}
                          {article.tags.length > 4 && (
                            <span className="px-2 py-0.5 text-xs text-gray-400">
                              +{article.tags.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
              <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No articles yet</p>
              <Link
                href="/wiki/article/new"
                className="text-violet-600 hover:text-violet-700 font-medium"
              >
                Create an article
              </Link>
            </div>
          )}
      </div>
    </div>
  );
}
