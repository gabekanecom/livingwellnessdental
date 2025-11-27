import Link from 'next/link';
import prisma from '@/lib/prisma';
import { 
  PlusIcon, 
  StarIcon, 
  ClockIcon, 
  FireIcon,
  TagIcon,
  ArrowRightIcon,
  EyeIcon,
  FolderIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import WikiSearchBar from './WikiSearchBar';

async function getFeaturedArticles() {
  return prisma.wikiArticle.findMany({
    where: {
      status: 'PUBLISHED',
      isFeatured: true,
    },
    include: {
      category: true,
      author: { select: { name: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 3,
  });
}

async function getRecentArticles() {
  return prisma.wikiArticle.findMany({
    where: { status: 'PUBLISHED' },
    include: {
      category: true,
      author: { select: { name: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 8,
  });
}

async function getPopularArticles() {
  return prisma.wikiArticle.findMany({
    where: { status: 'PUBLISHED' },
    include: {
      category: true,
    },
    orderBy: { views: 'desc' },
    take: 5,
  });
}

async function getPopularTags() {
  const tags = await prisma.wikiTag.findMany({
    include: {
      _count: { select: { articles: true } },
    },
    orderBy: {
      articles: { _count: 'desc' },
    },
    take: 12,
  });
  return tags.filter(tag => tag._count.articles > 0);
}

async function getStats() {
  const [articleCount, categoryCount] = await Promise.all([
    prisma.wikiArticle.count({ where: { status: 'PUBLISHED' } }),
    prisma.wikiCategory.count(),
  ]);
  return { articleCount, categoryCount };
}

function formatDate(date: Date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function estimateReadTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export const dynamic = 'force-dynamic';

export default async function WikiHomePage() {
  const [featured, recent, popular, tags, stats] = await Promise.all([
    getFeaturedArticles(),
    getRecentArticles(),
    getPopularArticles(),
    getPopularTags(),
    getStats(),
  ]);

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex-1 max-w-xl">
          <WikiSearchBar />
        </div>
        <Link
          href="/wiki/article/new"
          className="inline-flex items-center justify-center px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors shrink-0"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Article
        </Link>
      </div>

      <div className="flex items-center gap-6 mb-8 text-sm text-gray-500">
        <div className="flex items-center gap-1.5">
          <FolderIcon className="h-4 w-4" />
          <span>{stats.categoryCount} categories</span>
        </div>
        <div className="flex items-center gap-1.5">
          <TagIcon className="h-4 w-4" />
          <span>{stats.articleCount} articles</span>
        </div>
      </div>

      {featured.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <StarIconSolid className="h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-semibold text-gray-800">Featured</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featured.map((article) => (
              <Link
                key={article.id}
                href={`/wiki/article/${article.slug}`}
                className="group p-5 bg-gradient-to-br from-violet-50 to-white rounded-xl border border-violet-200 hover:border-violet-400 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-medium text-violet-600 bg-violet-100 px-2 py-0.5 rounded">
                    {article.category.name}
                  </span>
                  <StarIconSolid className="h-4 w-4 text-yellow-500" />
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-violet-700 mb-2 line-clamp-2">
                  {article.title}
                </h3>
                {article.excerpt && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {article.excerpt}
                  </p>
                )}
                <div className="flex items-center text-xs text-gray-500">
                  <span>{article.author.name}</span>
                  <span className="mx-2">•</span>
                  <span>{estimateReadTime(article.contentPlain)} min read</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-800">Recently Updated</h2>
              </div>
              <Link
                href="/wiki/browse"
                className="text-sm text-violet-600 hover:text-violet-700 flex items-center gap-1"
              >
                View all
                <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </div>

            {recent.length > 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                {recent.map((article) => (
                  <Link
                    key={article.id}
                    href={`/wiki/article/${article.slug}`}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 group-hover:text-violet-700 truncate">
                          {article.title}
                        </h3>
                        {article.isFeatured && (
                          <StarIconSolid className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center text-xs text-gray-500 gap-3">
                        <span className="text-violet-600">{article.category.name}</span>
                        <span>{article.author.name}</span>
                        <span className="flex items-center gap-1">
                          <EyeIcon className="h-3 w-3" />
                          {article.views}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 shrink-0 ml-4">
                      {formatDate(article.updatedAt)}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
                <p className="text-gray-500 mb-4">No articles yet</p>
                <Link
                  href="/wiki/article/new"
                  className="inline-flex items-center text-violet-600 hover:text-violet-700 font-medium"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Create your first article
                </Link>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-8">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <FireIcon className="h-5 w-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-gray-800">Popular</h2>
            </div>
            {popular.length > 0 ? (
              <div className="space-y-2">
                {popular.map((article, index) => (
                  <Link
                    key={article.id}
                    href={`/wiki/article/${article.slug}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <span className="text-lg font-bold text-gray-300 w-6">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 group-hover:text-violet-700 truncate">
                        {article.title}
                      </h3>
                      <div className="flex items-center text-xs text-gray-500 gap-2">
                        <span>{article.category.name}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <EyeIcon className="h-3 w-3" />
                          {article.views} views
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No articles yet</p>
            )}
          </section>

          {tags.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TagIcon className="h-5 w-5 text-gray-400" />
                  <h2 className="text-lg font-semibold text-gray-800">Browse by Tag</h2>
                </div>
                <Link
                  href="/wiki/tags"
                  className="text-sm text-violet-600 hover:text-violet-700"
                >
                  All tags
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/wiki/tags/${encodeURIComponent(tag.name)}`}
                    className="inline-flex items-center px-3 py-1.5 bg-gray-100 hover:bg-violet-100 text-gray-700 hover:text-violet-700 rounded-full text-sm transition-colors"
                  >
                    {tag.name}
                    <span className="ml-1.5 text-xs text-gray-400">
                      {tag._count.articles}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
