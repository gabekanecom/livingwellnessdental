'use client';

import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface ArticleLink {
  id: string;
  title: string;
  slug: string;
}

interface ArticleNavigationProps {
  previous: ArticleLink | null;
  next: ArticleLink | null;
}

export default function ArticleNavigation({ previous, next }: ArticleNavigationProps) {
  if (!previous && !next) return null;

  return (
    <nav className="mt-12 pt-8 border-t border-gray-200">
      <div className="flex justify-between gap-4">
        {previous ? (
          <Link
            href={`/wiki/article/${previous.slug}`}
            className="flex-1 group p-4 rounded-lg border border-gray-200 hover:border-violet-300 hover:bg-violet-50 transition-colors"
          >
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <ChevronLeftIcon className="h-4 w-4" />
              <span>Previous</span>
            </div>
            <div className="font-medium text-gray-900 group-hover:text-violet-700 line-clamp-1">
              {previous.title}
            </div>
          </Link>
        ) : (
          <div className="flex-1" />
        )}

        {next ? (
          <Link
            href={`/wiki/article/${next.slug}`}
            className="flex-1 group p-4 rounded-lg border border-gray-200 hover:border-violet-300 hover:bg-violet-50 transition-colors text-right"
          >
            <div className="flex items-center justify-end gap-2 text-sm text-gray-500 mb-1">
              <span>Next</span>
              <ChevronRightIcon className="h-4 w-4" />
            </div>
            <div className="font-medium text-gray-900 group-hover:text-violet-700 line-clamp-1">
              {next.title}
            </div>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
      </div>
    </nav>
  );
}
