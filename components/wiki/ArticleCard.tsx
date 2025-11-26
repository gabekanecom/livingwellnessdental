'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ClockIcon, EyeIcon } from '@heroicons/react/24/outline';
import { WikiArticle } from '@/lib/wiki/types';
import { calculateReadingTime } from '@/lib/wiki/utils';

interface ArticleCardProps {
  article: WikiArticle;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const readingTime = calculateReadingTime(article.content);

  return (
    <Link
      href={`/wiki/article/${article.slug}`}
      className="block p-6 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
    >
      {article.coverImage && (
        <img
          src={article.coverImage}
          alt={article.title}
          className="w-full h-40 object-cover rounded-md mb-4"
        />
      )}
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{article.title}</h3>
      {article.excerpt && (
        <p className="text-gray-600 mb-4 line-clamp-3">{article.excerpt}</p>
      )}
      <div className="flex items-center space-x-4 text-sm text-gray-500">
        <div className="flex items-center space-x-1">
          <ClockIcon className="h-4 w-4" />
          <span>{readingTime} min read</span>
        </div>
        <div className="flex items-center space-x-1">
          <EyeIcon className="h-4 w-4" />
          <span>{article.views} views</span>
        </div>
        {article.publishedAt && (
          <span>{formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}</span>
        )}
      </div>
    </Link>
  );
}
