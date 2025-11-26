import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { answers } = body;

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: 'Answers array is required' },
        { status: 400 }
      );
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            answers: true
          }
        },
        lesson: {
          select: {
            module: {
              select: {
                course: {
                  select: { id: true }
                }
              }
            }
          }
        }
      }
    });

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    let correctCount = 0;
    const gradedAnswers = [];

    for (const submittedAnswer of answers) {
      const question = quiz.questions.find(q => q.id === submittedAnswer.questionId);
      if (!question) continue;

      const correctAnswer = question.answers.find(a => a.isCorrect);
      const isCorrect = correctAnswer?.id === submittedAnswer.answerId;
      
      if (isCorrect) correctCount++;

      gradedAnswers.push({
        questionId: submittedAnswer.questionId,
        selectedAnswerId: submittedAnswer.answerId,
        correctAnswerId: correctAnswer?.id,
        isCorrect,
        explanation: question.explanation
      });
    }

    const score = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = score >= (quiz.passingScore || 70);

    // Find the user's enrollment for the course that contains this quiz
    const courseId = quiz.lesson?.module?.course?.id;
    if (!courseId) {
      return NextResponse.json(
        { error: 'Quiz not properly associated with a course' },
        { status: 400 }
      );
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: session.user.id,
        courseId
      }
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: 'You must be enrolled in the course to take this quiz' },
        { status: 403 }
      );
    }

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId: id,
        enrollmentId: enrollment.id,
        score,
        passed,
        answers: gradedAnswers,
        completedAt: new Date()
      }
    });

    return NextResponse.json({
      data: {
        attemptId: attempt.id,
        score,
        passed,
        correctCount,
        totalQuestions: quiz.questions.length,
        gradedAnswers
      }
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    return NextResponse.json(
      { error: 'Failed to submit quiz' },
      { status: 500 }
    );
  }
}
