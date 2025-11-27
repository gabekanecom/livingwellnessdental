'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BookOpenIcon,
  ArrowPathIcon,
  PlayIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import ProgressBar from '@/components/lms/ProgressBar';

interface Enrollment {
  id: string;
  progress: number;
  status: string;
  createdAt: string;
  lastAccessedAt: string | null;
  course: {
    id: string;
    title: string;
    shortDescription: string | null;
    coverImage: string | null;
    difficulty: string;
    duration: number | null;
    category: {
      name: string;
      color: string;
    } | null;
    _count?: {
      modules: number;
    };
  };
}

export default function MyCoursesPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed'>('all');

  useEffect(() => {
    loadEnrollments();
  }, []);

  const loadEnrollments = async () => {
    try {
      const response = await fetch('/api/lms/enrollments');
      if (response.ok) {
        const data = await response.json();
        setEnrollments(data.enrollments || []);
      }
    } catch (error) {
      console.error('Failed to load enrollments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEnrollments = enrollments.filter(enrollment => {
    if (filter === 'all') return true;
    if (filter === 'in_progress') return enrollment.status === 'ACTIVE' && enrollment.progress < 100;
    if (filter === 'completed') return enrollment.status === 'COMPLETED' || enrollment.progress >= 100;
    return true;
  });

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <ArrowPathIcon className="h-8 w-8 text-gray-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BookOpenIcon className="h-8 w-8 text-indigo-600" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Courses</h1>
        </div>
        <p className="text-gray-600">
          Continue learning where you left off
        </p>
      </div>

      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({enrollments.length})
        </button>
        <button
          onClick={() => setFilter('in_progress')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'in_progress'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          In Progress ({enrollments.filter(e => e.status === 'ACTIVE' && e.progress < 100).length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'completed'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Completed ({enrollments.filter(e => e.status === 'COMPLETED' || e.progress >= 100).length})
        </button>
      </div>

      {filteredEnrollments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === 'all' ? 'No courses yet' : `No ${filter.replace('_', ' ')} courses`}
          </h3>
          <p className="text-gray-500 mb-4">
            {filter === 'all' 
              ? 'Enroll in a course to start learning'
              : 'Continue learning to see courses here'
            }
          </p>
          <Link
            href="/lms/catalog"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEnrollments.map((enrollment) => {
            const isCompleted = enrollment.status === 'COMPLETED' || enrollment.progress >= 100;
            
            return (
              <div
                key={enrollment.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-6">
                  <div 
                    className="w-32 h-24 rounded-lg flex items-center justify-center text-white text-3xl font-bold flex-shrink-0"
                    style={{ backgroundColor: enrollment.course.category?.color || '#6366F1' }}
                  >
                    {enrollment.course.title.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <Link 
                          href={`/lms/courses/${enrollment.course.id}`}
                          className="text-lg font-semibold text-gray-900 hover:text-indigo-600 transition-colors"
                        >
                          {enrollment.course.title}
                        </Link>
                        {enrollment.course.category && (
                          <span 
                            className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full"
                            style={{ 
                              backgroundColor: `${enrollment.course.category.color}20`, 
                              color: enrollment.course.category.color 
                            }}
                          >
                            {enrollment.course.category.name}
                          </span>
                        )}
                      </div>
                      
                      {isCompleted ? (
                        <span className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
                          <CheckCircleIcon className="h-5 w-5" />
                          Completed
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">
                          {Math.round(enrollment.progress)}% complete
                        </span>
                      )}
                    </div>

                    {enrollment.course.shortDescription && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {enrollment.course.shortDescription}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <span>{formatDuration(enrollment.course.duration)}</span>
                      <span>{enrollment.course._count?.modules || 0} modules</span>
                      <span className="capitalize">{enrollment.course.difficulty.toLowerCase()}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex-1 max-w-xs">
                        <ProgressBar 
                          progress={enrollment.progress} 
                          size="sm" 
                          color={isCompleted ? 'emerald' : 'blue'}
                        />
                      </div>
                      
                      <Link
                        href={`/lms/courses/${enrollment.course.id}/take`}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <PlayIcon className="h-4 w-4" />
                        {isCompleted ? 'Review' : 'Continue'}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
