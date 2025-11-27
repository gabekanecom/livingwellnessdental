import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const instructorId = searchParams.get('instructorId');
    const courseId = searchParams.get('courseId');
    const quizId = searchParams.get('quizId');

    let quizFilter = {};
    
    if (quizId) {
      quizFilter = { id: quizId };
    } else if (courseId) {
      quizFilter = { lesson: { module: { courseId } } };
    } else if (instructorId) {
      quizFilter = { lesson: { module: { course: { createdById: instructorId } } } };
    }

    const quizzes = await prisma.quiz.findMany({
      where: quizFilter,
      include: {
        lesson: {
          include: {
            module: {
              include: {
                course: {
                  select: { id: true, title: true }
                }
              }
            }
          }
        },
        questions: {
          include: {
            answers: true
          }
        },
        attempts: {
          include: {
            enrollment: {
              include: {
                user: {
                  select: { id: true, name: true }
                }
              }
            }
          }
        }
      }
    });

    const quizAnalytics = quizzes.map(quiz => {
      const attempts = quiz.attempts;
      const totalAttempts = attempts.length;
      const passedAttempts = attempts.filter(a => a.passed).length;
      const scores = attempts.map(a => a.score);
      
      const avgScore = scores.length > 0 
        ? scores.reduce((a, b) => a + b, 0) / scores.length 
        : 0;
      const minScore = scores.length > 0 ? Math.min(...scores) : 0;
      const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
      const passRate = totalAttempts > 0 ? (passedAttempts / totalAttempts) * 100 : 0;

      const questionStats = quiz.questions.map(q => {
        let correctCount = 0;
        let totalAnswered = 0;
        const answerDistribution: Record<string, number> = {};
        
        q.answers.forEach(a => {
          answerDistribution[a.id] = 0;
        });

        attempts.forEach(attempt => {
          const answers = attempt.answers as Record<string, string>;
          const selectedAnswer = answers[q.id];
          if (selectedAnswer) {
            totalAnswered++;
            if (answerDistribution[selectedAnswer] !== undefined) {
              answerDistribution[selectedAnswer]++;
            }
            const correctAnswer = q.answers.find(a => a.isCorrect);
            if (correctAnswer && selectedAnswer === correctAnswer.id) {
              correctCount++;
            }
          }
        });

        return {
          id: q.id,
          question: q.question,
          questionType: q.questionType,
          correctRate: totalAnswered > 0 ? (correctCount / totalAnswered) * 100 : 0,
          totalAnswered,
          answers: q.answers.map(a => ({
            id: a.id,
            text: a.text,
            isCorrect: a.isCorrect,
            selectedCount: answerDistribution[a.id] || 0,
            percentage: totalAnswered > 0 
              ? ((answerDistribution[a.id] || 0) / totalAnswered) * 100 
              : 0
          }))
        };
      });

      const weakQuestions = questionStats
        .filter(q => q.correctRate < 60)
        .sort((a, b) => a.correctRate - b.correctRate);

      const scoreDistribution = {
        '0-50': scores.filter(s => s < 50).length,
        '50-70': scores.filter(s => s >= 50 && s < 70).length,
        '70-85': scores.filter(s => s >= 70 && s < 85).length,
        '85-100': scores.filter(s => s >= 85).length
      };

      const recentAttempts = attempts
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
        .map(a => ({
          id: a.id,
          studentName: a.enrollment.user.name,
          score: a.score,
          passed: a.passed,
          date: a.createdAt
        }));

      return {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        passingScore: quiz.passingScore,
        timeLimit: quiz.timeLimit,
        course: quiz.lesson.module.course,
        lesson: {
          id: quiz.lesson.id,
          title: quiz.lesson.title
        },
        stats: {
          totalAttempts,
          passedAttempts,
          passRate: Math.round(passRate * 10) / 10,
          avgScore: Math.round(avgScore * 10) / 10,
          minScore: Math.round(minScore * 10) / 10,
          maxScore: Math.round(maxScore * 10) / 10
        },
        scoreDistribution,
        questionStats,
        weakQuestions,
        recentAttempts
      };
    });

    const overallStats = {
      totalQuizzes: quizzes.length,
      totalAttempts: quizAnalytics.reduce((sum, q) => sum + q.stats.totalAttempts, 0),
      avgPassRate: quizAnalytics.length > 0
        ? quizAnalytics.reduce((sum, q) => sum + q.stats.passRate, 0) / quizAnalytics.length
        : 0,
      avgScore: quizAnalytics.length > 0
        ? quizAnalytics.reduce((sum, q) => sum + q.stats.avgScore, 0) / quizAnalytics.length
        : 0
    };

    return NextResponse.json({
      overallStats,
      quizzes: quizAnalytics
    });
  } catch (error) {
    console.error('Error fetching quiz analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz analytics' },
      { status: 500 }
    );
  }
}
