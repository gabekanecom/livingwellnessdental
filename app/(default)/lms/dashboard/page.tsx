'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  AcademicCapIcon, 
  BookOpenIcon, 
  ClockIcon, 
  TrophyIcon,
  ChartBarIcon,
  PlayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import ContinueLearning from '@/components/lms/ContinueLearning';

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
  lessonProgress?: {
    timeSpent: number;
  }[];
}

interface DashboardStats {
  totalEnrollments: number;
  completedCourses: number;
  inProgressCourses: number;
  totalTimeSpentMinutes: number;
  overallCompletionRate: number;
}

export default function StudentDashboard() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalEnrollments: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    totalTimeSpentMinutes: 0,
    overallCompletionRate: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/lms/enrollments');
      if (!response.ok) {
        toast.error('Failed to load dashboard data');
        return;
      }

      const data = await response.json();
      const enrollmentData = data.enrollments || [];
      setEnrollments(enrollmentData);

      const completed = enrollmentData.filter((e: Enrollment) => e.status === 'COMPLETED' || e.progress >= 100);
      const inProgress = enrollmentData.filter((e: Enrollment) => e.status === 'ACTIVE' && e.progress < 100);
      
      const totalTimeSpent = enrollmentData.reduce((acc: number, e: Enrollment) => {
        const lessonTime = e.lessonProgress?.reduce((sum, lp) => sum + (lp.timeSpent || 0), 0) || 0;
        return acc + lessonTime;
      }, 0);

      const totalProgress = enrollmentData.reduce((acc: number, e: Enrollment) => acc + e.progress, 0);
      const avgProgress = enrollmentData.length > 0 ? Math.round(totalProgress / enrollmentData.length) : 0;

      setStats({
        totalEnrollments: enrollmentData.length,
        completedCourses: completed.length,
        inProgressCourses: inProgress.length,
        totalTimeSpentMinutes: Math.floor(totalTimeSpent / 60),
        overallCompletionRate: avgProgress
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const getStatusIcon = (status: string, progress: number) => {
    if (status === 'COMPLETED' || progress >= 100) {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    }
    if (progress > 0) {
      return <PlayIcon className="h-5 w-5 text-violet-500" />;
    }
    return <BookOpenIcon className="h-5 w-5 text-gray-500" />;
  };

  const getStatusText = (status: string, progress: number) => {
    if (status === 'COMPLETED' || progress >= 100) {
      return 'Completed';
    }
    if (progress > 0) {
      return 'In Progress';
    }
    return 'Not Started';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl text-gray-800 font-bold">
          My Learning Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Track your learning progress and continue your courses
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BookOpenIcon className="h-8 w-8 text-violet-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Enrolled Courses</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalEnrollments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrophyIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.completedCourses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Progress Rate</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.overallCompletionRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Time Spent</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatDuration(stats.totalTimeSpentMinutes)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <ContinueLearning />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">My Courses</h2>
        </div>
        
        {enrollments.length === 0 ? (
          <div className="p-8 text-center">
            <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Courses Yet</h3>
            <p className="text-gray-600 mb-4">
              You haven't enrolled in any courses yet. Browse our course catalog to get started!
            </p>
            <Link
              href="/lms/catalog"
              className="btn bg-violet-500 hover:bg-violet-600 text-white"
            >
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {enrollments.map((enrollment) => (
              <div key={enrollment.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {enrollment.course.coverImage ? (
                      <img
                        src={enrollment.course.coverImage}
                        alt={enrollment.course.title}
                        className="w-20 h-16 object-cover rounded-lg flex-shrink-0"
                      />
                    ) : (
                      <div 
                        className="w-20 h-16 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-xl"
                        style={{ backgroundColor: enrollment.course.category?.color || '#8B5CF6' }}
                      >
                        {enrollment.course.title.charAt(0)}
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <Link
                          href={`/lms/courses/${enrollment.course.id}`}
                          className="text-lg font-semibold text-gray-900 hover:text-violet-600"
                        >
                          {enrollment.course.title}
                        </Link>
                        {enrollment.course.category && (
                          <span 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: enrollment.course.category.color }}
                          >
                            {enrollment.course.category.name}
                          </span>
                        )}
                      </div>
                      
                      {enrollment.course.shortDescription && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {enrollment.course.shortDescription}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="capitalize">{enrollment.course.difficulty.toLowerCase()}</span>
                        {enrollment.course.duration && (
                          <>
                            <span>•</span>
                            <span>{formatDuration(enrollment.course.duration)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className="flex items-center space-x-2 mb-2">
                      {getStatusIcon(enrollment.status, enrollment.progress)}
                      <span className="text-sm font-medium text-gray-900">
                        {getStatusText(enrollment.status, enrollment.progress)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-3">
                      {Math.round(enrollment.progress)}% complete
                    </div>
                    <div className="w-32 bg-gray-200 rounded-full h-2 mb-3">
                      <div
                        className="bg-violet-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${enrollment.progress}%` }}
                      />
                    </div>
                    <Link
                      href={`/lms/courses/${enrollment.course.id}`}
                      className="btn bg-violet-500 hover:bg-violet-600 text-white text-sm"
                    >
                      {enrollment.status === 'COMPLETED' || enrollment.progress >= 100 ? 'Review' : 'Continue'}
                    </Link>
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
