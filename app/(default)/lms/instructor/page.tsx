'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AcademicCapIcon,
  UsersIcon,
  ChartBarIcon,
  TrophyIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CheckCircleIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';

interface OverviewStats {
  totalCourses: number;
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  recentEnrollments: number;
  avgProgress: number;
  completionRate: number;
  avgQuizScore: number;
  quizPassRate: number;
}

interface CourseStats {
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

interface TrendData {
  date: string;
  count: number;
}

interface TopStudent {
  id: string;
  name: string;
  email: string;
  progress: number;
  lessonsCompleted: number;
  quizzesTaken: number;
  avgQuizScore: number;
}

export default function InstructorDashboard() {
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [courseStats, setCourseStats] = useState<CourseStats[]>([]);
  const [trends, setTrends] = useState<{ enrollments: TrendData[]; completions: TrendData[] }>({
    enrollments: [],
    completions: []
  });
  const [topStudents, setTopStudents] = useState<TopStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/lms/instructor/stats?period=${period}`);
      if (response.ok) {
        const data = await response.json();
        setOverview(data.overview);
        setCourseStats(data.courseStats);
        setTrends(data.trends);
        setTopStudents(data.topStudents);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  const statCards = overview ? [
    {
      label: 'Total Enrollments',
      value: overview.totalEnrollments,
      icon: UsersIcon,
      color: 'bg-blue-500',
      subtext: `${overview.recentEnrollments} new this period`
    },
    {
      label: 'Active Learners',
      value: overview.activeEnrollments,
      icon: BookOpenIcon,
      color: 'bg-green-500',
      subtext: `${overview.completedEnrollments} completed`
    },
    {
      label: 'Completion Rate',
      value: `${overview.completionRate}%`,
      icon: TrophyIcon,
      color: 'bg-amber-500',
      subtext: `Avg progress: ${overview.avgProgress}%`
    },
    {
      label: 'Quiz Pass Rate',
      value: `${overview.quizPassRate}%`,
      icon: CheckCircleIcon,
      color: 'bg-violet-500',
      subtext: `Avg score: ${overview.avgQuizScore}%`
    }
  ] : [];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Instructor Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor course performance and student progress</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <Link
            href="/lms/instructor/students"
            className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700"
          >
            View Students
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.subtext}</p>
              </div>
              <div className={`${stat.color} p-2 rounded-lg`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Enrollment Trends</h2>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-violet-500 rounded-full"></div>
                <span className="text-gray-600">Enrollments</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-gray-600">Completions</span>
              </div>
            </div>
          </div>
          
          <div className="h-48 flex items-end gap-1">
            {trends.enrollments.map((day, index) => {
              const maxEnroll = Math.max(...trends.enrollments.map(d => d.count), 1);
              const completionDay = trends.completions[index];
              const enrollHeight = (day.count / maxEnroll) * 100;
              const completionHeight = completionDay ? (completionDay.count / maxEnroll) * 100 : 0;
              
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="w-full flex gap-0.5 items-end h-40">
                    <div 
                      className="flex-1 bg-violet-500 rounded-t transition-all hover:bg-violet-600"
                      style={{ height: `${Math.max(enrollHeight, 2)}%` }}
                    ></div>
                    <div 
                      className="flex-1 bg-emerald-500 rounded-t transition-all hover:bg-emerald-600"
                      style={{ height: `${Math.max(completionHeight, 2)}%` }}
                    ></div>
                  </div>
                  <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: {day.count} enrollments, {completionDay?.count || 0} completions
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Students</h2>
          <div className="space-y-3">
            {topStudents.slice(0, 5).map((student, index) => (
              <div key={student.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{student.name}</p>
                  <p className="text-xs text-gray-500">{student.lessonsCompleted} lessons • {Math.round(student.avgQuizScore)}% quiz avg</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-violet-600">{Math.round(student.progress)}%</p>
                </div>
              </div>
            ))}
            {topStudents.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No students yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Course Performance</h2>
          <Link href="/lms/instructor/analytics" className="text-sm text-violet-600 hover:text-violet-700">
            View Details →
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollments</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quiz Avg</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {courseStats.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link href={`/lms/instructor/courses/${course.id}`} className="flex items-center gap-3 group">
                      {course.coverImage ? (
                        <img src={course.coverImage} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                          <AcademicCapIcon className="h-5 w-5 text-violet-600" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900 group-hover:text-violet-600">{course.title}</p>
                        <p className="text-xs text-gray-500">{course.totalLessons} lessons</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{course.totalEnrollments}</div>
                    {course.recentEnrollments > 0 && (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <ArrowTrendingUpIcon className="h-3 w-3" />
                        +{course.recentEnrollments} new
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-violet-500 rounded-full"
                          style={{ width: `${course.avgProgress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{Math.round(course.avgProgress)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      course.completionRate >= 70 
                        ? 'bg-green-100 text-green-800'
                        : course.completionRate >= 40
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {Math.round(course.completionRate)}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{Math.round(course.avgQuizScore)}%</span>
                  </td>
                </tr>
              ))}
              {courseStats.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No courses found
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
