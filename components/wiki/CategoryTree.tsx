'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { WikiCategory } from '@/lib/wiki/types';
import { useWiki } from '@/contexts/WikiContext';

interface CategoryTreeProps {
  categories: WikiCategory[];
  level?: number;
}

function CategoryNode({ category, level = 0 }: { category: WikiCategory; level?: number }) {
  const { expandedCategories, toggleCategoryExpanded } = useWiki();
  const isExpanded = expandedCategories.has(category.id);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div className="select-none">
      <div
        className="flex items-center py-2 px-3 hover:bg-gray-100 rounded-md cursor-pointer group"
        style={{ paddingLeft: `${level * 12 + 12}px` }}
      >
        {hasChildren ? (
          <button
            onClick={() => toggleCategoryExpanded(category.id)}
            className="mr-1 focus:outline-none"
          >
            {isExpanded ? (
              <ChevronDownIcon className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRightIcon className="h-4 w-4 text-gray-500" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}
        <Link
          href={`/wiki/category/${category.slug}`}
          className="flex-1 text-sm text-gray-700 group-hover:text-blue-600 transition-colors"
        >
          {category.name}
        </Link>
        {category.articles && (
          <span className="text-xs text-gray-400">{category.articles.length}</span>
        )}
      </div>
      {hasChildren && isExpanded && (
        <div>
          {category.children!.map((child) => (
            <CategoryNode key={child.id} category={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategoryTree({ categories, level = 0 }: CategoryTreeProps) {
  return (
    <div className="space-y-1">
      {categories.map((category) => (
        <CategoryNode key={category.id} category={category} level={level} />
      ))}
    </div>
  );
}
