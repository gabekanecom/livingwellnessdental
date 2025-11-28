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
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

// Types
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

interface Enrollment {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    locations: string[];
    roles: string[];
  };
  course: {
    id: string;
    title: string;
    coverImage: string | null;
    duration: number | null;
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

interface Course {
  id: string;
  title: string;
}

interface Location {
  id: string;
  name: string;
}

interface LearnerEnrollment {
  id: string;
  courseId: string;
  courseTitle: string;
  status: string;
  progress: number;
  lessonsCompleted: number;
  totalLessons: number;
  enrolledAt: string;
  lastAccessedAt: string | null;
  completedAt: string | null;
}

interface Learner {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  jobTitle: string | null;
  locations: string[];
  totalEnrollments: number;
  completedCourses: number;
  activeCourses: number;
  avgProgress: number;
  enrollments: LearnerEnrollment[];
}

type TabType = 'overview' | 'courses' | 'enrollments' | 'learners';

export default function LMSAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [period, setPeriod] = useState(30);

  // Overview state
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [courseStats, setCourseStats] = useState<CourseStats[]>([]);
  const [stalledLearners, setStalledLearners] = useState<StalledLearner[]>([]);
  const [recentEnrollments, setRecentEnrollments] = useState<RecentEnrollment[]>([]);
  const [enrollmentTrend, setEnrollmentTrend] = useState<EnrollmentTrend[]>([]);

  // Courses tab state
  const [courseSearch, setCourseSearch] = useState('');
  const [courseSortBy, setCourseSortBy] = useState<'enrollments' | 'completion' | 'progress' | 'title'>('enrollments');

  // Enrollments tab state
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(false);
  const [enrollmentSearch, setEnrollmentSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [sortBy, setSortBy] = useState('enrolledAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [courses, setCourses] = useState<Course[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Learners tab state
  const [learners, setLearners] = useState<Learner[]>([]);
  const [isLoadingLearners, setIsLoadingLearners] = useState(false);
  const [learnerSearch, setLearnerSearch] = useState('');
  const [learnerCourseFilter, setLearnerCourseFilter] = useState('');
  const [learnerLocationFilter, setLearnerLocationFilter] = useState('');
  const [learnerCompletionFilter, setLearnerCompletionFilter] = useState('');
  const [learnerSortBy, setLearnerSortBy] = useState('name');
  const [learnerSortOrder, setLearnerSortOrder] = useState<'asc' | 'desc'>('asc');
  const [learnerPage, setLearnerPage] = useState(1);
  const [learnerTotalPages, setLearnerTotalPages] = useState(1);
  const [learnerTotal, setLearnerTotal] = useState(0);
  const [showLearnerFilters, setShowLearnerFilters] = useState(false);
  const [expandedLearner, setExpandedLearner] = useState<string | null>(null);

  // Fetch overview stats
  useEffect(() => {
    if (activeTab === 'overview' || activeTab === 'courses') {
      fetchOverviewStats();
    }
  }, [period, activeTab]);

  // Fetch enrollments filters
  useEffect(() => {
    if (activeTab === 'enrollments' && courses.length === 0) {
      fetchFilters();
    }
  }, [activeTab]);

  // Fetch enrollments
  useEffect(() => {
    if (activeTab === 'enrollments') {
      fetchEnrollments();
    }
  }, [activeTab, enrollmentSearch, courseFilter, statusFilter, locationFilter, sortBy, sortOrder, page]);

  // Fetch learners filters
  useEffect(() => {
    if (activeTab === 'learners' && courses.length === 0) {
      fetchFilters();
    }
  }, [activeTab]);

  // Fetch learners
  useEffect(() => {
    if (activeTab === 'learners') {
      fetchLearners();
    }
  }, [activeTab, learnerSearch, learnerCourseFilter, learnerLocationFilter, learnerCompletionFilter, learnerSortBy, learnerSortOrder, learnerPage]);

  const fetchOverviewStats = async () => {
    setIsLoadingOverview(true);
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
      setIsLoadingOverview(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const [coursesRes, locationsRes] = await Promise.all([
        fetch('/api/lms/courses?limit=100'),
        fetch('/api/locations')
      ]);

      if (coursesRes.ok) {
        const data = await coursesRes.json();
        setCourses(data.courses || []);
      }

      if (locationsRes.ok) {
        const data = await locationsRes.json();
        setLocations(data.locations || data || []);
      }
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const fetchEnrollments = async () => {
    setIsLoadingEnrollments(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy,
        sortOrder,
      });

      if (enrollmentSearch) params.set('search', enrollmentSearch);
      if (courseFilter) params.set('courseId', courseFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (locationFilter) params.set('locationId', locationFilter);

      const response = await fetch(`/api/admin/lms/enrollments?${params}`);
      if (response.ok) {
        const data = await response.json();
        setEnrollments(data.enrollments);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setIsLoadingEnrollments(false);
    }
  };

  const fetchLearners = async () => {
    setIsLoadingLearners(true);
    try {
      const params = new URLSearchParams({
        page: learnerPage.toString(),
        limit: '20',
        sortBy: learnerSortBy,
        sortOrder: learnerSortOrder,
      });

      if (learnerSearch) params.set('search', learnerSearch);
      if (learnerCourseFilter) params.set('courseId', learnerCourseFilter);
      if (learnerLocationFilter) params.set('locationId', learnerLocationFilter);
      if (learnerCompletionFilter) params.set('completionStatus', learnerCompletionFilter);

      const response = await fetch(`/api/admin/lms/learners?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLearners(data.learners);
        setLearnerTotalPages(data.pagination.totalPages);
        setLearnerTotal(data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching learners:', error);
    } finally {
      setIsLoadingLearners(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
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

  const filteredCourses = courseStats
    .filter(course =>
      course.title.toLowerCase().includes(courseSearch.toLowerCase())
    )
    .sort((a, b) => {
      switch (courseSortBy) {
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

  const SortHeader = ({ field, label }: { field: string; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 text-left text-xs font-medium text-gray-500 uppercase hover:text-gray-700"
    >
      {label}
      {sortBy === field && (
        sortOrder === 'asc' ? (
          <ChevronUpIcon className="w-4 h-4" />
        ) : (
          <ChevronDownIcon className="w-4 h-4" />
        )
      )}
    </button>
  );

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'courses' as const, label: 'Courses' },
    { id: 'enrollments' as const, label: 'Enrollments' },
    { id: 'learners' as const, label: 'Learners' },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      {/* Header */}
      <div className="sm:flex sm:justify-between sm:items-center mb-8">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">LMS Analytics</h1>
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
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-violet-500 text-violet-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {isLoadingOverview && !overview ? (
            <div className="animate-pulse space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
                ))}
              </div>
              <div className="h-96 bg-gray-200 rounded-xl"></div>
            </div>
          ) : (
            <>
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
                                href={`/lms/analytics/courses/${course.id}`}
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
                      <button
                        onClick={() => setActiveTab('courses')}
                        className="text-sm text-violet-600 hover:text-violet-700 font-medium"
                      >
                        View all {courseStats.length} courses
                      </button>
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

              {/* Enrollment Trend Chart */}
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
            </>
          )}
        </>
      )}

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <>
          {isLoadingOverview ? (
            <div className="animate-pulse space-y-6">
              <div className="h-16 bg-gray-200 rounded-xl"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Search and Sort */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    className="form-input w-full pl-10"
                  />
                </div>
                <select
                  value={courseSortBy}
                  onChange={(e) => setCourseSortBy(e.target.value as typeof courseSortBy)}
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
                    {courseSearch ? 'Try a different search term' : 'No published courses available'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCourses.map(course => (
                    <Link
                      key={course.id}
                      href={`/lms/analytics/courses/${course.id}`}
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
            </>
          )}
        </>
      )}

      {/* Enrollments Tab */}
      {activeTab === 'enrollments' && (
        <>
          {/* Search and Filters */}
          <div className="bg-white rounded-xl border border-gray-200 mb-6">
            <div className="p-4 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or course..."
                  value={enrollmentSearch}
                  onChange={(e) => {
                    setEnrollmentSearch(e.target.value);
                    setPage(1);
                  }}
                  className="form-input w-full pl-10"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn ${showFilters ? 'bg-violet-100 text-violet-700' : 'bg-white border-gray-200 hover:border-gray-300 text-gray-600'}`}
              >
                <FunnelIcon className="w-4 h-4 mr-2" />
                Filters
              </button>
            </div>

            {showFilters && (
              <div className="px-4 pb-4 border-t border-gray-200 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                  <select
                    value={courseFilter}
                    onChange={(e) => {
                      setCourseFilter(e.target.value);
                      setPage(1);
                    }}
                    className="form-select w-full"
                  >
                    <option value="">All Courses</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>{course.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(1);
                    }}
                    className="form-select w-full"
                  >
                    <option value="">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="PAUSED">Paused</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <select
                    value={locationFilter}
                    onChange={(e) => {
                      setLocationFilter(e.target.value);
                      setPage(1);
                    }}
                    className="form-select w-full"
                  >
                    <option value="">All Locations</option>
                    {locations.map(location => (
                      <option key={location.id} value={location.id}>{location.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200">
              <p className="text-sm text-gray-600">{total} total enrollments</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left">
                      <SortHeader field="userName" label="Learner" />
                    </th>
                    <th className="px-5 py-3 text-left">
                      <SortHeader field="courseName" label="Course" />
                    </th>
                    <th className="px-5 py-3 text-left">
                      <SortHeader field="progress" label="Progress" />
                    </th>
                    <th className="px-5 py-3 text-left">
                      <SortHeader field="enrolledAt" label="Enrolled" />
                    </th>
                    <th className="px-5 py-3 text-left">
                      <SortHeader field="lastActivity" label="Last Active" />
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isLoadingEnrollments ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td className="px-5 py-4" colSpan={6}>
                          <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
                        </td>
                      </tr>
                    ))
                  ) : enrollments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-gray-500">
                        No enrollments found
                      </td>
                    </tr>
                  ) : (
                    enrollments.map((enrollment) => (
                      <tr key={enrollment.id} className="hover:bg-gray-50">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
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
                            <div>
                              <p className="font-medium text-gray-900">{enrollment.user.name}</p>
                              <p className="text-xs text-gray-500">{enrollment.user.email}</p>
                              {enrollment.user.locations.length > 0 && (
                                <p className="text-xs text-gray-400">{enrollment.user.locations.join(', ')}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-900">{enrollment.course.title}</p>
                          {enrollment.totalLessons > 0 && (
                            <p className="text-xs text-gray-500">
                              {enrollment.lessonsCompleted}/{enrollment.totalLessons} lessons
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  enrollment.progress >= 100
                                    ? 'bg-green-500'
                                    : enrollment.progress >= 50
                                    ? 'bg-violet-500'
                                    : 'bg-amber-500'
                                }`}
                                style={{ width: `${enrollment.progress}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 w-12">{enrollment.progress}%</span>
                          </div>
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
                                  ? 'text-amber-600'
                                  : 'text-gray-500'
                              }`}>
                                {enrollment.daysSinceActivity} days ago
                              </p>
                            </>
                          ) : (
                            <span className="text-sm text-gray-400">Never accessed</span>
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn bg-white border-gray-200 hover:border-gray-300 text-gray-600 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="btn bg-white border-gray-200 hover:border-gray-300 text-gray-600 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Learners Tab */}
      {activeTab === 'learners' && (
        <>
          {/* Search and Filters */}
          <div className="bg-white rounded-xl border border-gray-200 mb-6">
            <div className="p-4 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={learnerSearch}
                  onChange={(e) => {
                    setLearnerSearch(e.target.value);
                    setLearnerPage(1);
                  }}
                  className="form-input w-full pl-10"
                />
              </div>
              <button
                onClick={() => setShowLearnerFilters(!showLearnerFilters)}
                className={`btn ${showLearnerFilters ? 'bg-violet-100 text-violet-700' : 'bg-white border-gray-200 hover:border-gray-300 text-gray-600'}`}
              >
                <FunnelIcon className="w-4 h-4 mr-2" />
                Filters
              </button>
            </div>

            {showLearnerFilters && (
              <div className="px-4 pb-4 border-t border-gray-200 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                  <select
                    value={learnerCourseFilter}
                    onChange={(e) => {
                      setLearnerCourseFilter(e.target.value);
                      setLearnerPage(1);
                    }}
                    className="form-select w-full"
                  >
                    <option value="">All Courses</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>{course.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <select
                    value={learnerLocationFilter}
                    onChange={(e) => {
                      setLearnerLocationFilter(e.target.value);
                      setLearnerPage(1);
                    }}
                    className="form-select w-full"
                  >
                    <option value="">All Locations</option>
                    {locations.map(location => (
                      <option key={location.id} value={location.id}>{location.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={learnerCompletionFilter}
                    onChange={(e) => {
                      setLearnerCompletionFilter(e.target.value);
                      setLearnerPage(1);
                    }}
                    className="form-select w-full"
                  >
                    <option value="">All Learners</option>
                    <option value="completed">Has Completions</option>
                    <option value="in_progress">In Progress</option>
                    <option value="not_started">Not Started</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Learners List */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">{learnerTotal} learners found</p>
              <select
                value={`${learnerSortBy}-${learnerSortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setLearnerSortBy(field);
                  setLearnerSortOrder(order as 'asc' | 'desc');
                  setLearnerPage(1);
                }}
                className="form-select text-sm"
              >
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="progress-desc">Highest Progress</option>
                <option value="progress-asc">Lowest Progress</option>
                <option value="enrollments-desc">Most Enrollments</option>
                <option value="enrollments-asc">Fewest Enrollments</option>
              </select>
            </div>

            {isLoadingLearners ? (
              <div className="p-8">
                <div className="animate-pulse space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
                  ))}
                </div>
              </div>
            ) : learners.length === 0 ? (
              <div className="p-12 text-center">
                <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No learners found</h3>
                <p className="text-gray-600">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {learners.map((learner) => (
                  <div key={learner.id}>
                    <div
                      className="p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setExpandedLearner(expandedLearner === learner.id ? null : learner.id)}
                    >
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        {learner.avatar ? (
                          <img
                            src={learner.avatar}
                            alt=""
                            className="w-12 h-12 rounded-full"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-medium text-lg">
                            {learner.name.charAt(0)}
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/users/${learner.id}`}
                              className="font-medium text-gray-900 hover:text-violet-600"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {learner.name}
                            </Link>
                            {learner.jobTitle && (
                              <span className="text-sm text-gray-500">• {learner.jobTitle}</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{learner.email}</p>
                          {learner.locations.length > 0 && (
                            <p className="text-xs text-gray-400 mt-1">{learner.locations.join(', ')}</p>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-lg font-bold text-gray-900">{learner.totalEnrollments}</p>
                            <p className="text-xs text-gray-500">Enrolled</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-green-600">{learner.completedCourses}</p>
                            <p className="text-xs text-gray-500">Completed</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-violet-600">{learner.avgProgress}%</p>
                            <p className="text-xs text-gray-500">Avg Progress</p>
                          </div>
                          <ChevronDownIcon
                            className={`w-5 h-5 text-gray-400 transition-transform ${
                              expandedLearner === learner.id ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expanded Course List */}
                    {expandedLearner === learner.id && learner.enrollments.length > 0 && (
                      <div className="bg-gray-50 px-4 pb-4">
                        <div className="ml-16 space-y-2">
                          {learner.enrollments.map((enrollment) => (
                            <div
                              key={enrollment.id}
                              className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                            >
                              <div className="flex items-center gap-3">
                                <AcademicCapIcon className="w-5 h-5 text-gray-400" />
                                <div>
                                  <p className="font-medium text-gray-900">{enrollment.courseTitle}</p>
                                  <p className="text-xs text-gray-500">
                                    {enrollment.lessonsCompleted}/{enrollment.totalLessons} lessons
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        enrollment.progress >= 100
                                          ? 'bg-green-500'
                                          : enrollment.progress >= 50
                                          ? 'bg-violet-500'
                                          : 'bg-amber-500'
                                      }`}
                                      style={{ width: `${enrollment.progress}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-medium text-gray-900 w-12 text-right">
                                    {enrollment.progress}%
                                  </span>
                                </div>
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                                    enrollment.status
                                  )}`}
                                >
                                  {enrollment.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {expandedLearner === learner.id && learner.enrollments.length === 0 && (
                      <div className="bg-gray-50 px-4 pb-4">
                        <div className="ml-16 p-4 text-center text-gray-500 text-sm">
                          No course enrollments
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {learnerTotalPages > 1 && (
              <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {((learnerPage - 1) * 20) + 1} to {Math.min(learnerPage * 20, learnerTotal)} of {learnerTotal}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setLearnerPage(p => Math.max(1, p - 1))}
                    disabled={learnerPage === 1}
                    className="btn bg-white border-gray-200 hover:border-gray-300 text-gray-600 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setLearnerPage(p => Math.min(learnerTotalPages, p + 1))}
                    disabled={learnerPage === learnerTotalPages}
                    className="btn bg-white border-gray-200 hover:border-gray-300 text-gray-600 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
