'use client';

import { useState } from 'react';
import CourseCard from './CourseCard';
import CoursePreviewModal from './CoursePreviewModal';

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

interface CourseGridProps {
  courses: Course[];
  showEnrollButton?: boolean;
  showManagementActions?: boolean;
}

export default function CourseGrid({ 
  courses, 
  showEnrollButton = true, 
  showManagementActions = false 
}: CourseGridProps) {
  const [previewCourseId, setPreviewCourseId] = useState<string | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            showEnrollButton={showEnrollButton}
            showManagementActions={showManagementActions}
            onPreview={setPreviewCourseId}
          />
        ))}
      </div>

      <CoursePreviewModal
        courseId={previewCourseId}
        isOpen={!!previewCourseId}
        onClose={() => setPreviewCourseId(null)}
      />
    </>
  );
}
