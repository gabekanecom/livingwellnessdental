'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  DocumentTextIcon,
  PencilSquareIcon,
  EyeIcon,
  ClockIcon,
  PlusIcon,
  DocumentDuplicateIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface ArticleReview {
  id: string;
  status: string;
  feedback: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: { name: string } | null;
}

interface ArticleCategory {
  category: { id: string; name: string; slug: string };
  isPrimary: boolean;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: string;
  views: number;
  createdAt: string;
  updatedAt: string;
  categories: ArticleCategory[];
  reviews?: ArticleReview[];
}

interface MyArticlesData {
  drafts: Article[];
  inReview: Article[];
  published: Article[];
  stats: {
    totalArticles: number;
    totalPublished: number;
    totalViews: number;
  };
}

function ArticleCard({
  article,
  showViews = false,
  showFeedback = false,
}: {
  article: Article;
  showViews?: boolean;
  showFeedback?: boolean;
}) {
  // Find the latest rejected review with feedback
  const latestRejectedReview = article.reviews?.find(
    (r) => r.status === 'REJECTED' && r.feedback
  );

  return (
    <div className="group p-4 bg-white border border-gray-200 rounded-lg hover:border-violet-300 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <Link
            href={
              article.status === 'PUBLISHED'
                ? `/wiki/article/${article.slug}`
                : `/wiki/article/${article.slug}/edit`
            }
            className="font-medium text-gray-900 hover:text-violet-700 line-clamp-1"
          >
            {article.title}
          </Link>
          {article.excerpt && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{article.excerpt}</p>
          )}
          <div className="flex items-center flex-wrap gap-2 mt-2 text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              {article.categories.map((cat, idx) => (
                <span
                  key={cat.category.id}
                  className={`${cat.isPrimary ? 'text-violet-600' : 'text-gray-500'}`}
                >
                  {cat.category.name}{idx < article.categories.length - 1 ? ',' : ''}
                </span>
              ))}
            </div>
            <span className="flex items-center gap-1">
              <ClockIcon className="h-3 w-3" />
              {formatDistanceToNow(new Date(article.updatedAt), { addSuffix: true })}
            </span>
            {showViews && (
              <span className="flex items-center gap-1">
                <EyeIcon className="h-3 w-3" />
                {article.views} views
              </span>
            )}
          </div>
          {showFeedback && latestRejectedReview && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <ExclamationTriangleIcon className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800">Revision Requested</p>
                  <p className="text-amber-700 mt-1">{latestRejectedReview.feedback}</p>
                  {latestRejectedReview.reviewedBy && (
                    <p className="text-xs text-amber-600 mt-1">
                      — {latestRejectedReview.reviewedBy.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        <Link
          href={`/wiki/article/${article.slug}/edit`}
          className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
          title="Edit article"
        >
          <PencilSquareIcon className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}

function ArticleSection({
  title,
  icon: Icon,
  articles,
  emptyMessage,
  showViews = false,
  showFeedback = false,
  color = 'gray',
}: {
  title: string;
  icon: React.ElementType;
  articles: Article[];
  emptyMessage: string;
  showViews?: boolean;
  showFeedback?: boolean;
  color?: 'gray' | 'yellow' | 'green';
}) {
  const colorClasses = {
    gray: 'bg-gray-100 text-gray-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600',
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className={`p-1.5 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="font-semibold text-gray-900">{title}</h2>
        <span className="text-sm text-gray-400">({articles.length})</span>
      </div>
      {articles.length > 0 ? (
        <div className="space-y-3">
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              showViews={showViews}
              showFeedback={showFeedback}
            />
          ))}
        </div>
      ) : (
        <div className="p-6 bg-gray-50 rounded-lg text-center text-sm text-gray-500">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}

export default function MyArticlesPage() {
  const [data, setData] = useState<MyArticlesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMyArticles() {
      try {
        const res = await fetch('/api/wiki/articles/my');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error('Failed to fetch articles:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchMyArticles();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          Failed to load your articles. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Articles</h1>
          <p className="text-gray-500">Manage your wiki contributions</p>
        </div>
        <Link
          href="/wiki/article/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          New Article
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 rounded-lg">
              <DocumentTextIcon className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{data.stats.totalArticles}</div>
              <div className="text-sm text-gray-500">Total Articles</div>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{data.stats.totalPublished}</div>
              <div className="text-sm text-gray-500">Published</div>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <EyeIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{data.stats.totalViews.toLocaleString()}</div>
              <div className="text-sm text-gray-500">Total Views</div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <ArticleSection
          title="Drafts"
          icon={DocumentDuplicateIcon}
          articles={data.drafts}
          emptyMessage="No drafts. Start writing a new article!"
          showFeedback
          color="gray"
        />

        <ArticleSection
          title="In Review"
          icon={PaperAirplaneIcon}
          articles={data.inReview}
          emptyMessage="No articles pending review"
          color="yellow"
        />

        <ArticleSection
          title="Published"
          icon={CheckCircleIcon}
          articles={data.published}
          emptyMessage="No published articles yet"
          showViews
          color="green"
        />
      </div>
    </div>
  );
}
