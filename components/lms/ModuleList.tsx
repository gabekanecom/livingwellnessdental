'use client';

import { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon, PlayIcon, DocumentTextIcon, PuzzlePieceIcon, ClockIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import ProgressBar from './ProgressBar';

interface Lesson {
  id: string;
  title: string;
  content?: string | null;
  lessonType: 'TEXT' | 'VIDEO' | 'INTERACTIVE' | 'QUIZ' | 'ASSIGNMENT' | 'DOCUMENT';
  order: number;
  duration: number | null;
  completed?: boolean;
  progress?: number;
}

interface Module {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  lessons: Lesson[];
  completedLessons?: number;
  totalLessons?: number;
  progress?: number;
}

interface ModuleListProps {
  modules: Module[];
  courseId: string;
  isStudent?: boolean;
  onLessonClick?: (lessonId: string, moduleId: string) => void;
  className?: string;
}

export default function ModuleList({
  modules,
  courseId,
  isStudent = false,
  onLessonClick,
  className = ''
}: ModuleListProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const getLessonIcon = (lessonType: Lesson['lessonType']) => {
    switch (lessonType) {
      case 'VIDEO':
        return <PlayIcon className="h-4 w-4" />;
      case 'QUIZ':
        return <PuzzlePieceIcon className="h-4 w-4" />;
      case 'TEXT':
      case 'DOCUMENT':
        return <DocumentTextIcon className="h-4 w-4" />;
      default:
        return <DocumentTextIcon className="h-4 w-4" />;
    }
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}m`;
  };

  const calculateModuleProgress = (module: Module) => {
    if (!isStudent || !module.lessons.length) return 0;
    const completedLessons = module.lessons.filter(lesson => lesson.completed).length;
    return (completedLessons / module.lessons.length) * 100;
  };

  const calculateModuleDuration = (module: Module) => {
    return module.lessons.reduce((total, lesson) => total + (lesson.duration || 0), 0);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {modules.length === 0 ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
            <DocumentTextIcon className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-gray-500">No modules available yet</p>
        </div>
      ) : (
        modules.map((module, moduleIndex) => {
          const isExpanded = expandedModules.has(module.id);
          const moduleProgress = isStudent ? calculateModuleProgress(module) : undefined;
          const moduleDuration = calculateModuleDuration(module);

          return (
            <div
              key={module.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <div
                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleModule(module.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center mb-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-bold mr-3">
                        {moduleIndex + 1}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900">
                        {module.title}
                      </h3>
                    </div>
                    
                    {module.description && (
                      <p className="text-gray-600 mb-3 ml-11">
                        {module.description}
                      </p>
                    )}

                    <div className="flex items-center text-sm text-gray-500 ml-11">
                      <div className="flex items-center mr-4">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {formatDuration(moduleDuration)}
                      </div>
                      <div>
                        {module.lessons.length} lesson{module.lessons.length !== 1 ? 's' : ''}
                      </div>
                    </div>

                    {isStudent && moduleProgress !== undefined && (
                      <div className="mt-3 ml-11">
                        <ProgressBar 
                          progress={moduleProgress} 
                          size="sm" 
                          color="blue"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    {isExpanded ? (
                      <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-200">
                  {module.lessons.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      No lessons in this module
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {module.lessons.map((lesson, lessonIndex) => (
                        <div
                          key={lesson.id}
                          className={`p-4 hover:bg-gray-50 transition-colors ${
                            onLessonClick ? 'cursor-pointer' : ''
                          }`}
                          onClick={() => onLessonClick?.(lesson.id, module.id)}
                        >
                          <div className="flex items-start">
                            <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600 mr-3 mt-0.5">
                              {lessonIndex + 1}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center mb-1">
                                    <div className="text-gray-400 mr-2">
                                      {getLessonIcon(lesson.lessonType)}
                                    </div>
                                    <h4 className="text-sm font-medium text-gray-900">
                                      {lesson.title}
                                    </h4>
                                  </div>

                                  <div className="flex items-center text-xs text-gray-400 ml-6">
                                    <ClockIcon className="h-3 w-3 mr-1" />
                                    {formatDuration(lesson.duration)}
                                    <span className="mx-2">•</span>
                                    <span className="capitalize">{lesson.lessonType.toLowerCase()}</span>
                                  </div>
                                </div>

                                {isStudent && (
                                  <div className="flex-shrink-0 ml-3">
                                    {lesson.completed ? (
                                      <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                                    ) : (
                                      <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                                    )}
                                  </div>
                                )}
                              </div>

                              {isStudent && lesson.lessonType === 'VIDEO' && lesson.progress && lesson.progress > 0 && lesson.progress < 100 && (
                                <div className="mt-2 ml-6">
                                  <ProgressBar 
                                    progress={lesson.progress} 
                                    size="sm" 
                                    color="emerald"
                                    showPercentage={false}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
