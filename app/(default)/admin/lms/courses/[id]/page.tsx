'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  AcademicCapIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

interface CourseInfo {
  id: string;
  title: string;
  description: string;
  coverImage: string | null;
  difficulty: string;
  duration: number | null;
  isPublished: boolean;
  category: { id: string; name: string } | null;
}

interface Stats {
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  pausedEnrollments: number;
  recentEnrollments: number;
  completionRate: number;
  avgProgress: number;
  avgDaysToComplete: number;
  totalLessons: number;
  totalModules: number;
}

interface LessonStat {
  id: string;
  title: string;
  duration: number | null;
  order: number;
  completions: number;
  completionRate: number;
  avgTimeSpent: number;
}

interface ModuleStat {
  id: string;
  title: string;
  order: number;
  lessonCount: number;
  avgCompletionRate: number;
  lessons: LessonStat[];
}

interface Enrollment {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    locations: string[];
  };
  status: string;
  progress: number;
  lessonsCompleted: number;
  totalLessons: number;
  enrolledAt: string;
  lastAccessedAt: string | null;
  completedAt: string | null;
  daysSinceEnrollment: number;
  daysSinceActivity: number | null;
}

export default function AdminCourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [isLoading, setIsLoading] = useState(true);
  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [moduleStats, setModuleStats] = useState<ModuleStat[]>([]);
  const [dropOffLessons, setDropOffLessons] = useState<LessonStat[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState('enrolledAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchCourseData();
  }, [id]);

  const fetchCourseData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/lms/courses/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCourse(data.course);
        setStats(data.stats);
        setModuleStats(data.moduleStats);
        setDropOffLessons(data.dropOffLessons);
        setEnrollments(data.enrollments);
      }
    } catch (error) {
      console.error('Error fetching course data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ACTIVE: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      PAUSED: 'bg-yellow-100 text-yellow-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const sortedEnrollments = [...enrollments].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'progress':
        comparison = a.progress - b.progress;
        break;
      case 'name':
        comparison = a.user.name.localeCompare(b.user.name);
        break;
      case 'lastActivity':
        const aDate = a.lastAccessedAt ? new Date(a.lastAccessedAt).getTime() : 0;
        const bDate = b.lastAccessedAt ? new Date(b.lastAccessedAt).getTime() : 0;
        comparison = aDate - bDate;
        break;
      default:
        comparison = new Date(a.enrolledAt).getTime() - new Date(b.enrolledAt).getTime();
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-48 bg-gray-200 rounded-xl"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-800">Course not found</h2>
          <Link href="/admin/lms" className="text-violet-600 hover:text-violet-700 mt-4 inline-block">
            ← Back to LMS Overview
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      {/* Back link */}
      <Link
        href="/admin/lms"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeftIcon className="w-4 h-4 mr-1" />
        Back to LMS Overview
      </Link>

      {/* Course Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          {course.coverImage ? (
            <img
              src={course.coverImage}
              alt={course.title}
              className="w-full md:w-48 h-32 object-cover rounded-lg"
            />
          ) : (
            <div className="w-full md:w-48 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
              <AcademicCapIcon className="w-12 h-12 text-gray-400" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{course.title}</h1>
                <p className="text-gray-600 mt-1 line-clamp-2">{course.description}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                course.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {course.isPublished ? 'Published' : 'Draft'}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
              {course.category && (
                <span className="bg-gray-100 px-2 py-1 rounded">{course.category.name}</span>
              )}
              <span className="bg-gray-100 px-2 py-1 rounded capitalize">{course.difficulty}</span>
              {course.duration && (
                <span className="bg-gray-100 px-2 py-1 rounded">{course.duration} min</span>
              )}
              <span className="bg-gray-100 px-2 py-1 rounded">
                {stats?.totalModules} modules • {stats?.totalLessons} lessons
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Enrolled</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalEnrollments || 0}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats?.activeEnrollments || 0} active, {stats?.pausedEnrollments || 0} paused
              </p>
            </div>
            <div className="bg-blue-100 p-2 rounded-lg">
              <UserGroupIcon className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.completionRate || 0}%</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats?.completedEnrollments || 0} completed
              </p>
            </div>
            <div className="bg-green-100 p-2 rounded-lg">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Progress</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.avgProgress || 0}%</p>
              <p className="text-xs text-gray-500 mt-1">
                Across all enrollments
              </p>
            </div>
            <div className="bg-violet-100 p-2 rounded-lg">
              <ChartBarIcon className="h-5 w-5 text-violet-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Days to Complete</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.avgDaysToComplete || 0}</p>
              <p className="text-xs text-gray-500 mt-1">
                +{stats?.recentEnrollments || 0} new this month
              </p>
            </div>
            <div className="bg-amber-100 p-2 rounded-lg">
              <ClockIcon className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Drop-off Alert */}
      {dropOffLessons.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
            <h2 className="text-lg font-semibold text-amber-800">Potential Drop-off Points</h2>
          </div>
          <p className="text-sm text-amber-700 mb-3">
            These lessons have significantly lower completion rates than average:
          </p>
          <div className="space-y-2">
            {dropOffLessons.map(lesson => (
              <div key={lesson.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                <span className="text-sm font-medium text-gray-800">{lesson.title}</span>
                <span className="text-sm text-amber-700">{lesson.completionRate}% completion</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Module/Lesson Breakdown */}
        <div className="xl:col-span-1 bg-white rounded-xl border border-gray-200">
          <div className="p-5 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Content Breakdown</h2>
          </div>
          <div className="p-4 space-y-2">
            {moduleStats.map(module => (
              <div key={module.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleModule(module.id)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    {expandedModules.has(module.id) ? (
                      <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                    )}
                    <span className="font-medium text-gray-800">{module.title}</span>
                  </div>
                  <span className={`text-sm px-2 py-0.5 rounded ${
                    module.avgCompletionRate >= 70
                      ? 'bg-green-100 text-green-800'
                      : module.avgCompletionRate >= 40
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {module.avgCompletionRate}%
                  </span>
                </button>
                {expandedModules.has(module.id) && (
                  <div className="p-3 space-y-2">
                    {module.lessons.map(lesson => (
                      <div key={lesson.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{lesson.title}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full">
                            <div
                              className={`h-full rounded-full ${
                                lesson.completionRate >= 70 ? 'bg-green-500' :
                                lesson.completionRate >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${lesson.completionRate}%` }}
                            />
                          </div>
                          <span className="text-gray-500 w-10 text-right">{lesson.completionRate}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {moduleStats.length === 0 && (
              <p className="text-gray-500 text-center py-4">No modules in this course</p>
            )}
          </div>
        </div>

        {/* Enrolled Students Table */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              Enrolled Students ({enrollments.length})
            </h2>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="form-select text-sm"
            >
              <option value="enrolledAt-desc">Newest First</option>
              <option value="enrolledAt-asc">Oldest First</option>
              <option value="progress-desc">Highest Progress</option>
              <option value="progress-asc">Lowest Progress</option>
              <option value="name-asc">Name A-Z</option>
              <option value="lastActivity-desc">Recently Active</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Progress</th>
                  <th className="px-5 py-3">Enrolled</th>
                  <th className="px-5 py-3">Last Active</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedEnrollments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-gray-500">
                      No enrollments yet
                    </td>
                  </tr>
                ) : (
                  sortedEnrollments.map(enrollment => (
                    <tr key={enrollment.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {enrollment.user.avatar ? (
                            <img
                              src={enrollment.user.avatar}
                              alt=""
                              className="w-9 h-9 rounded-full"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-medium text-sm">
                              {enrollment.user.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{enrollment.user.name}</p>
                            <p className="text-xs text-gray-500">{enrollment.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                enrollment.progress >= 100 ? 'bg-green-500' :
                                enrollment.progress >= 50 ? 'bg-violet-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${enrollment.progress}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{enrollment.progress}%</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {enrollment.lessonsCompleted}/{enrollment.totalLessons} lessons
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-900">{formatDate(enrollment.enrolledAt)}</p>
                        <p className="text-xs text-gray-500">{enrollment.daysSinceEnrollment} days ago</p>
                      </td>
                      <td className="px-5 py-4">
                        {enrollment.lastAccessedAt ? (
                          <>
                            <p className="text-sm text-gray-900">{formatDate(enrollment.lastAccessedAt)}</p>
                            <p className={`text-xs ${
                              enrollment.daysSinceActivity !== null && enrollment.daysSinceActivity > 7
                                ? 'text-amber-600' : 'text-gray-500'
                            }`}>
                              {enrollment.daysSinceActivity} days ago
                            </p>
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">Never</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(enrollment.status)}`}>
                          {enrollment.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
