'use client';

import Link from 'next/link';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

interface RelatedArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: { name: string };
}

interface RelatedArticlesProps {
  articles: RelatedArticle[];
}

export default function RelatedArticles({ articles }: RelatedArticlesProps) {
  if (articles.length === 0) return null;

  return (
    <div className="border-t border-gray-200 pt-6">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        Related Articles
      </h3>
      <ul className="space-y-3">
        {articles.map((article) => (
          <li key={article.id}>
            <Link
              href={`/wiki/article/${article.slug}`}
              className="group block"
            >
              <div className="flex items-start gap-2">
                <DocumentTextIcon className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-700 group-hover:text-violet-700 line-clamp-2">
                    {article.title}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {article.category.name}
                  </div>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
