'use client';

import { formatDistanceToNow } from 'date-fns';
import { ClockIcon, EyeIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { WikiArticle } from '@/lib/wiki/types';
import { calculateReadingTime } from '@/lib/wiki/utils';

interface ArticleViewProps {
  article: WikiArticle;
}

export default function ArticleView({ article }: ArticleViewProps) {
  const readingTime = calculateReadingTime(article.content);

  return (
    <article className="max-w-4xl mx-auto px-6 py-8">
      {article.coverImage && (
        <img
          src={article.coverImage}
          alt={article.title}
          className="w-full h-64 object-cover rounded-lg mb-8"
        />
      )}

      <h1 className="text-4xl font-bold text-gray-900 mb-4">{article.title}</h1>

      <div className="flex items-center space-x-6 text-sm text-gray-600 mb-8 pb-8 border-b border-gray-200">
        {article.author && (
          <div className="flex items-center space-x-2">
            {article.author.avatar ? (
              <img
                src={article.author.avatar}
                alt={article.author.name}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <UserCircleIcon className="h-8 w-8 text-gray-400" />
            )}
            <span>{article.author.name}</span>
          </div>
        )}
        <div className="flex items-center space-x-1">
          <ClockIcon className="h-4 w-4" />
          <span>{readingTime} min read</span>
        </div>
        <div className="flex items-center space-x-1">
          <EyeIcon className="h-4 w-4" />
          <span>{article.views} views</span>
        </div>
        {article.publishedAt && (
          <span>
            Published {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
          </span>
        )}
      </div>

      <div
        className="prose prose-lg max-w-none prose-headings:font-semibold prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      {article.tags && article.tags.length > 0 && (
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <a
                key={tag.id}
                href={`/wiki/search?tag=${tag.slug}`}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              >
                {tag.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
