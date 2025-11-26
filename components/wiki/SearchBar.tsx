'use client';

import { useState, useCallback } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useWiki } from '@/contexts/WikiContext';
import { useRouter } from 'next/navigation';

export default function SearchBar() {
  const { searchQuery, setSearchQuery } = useWiki();
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const router = useRouter();

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim()) {
      setSearchQuery(localQuery);
      router.push(`/wiki/search?q=${encodeURIComponent(localQuery)}`);
    }
  }, [localQuery, setSearchQuery, router]);

  return (
    <form onSubmit={handleSearch} className="relative">
      <input
        type="text"
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        placeholder="Search wiki..."
        className="w-full px-4 py-2 pl-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
    </form>
  );
}
