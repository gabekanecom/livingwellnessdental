'use client';

interface CardSkeletonProps {
  count?: number;
}

export default function CardSkeleton({ count = 3 }: CardSkeletonProps) {
  return (
    <div className="space-y-4" aria-label="Loading...">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse bg-white border border-gray-200 rounded-xl p-5"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-gray-200 rounded-lg" />
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded w-2/3 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
