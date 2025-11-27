'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ClockIcon, UserGroupIcon, StarIcon, PencilSquareIcon, EyeIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface Course {
  id: string;
  title: string;
  description: string | null;
  shortDescription?: string | null;
  coverImage?: string | null;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  duration: number | null;
  rating: number;
  ratingCount: number;
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: Date;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
  category?: {
    id: string;
    name: string;
    color: string;
  } | null;
  _count?: {
    enrollments: number;
  };
}

interface CourseCardProps {
  course: Course;
  showManagementActions?: boolean;
  showEnrollButton?: boolean;
  onPreview?: (courseId: string) => void;
}

export default function CourseCard({ 
  course, 
  showManagementActions = false, 
  showEnrollButton = true,
  onPreview
}: CourseCardProps) {
  
  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'BEGINNER': return 'bg-success/10 text-success';
      case 'INTERMEDIATE': return 'bg-warning/10 text-warning';
      case 'ADVANCED': return 'bg-danger/10 text-danger';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <StarIconSolid key={i} className="h-4 w-4 text-yellow-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <StarIcon className="h-4 w-4 text-gray-300" />
            <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
              <StarIconSolid className="h-4 w-4 text-yellow-400" />
            </div>
          </div>
        );
      } else {
        stars.push(
          <StarIcon key={i} className="h-4 w-4 text-gray-300" />
        );
      }
    }
    return stars;
  };


  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <Link href={`/lms/courses/${course.id}`} className="block">
        <div className="relative aspect-video bg-gray-100 hover:opacity-95 transition-opacity">
          {course.coverImage ? (
            <Image
              src={course.coverImage}
              alt={course.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div 
                className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-2xl font-bold"
                style={{ backgroundColor: course.category?.color || '#3B82F6' }}
              >
                {course.title.charAt(0)}
              </div>
            </div>
          )}
          
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            {course.isFeatured && (
              <span className="px-2 py-1 bg-warning text-white text-xs font-medium rounded">
                Featured
              </span>
            )}
            {!course.isPublished && (
              <span className="px-2 py-1 bg-gray-500 text-white text-xs font-medium rounded">
                Draft
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          {course.category && (
            <span 
              className="px-2 py-1 text-xs font-medium rounded-full"
              style={{ 
                backgroundColor: `${course.category.color}20`, 
                color: course.category.color 
              }}
            >
              {course.category.name}
            </span>
          )}
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(course.difficulty)}`}>
            {course.difficulty.charAt(0) + course.difficulty.slice(1).toLowerCase()}
          </span>
        </div>

        <Link href={`/lms/courses/${course.id}`}>
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 hover:text-violet-600 cursor-pointer transition-colors">
            {course.title}
          </h3>
        </Link>
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
          {course.shortDescription || course.description}
        </p>

        {course.createdBy && (
          <div className="text-sm text-gray-500 mb-4">
            By {course.createdBy.name}
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center">
            <ClockIcon className="h-4 w-4 mr-1" />
            {formatDuration(course.duration)}
          </div>
          <div className="flex items-center">
            <UserGroupIcon className="h-4 w-4 mr-1" />
            {course._count?.enrollments || 0} students
          </div>
        </div>

        {course.ratingCount > 0 && (
          <div className="flex items-center mb-4">
            <div className="flex items-center mr-2">
              {renderStars(course.rating)}
            </div>
            <span className="text-sm text-gray-600">
              {course.rating.toFixed(1)} ({course.ratingCount} reviews)
            </span>
          </div>
        )}

        <div className="flex gap-2">
          {showEnrollButton && course.isPublished && !showManagementActions && (
            <Link
              href={`/lms/courses/${course.id}/take`}
              className="flex-1 px-4 py-2 bg-success text-white text-sm font-medium rounded-lg hover:opacity-90 transition-colors text-center"
            >
              Take Course
            </Link>
          )}
          
          {showManagementActions && (
            <Link
              href={`/lms/courses/${course.id}/edit`}
              className="px-3 py-2 bg-violet-100 text-violet-700 text-sm font-medium rounded-lg hover:bg-violet-200 transition-colors flex items-center justify-center"
              title="Edit Course"
            >
              <PencilSquareIcon className="h-4 w-4" />
            </Link>
          )}

          {onPreview && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onPreview(course.id);
              }}
              className="px-3 py-2 bg-violet-50 text-violet-600 text-sm font-medium rounded-lg hover:bg-violet-100 transition-colors flex items-center justify-center"
              title="Quick Preview"
            >
              <EyeIcon className="h-4 w-4" />
            </button>
          )}
          
          <Link
            href={`/lms/courses/${course.id}`}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors text-center"
          >
            View Course
          </Link>
        </div>
      </div>
    </div>
  );
}
