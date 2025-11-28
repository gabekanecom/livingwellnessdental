'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AcademicCapIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface OverviewStats {
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  totalCourses: number;
  recentEnrollments: number;
  completionRate: number;
  avgProgress: number;
  avgDaysToComplete: number;
}

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

interface StalledLearner {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  course: {
    id: string;
    title: string;
  };
  progress: number;
  enrolledAt: string;
  lastAccessedAt: string | null;
  daysSinceEnrollment: number;
  daysSinceActivity: number | null;
}

interface RecentEnrollment {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  course: {
    id: string;
    title: string;
  };
  progress: number;
  status: string;
  enrolledAt: string;
}

interface EnrollmentTrend {
  date: string;
  enrollments: number;
  completions: number;
}

export default function AdminLMSDashboard() {
  const [period, setPeriod] = useState(30);
  const [isLoading, setIsLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [courseStats, setCourseStats] = useState<CourseStats[]>([]);
  const [stalledLearners, setStalledLearners] = useState<StalledLearner[]>([]);
  const [recentEnrollments, setRecentEnrollments] = useState<RecentEnrollment[]>([]);
  const [enrollmentTrend, setEnrollmentTrend] = useState<EnrollmentTrend[]>([]);

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/lms/stats?period=${period}`);
      if (response.ok) {
        const data = await response.json();
        setOverview(data.overview);
        setCourseStats(data.courseStats);
        setStalledLearners(data.stalledLearners);
        setRecentEnrollments(data.recentEnrollments);
        setEnrollmentTrend(data.enrollmentTrend);
      }
    } catch (error) {
      console.error('Error fetching LMS stats:', error);
    } finally {
      setIsLoading(false);
    }
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

  if (isLoading && !overview) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      {/* Header */}
      <div className="sm:flex sm:justify-between sm:items-center mb-8">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">LMS Overview</h1>
          <p className="text-gray-600 mt-1">Monitor learning progress across your organization</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(parseInt(e.target.value))}
            className="form-select text-sm"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <Link
            href="/admin/lms/enrollments"
            className="btn bg-violet-500 hover:bg-violet-600 text-white"
          >
            View All Enrollments
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Learners</p>
              <p className="text-2xl font-bold text-gray-900">{overview?.activeEnrollments || 0}</p>
              <p className="text-xs text-gray-500 mt-1">
                +{overview?.recentEnrollments || 0} in last {period} days
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
              <p className="text-2xl font-bold text-gray-900">{overview?.completionRate || 0}%</p>
              <p className="text-xs text-gray-500 mt-1">
                {overview?.completedEnrollments || 0} of {overview?.totalEnrollments || 0} completed
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
              <p className="text-2xl font-bold text-gray-900">{overview?.avgProgress || 0}%</p>
              <p className="text-xs text-gray-500 mt-1">
                Across active enrollments
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
              <p className="text-2xl font-bold text-gray-900">{overview?.avgDaysToComplete || 0}</p>
              <p className="text-xs text-gray-500 mt-1">
                {overview?.totalCourses || 0} courses available
              </p>
            </div>
            <div className="bg-amber-100 p-2 rounded-lg">
              <ClockIcon className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Stalled Learners Alert */}
        {stalledLearners.length > 0 && (
          <div className="xl:col-span-3 bg-amber-50 border border-amber-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
              <h2 className="text-lg font-semibold text-amber-800">Needs Attention</h2>
              <span className="bg-amber-200 text-amber-800 text-xs font-medium px-2 py-0.5 rounded-full">
                {stalledLearners.length}
              </span>
            </div>
            <p className="text-sm text-amber-700 mb-4">
              These learners have been enrolled for 14+ days with less than 50% progress and no activity in the last 7 days.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-amber-700 uppercase">
                    <th className="pb-2">Learner</th>
                    <th className="pb-2">Course</th>
                    <th className="pb-2">Progress</th>
                    <th className="pb-2">Days Enrolled</th>
                    <th className="pb-2">Last Active</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {stalledLearners.map((item) => (
                    <tr key={item.id} className="border-t border-amber-200">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          {item.user.avatar ? (
                            <img src={item.user.avatar} alt="" className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 font-medium">
                              {item.user.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{item.user.name}</p>
                            <p className="text-xs text-gray-500">{item.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-gray-700">{item.course.title}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-amber-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                          <span className="text-amber-700">{item.progress}%</span>
                        </div>
                      </td>
                      <td className="py-3 text-gray-700">{item.daysSinceEnrollment} days</td>
                      <td className="py-3 text-gray-700">
                        {item.daysSinceActivity !== null
                          ? `${item.daysSinceActivity} days ago`
                          : 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Course Performance */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="p-5 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Course Performance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                  <th className="px-5 py-3">Course</th>
                  <th className="px-5 py-3">Enrollments</th>
                  <th className="px-5 py-3">Avg Progress</th>
                  <th className="px-5 py-3">Completion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {courseStats.slice(0, 8).map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/lms/courses/${course.id}`}
                        className="flex items-center gap-3 hover:text-violet-600"
                      >
                        {course.coverImage ? (
                          <img
                            src={course.coverImage}
                            alt=""
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                            <AcademicCapIcon className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <span className="font-medium text-gray-900">{course.title}</span>
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm text-gray-900">{course.totalEnrollments}</div>
                      {course.recentEnrollments > 0 && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <ArrowTrendingUpIcon className="w-3 h-3" />
                          +{course.recentEnrollments}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-violet-500 rounded-full"
                            style={{ width: `${course.avgProgress}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{course.avgProgress}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          course.completionRate >= 70
                            ? 'bg-green-100 text-green-800'
                            : course.completionRate >= 40
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {course.completionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {courseStats.length > 8 && (
            <div className="p-4 border-t border-gray-200 text-center">
              <Link
                href="/lms/courses"
                className="text-sm text-violet-600 hover:text-violet-700 font-medium"
              >
                View all {courseStats.length} courses
              </Link>
            </div>
          )}
        </div>

        {/* Recent Enrollments */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-5 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Recent Enrollments</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {recentEnrollments.map((enrollment) => (
              <div key={enrollment.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start gap-3">
                  {enrollment.user.avatar ? (
                    <img
                      src={enrollment.user.avatar}
                      alt=""
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-medium">
                      {enrollment.user.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {enrollment.user.name}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {enrollment.course.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(enrollment.status)}`}>
                        {enrollment.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(enrollment.enrolledAt)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{enrollment.progress}%</p>
                    <div className="w-16 h-1.5 bg-gray-200 rounded-full mt-1">
                      <div
                        className="h-full bg-violet-500 rounded-full"
                        style={{ width: `${enrollment.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {recentEnrollments.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No enrollments in this period
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enrollment Trend Chart Placeholder */}
      {enrollmentTrend.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Enrollment Trend</h2>
          <div className="h-48 flex items-end gap-1">
            {enrollmentTrend.slice(-14).map((day, index) => {
              const maxEnrollments = Math.max(...enrollmentTrend.map(d => d.enrollments), 1);
              const height = (day.enrollments / maxEnrollments) * 100;
              return (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    className="w-full bg-violet-500 rounded-t hover:bg-violet-600 transition-colors"
                    style={{ height: `${Math.max(height, 4)}%` }}
                    title={`${day.date}: ${day.enrollments} enrollments, ${day.completions} completions`}
                  />
                  {index % 2 === 0 && (
                    <span className="text-xs text-gray-500 transform -rotate-45 origin-left">
                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-violet-500 rounded" />
              <span className="text-gray-600">Enrollments</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
