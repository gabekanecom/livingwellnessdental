'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MagnifyingGlassIcon,
  AcademicCapIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

interface CourseStats {
  id: string;
  title: string;
  coverImage: string | null;
  totalEnrollments: number;
  recentEnrollments: number;
  avgProgress: number;
  completionRate: number;
  completedCount: number;
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'enrollments' | 'completion' | 'progress' | 'title'>('enrollments');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/lms/stats?period=30');
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courseStats || []);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCourses = courses
    .filter(course =>
      course.title.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'completion':
          return b.completionRate - a.completionRate;
        case 'progress':
          return b.avgProgress - a.avgProgress;
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return b.totalEnrollments - a.totalEnrollments;
      }
    });

  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      {/* Header */}
      <div className="sm:flex sm:justify-between sm:items-center mb-8">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Course Progress</h1>
          <p className="text-gray-600 mt-1">View enrollment and completion metrics for all courses</p>
        </div>
      </div>

      {/* Search and Sort */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input w-full pl-10"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="form-select"
        >
          <option value="enrollments">Most Enrollments</option>
          <option value="completion">Highest Completion Rate</option>
          <option value="progress">Highest Avg Progress</option>
          <option value="title">Alphabetical</option>
        </select>
      </div>

      {/* Course Cards Grid */}
      {filteredCourses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <AcademicCapIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-800 mb-2">No courses found</h2>
          <p className="text-gray-600">
            {search ? 'Try a different search term' : 'No published courses available'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => (
            <Link
              key={course.id}
              href={`/admin/lms/courses/${course.id}`}
              className="bg-white rounded-xl border border-gray-200 hover:border-violet-300 hover:shadow-md transition-all overflow-hidden group"
            >
              {/* Cover Image */}
              {course.coverImage ? (
                <div className="h-36 overflow-hidden">
                  <img
                    src={course.coverImage}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="h-36 bg-gradient-to-br from-violet-100 to-violet-50 flex items-center justify-center">
                  <AcademicCapIcon className="w-16 h-16 text-violet-300" />
                </div>
              )}

              {/* Content */}
              <div className="p-5">
                <h3 className="font-semibold text-gray-900 group-hover:text-violet-600 transition-colors mb-3 line-clamp-2">
                  {course.title}
                </h3>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 text-gray-600 mb-1">
                      <UserGroupIcon className="w-4 h-4" />
                      <span className="text-xs">Enrolled</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold text-gray-900">{course.totalEnrollments}</span>
                      {course.recentEnrollments > 0 && (
                        <span className="text-xs text-green-600 flex items-center">
                          <ArrowTrendingUpIcon className="w-3 h-3" />
                          +{course.recentEnrollments}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-600 mb-1">Completion</div>
                    <span className={`text-lg font-bold ${
                      course.completionRate >= 70 ? 'text-green-600' :
                      course.completionRate >= 40 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {course.completionRate}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Avg Progress</span>
                    <span>{course.avgProgress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-violet-500 rounded-full transition-all"
                      style={{ width: `${course.avgProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
