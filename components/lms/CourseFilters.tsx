'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import CourseSearchAutocomplete from './CourseSearchAutocomplete';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface CourseFiltersProps {
  categories: Category[];
}

const DIFFICULTY_OPTIONS = [
  { value: 'BEGINNER', label: 'Beginner', color: 'bg-green-100 text-green-700' },
  { value: 'INTERMEDIATE', label: 'Intermediate', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'ADVANCED', label: 'Advanced', color: 'bg-red-100 text-red-700' },
];

const DURATION_OPTIONS = [
  { value: '0-30', label: 'Under 30 min' },
  { value: '30-60', label: '30-60 min' },
  { value: '60-120', label: '1-2 hours' },
  { value: '120+', label: '2+ hours' },
];

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'title', label: 'A-Z' },
];

export default function CourseFilters({ categories }: CourseFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get('category') || '';
  const currentDifficulty = searchParams.get('difficulty') || '';
  const currentDuration = searchParams.get('duration') || '';
  const currentSort = searchParams.get('sort') || 'featured';
  const currentQuery = searchParams.get('q') || '';

  const createQueryString = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      return params.toString();
    },
    [searchParams]
  );

  const updateFilter = (key: string, value: string | null) => {
    const queryString = createQueryString({ [key]: value });
    router.push(`/lms/catalog${queryString ? `?${queryString}` : ''}`);
  };

  const clearAllFilters = () => {
    router.push('/lms/catalog');
  };

  const hasActiveFilters = currentCategory || currentDifficulty || currentDuration || currentQuery;

  const selectedCategory = categories.find(c => c.id === currentCategory);

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <CourseSearchAutocomplete />
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-stretch sm:items-center">
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">Filters:</span>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-4">
          <select
            value={currentCategory}
            onChange={(e) => updateFilter('category', e.target.value || null)}
            className="pl-3 pr-8 py-2.5 sm:py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 min-h-[44px] sm:min-h-0"
            style={selectedCategory ? {
              backgroundColor: `${selectedCategory.color}15`,
              borderColor: selectedCategory.color
            } : {}}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={currentDifficulty}
            onChange={(e) => updateFilter('difficulty', e.target.value || null)}
            className="pl-3 pr-8 py-2.5 sm:py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 min-h-[44px] sm:min-h-0"
          >
            <option value="">All Levels</option>
            {DIFFICULTY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={currentDuration}
            onChange={(e) => updateFilter('duration', e.target.value || null)}
            className="pl-3 pr-8 py-2.5 sm:py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 min-h-[44px] sm:min-h-0"
          >
            <option value="">Any Duration</option>
            {DURATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={currentSort}
            onChange={(e) => updateFilter('sort', e.target.value)}
            className="pl-3 pr-8 py-2.5 sm:py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 min-h-[44px] sm:min-h-0 col-span-2 sm:col-span-1"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center justify-center gap-1 px-3 py-2.5 sm:py-1.5 text-sm text-red-600 hover:text-red-700 min-h-[44px] sm:min-h-0"
          >
            <XMarkIcon className="h-4 w-4" />
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
