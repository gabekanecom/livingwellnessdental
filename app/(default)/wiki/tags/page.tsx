import Link from 'next/link';
import prisma from '@/lib/prisma';
import { TagIcon } from '@heroicons/react/24/outline';

export const dynamic = 'force-dynamic';

async function getAllTags() {
  const tags = await prisma.wikiTag.findMany({
    include: {
      _count: { select: { articles: true } },
    },
    orderBy: { name: 'asc' },
  });
  return tags;
}

export default async function TagsPage() {
  const tags = await getAllTags();
  const tagsWithArticles = tags.filter(tag => tag._count.articles > 0);
  const emptyTags = tags.filter(tag => tag._count.articles === 0);

  const maxCount = Math.max(...tagsWithArticles.map(t => t._count.articles), 1);

  function getTagSize(count: number): string {
    const ratio = count / maxCount;
    if (ratio > 0.7) return 'text-2xl font-bold';
    if (ratio > 0.4) return 'text-xl font-semibold';
    if (ratio > 0.2) return 'text-lg font-medium';
    return 'text-base';
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <TagIcon className="h-6 w-6 text-violet-600" />
          <h1 className="text-2xl font-bold text-gray-900">All Tags</h1>
        </div>
        <p className="text-gray-600">
          Browse articles by topic. Tags with more articles appear larger.
        </p>
      </div>

      {tagsWithArticles.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="flex flex-wrap gap-4 items-center justify-center">
            {tagsWithArticles.map((tag) => (
              <Link
                key={tag.id}
                href={`/wiki/tags/${encodeURIComponent(tag.name)}`}
                className={`${getTagSize(tag._count.articles)} text-gray-700 hover:text-violet-700 transition-colors`}
              >
                {tag.name}
                <span className="ml-1 text-xs text-gray-400 font-normal">
                  ({tag._count.articles})
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
          <TagIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No tags with articles yet</p>
        </div>
      )}

      {emptyTags.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Unused Tags
          </h2>
          <div className="flex flex-wrap gap-2">
            {emptyTags.map((tag) => (
              <span
                key={tag.id}
                className="px-3 py-1 text-sm text-gray-400 bg-gray-100 rounded-full"
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
