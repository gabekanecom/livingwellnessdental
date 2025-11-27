'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Link from 'next/link';
import Image from 'next/image';
import {
  XMarkIcon,
  ClockIcon,
  AcademicCapIcon,
  UserGroupIcon,
  PlayIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';

interface Lesson {
  id: string;
  title: string;
  duration: number | null;
  lessonType: string;
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  lessons: Lesson[];
}

interface CoursePreview {
  id: string;
  title: string;
  description: string | null;
  shortDescription: string | null;
  coverImage: string | null;
  difficulty: string;
  duration: number | null;
  learningObjectives: string[];
  prerequisites: string[];
  category: {
    id: string;
    name: string;
    color: string;
  } | null;
  createdBy: {
    name: string;
  } | null;
  modules: Module[];
  _count: {
    enrollments: number;
  };
}

interface CoursePreviewModalProps {
  courseId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function CoursePreviewModal({ courseId, isOpen, onClose }: CoursePreviewModalProps) {
  const [course, setCourse] = useState<CoursePreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (courseId && isOpen) {
      fetchCourse(courseId);
    }
  }, [courseId, isOpen]);

  const fetchCourse = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/lms/courses/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCourse(data.course);
        if (data.course?.modules?.[0]) {
          setExpandedModules(new Set([data.course.modules[0].id]));
        }
      }
    } catch (error) {
      console.error('Error fetching course:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'BEGINNER': return 'bg-green-100 text-green-700';
      case 'INTERMEDIATE': return 'bg-yellow-100 text-yellow-700';
      case 'ADVANCED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const totalLessons = course?.modules.reduce((sum, m) => sum + m.lessons.length, 0) || 0;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                {isLoading ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-500 mx-auto"></div>
                  </div>
                ) : course ? (
                  <>
                    <div className="relative">
                      {course.coverImage ? (
                        <Image
                          src={course.coverImage}
                          alt={course.title}
                          width={672}
                          height={200}
                          className="w-full h-32 sm:h-40 md:h-48 object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-32 sm:h-40 md:h-48 flex items-center justify-center"
                          style={{ backgroundColor: course.category?.color || '#8B5CF6' }}
                        >
                          <span className="text-4xl sm:text-5xl md:text-6xl font-bold text-white/30">
                            {course.title.charAt(0)}
                          </span>
                        </div>
                      )}
                      <button
                        onClick={onClose}
                        className="absolute top-3 right-3 p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                      >
                        <XMarkIcon className="h-5 w-5 text-gray-600" />
                      </button>
                    </div>

                    <div className="p-6">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
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

                      <Dialog.Title className="text-xl font-bold text-gray-900 mb-2">
                        {course.title}
                      </Dialog.Title>

                      {course.shortDescription && (
                        <p className="text-gray-600 text-sm mb-4">{course.shortDescription}</p>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-6">
                        {course.duration && (
                          <div className="flex items-center gap-1">
                            <ClockIcon className="h-4 w-4" />
                            {formatDuration(course.duration)}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <AcademicCapIcon className="h-4 w-4" />
                          {course.modules.length} modules
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpenIcon className="h-4 w-4" />
                          {totalLessons} lessons
                        </div>
                        <div className="flex items-center gap-1">
                          <UserGroupIcon className="h-4 w-4" />
                          {course._count.enrollments} enrolled
                        </div>
                      </div>

                      {course.learningObjectives.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-sm font-semibold text-gray-900 mb-2">What you'll learn</h3>
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {course.learningObjectives.slice(0, 4).map((obj, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                <span className="text-green-500 mt-0.5">✓</span>
                                <span className="line-clamp-2">{obj}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">Course Content</h3>
                        <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-60 overflow-y-auto">
                          {course.modules.map((module) => (
                            <div key={module.id}>
                              <button
                                onClick={() => toggleModule(module.id)}
                                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  {expandedModules.has(module.id) ? (
                                    <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                                  ) : (
                                    <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                                  )}
                                  <span className="text-sm font-medium text-gray-900">{module.title}</span>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {module.lessons.length} lessons
                                </span>
                              </button>
                              {expandedModules.has(module.id) && (
                                <ul className="bg-gray-50 px-3 pb-3">
                                  {module.lessons.map((lesson) => (
                                    <li
                                      key={lesson.id}
                                      className="flex items-center justify-between py-2 pl-6 text-sm text-gray-600"
                                    >
                                      <span>{lesson.title}</span>
                                      {lesson.duration && (
                                        <span className="text-xs text-gray-400">
                                          {formatDuration(lesson.duration)}
                                        </span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Link
                          href={`/lms/courses/${course.id}/take`}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 transition-colors"
                        >
                          <PlayIcon className="h-5 w-5" />
                          Start Course
                        </Link>
                        <Link
                          href={`/lms/courses/${course.id}`}
                          className="px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Full Details
                        </Link>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-12 text-center text-gray-500">
                    Course not found
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
