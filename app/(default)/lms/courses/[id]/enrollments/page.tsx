'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeftIcon,
  UserGroupIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import ProgressBar from '@/components/lms/ProgressBar';

interface LessonProgress {
  lessonId: string;
  isCompleted: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
}

interface Course {
  id: string;
  title: string;
}

interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  status: string;
  progress: number;
  enrolledAt: string;
  completedAt: string | null;
  user: User;
  course: Course;
  lessonProgress: LessonProgress[];
}

export default function CourseEnrollmentsPage() {
  const params = useParams();
  const courseId = params.id as string;

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [course, setCourse] = useState<{ title: string; modules: { lessons: { id: string }[] }[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [courseId]);

  const loadData = async () => {
    try {
      const [enrollmentsRes, courseRes] = await Promise.all([
        fetch(`/api/lms/enrollments?courseId=${courseId}`),
        fetch(`/api/lms/courses/${courseId}`)
      ]);

      if (enrollmentsRes.ok) {
        const data = await enrollmentsRes.json();
        setEnrollments(data.enrollments || []);
      }

      if (courseRes.ok) {
        const data = await courseRes.json();
        setCourse(data.course);
      }
    } catch (error) {
      console.error('Failed to load enrollments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveEnrollment = async (enrollmentId: string) => {
    if (!confirm('Are you sure you want to remove this student from the course?')) {
      return;
    }

    setIsRemoving(enrollmentId);
    try {
      const response = await fetch(`/api/lms/enrollments/${enrollmentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setEnrollments(prev => prev.filter(e => e.id !== enrollmentId));
      }
    } catch (error) {
      console.error('Failed to remove enrollment:', error);
    } finally {
      setIsRemoving(null);
    }
  };

  const totalLessons = course?.modules?.reduce((sum, m) => sum + m.lessons.length, 0) || 0;

  const getCompletedLessons = (enrollment: Enrollment) => {
    return enrollment.lessonProgress?.filter(p => p.isCompleted).length || 0;
  };

  const getProgressPercentage = (enrollment: Enrollment) => {
    if (totalLessons === 0) return 0;
    return Math.round((getCompletedLessons(enrollment) / totalLessons) * 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredEnrollments = enrollments.filter(enrollment => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      enrollment.user.name.toLowerCase().includes(query) ||
      enrollment.user.email.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <ArrowPathIcon className="h-8 w-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-5xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/lms/courses/${courseId}/edit`}
          className="inline-flex items-center text-sm text-gray-600 hover:text-violet-600"
        >
          <ChevronLeftIcon className="h-4 w-4 mr-1" />
          Back to Course Editor
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Enrollments</h1>
          {course && (
            <p className="text-gray-600 mt-1">{course.title}</p>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <UserGroupIcon className="h-5 w-5" />
          <span>{enrollments.length} student{enrollments.length !== 1 ? 's' : ''} enrolled</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            />
          </div>
        </div>

        {filteredEnrollments.length === 0 ? (
          <div className="p-8 text-center">
            <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchQuery ? 'No students match your search' : 'No students enrolled yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredEnrollments.map((enrollment) => (
              <div key={enrollment.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                      {enrollment.user.avatar ? (
                        <img
                          src={enrollment.user.avatar}
                          alt={enrollment.user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-violet-600 font-medium">
                          {enrollment.user.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{enrollment.user.name}</p>
                      <p className="text-sm text-gray-500 truncate">{enrollment.user.email}</p>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-6 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">Progress</p>
                      <div className="flex items-center gap-2">
                        <div className="w-24">
                          <ProgressBar progress={getProgressPercentage(enrollment)} size="sm" />
                        </div>
                        <span className="text-sm text-gray-600 w-12">
                          {getProgressPercentage(enrollment)}%
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-gray-500">Enrolled</p>
                      <p className="text-sm text-gray-900">{formatDate(enrollment.enrolledAt)}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-gray-500">Status</p>
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        enrollment.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-700'
                          : enrollment.status === 'ACTIVE'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {enrollment.status}
                      </span>
                    </div>

                    <button
                      onClick={() => handleRemoveEnrollment(enrollment.id)}
                      disabled={isRemoving === enrollment.id}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Remove from course"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Mobile progress and status */}
                <div className="sm:hidden mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500">Progress:</span>
                        <span className="text-xs font-medium">{getProgressPercentage(enrollment)}%</span>
                      </div>
                      <ProgressBar progress={getProgressPercentage(enrollment)} size="sm" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        enrollment.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-700'
                          : enrollment.status === 'ACTIVE'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {enrollment.status}
                      </span>
                      <button
                        onClick={() => handleRemoveEnrollment(enrollment.id)}
                        disabled={isRemoving === enrollment.id}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Remove from course"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
