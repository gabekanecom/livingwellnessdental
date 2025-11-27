'use client';

export default function ArticleSkeleton() {
  return (
    <div className="p-6 animate-pulse" aria-label="Loading article...">
      <div className="h-4 bg-gray-200 rounded w-48 mb-6" />
      
      <div className="max-w-4xl mx-auto">
        <div className="h-10 bg-gray-200 rounded w-3/4 mb-4" />
        
        <div className="flex items-center gap-4 mb-8">
          <div className="h-8 w-8 bg-gray-200 rounded-full" />
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-4 bg-gray-200 rounded w-20" />
          <div className="h-4 bg-gray-200 rounded w-32" />
        </div>
        
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-4/5" />
        </div>
        
        <div className="h-6 bg-gray-200 rounded w-48 mt-8 mb-4" />
        
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>
        
        <div className="h-6 bg-gray-200 rounded w-56 mt-8 mb-4" />
        
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    </div>
  );
}
