'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWiki } from '@/contexts/WikiContext';
import CategoryTree from './CategoryTree';
import { buildCategoryTree } from '@/lib/wiki/utils';
import {
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  TagIcon,
  UserIcon,
  DocumentMagnifyingGlassIcon,
  ChartBarIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';

const quickLinks = [
  { href: '/wiki', label: 'Home', icon: HomeIcon },
  { href: '/wiki/search', label: 'Search', icon: MagnifyingGlassIcon },
  { href: '/wiki/browse', label: 'All Articles', icon: DocumentTextIcon },
  { href: '/wiki/tags', label: 'Tags', icon: TagIcon },
  { href: '/wiki/media', label: 'Media Library', icon: PhotoIcon },
  { href: '/wiki/my-articles', label: 'My Articles', icon: UserIcon },
  { href: '/wiki/review', label: 'Review Queue', icon: DocumentMagnifyingGlassIcon },
  { href: '/wiki/analytics', label: 'Analytics', icon: ChartBarIcon },
];

export default function WikiCategorySidebar() {
  const { categories, setCategories } = useWiki();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

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

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const categoryTree = buildCategoryTree(categories);

  const SidebarContent = () => (
    <>
      <div className="mb-6">
        <span className="font-semibold text-xs uppercase text-gray-400 mb-3 block">
          Quick Links
        </span>
        <nav className="space-y-1" aria-label="Quick links">
          {quickLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-violet-100 text-violet-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <link.icon className="h-4 w-4" aria-hidden="true" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-xs uppercase text-gray-400">
            Categories
          </span>
          <Link
            href="/wiki/categories"
            className="p-1 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded"
            title="Manage Categories"
            aria-label="Manage categories"
          >
            <Cog6ToothIcon className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        {categoryTree.length > 0 ? (
          <CategoryTree categories={categoryTree} />
        ) : (
          <p className="text-sm text-gray-500">No categories yet</p>
        )}
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed bottom-20 left-4 z-40 p-3 bg-violet-600 text-white rounded-full shadow-lg hover:bg-violet-700 transition-colors"
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
      >
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          md:relative md:translate-x-0 md:block
          fixed inset-y-0 left-0 z-50 w-[85vw] max-w-72 sm:w-72 bg-white
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          border-r border-gray-200 overflow-y-auto
        `}
        aria-label="Wiki navigation"
      >
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200">
          <span className="font-semibold text-gray-900">Navigation</span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg"
            aria-label="Close navigation menu"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="p-4 md:py-6">
          <SidebarContent />
        </div>
      </aside>
    </>
  );
}
