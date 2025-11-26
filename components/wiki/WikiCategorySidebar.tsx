'use client';

import { useEffect } from 'react';
import { useWiki } from '@/contexts/WikiContext';
import CategoryTree from './CategoryTree';
import { buildCategoryTree } from '@/lib/wiki/utils';

export default function WikiCategorySidebar() {
  const { categories, setCategories } = useWiki();

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/wiki/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    }
    fetchCategories();
  }, [setCategories]);

  const categoryTree = buildCategoryTree(categories);

  return (
    <div className="flex flex-col flex-nowrap border-r border-gray-200 min-w-60 md:min-w-72">
      <div className="py-6 px-4">
        <div className="font-semibold text-xs uppercase text-gray-400 mb-4">
          Categories
        </div>
        {categoryTree.length > 0 ? (
          <CategoryTree categories={categoryTree} />
        ) : (
          <p className="text-sm text-gray-500">No categories yet</p>
        )}
      </div>
    </div>
  );
}
