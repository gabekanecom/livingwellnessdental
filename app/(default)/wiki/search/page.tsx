import { Suspense } from 'react';
import Link from 'next/link';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import SearchInput from './SearchInput';

interface SearchResultsProps {
  searchParams: Promise<{ q?: string }>;
}

async function SearchResults({ query }: { query: string }) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/wiki/search?q=${encodeURIComponent(query)}`,
    { cache: 'no-store' }
  );

  if (!response.ok) {
    return <div className="text-red-600">Error loading search results</div>;
  }

  const { results } = await response.json();

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
        <p className="text-gray-600">Try adjusting your search terms</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {results.map((result: any) => (
        <Link
          key={result.id}
          href={`/wiki/article/${result.slug}`}
          className="block p-4 bg-gray-50 border border-gray-200 rounded-lg hover:border-violet-500 hover:shadow-md transition-all"
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{result.title}</h3>
            <span className="text-sm text-gray-500 ml-4">{result.categoryName}</span>
          </div>
          {result.excerpt && (
            <p className="text-gray-600 line-clamp-2">{result.excerpt}</p>
          )}
        </Link>
      ))}
    </div>
  );
}

export default async function SearchPage({ searchParams }: SearchResultsProps) {
  const { q } = await searchParams;

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Search</h2>
      
      <div className="mb-6">
        <SearchInput initialQuery={q || ''} />
      </div>

      {q && (
        <p className="text-gray-600 mb-6">
          Showing results for: <span className="font-medium">{q}</span>
        </p>
      )}

      {q ? (
        <Suspense fallback={<div className="text-gray-600">Loading...</div>}>
          <SearchResults query={q} />
        </Suspense>
      ) : (
        <div className="text-center py-12">
          <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Enter a search query to get started</p>
        </div>
      )}
    </div>
  );
}
