'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronRightIcon,
  ChartBarIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface QuestionStat {
  id: string;
  question: string;
  questionType: string;
  correctRate: number;
  totalAnswered: number;
  answers: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
    selectedCount: number;
    percentage: number;
  }>;
}

interface QuizAnalytics {
  id: string;
  title: string;
  description: string | null;
  passingScore: number;
  timeLimit: number | null;
  course: { id: string; title: string };
  lesson: { id: string; title: string };
  stats: {
    totalAttempts: number;
    passedAttempts: number;
    passRate: number;
    avgScore: number;
    minScore: number;
    maxScore: number;
  };
  scoreDistribution: Record<string, number>;
  questionStats: QuestionStat[];
  weakQuestions: QuestionStat[];
  recentAttempts: Array<{
    id: string;
    studentName: string;
    score: number;
    passed: boolean;
    date: string;
  }>;
}

interface OverallStats {
  totalQuizzes: number;
  totalAttempts: number;
  avgPassRate: number;
  avgScore: number;
}

export default function QuizAnalyticsPage() {
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [quizzes, setQuizzes] = useState<QuizAnalytics[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/lms/instructor/quiz-analytics');
      if (response.ok) {
        const data = await response.json();
        setOverallStats(data.overallStats);
        setQuizzes(data.quizzes);
        if (data.quizzes.length > 0) {
          setSelectedQuiz(data.quizzes[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
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

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <Link href="/lms/instructor" className="hover:text-violet-600">Dashboard</Link>
        <ChevronRightIcon className="h-4 w-4" />
        <span className="text-gray-900">Quiz Analytics</span>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Quiz Analytics</h1>
        <p className="text-gray-600 mt-1">Analyze quiz performance and identify problem areas</p>
      </div>

      {overallStats && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-600">Total Quizzes</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{overallStats.totalQuizzes}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-600">Total Attempts</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{overallStats.totalAttempts}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-600">Avg Pass Rate</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{Math.round(overallStats.avgPassRate)}%</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-600">Avg Score</p>
            <p className="text-2xl font-bold text-violet-600 mt-1">{Math.round(overallStats.avgScore)}%</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Quizzes</h2>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {quizzes.map((quiz) => (
              <button
                key={quiz.id}
                onClick={() => setSelectedQuiz(quiz)}
                className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  selectedQuiz?.id === quiz.id ? 'bg-violet-50 border-l-4 border-l-violet-500' : ''
                }`}
              >
                <p className="font-medium text-gray-900 text-sm">{quiz.title}</p>
                <p className="text-xs text-gray-500 mt-1">{quiz.course.title}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-gray-600">
                    {quiz.stats.totalAttempts} attempts
                  </span>
                  <span className={`text-xs font-medium ${
                    quiz.stats.passRate >= 70 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {Math.round(quiz.stats.passRate)}% pass rate
                  </span>
                </div>
              </button>
            ))}
            {quizzes.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <ChartBarIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No quizzes found</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedQuiz ? (
            <>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{selectedQuiz.title}</h2>
                    <p className="text-sm text-gray-500">{selectedQuiz.course.title} • {selectedQuiz.lesson.title}</p>
                  </div>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                    Pass: {selectedQuiz.passingScore}%
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{selectedQuiz.stats.totalAttempts}</p>
                    <p className="text-xs text-gray-500">Attempts</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{selectedQuiz.stats.passRate}%</p>
                    <p className="text-xs text-gray-500">Pass Rate</p>
                  </div>
                  <div className="text-center p-3 bg-violet-50 rounded-lg">
                    <p className="text-2xl font-bold text-violet-600">{selectedQuiz.stats.avgScore}%</p>
                    <p className="text-xs text-gray-500">Avg Score</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">
                      {selectedQuiz.stats.minScore}-{selectedQuiz.stats.maxScore}%
                    </p>
                    <p className="text-xs text-gray-500">Score Range</p>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Score Distribution</h3>
                  <div className="flex items-end gap-2 h-24">
                    {Object.entries(selectedQuiz.scoreDistribution).map(([range, count]) => {
                      const maxCount = Math.max(...Object.values(selectedQuiz.scoreDistribution), 1);
                      const height = (count / maxCount) * 100;
                      const colors: Record<string, string> = {
                        '0-50': 'bg-red-500',
                        '50-70': 'bg-yellow-500',
                        '70-85': 'bg-blue-500',
                        '85-100': 'bg-green-500'
                      };
                      return (
                        <div key={range} className="flex-1 flex flex-col items-center">
                          <div 
                            className={`w-full ${colors[range]} rounded-t`}
                            style={{ height: `${Math.max(height, 4)}%` }}
                          ></div>
                          <p className="text-xs text-gray-500 mt-1">{range}</p>
                          <p className="text-xs font-medium text-gray-700">{count}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {selectedQuiz.weakQuestions.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
                    <h3 className="font-semibold text-gray-900">Problem Questions</h3>
                    <span className="text-sm text-gray-500">(&lt;60% correct)</span>
                  </div>
                  <div className="space-y-4">
                    {selectedQuiz.weakQuestions.slice(0, 5).map((q) => (
                      <div key={q.id} className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-sm text-gray-900">{q.question}</p>
                          <span className="text-sm font-medium text-red-600 whitespace-nowrap">
                            {Math.round(q.correctRate)}% correct
                          </span>
                        </div>
                        <div className="mt-3 space-y-1">
                          {q.answers.map((a) => (
                            <div key={a.id} className="flex items-center gap-2 text-xs">
                              {a.isCorrect ? (
                                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircleIcon className="h-4 w-4 text-gray-300" />
                              )}
                              <span className={a.isCorrect ? 'text-green-700' : 'text-gray-600'}>
                                {a.text}
                              </span>
                              <span className="text-gray-400">({Math.round(a.percentage)}% selected)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Recent Attempts</h3>
                <div className="space-y-2">
                  {selectedQuiz.recentAttempts.map((attempt) => (
                    <div key={attempt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          attempt.passed ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {attempt.passed ? (
                            <CheckCircleIcon className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircleIcon className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{attempt.studentName}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(attempt.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <span className={`text-lg font-bold ${
                        attempt.passed ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {Math.round(attempt.score)}%
                      </span>
                    </div>
                  ))}
                  {selectedQuiz.recentAttempts.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No attempts yet</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Select a quiz to view analytics</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
