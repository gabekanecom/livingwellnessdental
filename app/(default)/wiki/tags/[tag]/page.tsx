import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { TagIcon, EyeIcon, ClockIcon } from '@heroicons/react/24/outline';
import WikiBreadcrumb from '@/components/wiki/WikiBreadcrumb';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ tag: string }>;
}

async function getTagWithArticles(tagName: string) {
  const tag = await prisma.wikiTag.findFirst({
    where: { 
      name: { equals: tagName, mode: 'insensitive' } 
    },
    include: {
      articles: {
        where: { status: 'PUBLISHED' },
        include: {
          category: true,
          author: { select: { name: true } },
        },
        orderBy: { updatedAt: 'desc' },
      },
    },
  });
  return tag;
}

async function getRelatedTags(tagName: string, articleIds: string[]) {
  if (articleIds.length === 0) return [];
  
  const relatedTags = await prisma.wikiTag.findMany({
    where: {
      articles: { some: { id: { in: articleIds } } },
      NOT: { name: { equals: tagName, mode: 'insensitive' } },
    },
    include: {
      _count: { select: { articles: true } },
    },
    take: 10,
  });
  return relatedTags;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

export default async function TagPage({ params }: PageProps) {
  const { tag: tagParam } = await params;
  const tagName = decodeURIComponent(tagParam);
  
  const tag = await getTagWithArticles(tagName);

  if (!tag) {
    notFound();
  }

  const articleIds = tag.articles.map(a => a.id);
  const relatedTags = await getRelatedTags(tagName, articleIds);

  const breadcrumbItems = [
    { label: 'Tags', href: '/wiki/tags' },
    { label: tag.name, href: `/wiki/tags/${encodeURIComponent(tag.name)}` },
  ];

  return (
    <div className="p-6">
      <WikiBreadcrumb items={breadcrumbItems} />

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="p-2 bg-violet-100 rounded-lg">
            <TagIcon className="h-6 w-6 text-violet-600" />
          </span>
          <h1 className="text-2xl font-bold text-gray-900">{tag.name}</h1>
          <span className="text-gray-500">
            ({tag.articles.length} {tag.articles.length === 1 ? 'article' : 'articles'})
          </span>
        </div>
      </div>

      <div className="flex gap-8">
        <div className="flex-1 min-w-0">
          {tag.articles.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {tag.articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/wiki/article/${article.slug}`}
                  className="block p-5 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-semibold text-gray-900 group-hover:text-violet-700 mb-1">
                        {article.title}
                      </h2>
                      {article.excerpt && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {article.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="text-violet-600 font-medium">
                          {article.category.name}
                        </span>
                        <span>{article.author.name}</span>
                        <span className="flex items-center gap-1">
                          <EyeIcon className="h-3 w-3" />
                          {article.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <ClockIcon className="h-3 w-3" />
                          {formatDate(article.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-500">No published articles with this tag</p>
            </div>
          )}
        </div>

        {relatedTags.length > 0 && (
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Related Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {relatedTags.map((relTag) => (
                  <Link
                    key={relTag.id}
                    href={`/wiki/tags/${encodeURIComponent(relTag.name)}`}
                    className="inline-flex items-center px-3 py-1.5 bg-gray-100 hover:bg-violet-100 text-gray-700 hover:text-violet-700 rounded-full text-sm transition-colors"
                  >
                    {relTag.name}
                    <span className="ml-1.5 text-xs text-gray-400">
                      {relTag._count.articles}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
