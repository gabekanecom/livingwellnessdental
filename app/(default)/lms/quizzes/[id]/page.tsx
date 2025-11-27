'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  BookOpenIcon,
  TrophyIcon,
  ArrowPathIcon,
  LightBulbIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

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

type QuizMode = 'quiz' | 'practice';

export default function QuizPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const quizId = params.id as string;
  const initialMode = searchParams.get('mode') as QuizMode || 'quiz';

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [mode, setMode] = useState<QuizMode>(initialMode);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState<Record<string, boolean>>({});
  const [practiceRevealed, setPracticeRevealed] = useState<Record<string, boolean>>({});
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    async function fetchQuiz() {
      try {
        const response = await fetch(`/api/lms/quizzes/${quizId}`);
        if (response.ok) {
          const { quiz: quizData } = await response.json();
          setQuiz(quizData);
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
    if (!hasStarted || mode === 'practice' || timeRemaining === null || timeRemaining <= 0 || result) return;

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
  }, [hasStarted, mode, timeRemaining, result]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startQuiz = () => {
    setHasStarted(true);
    if (mode === 'quiz' && quiz?.timeLimit) {
      setTimeRemaining(quiz.timeLimit * 60);
    }
  };

  const handleAnswerSelect = (questionId: string, answerId: string) => {
    if (result) return;
    if (mode === 'practice' && practiceRevealed[questionId]) return;
    
    setSelectedAnswers({ ...selectedAnswers, [questionId]: answerId });
  };

  const revealPracticeAnswer = (questionId: string) => {
    setPracticeRevealed({ ...practiceRevealed, [questionId]: true });
  };

  const handleSubmit = useCallback(async () => {
    if (!quiz) return;

    if (mode === 'practice') {
      const gradedAnswers: GradedAnswer[] = quiz.questions.map(q => {
        const selectedId = selectedAnswers[q.id];
        const correctAnswer = q.answers.find(a => a.isCorrect);
        return {
          questionId: q.id,
          selectedAnswerId: selectedId || '',
          correctAnswerId: correctAnswer?.id || '',
          isCorrect: selectedId === correctAnswer?.id,
          explanation: q.explanation
        };
      });

      const correctCount = gradedAnswers.filter(a => a.isCorrect).length;
      const score = Math.round((correctCount / quiz.questions.length) * 100);

      setResult({
        score,
        passed: score >= quiz.passingScore,
        correctCount,
        totalQuestions: quiz.questions.length,
        gradedAnswers
      });
      return;
    }

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
  }, [quiz, mode, selectedAnswers, quizId]);

  const resetQuiz = () => {
    setResult(null);
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setPracticeRevealed({});
    setShowExplanation({});
    setHasStarted(false);
    setTimeRemaining(null);
  };

  const getWeakAreas = () => {
    if (!result || !quiz) return [];
    
    const incorrect = result.gradedAnswers
      .filter(a => !a.isCorrect)
      .map(a => {
        const question = quiz.questions.find(q => q.id === a.questionId);
        return question;
      })
      .filter(Boolean);
    
    return incorrect;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Quiz not found</h1>
        <Link href="/lms" className="text-violet-600 hover:text-violet-700">
          Return to LMS
        </Link>
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
            {quiz.description && (
              <p className="text-gray-600 mb-6">{quiz.description}</p>
            )}

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Questions</p>
                <p className="text-2xl font-bold text-gray-900">{quiz.questions.length}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Passing Score</p>
                <p className="text-2xl font-bold text-gray-900">{quiz.passingScore}%</p>
              </div>
              {quiz.timeLimit && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Time Limit</p>
                  <p className="text-2xl font-bold text-gray-900">{quiz.timeLimit} min</p>
                </div>
              )}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Total Points</p>
                <p className="text-2xl font-bold text-gray-900">
                  {quiz.questions.reduce((sum, q) => sum + q.points, 0)}
                </p>
              </div>
            </div>

            <div className="mb-8">
              <p className="text-sm font-medium text-gray-700 mb-3">Select Mode:</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setMode('quiz')}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    mode === 'quiz'
                      ? 'border-violet-600 bg-violet-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <TrophyIcon className={`h-6 w-6 mb-2 ${mode === 'quiz' ? 'text-violet-600' : 'text-gray-400'}`} />
                  <p className="font-medium text-gray-900">Graded Quiz</p>
                  <p className="text-sm text-gray-500">Your score will be recorded</p>
                </button>
                <button
                  onClick={() => setMode('practice')}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    mode === 'practice'
                      ? 'border-violet-600 bg-violet-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <BookOpenIcon className={`h-6 w-6 mb-2 ${mode === 'practice' ? 'text-violet-600' : 'text-gray-400'}`} />
                  <p className="font-medium text-gray-900">Practice Mode</p>
                  <p className="text-sm text-gray-500">No timer, see answers as you go</p>
                </button>
              </div>
            </div>

            <button
              onClick={startQuiz}
              className="w-full py-3 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 transition-colors"
            >
              Start {mode === 'practice' ? 'Practice' : 'Quiz'}
            </button>

            {quiz.lesson && (
              <Link
                href={`/lms/courses/${quiz.lesson.module.course.id}/take`}
                className="block mt-4 text-center text-sm text-gray-500 hover:text-violet-600"
              >
                ← Back to {quiz.lesson.module.course.title}
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const answeredCount = Object.keys(selectedAnswers).length;
  const weakAreas = getWeakAreas();

  if (result) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center mb-6">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
              result.passed ? 'bg-green-100' : 'bg-amber-100'
            }`}>
              {result.passed ? (
                <TrophyIcon className="h-10 w-10 text-green-600" />
              ) : (
                <LightBulbIcon className="h-10 w-10 text-amber-600" />
              )}
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {result.passed ? 'Excellent Work!' : 'Keep Practicing!'}
            </h1>

            <p className="text-gray-600 mb-6">
              {mode === 'practice' 
                ? 'Practice complete! Review your answers below.'
                : result.passed
                  ? 'You passed the quiz!'
                  : `You need ${quiz.passingScore}% to pass.`}
            </p>

            <div className="inline-flex items-center justify-center gap-8 mb-6">
              <div>
                <p className="text-5xl font-bold text-gray-900">{result.score}%</p>
                <p className="text-sm text-gray-500">Score</p>
              </div>
              <div className="h-16 w-px bg-gray-200" />
              <div>
                <p className="text-5xl font-bold text-gray-900">{result.correctCount}/{result.totalQuestions}</p>
                <p className="text-sm text-gray-500">Correct</p>
              </div>
            </div>

            <div className="flex justify-center gap-3 flex-wrap">
              <button
                onClick={resetQuiz}
                className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700"
              >
                <ArrowPathIcon className="h-4 w-4" />
                {mode === 'practice' ? 'Practice Again' : 'Retake Quiz'}
              </button>
              {mode === 'quiz' && !result.passed && (
                <button
                  onClick={() => {
                    setMode('practice');
                    resetQuiz();
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200"
                >
                  <BookOpenIcon className="h-4 w-4" />
                  Try Practice Mode
                </button>
              )}
              {quiz.lesson && (
                <Link
                  href={`/lms/courses/${quiz.lesson.module.course.id}/take`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200"
                >
                  Back to Course
                </Link>
              )}
            </div>
          </div>

          {weakAreas.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <ChartBarIcon className="h-5 w-5 text-amber-600" />
                <h2 className="font-semibold text-amber-900">Areas to Review</h2>
              </div>
              <p className="text-sm text-amber-700 mb-3">
                You missed {weakAreas.length} question{weakAreas.length > 1 ? 's' : ''}. Review these topics:
              </p>
              <ul className="space-y-2">
                {weakAreas.slice(0, 3).map((q, i) => (
                  <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                    <span className="text-amber-500">•</span>
                    <span className="line-clamp-2">{q?.question}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Review All Answers</h2>
            <div className="space-y-6">
              {quiz.questions.map((question, index) => {
                const graded = result.gradedAnswers.find(a => a.questionId === question.id);
                const isCorrect = graded?.isCorrect;
                
                return (
                  <div key={question.id} className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className="flex items-start gap-3">
                      <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${
                        isCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                      }`}>
                        {isCorrect ? <CheckCircleSolid className="h-4 w-4" /> : index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-3">{question.question}</p>
                        <div className="space-y-2">
                          {question.answers.map(answer => {
                            const isSelected = graded?.selectedAnswerId === answer.id;
                            const isCorrectAnswer = answer.isCorrect;
                            
                            return (
                              <div
                                key={answer.id}
                                className={`text-sm px-3 py-2 rounded-lg flex items-center gap-2 ${
                                  isCorrectAnswer
                                    ? 'bg-green-100 text-green-800 border border-green-200'
                                    : isSelected
                                    ? 'bg-red-100 text-red-800 border border-red-200'
                                    : 'bg-white text-gray-600 border border-gray-200'
                                }`}
                              >
                                {isCorrectAnswer && <CheckCircleIcon className="h-4 w-4 text-green-600" />}
                                {isSelected && !isCorrectAnswer && <XCircleIcon className="h-4 w-4 text-red-600" />}
                                <span>{answer.text}</span>
                                {isSelected && !isCorrectAnswer && (
                                  <span className="text-xs ml-auto">(your answer)</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {question.explanation && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-800">
                              <span className="font-medium">Explanation: </span>
                              {question.explanation}
                            </p>
                          </div>
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

  const isPracticeRevealed = mode === 'practice' && practiceRevealed[currentQuestion.id];
  const selectedAnswer = selectedAnswers[currentQuestion.id];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-gray-900">{quiz.title}</h1>
                {mode === 'practice' && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                    Practice
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </p>
            </div>

            {mode === 'quiz' && timeRemaining !== null && (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                timeRemaining < 60 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-gray-100 text-gray-700'
              }`}>
                <ClockIcon className="h-4 w-4" />
                <span className="text-sm font-medium">{formatTime(timeRemaining)}</span>
              </div>
            )}
          </div>

          <div className="mt-3 flex gap-1">
            {quiz.questions.map((q, index) => {
              const isAnswered = selectedAnswers[q.id];
              const isCurrent = index === currentQuestionIndex;
              const isRevealed = mode === 'practice' && practiceRevealed[q.id];
              const correctAnswer = q.answers.find(a => a.isCorrect);
              const wasCorrect = isRevealed && selectedAnswers[q.id] === correctAnswer?.id;
              
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`flex-1 h-2 rounded-full transition-colors ${
                    isRevealed
                      ? wasCorrect ? 'bg-green-500' : 'bg-red-500'
                      : isAnswered
                      ? 'bg-violet-600'
                      : isCurrent
                      ? 'bg-violet-300'
                      : 'bg-gray-200'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-xl font-medium text-gray-900 flex-1">
              {currentQuestion.question}
            </h2>
            <span className="text-sm text-gray-500 ml-4">
              {currentQuestion.points} pt{currentQuestion.points > 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-3">
            {currentQuestion.answers.map(answer => {
              const isSelected = selectedAnswer === answer.id;
              const isCorrectAnswer = answer.isCorrect;
              
              let buttonClass = 'border-gray-200 hover:border-gray-300';
              if (isSelected && !isPracticeRevealed) {
                buttonClass = 'border-violet-600 bg-violet-50';
              } else if (isPracticeRevealed) {
                if (isCorrectAnswer) {
                  buttonClass = 'border-green-500 bg-green-50';
                } else if (isSelected) {
                  buttonClass = 'border-red-500 bg-red-50';
                }
              }

              return (
                <button
                  key={answer.id}
                  onClick={() => handleAnswerSelect(currentQuestion.id, answer.id)}
                  disabled={isPracticeRevealed}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${buttonClass} disabled:cursor-default`}
                >
                  <div className="flex items-center gap-3">
                    {isPracticeRevealed && isCorrectAnswer && (
                      <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
                    )}
                    {isPracticeRevealed && isSelected && !isCorrectAnswer && (
                      <XCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${isPracticeRevealed && isCorrectAnswer ? 'text-green-800 font-medium' : 'text-gray-900'}`}>
                      {answer.text}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {mode === 'practice' && selectedAnswer && !isPracticeRevealed && (
            <button
              onClick={() => revealPracticeAnswer(currentQuestion.id)}
              className="mt-4 w-full py-2 bg-blue-100 text-blue-700 font-medium rounded-lg hover:bg-blue-200"
            >
              Check Answer
            </button>
          )}

          {isPracticeRevealed && currentQuestion.explanation && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Explanation: </span>
                {currentQuestion.explanation}
              </p>
            </div>
          )}
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

          <div className="text-sm text-gray-500">
            {answeredCount} of {quiz.questions.length} answered
          </div>

          {currentQuestionIndex < quiz.questions.length - 1 ? (
            <button
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
              className="px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700"
            >
              Next Question
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || (mode === 'quiz' && answeredCount < quiz.questions.length)}
              className="px-6 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : mode === 'practice' ? 'Finish Practice' : 'Submit Quiz'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
