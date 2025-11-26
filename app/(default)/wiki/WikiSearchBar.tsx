'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function WikiSearchBar() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/wiki/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search articles..."
        className="w-full px-4 py-3 pl-12 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
      />
      <MagnifyingGlassIcon className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
      <button
        type="submit"
        className="absolute right-2 top-2 px-4 py-1.5 bg-violet-500 text-white text-sm font-medium rounded-md hover:bg-violet-600 transition-colors"
      >
        Search
      </button>
    </form>
  );
}
