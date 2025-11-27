'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  Bars3Icon,
  XMarkIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import ProgressBar from '@/components/lms/ProgressBar';
import VideoPlayer from '@/components/lms/VideoPlayer';
import LessonTools from '@/components/lms/LessonTools';
import CourseCompletionModal from '@/components/lms/CourseCompletionModal';

interface Lesson {
  id: string;
  title: string;
  content: string | null;
  lessonType: string;
  order: number;
  duration: number | null;
  videoUrl: string | null;
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
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set([0]));
  const [readingProgress, setReadingProgress] = useState(0);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [hasShownCompletion, setHasShownCompletion] = useState(false);

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  useEffect(() => {
    const handleScroll = () => {
      const contentArea = document.getElementById('lesson-content');
      if (!contentArea) return;
      
      const scrollTop = contentArea.scrollTop;
      const scrollHeight = contentArea.scrollHeight - contentArea.clientHeight;
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      setReadingProgress(Math.min(100, Math.max(0, progress)));
    };

    const contentArea = document.getElementById('lesson-content');
    contentArea?.addEventListener('scroll', handleScroll);
    return () => contentArea?.removeEventListener('scroll', handleScroll);
  }, [currentLesson]);

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
    if (!enrollment || !currentLesson || !course) return;
    
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

      const completedBefore = enrollment.lessonProgress?.filter(p => p.isCompleted).length || 0;
      const totalLessonsCount = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
      const willBeComplete = completedBefore + 1 >= totalLessonsCount;

      await loadCourse();

      if (willBeComplete && !hasShownCompletion) {
        setHasShownCompletion(true);
        setShowCompletionModal(true);
      }
    } catch (error) {
      console.error('Failed to mark lesson complete:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const isLessonCompleted = useCallback((lessonId: string) => {
    return enrollment?.lessonProgress?.some(
      p => p.lessonId === lessonId && p.isCompleted
    ) || false;
  }, [enrollment]);

  const navigateToLesson = (moduleIndex: number, lessonIndex: number) => {
    if (!course) return;
    setCurrentModuleIndex(moduleIndex);
    setCurrentLessonIndex(lessonIndex);
    setCurrentLesson(course.modules[moduleIndex].lessons[lessonIndex]);
    setIsSidebarOpen(false);
    setReadingProgress(0);
    document.getElementById('lesson-content')?.scrollTo(0, 0);
  };

  const goToNextLesson = () => {
    if (!course) return;
    
    const currentModule = course.modules[currentModuleIndex];
    if (currentLessonIndex < currentModule.lessons.length - 1) {
      navigateToLesson(currentModuleIndex, currentLessonIndex + 1);
    } else if (currentModuleIndex < course.modules.length - 1) {
      navigateToLesson(currentModuleIndex + 1, 0);
      setExpandedModules(prev => {
        const next = new Set(prev);
        next.add(currentModuleIndex + 1);
        return next;
      });
    }
  };

  const goToPrevLesson = () => {
    if (!course) return;
    
    if (currentLessonIndex > 0) {
      navigateToLesson(currentModuleIndex, currentLessonIndex - 1);
    } else if (currentModuleIndex > 0) {
      const prevModule = course.modules[currentModuleIndex - 1];
      navigateToLesson(currentModuleIndex - 1, prevModule.lessons.length - 1);
      setExpandedModules(prev => {
        const next = new Set(prev);
        next.add(currentModuleIndex - 1);
        return next;
      });
    }
  };

  const toggleModule = (index: number) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
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

  const getModuleProgress = (module: Module) => {
    const completed = module.lessons.filter(l => isLessonCompleted(l.id)).length;
    return { completed, total: module.lessons.length };
  };

  const getRemainingTime = () => {
    if (!course) return null;
    let totalMinutes = 0;
    course.modules.forEach((module, mIdx) => {
      module.lessons.forEach((lesson, lIdx) => {
        if (!isLessonCompleted(lesson.id)) {
          if (mIdx > currentModuleIndex || (mIdx === currentModuleIndex && lIdx >= currentLessonIndex)) {
            totalMinutes += lesson.duration || 5;
          }
        }
      });
    });
    return formatDuration(totalMinutes);
  };

  const totalLessons = course?.modules.reduce((sum, m) => sum + m.lessons.length, 0) || 0;
  const completedLessons = enrollment?.lessonProgress?.filter(p => p.isCompleted).length || 0;
  const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
  const isFirstLesson = currentModuleIndex === 0 && currentLessonIndex === 0;
  const isLastLesson = course ? 
    currentModuleIndex === course.modules.length - 1 && 
    currentLessonIndex === course.modules[currentModuleIndex].lessons.length - 1 : false;

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
        <Link href="/lms/catalog" className="text-violet-600 hover:underline mt-2 inline-block">
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
            className="px-6 py-3 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 disabled:opacity-50"
          >
            {isEnrolling ? 'Enrolling...' : 'Enroll Now'}
          </button>
        </div>
      </div>
    );
  }

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <Link href={`/lms/courses/${courseId}`} className="flex items-center text-sm text-gray-600 hover:text-violet-600">
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            Back
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1 text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <h2 className="font-bold text-gray-900 truncate text-sm">{course.title}</h2>
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>{completedLessons}/{totalLessons} lessons</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <ProgressBar progress={progress} size="sm" showPercentage={false} />
        </div>
        {getRemainingTime() && (
          <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
            <ClockIcon className="h-3.5 w-3.5" />
            <span>{getRemainingTime()} remaining</span>
          </div>
        )}
      </div>

      <div className="p-3 overflow-y-auto flex-1">
        {course.modules.map((module, moduleIndex) => {
          const moduleProgress = getModuleProgress(module);
          const isExpanded = expandedModules.has(moduleIndex);
          
          return (
            <div key={module.id} className="mb-2">
              <button
                onClick={() => toggleModule(moduleIndex)}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isExpanded ? (
                    <ChevronDownIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  )}
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {moduleIndex + 1}. {module.title}
                  </span>
                </div>
                <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                  {moduleProgress.completed}/{moduleProgress.total}
                </span>
              </button>
              
              {isExpanded && (
                <ul className="mt-1 ml-6 space-y-0.5">
                  {module.lessons.map((lesson, lessonIndex) => {
                    const isActive = currentModuleIndex === moduleIndex && currentLessonIndex === lessonIndex;
                    const completed = isLessonCompleted(lesson.id);
                    
                    return (
                      <li key={lesson.id}>
                        <button
                          onClick={() => navigateToLesson(moduleIndex, lessonIndex)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md text-left transition-colors ${
                            isActive 
                              ? 'bg-violet-50 text-violet-700' 
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {completed ? (
                            <CheckCircleSolidIcon className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                          ) : (
                            <div className={`h-4 w-4 border-2 rounded-full flex-shrink-0 ${
                              isActive ? 'border-violet-400' : 'border-gray-300'
                            }`} />
                          )}
                          <span className="truncate flex-1">{lesson.title}</span>
                          {lesson.duration && (
                            <span className="text-xs text-gray-400">{formatDuration(lesson.duration)}</span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </>
  );

  return (
    <div className="flex h-[calc(100vh-64px)] relative">
      <div 
        className="fixed top-0 left-0 h-1 bg-violet-500 z-50 transition-all duration-150"
        style={{ width: `${readingProgress}%` }}
      />

      <div className="hidden lg:flex w-72 bg-white border-r border-gray-200 flex-col flex-shrink-0">
        {sidebarContent}
      </div>

      {isSidebarOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white z-50 flex flex-col lg:hidden shadow-xl">
            {sidebarContent}
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="lg:hidden flex items-center justify-between p-3 border-b border-gray-200 bg-white">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <Bars3Icon className="h-5 w-5" />
            <span className="text-sm font-medium">Course Content</span>
          </button>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{completedLessons}/{totalLessons}</span>
            <div className="w-16">
              <ProgressBar progress={progress} size="sm" showPercentage={false} />
            </div>
          </div>
        </div>

        <div id="lesson-content" className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            {currentLesson ? (
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>Module {currentModuleIndex + 1}</span>
                    <ChevronRightIcon className="h-4 w-4" />
                    <span>Lesson {currentLessonIndex + 1}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {currentLesson.duration && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <ClockIcon className="h-4 w-4" />
                        {formatDuration(currentLesson.duration)}
                      </div>
                    )}
                    <LessonTools lessonId={currentLesson.id} lessonTitle={currentLesson.title} />
                  </div>
                </div>
                
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
                  {currentLesson.title}
                </h1>

                {currentLesson.videoUrl && (
                  <div className="mb-6">
                    <VideoPlayer 
                      url={currentLesson.videoUrl} 
                      title={currentLesson.title}
                    />
                  </div>
                )}

                {currentLesson.content ? (
                  <div 
                    className="prose prose-gray max-w-none prose-sm sm:prose-base"
                    dangerouslySetInnerHTML={{ __html: currentLesson.content.replace(/\n/g, '<br/>') }}
                  />
                ) : !currentLesson.videoUrl ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No content available for this lesson</p>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">Select a lesson to begin</p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 bg-white p-3 sm:p-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
            <button
              onClick={goToPrevLesson}
              disabled={isFirstLesson}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              <ChevronLeftIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            <div className="flex items-center gap-2 sm:gap-4">
              {currentLesson && !isLessonCompleted(currentLesson.id) && (
                <button
                  onClick={markLessonComplete}
                  disabled={isSaving}
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm sm:text-base"
                >
                  <CheckCircleIcon className="h-5 w-5" />
                  <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Mark Complete'}</span>
                  <span className="sm:hidden">{isSaving ? '...' : 'Done'}</span>
                </button>
              )}
              
              {currentLesson && isLessonCompleted(currentLesson.id) && (
                <span className="flex items-center gap-1 sm:gap-2 text-emerald-600 text-sm sm:text-base">
                  <CheckCircleSolidIcon className="h-5 w-5" />
                  <span className="hidden sm:inline">Completed</span>
                </span>
              )}
            </div>

            <button
              onClick={goToNextLesson}
              disabled={isLastLesson}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {course && enrollment && (
        <CourseCompletionModal
          isOpen={showCompletionModal}
          onClose={() => setShowCompletionModal(false)}
          courseName={course.title}
          courseId={course.id}
          enrollmentId={enrollment.id}
        />
      )}
    </div>
  );
}
