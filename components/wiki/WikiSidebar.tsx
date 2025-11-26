'use client';

import { useWiki } from '@/contexts/WikiContext';
import SearchBar from './SearchBar';
import CategoryTree from './CategoryTree';
import { buildCategoryTree } from '@/lib/wiki/utils';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function WikiSidebar() {
  const { categories, sidebarExpanded, setSidebarExpanded, recentArticles } = useWiki();
  const categoryTree = buildCategoryTree(categories);

  if (!sidebarExpanded) {
    return null;
  }

  return (
    <aside className="w-80 bg-white border-r border-gray-200 h-screen sticky top-0 overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Wiki Navigation</h2>
          <button
            onClick={() => setSidebarExpanded(false)}
            className="lg:hidden p-1 hover:bg-gray-100 rounded"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <SearchBar />
      </div>

      <div className="px-4 pb-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Categories
        </h3>
        <CategoryTree categories={categoryTree} />
      </div>

      {recentArticles.length > 0 && (
        <div className="px-4 pb-4 border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Recent
          </h3>
          <div className="space-y-2">
            {recentArticles.map((article) => (
              <a
                key={article.id}
                href={`/wiki/article/${article.slug}`}
                className="block text-sm text-gray-700 hover:text-blue-600 truncate"
              >
                {article.title}
              </a>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
