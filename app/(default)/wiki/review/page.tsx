'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  DocumentMagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ClockIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  createdAt: string;
  updatedAt: string;
  author: { name: string };
  category: { name: string };
}

export default function ReviewQueuePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingReviews();
  }, []);

  async function fetchPendingReviews() {
    try {
      const res = await fetch('/api/wiki/articles?status=IN_REVIEW');
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles || []);
      }
    } catch (error) {
      console.error('Failed to fetch pending reviews:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(articleId: string, newStatus: 'PUBLISHED' | 'DRAFT') {
    setProcessing(articleId);
    try {
      const res = await fetch(`/api/wiki/articles/${articleId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setArticles((prev) => prev.filter((a) => a.id !== articleId));
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setProcessing(null);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-32 bg-gray-200 rounded-lg" />
          <div className="h-32 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <DocumentMagnifyingGlassIcon className="h-6 w-6 text-violet-600" />
          <h1 className="text-2xl font-bold text-gray-900">Review Queue</h1>
        </div>
        <p className="text-gray-500">
          Review and approve articles submitted for publication
        </p>
      </div>

      {articles.length > 0 ? (
        <div className="space-y-4">
          {articles.map((article) => (
            <div
              key={article.id}
              className="bg-white border border-gray-200 rounded-xl p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">
                    {article.title}
                  </h2>
                  {article.excerpt && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {article.excerpt}
                    </p>
                  )}
                  <div className="flex items-center flex-wrap gap-4 text-sm text-gray-500">
                    <span className="text-violet-600 font-medium">
                      {article.category.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <UserCircleIcon className="h-4 w-4" />
                      {article.author.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <ClockIcon className="h-4 w-4" />
                      Submitted {formatDistanceToNow(new Date(article.updatedAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/wiki/article/${article.slug}/preview`}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors"
                  >
                    <EyeIcon className="h-4 w-4" />
                    Preview
                  </Link>
                  <button
                    onClick={() => handleStatusChange(article.id, 'DRAFT')}
                    disabled={processing === article.id}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <XCircleIcon className="h-4 w-4" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleStatusChange(article.id, 'PUBLISHED')}
                    disabled={processing === article.id}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    Approve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
          <DocumentMagnifyingGlassIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No articles pending review</h3>
          <p className="text-gray-500">
            All submitted articles have been reviewed. Check back later!
          </p>
        </div>
      )}
    </div>
  );
}
