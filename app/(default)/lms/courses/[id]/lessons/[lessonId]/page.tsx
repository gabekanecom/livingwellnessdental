'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  PlayIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

interface Lesson {
  id: string;
  title: string;
  content: string;
  lessonType: string;
  duration: number;
  videoUrl?: string;
  attachments: string[];
  order: number;
}

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  modules: Module[];
}

interface Progress {
  lessonId: string;
  completed: boolean;
}

export default function LessonViewPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const lessonId = params.lessonId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [courseRes, progressRes] = await Promise.all([
          fetch(`/api/lms/courses/${courseId}`),
          fetch(`/api/lms/progress?courseId=${courseId}`)
        ]);

        if (courseRes.ok) {
          const { course: courseData } = await courseRes.json();
          setCourse(courseData);

          for (const module of courseData.modules) {
            const lesson = module.lessons.find((l: Lesson) => l.id === lessonId);
            if (lesson) {
              setCurrentLesson(lesson);
              break;
            }
          }
        }

        if (progressRes.ok) {
          const { progress: progressData } = await progressRes.json();
          setProgress(progressData || []);
        }
      } catch (error) {
        console.error('Error fetching lesson:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [courseId, lessonId]);

  const isLessonCompleted = (id: string) => {
    return progress.some(p => p.lessonId === id && p.completed);
  };

  const getAllLessons = (): { lesson: Lesson; moduleTitle: string }[] => {
    if (!course) return [];
    return course.modules.flatMap(module =>
      module.lessons.map(lesson => ({ lesson, moduleTitle: module.title }))
    );
  };

  const currentIndex = getAllLessons().findIndex(l => l.lesson.id === lessonId);
  const prevLesson = currentIndex > 0 ? getAllLessons()[currentIndex - 1] : null;
  const nextLesson = currentIndex < getAllLessons().length - 1 ? getAllLessons()[currentIndex + 1] : null;

  const handleMarkComplete = async () => {
    setIsCompleting(true);
    try {
      const response = await fetch('/api/lms/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          courseId,
          completed: true
        })
      });

      if (response.ok) {
        setProgress([...progress, { lessonId, completed: true }]);
      }
    } catch (error) {
      console.error('Error marking lesson complete:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!course || !currentLesson) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Lesson not found</h1>
        <Link
          href={`/lms/courses/${courseId}/take`}
          className="text-indigo-600 hover:text-indigo-700"
        >
          Return to course
        </Link>
      </div>
    );
  }

  const isComplete = isLessonCompleted(lessonId);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link
              href={`/lms/courses/${courseId}/take`}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span className="text-sm">Back to course</span>
            </Link>

            <div className="flex items-center gap-4">
              {isComplete ? (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircleSolidIcon className="h-5 w-5" />
                  Completed
                </span>
              ) : (
                <button
                  onClick={handleMarkComplete}
                  disabled={isCompleting}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  {isCompleting ? 'Saving...' : 'Mark Complete'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          {currentLesson.lessonType === 'VIDEO' && <PlayIcon className="h-4 w-4" />}
          {currentLesson.lessonType === 'TEXT' && <DocumentTextIcon className="h-4 w-4" />}
          {currentLesson.lessonType === 'QUIZ' && <ClipboardDocumentListIcon className="h-4 w-4" />}
          <span>{currentLesson.lessonType}</span>
          {currentLesson.duration > 0 && (
            <>
              <span className="text-gray-300">•</span>
              <span>{currentLesson.duration} min</span>
            </>
          )}
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {currentLesson.title}
        </h1>

        {currentLesson.lessonType === 'VIDEO' && currentLesson.videoUrl && (
          <div className="mb-8 aspect-video bg-black rounded-lg overflow-hidden">
            <iframe
              src={currentLesson.videoUrl}
              className="w-full h-full"
              allowFullScreen
            />
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div 
            className="prose prose-gray max-w-none"
            dangerouslySetInnerHTML={{ __html: currentLesson.content }}
          />
        </div>

        {currentLesson.attachments && currentLesson.attachments.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Attachments</h3>
            <div className="space-y-2">
              {currentLesson.attachments.map((attachment, index) => (
                <a
                  key={index}
                  href={attachment}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                >
                  <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-700">Attachment {index + 1}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          {prevLesson ? (
            <Link
              href={`/lms/courses/${courseId}/lessons/${prevLesson.lesson.id}`}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <div>
                <p className="text-xs text-gray-500">Previous</p>
                <p className="text-sm font-medium">{prevLesson.lesson.title}</p>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {nextLesson ? (
            <Link
              href={`/lms/courses/${courseId}/lessons/${nextLesson.lesson.id}`}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-right"
            >
              <div>
                <p className="text-xs text-gray-500">Next</p>
                <p className="text-sm font-medium">{nextLesson.lesson.title}</p>
              </div>
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              href={`/lms/courses/${courseId}`}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Finish Course
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
