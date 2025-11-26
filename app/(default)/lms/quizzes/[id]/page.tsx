'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  question: string;
  questionType: string;
  points: number;
  explanation?: string;
  answers: Answer[];
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  passingScore: number;
  timeLimit?: number;
  questions: Question[];
  lesson?: {
    id: string;
    title: string;
    module: {
      id: string;
      title: string;
      course: {
        id: string;
        title: string;
      };
    };
  };
}

interface GradedAnswer {
  questionId: string;
  selectedAnswerId: string;
  correctAnswerId: string;
  isCorrect: boolean;
  explanation?: string;
}

interface QuizResult {
  score: number;
  passed: boolean;
  correctCount: number;
  totalQuestions: number;
  gradedAnswers: GradedAnswer[];
}

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.id as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    async function fetchQuiz() {
      try {
        const response = await fetch(`/api/lms/quizzes/${quizId}`);
        if (response.ok) {
          const { quiz: quizData } = await response.json();
          setQuiz(quizData);
          if (quizData.timeLimit) {
            setTimeRemaining(quizData.timeLimit * 60);
          }
        }
      } catch (error) {
        console.error('Error fetching quiz:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchQuiz();
  }, [quizId]);

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || result) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, result]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (questionId: string, answerId: string) => {
    if (result) return;
    setSelectedAnswers({ ...selectedAnswers, [questionId]: answerId });
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    setIsSubmitting(true);
    try {
      const answers = Object.entries(selectedAnswers).map(([questionId, answerId]) => ({
        questionId,
        answerId
      }));

      const response = await fetch(`/api/lms/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      });

      if (response.ok) {
        const { data } = await response.json();
        setResult(data);
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Quiz not found</h1>
        <Link href="/lms" className="text-indigo-600 hover:text-indigo-700">
          Return to LMS
        </Link>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const answeredCount = Object.keys(selectedAnswers).length;

  if (result) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center mb-8">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
              result.passed ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {result.passed ? (
                <CheckCircleIcon className="h-10 w-10 text-green-600" />
              ) : (
                <XCircleIcon className="h-10 w-10 text-red-600" />
              )}
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {result.passed ? 'Congratulations!' : 'Keep Learning!'}
            </h1>

            <p className="text-gray-600 mb-6">
              {result.passed
                ? 'You passed the quiz!'
                : `You need ${quiz.passingScore}% to pass. Try again!`}
            </p>

            <div className="text-5xl font-bold text-gray-900 mb-2">
              {result.score}%
            </div>

            <p className="text-gray-500 mb-8">
              {result.correctCount} of {result.totalQuestions} correct
            </p>

            <div className="flex justify-center gap-4">
              {quiz.lesson && (
                <Link
                  href={`/lms/courses/${quiz.lesson.module.course.id}/lessons/${quiz.lesson.id}`}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Back to Lesson
                </Link>
              )}
              {!result.passed && (
                <button
                  onClick={() => {
                    setResult(null);
                    setSelectedAnswers({});
                    setCurrentQuestionIndex(0);
                    if (quiz.timeLimit) {
                      setTimeRemaining(quiz.timeLimit * 60);
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Review Answers</h2>
            <div className="space-y-6">
              {quiz.questions.map((question, index) => {
                const graded = result.gradedAnswers.find(a => a.questionId === question.id);
                return (
                  <div key={question.id} className="border-b border-gray-100 pb-4 last:border-0">
                    <div className="flex items-start gap-3">
                      <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        graded?.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 mb-2">
                          {question.question}
                        </p>
                        <div className="space-y-1">
                          {question.answers.map(answer => {
                            const isSelected = graded?.selectedAnswerId === answer.id;
                            const isCorrect = answer.isCorrect;
                            return (
                              <div
                                key={answer.id}
                                className={`text-sm px-3 py-2 rounded ${
                                  isCorrect
                                    ? 'bg-green-50 text-green-700'
                                    : isSelected
                                    ? 'bg-red-50 text-red-700'
                                    : 'text-gray-600'
                                }`}
                              >
                                {answer.text}
                                {isCorrect && ' ✓'}
                                {isSelected && !isCorrect && ' (your answer)'}
                              </div>
                            );
                          })}
                        </div>
                        {graded?.explanation && (
                          <p className="text-xs text-gray-500 mt-2 italic">
                            {graded.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{quiz.title}</h1>
              <p className="text-sm text-gray-500">
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </p>
            </div>

            {timeRemaining !== null && (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                timeRemaining < 60 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
              }`}>
                <ClockIcon className="h-4 w-4" />
                <span className="text-sm font-medium">{formatTime(timeRemaining)}</span>
              </div>
            )}
          </div>

          <div className="mt-3 flex gap-1">
            {quiz.questions.map((q, index) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  selectedAnswers[q.id]
                    ? 'bg-indigo-600'
                    : index === currentQuestionIndex
                    ? 'bg-indigo-300'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-medium text-gray-900 mb-6">
            {currentQuestion.question}
          </h2>

          <div className="space-y-3">
            {currentQuestion.answers.map(answer => {
              const isSelected = selectedAnswers[currentQuestion.id] === answer.id;
              return (
                <button
                  key={answer.id}
                  onClick={() => handleAnswerSelect(currentQuestion.id, answer.id)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-sm text-gray-900">{answer.text}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Previous
          </button>

          {currentQuestionIndex < quiz.questions.length - 1 ? (
            <button
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Next Question
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || answeredCount < quiz.questions.length}
              className="px-6 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
            >
              {isSubmitting ? 'Submitting...' : `Submit Quiz (${answeredCount}/${quiz.questions.length})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
