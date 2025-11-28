'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import {
  ClockIcon,
  EyeIcon,
  UserCircleIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  LinkIcon,
  CheckIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import { HandThumbUpIcon as ThumbUpSolid, HandThumbDownIcon as ThumbDownSolid } from '@heroicons/react/24/solid';
import { WikiArticle } from '@/lib/wiki/types';
import { calculateReadingTime } from '@/lib/wiki/utils';

interface ArticleViewProps {
  article: WikiArticle;
}

export default function ArticleView({ article }: ArticleViewProps) {
  const readingTime = calculateReadingTime(article.content);
  const [feedback, setFeedback] = useState<'helpful' | 'not-helpful' | null>(null);
  const [copied, setCopied] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    async function checkEditPermission() {
      try {
        const res = await fetch(`/api/wiki/articles/${article.id}/can-edit`);
        if (res.ok) {
          const data = await res.json();
          setCanEdit(data.canEdit);
        }
      } catch (error) {
        console.error('Error checking edit permission:', error);
      }
    }
    checkEditPermission();
  }, [article.id]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link');
    }
  };

  const handleFeedback = (type: 'helpful' | 'not-helpful') => {
    setFeedback(type);
  };

  return (
    <article className="max-w-4xl mx-auto px-6 py-8">

      {article.coverImage && (
        <img
          src={article.coverImage}
          alt={article.title}
          className="w-full h-64 object-cover rounded-lg mb-8"
        />
      )}

      <div className="flex items-start justify-between gap-4 mb-4">
        <h1 className="text-4xl font-bold text-gray-900">{article.title}</h1>
        {canEdit && (
          <Link
            href={`/wiki/article/${article.slug}/edit`}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors shrink-0"
          >
            <PencilSquareIcon className="h-4 w-4" />
            Edit
          </Link>
        )}
      </div>

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
              <Link
                key={tag.id}
                href={`/wiki/tags/${encodeURIComponent(tag.name)}`}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-violet-100 hover:text-violet-700 transition-colors"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 pt-8 border-t border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Was this helpful?</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleFeedback('helpful')}
                className={`p-2 rounded-lg transition-colors ${
                  feedback === 'helpful'
                    ? 'bg-green-100 text-green-600'
                    : 'hover:bg-gray-100 text-gray-500'
                }`}
                title="Yes, this was helpful"
              >
                {feedback === 'helpful' ? (
                  <ThumbUpSolid className="h-5 w-5" />
                ) : (
                  <HandThumbUpIcon className="h-5 w-5" />
                )}
              </button>
              <button
                onClick={() => handleFeedback('not-helpful')}
                className={`p-2 rounded-lg transition-colors ${
                  feedback === 'not-helpful'
                    ? 'bg-red-100 text-red-600'
                    : 'hover:bg-gray-100 text-gray-500'
                }`}
                title="No, this was not helpful"
              >
                {feedback === 'not-helpful' ? (
                  <ThumbDownSolid className="h-5 w-5" />
                ) : (
                  <HandThumbDownIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            {feedback && (
              <span className="text-sm text-gray-500">Thanks for your feedback!</span>
            )}
          </div>

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors"
          >
            {copied ? (
              <>
                <CheckIcon className="h-4 w-4 text-green-600" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <LinkIcon className="h-4 w-4" />
                <span>Copy link</span>
              </>
            )}
          </button>
        </div>

        {article.updatedAt && article.createdAt && (
          <div className="mt-4 text-xs text-gray-400">
            Created {format(new Date(article.createdAt), 'MMM d, yyyy')}
            {article.updatedAt !== article.createdAt && (
              <> · Last updated {format(new Date(article.updatedAt), 'MMM d, yyyy')}</>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
