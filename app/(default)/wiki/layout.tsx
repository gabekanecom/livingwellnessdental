'use client'

import { WikiProvider } from '@/contexts/WikiContext';
import WikiChatWidget from '@/components/wiki/WikiChatWidget';
import WikiCategorySidebar from '@/components/wiki/WikiCategorySidebar';
import Link from 'next/link';

export default function WikiLayout({ children }: { children: React.ReactNode }) {
  return (
    <WikiProvider>
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
        <div className="mb-8">
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
              className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-violet-600"
            >
              <svg className="mr-2 w-4 h-4 fill-current text-gray-400" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.4 13.4l-4.7-4.8 4.7-4.8 1.4 1.4-3.4 3.4 3.4 3.4z" />
              </svg>
              <span>Return to App</span>
            </Link>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-xl mb-8">
          <div className="flex flex-col md:flex-row md:-mr-px">
            <WikiCategorySidebar />
            <div className="grow">
              {children}
            </div>
          </div>
        </div>
      </div>
      <WikiChatWidget />
    </WikiProvider>
  );
}
