'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MagnifyingGlassIcon, XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';

interface CourseResult {
  id: string;
  title: string;
  shortDescription: string | null;
  coverImage: string | null;
  difficulty: string;
  duration: number | null;
  category: {
    id: string;
    name: string;
    color: string;
  } | null;
  _count: {
    enrollments: number;
  };
}

export default function CourseSearchAutocomplete() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<CourseResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const searchCourses = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/lms/courses/search?q=${encodeURIComponent(searchQuery)}&limit=5`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.courses);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchCourses(query);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query, searchCourses]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('q', query.trim());
      router.push(`/lms/catalog?${params.toString()}`);
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          router.push(`/lms/courses/${results[selectedIndex].id}`);
          setIsOpen(false);
        } else {
          handleSubmit(e);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
              setSelectedIndex(-1);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search courses..."
            className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </form>

      {isOpen && (query.length >= 2 || results.length > 0) && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-violet-500 mx-auto"></div>
            </div>
          ) : results.length > 0 ? (
            <ul>
              {results.map((course, index) => (
                <li key={course.id}>
                  <Link
                    href={`/lms/courses/${course.id}`}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors ${
                      index === selectedIndex ? 'bg-violet-50' : ''
                    }`}
                  >
                    {course.coverImage ? (
                      <Image
                        src={course.coverImage}
                        alt={course.title}
                        width={48}
                        height={36}
                        className="rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <div
                        className="w-12 h-9 rounded flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ backgroundColor: course.category?.color || '#8B5CF6' }}
                      >
                        {course.title.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {course.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {course.category && (
                          <span
                            className="px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: `${course.category.color}20`,
                              color: course.category.color
                            }}
                          >
                            {course.category.name}
                          </span>
                        )}
                        <span className="capitalize">{course.difficulty.toLowerCase()}</span>
                        {course.duration && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <ClockIcon className="h-3 w-3" />
                              {formatDuration(course.duration)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
              <li className="border-t border-gray-100">
                <button
                  onClick={handleSubmit}
                  className="w-full p-3 text-sm text-violet-600 hover:bg-violet-50 text-center"
                >
                  See all results for "{query}"
                </button>
              </li>
            </ul>
          ) : query.length >= 2 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No courses found for "{query}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
