'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronRightIcon,
  UsersIcon,
  ChartBarIcon,
  AcademicCapIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

interface CourseDetails {
  id: string;
  title: string;
  coverImage: string | null;
  totalEnrollments: number;
  completedCount: number;
  completionRate: number;
  avgProgress: number;
  totalLessons: number;
  avgQuizScore: number;
  recentEnrollments: number;
}

interface StudentProgress {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  progress: number;
  completedLessons: number;
  totalLessons: number;
  status: string;
  lastAccessedAt: string | null;
  enrolledAt: string;
}

export default function CourseAnalyticsPage() {
  const params = useParams();
  const courseId = params.id as string;
  
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [trends, setTrends] = useState<{ date: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCourseAnalytics();
  }, [courseId]);

  const fetchCourseAnalytics = async () => {
    try {
      const [statsRes, studentsRes] = await Promise.all([
        fetch(`/api/lms/instructor/stats?courseId=${courseId}&period=30`),
        fetch(`/api/lms/instructor/students?courseId=${courseId}&limit=50`)
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.courseStats.length > 0) {
          setCourse(statsData.courseStats[0]);
        }
        setTrends(statsData.trends.enrollments);
      }

      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setStudents(studentsData.students);
      }
    } catch (error) {
      console.error('Error fetching course analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-gray-500">Course not found</p>
        <Link href="/lms/instructor" className="text-violet-600 hover:underline mt-2 inline-block">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const progressGroups = {
    notStarted: students.filter(s => s.progress === 0).length,
    inProgress: students.filter(s => s.progress > 0 && s.progress < 100).length,
    completed: students.filter(s => s.progress >= 100).length
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <Link href="/lms/instructor" className="hover:text-violet-600">Dashboard</Link>
        <ChevronRightIcon className="h-4 w-4" />
        <span className="text-gray-900">{course.title}</span>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start gap-6 mb-8">
        <div className="flex items-center gap-4">
          {course.coverImage ? (
            <img src={course.coverImage} alt="" className="w-20 h-20 rounded-xl object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-violet-100 flex items-center justify-center">
              <AcademicCapIcon className="h-10 w-10 text-violet-600" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
            <p className="text-gray-600">{course.totalLessons} lessons</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <UsersIcon className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-gray-600">Enrollments</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{course.totalEnrollments}</p>
          {course.recentEnrollments > 0 && (
            <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
              <ArrowTrendingUpIcon className="h-3 w-3" />
              +{course.recentEnrollments} this month
            </p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <ChartBarIcon className="h-5 w-5 text-violet-500" />
            <span className="text-sm text-gray-600">Avg Progress</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{Math.round(course.avgProgress)}%</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
            <span className="text-sm text-gray-600">Completion Rate</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{Math.round(course.completionRate)}%</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <AcademicCapIcon className="h-5 w-5 text-amber-500" />
            <span className="text-sm text-gray-600">Quiz Average</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{Math.round(course.avgQuizScore)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Enrollment Trend</h2>
          <div className="h-40 flex items-end gap-1">
            {trends.map((day) => {
              const maxCount = Math.max(...trends.map(d => d.count), 1);
              const height = (day.count / maxCount) * 100;
              return (
                <div key={day.date} className="flex-1 group relative">
                  <div 
                    className="w-full bg-violet-500 rounded-t hover:bg-violet-600 transition-colors"
                    style={{ height: `${Math.max(height, 4)}%` }}
                  ></div>
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                    {formatDate(day.date)}: {day.count}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Progress Breakdown</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Not Started</span>
                <span className="font-medium text-gray-900">{progressGroups.notStarted}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gray-400 rounded-full"
                  style={{ width: `${(progressGroups.notStarted / students.length) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">In Progress</span>
                <span className="font-medium text-gray-900">{progressGroups.inProgress}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${(progressGroups.inProgress / students.length) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Completed</span>
                <span className="font-medium text-gray-900">{progressGroups.completed}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${(progressGroups.completed / students.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Enrolled Students</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {student.user.avatar ? (
                        <img src={student.user.avatar} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-violet-600">
                            {student.user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{student.user.name}</p>
                        <p className="text-xs text-gray-500">{student.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            student.progress >= 100 ? 'bg-green-500' : 'bg-violet-500'
                          }`}
                          style={{ width: `${Math.min(student.progress, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{Math.round(student.progress)}%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {student.completedLessons}/{student.totalLessons} lessons
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      student.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      student.status === 'ACTIVE' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {student.status.charAt(0) + student.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDate(student.lastAccessedAt)}
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No students enrolled yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
