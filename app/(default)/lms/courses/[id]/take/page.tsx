'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  CheckCircleIcon,
  PlayIcon,
  DocumentTextIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import ProgressBar from '@/components/lms/ProgressBar';

interface Lesson {
  id: string;
  title: string;
  content: string | null;
  lessonType: string;
  order: number;
  duration: number | null;
  completed?: boolean;
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  order: number;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  modules: Module[];
}

interface Enrollment {
  id: string;
  progress: number;
  lessonProgress: Array<{
    lessonId: string;
    isCompleted: boolean;
  }>;
}

export default function TakeCoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      const response = await fetch(`/api/lms/courses/${courseId}`);
      if (response.ok) {
        const data = await response.json();
        setCourse(data.course);
        
        if (data.course.modules.length > 0 && data.course.modules[0].lessons.length > 0) {
          setCurrentLesson(data.course.modules[0].lessons[0]);
        }
      }

      const enrollmentResponse = await fetch(`/api/lms/enrollments?courseId=${courseId}`);
      if (enrollmentResponse.ok) {
        const enrollData = await enrollmentResponse.json();
        if (enrollData.enrollments && enrollData.enrollments.length > 0) {
          setEnrollment(enrollData.enrollments[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load course:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = async () => {
    setIsEnrolling(true);
    try {
      const response = await fetch('/api/lms/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          userId: 'demo-user'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setEnrollment(data.data);
      }
    } catch (error) {
      console.error('Failed to enroll:', error);
    } finally {
      setIsEnrolling(false);
    }
  };

  const markLessonComplete = async () => {
    if (!enrollment || !currentLesson) return;
    
    setIsSaving(true);
    try {
      await fetch('/api/lms/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollmentId: enrollment.id,
          lessonId: currentLesson.id,
          isCompleted: true
        })
      });

      await loadCourse();
    } catch (error) {
      console.error('Failed to mark lesson complete:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const isLessonCompleted = (lessonId: string) => {
    return enrollment?.lessonProgress?.some(
      p => p.lessonId === lessonId && p.isCompleted
    ) || false;
  };

  const navigateToLesson = (moduleIndex: number, lessonIndex: number) => {
    if (!course) return;
    setCurrentModuleIndex(moduleIndex);
    setCurrentLessonIndex(lessonIndex);
    setCurrentLesson(course.modules[moduleIndex].lessons[lessonIndex]);
  };

  const goToNextLesson = () => {
    if (!course) return;
    
    const currentModule = course.modules[currentModuleIndex];
    if (currentLessonIndex < currentModule.lessons.length - 1) {
      navigateToLesson(currentModuleIndex, currentLessonIndex + 1);
    } else if (currentModuleIndex < course.modules.length - 1) {
      navigateToLesson(currentModuleIndex + 1, 0);
    }
  };

  const goToPrevLesson = () => {
    if (!course) return;
    
    if (currentLessonIndex > 0) {
      navigateToLesson(currentModuleIndex, currentLessonIndex - 1);
    } else if (currentModuleIndex > 0) {
      const prevModule = course.modules[currentModuleIndex - 1];
      navigateToLesson(currentModuleIndex - 1, prevModule.lessons.length - 1);
    }
  };

  const totalLessons = course?.modules.reduce((sum, m) => sum + m.lessons.length, 0) || 0;
  const completedLessons = enrollment?.lessonProgress?.filter(p => p.isCompleted).length || 0;
  const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ArrowPathIcon className="h-8 w-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-gray-500">Course not found</p>
        <Link href="/lms/catalog" className="text-indigo-600 hover:underline mt-2 inline-block">
          Browse courses
        </Link>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{course.title}</h2>
          <p className="text-gray-600 mb-6">Enroll in this course to start learning</p>
          <button
            onClick={handleEnroll}
            disabled={isEnrolling}
            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {isEnrolling ? 'Enrolling...' : 'Enroll Now'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
        <div className="p-4 border-b border-gray-200">
          <Link href={`/lms/courses/${courseId}`} className="flex items-center text-sm text-gray-600 hover:text-indigo-600 mb-3">
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            Back to course
          </Link>
          <h2 className="font-bold text-gray-900 truncate">{course.title}</h2>
          <div className="mt-3">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>{completedLessons}/{totalLessons} lessons</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <ProgressBar progress={progress} size="sm" showPercentage={false} />
          </div>
        </div>

        <div className="p-4">
          {course.modules.map((module, moduleIndex) => (
            <div key={module.id} className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                {moduleIndex + 1}. {module.title}
              </h3>
              <ul className="space-y-1">
                {module.lessons.map((lesson, lessonIndex) => {
                  const isActive = currentModuleIndex === moduleIndex && currentLessonIndex === lessonIndex;
                  const completed = isLessonCompleted(lesson.id);
                  
                  return (
                    <li key={lesson.id}>
                      <button
                        onClick={() => navigateToLesson(moduleIndex, lessonIndex)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-left transition-colors ${
                          isActive 
                            ? 'bg-indigo-50 text-indigo-700' 
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {completed ? (
                          <CheckCircleSolidIcon className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <div className="h-4 w-4 border-2 border-gray-300 rounded-full flex-shrink-0" />
                        )}
                        <span className="truncate">{lesson.title}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8">
          {currentLesson ? (
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <span>Module {currentModuleIndex + 1}</span>
                <ChevronRightIcon className="h-4 w-4" />
                <span>Lesson {currentLessonIndex + 1}</span>
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-6">
                {currentLesson.title}
              </h1>

              {currentLesson.content ? (
                <div 
                  className="prose prose-gray max-w-none"
                  dangerouslySetInnerHTML={{ __html: currentLesson.content.replace(/\n/g, '<br/>') }}
                />
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No content available for this lesson</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Select a lesson to begin</p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 bg-white p-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <button
              onClick={goToPrevLesson}
              disabled={currentModuleIndex === 0 && currentLessonIndex === 0}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="h-5 w-5" />
              Previous
            </button>

            <div className="flex items-center gap-4">
              {currentLesson && !isLessonCompleted(currentLesson.id) && (
                <button
                  onClick={markLessonComplete}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  <CheckCircleIcon className="h-5 w-5" />
                  {isSaving ? 'Saving...' : 'Mark Complete'}
                </button>
              )}
              
              {currentLesson && isLessonCompleted(currentLesson.id) && (
                <span className="flex items-center gap-2 text-emerald-600">
                  <CheckCircleSolidIcon className="h-5 w-5" />
                  Completed
                </span>
              )}
            </div>

            <button
              onClick={goToNextLesson}
              disabled={
                currentModuleIndex === course.modules.length - 1 && 
                currentLessonIndex === course.modules[currentModuleIndex].lessons.length - 1
              }
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
