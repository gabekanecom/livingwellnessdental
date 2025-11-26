import Link from 'next/link';
import { BookOpenIcon, PlusIcon } from '@heroicons/react/24/outline';
import WikiSearchBar from './WikiSearchBar';

export default async function WikiHomePage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Browse Articles</h2>
        <Link
          href="/wiki/article/new"
          className="inline-flex items-center px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Article
        </Link>
      </div>

      <div className="mb-8">
        <WikiSearchBar />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 hover:border-violet-500 hover:shadow-md transition-all">
          <BookOpenIcon className="h-8 w-8 text-violet-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Getting Started</h3>
          <p className="text-gray-600 text-sm">
            Learn the basics of using the wiki and find essential documentation
          </p>
        </div>

        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 hover:border-violet-500 hover:shadow-md transition-all">
          <BookOpenIcon className="h-8 w-8 text-green-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Browse Categories</h3>
          <p className="text-gray-600 text-sm">
            Explore articles organized by topic using the sidebar navigation
          </p>
        </div>

        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 hover:border-violet-500 hover:shadow-md transition-all">
          <BookOpenIcon className="h-8 w-8 text-purple-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Search</h3>
          <p className="text-gray-600 text-sm">
            Use the search to quickly find specific articles and information
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Articles</h2>
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 text-center">No articles yet. Create your first article to get started!</p>
        </div>
      </div>
    </div>
  );
}
