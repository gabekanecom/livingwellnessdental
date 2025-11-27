'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  DocumentTextIcon,
  EyeIcon,
  FolderIcon,
  TagIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  ChartBarIcon,
  DocumentDuplicateIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';

interface Analytics {
  overview: {
    totalArticles: number;
    publishedArticles: number;
    draftArticles: number;
    inReviewArticles: number;
    totalViews: number;
    totalCategories: number;
    totalTags: number;
  };
  topArticles: {
    id: string;
    title: string;
    slug: string;
    views: number;
    category: { name: string };
  }[];
  recentSearches: {
    id: string;
    query: string;
    results: number;
    createdAt: string;
  }[];
  topSearches: {
    query: string;
    count: number;
  }[];
  articlesByCategory: {
    id: string;
    name: string;
    count: number;
  }[];
  recentlyUpdated: {
    id: string;
    title: string;
    slug: string;
    updatedAt: string;
    author: { name: string };
  }[];
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  color = 'violet' 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: number | string;
  color?: 'violet' | 'green' | 'blue' | 'yellow' | 'gray';
}) {
  const colors = {
    violet: 'bg-violet-100 text-violet-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    gray: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          <div className="text-sm text-gray-500">{label}</div>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch('/api/wiki/analytics');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-gray-200 rounded-xl" />
            <div className="h-80 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          Failed to load analytics
        </div>
      </div>
    );
  }

  const maxCategoryCount = Math.max(...data.articlesByCategory.map(c => c.count), 1);

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <ChartBarIcon className="h-6 w-6 text-violet-600" />
        <h1 className="text-2xl font-bold text-gray-900">Wiki Analytics</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
        <StatCard
          icon={DocumentTextIcon}
          label="Total Articles"
          value={data.overview.totalArticles}
          color="violet"
        />
        <StatCard
          icon={DocumentTextIcon}
          label="Published"
          value={data.overview.publishedArticles}
          color="green"
        />
        <StatCard
          icon={DocumentDuplicateIcon}
          label="Drafts"
          value={data.overview.draftArticles}
          color="gray"
        />
        <StatCard
          icon={PaperAirplaneIcon}
          label="In Review"
          value={data.overview.inReviewArticles}
          color="yellow"
        />
        <StatCard
          icon={EyeIcon}
          label="Total Views"
          value={data.overview.totalViews}
          color="blue"
        />
        <StatCard
          icon={FolderIcon}
          label="Categories"
          value={data.overview.totalCategories}
          color="violet"
        />
        <StatCard
          icon={TagIcon}
          label="Tags"
          value={data.overview.totalTags}
          color="violet"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <EyeIcon className="h-5 w-5 text-gray-400" />
            Top Articles by Views
          </h2>
          <div className="space-y-3">
            {data.topArticles.map((article, index) => (
              <Link
                key={article.id}
                href={`/wiki/article/${article.slug}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="w-6 h-6 flex items-center justify-center text-sm font-medium text-gray-400">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {article.title}
                  </div>
                  <div className="text-xs text-gray-500">{article.category.name}</div>
                </div>
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <EyeIcon className="h-4 w-4" />
                  {article.views.toLocaleString()}
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FolderIcon className="h-5 w-5 text-gray-400" />
            Articles by Category
          </h2>
          <div className="space-y-3">
            {data.articlesByCategory.map((category) => (
              <div key={category.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{category.name}</span>
                  <span className="text-gray-500">{category.count}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-500 rounded-full transition-all"
                    style={{ width: `${(category.count / maxCategoryCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            Top Searches
          </h2>
          {data.topSearches.length > 0 ? (
            <div className="space-y-2">
              {data.topSearches.map((search, index) => (
                <div
                  key={search.query}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center text-sm font-medium text-gray-400">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{search.query}</span>
                  </div>
                  <span className="text-sm text-gray-500">{search.count} searches</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No search data yet</p>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-gray-400" />
            Recently Updated
          </h2>
          <div className="space-y-3">
            {data.recentlyUpdated.map((article) => (
              <Link
                key={article.id}
                href={`/wiki/article/${article.slug}`}
                className="block p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900 truncate">
                  {article.title}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Updated {formatDistanceToNow(new Date(article.updatedAt), { addSuffix: true })} by {article.author.name}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
