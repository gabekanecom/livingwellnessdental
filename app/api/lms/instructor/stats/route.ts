import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const instructorId = searchParams.get('instructorId');
    const courseId = searchParams.get('courseId');
    const period = searchParams.get('period') || '30'; // days

    const periodDays = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    const courseFilter = courseId 
      ? { id: courseId }
      : instructorId 
        ? { createdById: instructorId }
        : {};

    const courses = await prisma.course.findMany({
      where: courseFilter,
      include: {
        enrollments: {
          include: {
            lessonProgress: true,
            quizAttempts: true,
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        modules: {
          include: {
            lessons: {
              include: {
                quizzes: {
                  include: {
                    attempts: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: { enrollments: true }
        }
      }
    });

    const totalEnrollments = courses.reduce((sum, c) => sum + c._count.enrollments, 0);
    
    const allEnrollments = courses.flatMap(c => c.enrollments);
    const completedEnrollments = allEnrollments.filter(e => e.status === 'COMPLETED').length;
    const activeEnrollments = allEnrollments.filter(e => e.status === 'ACTIVE').length;
    
    const recentEnrollments = allEnrollments.filter(
      e => new Date(e.createdAt) >= startDate
    ).length;

    const avgProgress = allEnrollments.length > 0
      ? allEnrollments.reduce((sum, e) => sum + e.progress, 0) / allEnrollments.length
      : 0;

    const completionRate = totalEnrollments > 0 
      ? (completedEnrollments / totalEnrollments) * 100 
      : 0;

    const allQuizAttempts = allEnrollments.flatMap(e => e.quizAttempts);
    const avgQuizScore = allQuizAttempts.length > 0
      ? allQuizAttempts.reduce((sum, a) => sum + a.score, 0) / allQuizAttempts.length
      : 0;
    const quizPassRate = allQuizAttempts.length > 0
      ? (allQuizAttempts.filter(a => a.passed).length / allQuizAttempts.length) * 100
      : 0;

    const enrollmentsByDay: Record<string, number> = {};
    const completionsByDay: Record<string, number> = {};
    
    for (let i = periodDays - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      enrollmentsByDay[key] = 0;
      completionsByDay[key] = 0;
    }

    allEnrollments.forEach(e => {
      const enrollDate = new Date(e.createdAt).toISOString().split('T')[0];
      if (enrollmentsByDay[enrollDate] !== undefined) {
        enrollmentsByDay[enrollDate]++;
      }
      if (e.completedAt) {
        const completeDate = new Date(e.completedAt).toISOString().split('T')[0];
        if (completionsByDay[completeDate] !== undefined) {
          completionsByDay[completeDate]++;
        }
      }
    });

    const courseStats = courses.map(course => {
      const courseEnrollments = course.enrollments;
      const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
      const courseCompleted = courseEnrollments.filter(e => e.status === 'COMPLETED').length;
      const courseQuizAttempts = courseEnrollments.flatMap(e => e.quizAttempts);
      
      return {
        id: course.id,
        title: course.title,
        coverImage: course.coverImage,
        totalEnrollments: courseEnrollments.length,
        completedCount: courseCompleted,
        completionRate: courseEnrollments.length > 0 
          ? (courseCompleted / courseEnrollments.length) * 100 
          : 0,
        avgProgress: courseEnrollments.length > 0
          ? courseEnrollments.reduce((sum, e) => sum + e.progress, 0) / courseEnrollments.length
          : 0,
        totalLessons,
        avgQuizScore: courseQuizAttempts.length > 0
          ? courseQuizAttempts.reduce((sum, a) => sum + a.score, 0) / courseQuizAttempts.length
          : 0,
        recentEnrollments: courseEnrollments.filter(
          e => new Date(e.createdAt) >= startDate
        ).length
      };
    });

    const topStudents = allEnrollments
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 10)
      .map(e => ({
        id: e.user.id,
        name: e.user.name,
        email: e.user.email,
        progress: e.progress,
        lessonsCompleted: e.lessonProgress.filter(lp => lp.isCompleted).length,
        quizzesTaken: e.quizAttempts.length,
        avgQuizScore: e.quizAttempts.length > 0
          ? e.quizAttempts.reduce((sum, a) => sum + a.score, 0) / e.quizAttempts.length
          : 0
      }));

    return NextResponse.json({
      overview: {
        totalCourses: courses.length,
        totalEnrollments,
        activeEnrollments,
        completedEnrollments,
        recentEnrollments,
        avgProgress: Math.round(avgProgress),
        completionRate: Math.round(completionRate * 10) / 10,
        avgQuizScore: Math.round(avgQuizScore * 10) / 10,
        quizPassRate: Math.round(quizPassRate * 10) / 10
      },
      trends: {
        enrollments: Object.entries(enrollmentsByDay).map(([date, count]) => ({ date, count })),
        completions: Object.entries(completionsByDay).map(([date, count]) => ({ date, count }))
      },
      courseStats,
      topStudents
    });
  } catch (error) {
    console.error('Error fetching instructor stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch instructor stats' },
      { status: 500 }
    );
  }
}
