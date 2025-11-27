'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  EyeIcon,
  ClockIcon,
  XMarkIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import SearchWithAutocomplete from '@/components/wiki/SearchWithAutocomplete';
import { formatDistanceToNow } from 'date-fns';

interface SearchResult {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  views: number;
  updatedAt: string;
  category: { id: string; name: string; slug: string };
  author: { name: string };
  tags: { id: string; name: string }[];
  matchType: 'title' | 'content';
}

interface Filters {
  categories: { id: string; name: string }[];
  tags: { id: string; name: string }[];
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const categoryFilter = searchParams.get('category') || '';
  const tagFilter = searchParams.get('tag') || '';
  const sortBy = searchParams.get('sort') || 'relevance';

  const [results, setResults] = useState<SearchResult[]>([]);
  const [filters, setFilters] = useState<Filters>({ categories: [], tags: [] });
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (query) {
      performSearch();
    }
  }, [query, categoryFilter, tagFilter, sortBy]);

  async function performSearch() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: query });
      if (categoryFilter) params.set('category', categoryFilter);
      if (tagFilter) params.set('tag', tagFilter);
      if (sortBy) params.set('sort', sortBy);

      const res = await fetch(`/api/wiki/search?${params}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results);
        setFilters(data.filters);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/wiki/search?${params.toString()}`);
  }

  function clearFilters() {
    router.push(`/wiki/search?q=${encodeURIComponent(query)}`);
  }

  const hasActiveFilters = categoryFilter || tagFilter || sortBy !== 'relevance';

  return (
    <div className="p-6">
      <div className="max-w-3xl mb-8">
        <SearchWithAutocomplete initialQuery={query} autoFocus />
      </div>

      {query && (
        <>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {loading ? 'Searching...' : `${results.length} results for "${query}"`}
              </h2>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                showFilters || hasActiveFilters
                  ? 'bg-violet-100 text-violet-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FunnelIcon className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-violet-600 rounded-full" />
              )}
            </button>
          </div>

          {showFilters && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
              <div className="flex flex-wrap gap-6">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-2">
                    Category
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => updateFilter('category', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="">All Categories</option>
                    {filters.categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-2">
                    Tag
                  </label>
                  <select
                    value={tagFilter}
                    onChange={(e) => updateFilter('tag', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="">All Tags</option>
                    {filters.tags.map((tag) => (
                      <option key={tag.id} value={tag.name}>{tag.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => updateFilter('sort', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="date">Most Recent</option>
                    <option value="views">Most Viewed</option>
                  </select>
                </div>

                {hasActiveFilters && (
                  <div className="flex items-end">
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                      <XMarkIcon className="h-4 w-4" />
                      Clear filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-white border border-gray-200 rounded-xl p-5">
                  <div className="h-5 bg-gray-200 rounded w-2/3 mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-4">
              {results.map((result) => (
                <Link
                  key={result.id}
                  href={`/wiki/article/${result.slug}`}
                  className="block bg-white border border-gray-200 rounded-xl p-5 hover:border-violet-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-violet-100 transition-colors">
                      <DocumentTextIcon className="h-5 w-5 text-gray-400 group-hover:text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-violet-700">
                          {result.title}
                        </h3>
                        {result.matchType === 'title' && (
                          <span className="px-2 py-0.5 text-xs bg-violet-100 text-violet-700 rounded">
                            Title match
                          </span>
                        )}
                      </div>
                      {result.excerpt && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {result.excerpt}
                        </p>
                      )}
                      <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">
                        <span className="text-violet-600 font-medium">
                          {result.category.name}
                        </span>
                        <span>{result.author.name}</span>
                        <span className="flex items-center gap-1">
                          <EyeIcon className="h-3 w-3" />
                          {result.views} views
                        </span>
                        <span className="flex items-center gap-1">
                          <ClockIcon className="h-3 w-3" />
                          {formatDistanceToNow(new Date(result.updatedAt), { addSuffix: true })}
                        </span>
                      </div>
                      {result.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {result.tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag.id}
                              className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
              <MagnifyingGlassIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-500 mb-4">
                Try adjusting your search terms or filters
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-violet-600 hover:text-violet-700 font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </>
      )}

      {!query && (
        <div className="text-center py-12">
          <MagnifyingGlassIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Search the Wiki</h3>
          <p className="text-gray-500">
            Enter a search term to find articles, procedures, and documentation
          </p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
