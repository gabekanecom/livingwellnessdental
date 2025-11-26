'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ChartBarIcon, 
  BookOpenIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowPathIcon
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
  };
}

export default function DashboardPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const inProgressCourses = enrollments.filter(e => e.status === 'ACTIVE' && e.progress < 100);
  const completedCourses = enrollments.filter(e => e.status === 'COMPLETED' || e.progress >= 100);

  const stats = [
    {
      label: 'Enrolled Courses',
      value: enrollments.length,
      icon: BookOpenIcon,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      label: 'In Progress',
      value: inProgressCourses.length,
      icon: ClockIcon,
      bgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600'
    },
    {
      label: 'Completed',
      value: completedCourses.length,
      icon: CheckCircleIcon,
      bgColor: 'bg-emerald-100',
      iconColor: 'text-emerald-600'
    }
  ];

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
          <ChartBarIcon className="h-8 w-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-900">My Learning</h1>
        </div>
        <p className="text-gray-600">
          Track your progress and continue where you left off
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Continue Learning</h2>
        
        {inProgressCourses.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses in progress</h3>
            <p className="text-gray-500 mb-4">
              Start a course to see your progress here
            </p>
            <Link
              href="/lms/catalog"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inProgressCourses.map((enrollment) => (
              <Link
                key={enrollment.id}
                href={`/lms/courses/${enrollment.course.id}`}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4">
                  <div 
                    className="w-20 h-20 rounded-lg flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
                    style={{ backgroundColor: enrollment.course.category?.color || '#6366F1' }}
                  >
                    {enrollment.course.title.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate mb-1">
                      {enrollment.course.title}
                    </h3>
                    {enrollment.course.category && (
                      <span className="text-xs text-gray-500">
                        {enrollment.course.category.name}
                      </span>
                    )}
                    <div className="mt-2">
                      <ProgressBar 
                        progress={enrollment.progress} 
                        size="sm"
                        color="blue"
                      />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {completedCourses.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Completed Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedCourses.map((enrollment) => (
              <Link
                key={enrollment.id}
                href={`/lms/courses/${enrollment.course.id}`}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <CheckCircleIcon className="h-6 w-6 text-emerald-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {enrollment.course.title}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Completed
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
