import Link from 'next/link';
import { BookOpenIcon, PlusIcon } from '@heroicons/react/24/outline';

export default async function WikiHomePage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Training Wiki</h1>
          <p className="text-gray-600">
            Your centralized knowledge base for staff training and documentation
          </p>
        </div>
        <Link
          href="/wiki/article/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Article
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all">
          <BookOpenIcon className="h-8 w-8 text-blue-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Getting Started</h3>
          <p className="text-gray-600 text-sm">
            Learn the basics of using the wiki and find essential documentation
          </p>
        </div>

        <div className="p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all">
          <BookOpenIcon className="h-8 w-8 text-green-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Browse Categories</h3>
          <p className="text-gray-600 text-sm">
            Explore articles organized by topic using the sidebar navigation
          </p>
        </div>

        <div className="p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all">
          <BookOpenIcon className="h-8 w-8 text-purple-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Search</h3>
          <p className="text-gray-600 text-sm">
            Use the search bar to quickly find specific articles and information
          </p>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Articles</h2>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 text-center">No articles yet. Create your first article to get started!</p>
        </div>
      </div>
    </div>
  );
}
