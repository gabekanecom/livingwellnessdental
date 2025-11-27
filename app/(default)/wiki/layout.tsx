'use client'

import { WikiProvider } from '@/contexts/WikiContext';
import WikiChatWidget from '@/components/wiki/WikiChatWidget';
import WikiCategorySidebar from '@/components/wiki/WikiCategorySidebar';
import Link from 'next/link';
import '@/app/css/wiki-print.css';

export default function WikiLayout({ children }: { children: React.ReactNode }) {
  return (
    <WikiProvider>
      <a
        href="#wiki-main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-violet-600 focus:text-white focus:rounded-lg focus:outline-none"
      >
        Skip to main content
      </a>
      
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl text-gray-800 font-bold">
                Training Wiki
              </h1>
              <p className="text-sm text-gray-500">
                Your centralized knowledge base for staff training and documentation
              </p>
            </div>
            <Link 
              href="/"
              className="hidden sm:inline-flex items-center text-sm font-medium text-gray-600 hover:text-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 rounded-lg px-2 py-1"
            >
              <svg className="mr-2 w-4 h-4 fill-current text-gray-400" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M9.4 13.4l-4.7-4.8 4.7-4.8 1.4 1.4-3.4 3.4 3.4 3.4z" />
              </svg>
              <span>Return to App</span>
            </Link>
          </div>
        </header>

        <div className="bg-white shadow-sm rounded-xl mb-8">
          <div className="flex flex-col md:flex-row md:-mr-px">
            <WikiCategorySidebar />
            <main id="wiki-main-content" className="grow min-w-0" role="main">
              {children}
            </main>
          </div>
        </div>
      </div>
      <WikiChatWidget />
    </WikiProvider>
  );
}
