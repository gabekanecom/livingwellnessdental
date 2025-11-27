'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PlayIcon, ClockIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import ProgressBar from './ProgressBar';

interface ContinueCourse {
  id: string;
  title: string;
  coverImage: string | null;
  progress: number;
  lastAccessedAt: string | null;
  nextLesson: {
    id: string;
    title: string;
    moduleTitle: string;
  } | null;
  category: {
    name: string;
    color: string;
  } | null;
}

export default function ContinueLearning() {
  const [courses, setCourses] = useState<ContinueCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchContinueCourses();
  }, []);

  const fetchContinueCourses = async () => {
    try {
      const response = await fetch('/api/lms/enrollments?status=ACTIVE&limit=3');
      if (response.ok) {
        const data = await response.json();
        const inProgress = data.enrollments
          ?.filter((e: { progress: number }) => e.progress > 0 && e.progress < 100)
          .slice(0, 3)
          .map((e: { 
            course: { 
              id: string; 
              title: string; 
              coverImage: string | null;
              category: { name: string; color: string } | null;
              modules: Array<{
                title: string;
                lessons: Array<{ id: string; title: string }>;
              }>;
            }; 
            progress: number; 
            lastAccessedAt: string | null;
            lessonProgress: Array<{ lessonId: string; isCompleted: boolean }>;
          }) => {
            let nextLesson = null;
            const completedLessonIds = new Set(
              e.lessonProgress?.filter(lp => lp.isCompleted).map(lp => lp.lessonId) || []
            );
            
            for (const module of e.course.modules || []) {
              for (const lesson of module.lessons || []) {
                if (!completedLessonIds.has(lesson.id)) {
                  nextLesson = {
                    id: lesson.id,
                    title: lesson.title,
                    moduleTitle: module.title
                  };
                  break;
                }
              }
              if (nextLesson) break;
            }

            return {
              id: e.course.id,
              title: e.course.title,
              coverImage: e.course.coverImage,
              progress: e.progress,
              lastAccessedAt: e.lastAccessedAt,
              nextLesson,
              category: e.course.category
            };
          });
        setCourses(inProgress || []);
      }
    } catch (error) {
      console.error('Error fetching continue courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatLastAccessed = (date: string | null) => {
    if (!date) return 'Not started';
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            <div className="h-20 bg-gray-100 rounded"></div>
            <div className="h-20 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Continue Learning</h2>
        <Link 
          href="/lms/dashboard" 
          className="text-sm text-violet-600 hover:text-violet-700 flex items-center gap-1"
        >
          View all
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>

      <div className="divide-y divide-gray-100">
        {courses.map((course) => (
          <div key={course.id} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start gap-4">
              {course.coverImage ? (
                <Image
                  src={course.coverImage}
                  alt={course.title}
                  width={80}
                  height={60}
                  className="rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div 
                  className="w-20 h-15 rounded-lg flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
                  style={{ backgroundColor: course.category?.color || '#8B5CF6' }}
                >
                  {course.title.charAt(0)}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link 
                      href={`/lms/courses/${course.id}/take`}
                      className="font-medium text-gray-900 hover:text-violet-600 line-clamp-1"
                    >
                      {course.title}
                    </Link>
                    {course.nextLesson && (
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                        Next: {course.nextLesson.title}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/lms/courses/${course.id}/take`}
                    className="flex-shrink-0 p-2 bg-violet-100 text-violet-600 rounded-lg hover:bg-violet-200 transition-colors"
                  >
                    <PlayIcon className="h-4 w-4" />
                  </Link>
                </div>

                <div className="mt-2 flex items-center gap-3">
                  <div className="flex-1">
                    <ProgressBar progress={course.progress} size="sm" showPercentage={false} />
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {Math.round(course.progress)}%
                  </span>
                </div>

                <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                  <ClockIcon className="h-3 w-3" />
                  {formatLastAccessed(course.lastAccessedAt)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
