'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

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

export default function AdminEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
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

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchEnrollments();
  }, [search, courseFilter, statusFilter, locationFilter, sortBy, sortOrder, page]);

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
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy,
        sortOrder,
      });

      if (search) params.set('search', search);
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
      setIsLoading(false);
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

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/lms"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" />
          Back to LMS Overview
        </Link>
        <div className="sm:flex sm:justify-between sm:items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">All Enrollments</h1>
            <p className="text-gray-600 mt-1">{total} total enrollments</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or course..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
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
              {isLoading ? (
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
    </div>
  );
}
