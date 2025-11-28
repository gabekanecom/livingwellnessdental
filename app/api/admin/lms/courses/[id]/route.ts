import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const period = parseInt(searchParams.get('period') || '30');

    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - period);

    // Get course with all related data
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        category: true,
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                duration: true,
                order: true
              }
            }
          }
        },
        enrollments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                locations: {
                  where: { isActive: true },
                  include: { location: true }
                }
              }
            },
            lessonProgress: {
              select: {
                lessonId: true,
                isCompleted: true,
                completedAt: true,
                timeSpent: true
              }
            }
          }
        }
      }
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Calculate course-level stats
    const totalEnrollments = course.enrollments.length;
    const activeEnrollments = course.enrollments.filter(e => e.status === 'ACTIVE').length;
    const completedEnrollments = course.enrollments.filter(e => e.status === 'COMPLETED').length;
    const pausedEnrollments = course.enrollments.filter(e => e.status === 'PAUSED').length;

    const completionRate = totalEnrollments > 0
      ? Math.round((completedEnrollments / totalEnrollments) * 100)
      : 0;

    const avgProgress = totalEnrollments > 0
      ? Math.round(course.enrollments.reduce((sum, e) => sum + e.progress, 0) / totalEnrollments)
      : 0;

    // Calculate average days to completion
    const completedWithDates = course.enrollments.filter(
      e => e.status === 'COMPLETED' && e.completedAt
    );
    let avgDaysToComplete = 0;
    if (completedWithDates.length > 0) {
      const totalDays = completedWithDates.reduce((sum, e) => {
        const days = Math.ceil(
          (e.completedAt!.getTime() - e.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }, 0);
      avgDaysToComplete = Math.round(totalDays / completedWithDates.length);
    }

    // Recent enrollments in period
    const recentEnrollments = course.enrollments.filter(
      e => e.createdAt >= periodStart
    ).length;

    // Calculate lesson completion stats
    const allLessons = course.modules.flatMap(m => m.lessons);
    const lessonStats = allLessons.map(lesson => {
      const completions = course.enrollments.reduce((count, enrollment) => {
        const progress = enrollment.lessonProgress.find(lp => lp.lessonId === lesson.id);
        return count + (progress?.isCompleted ? 1 : 0);
      }, 0);

      const totalTimeSpent = course.enrollments.reduce((total, enrollment) => {
        const progress = enrollment.lessonProgress.find(lp => lp.lessonId === lesson.id);
        return total + (progress?.timeSpent || 0);
      }, 0);

      return {
        id: lesson.id,
        title: lesson.title,
        duration: lesson.duration,
        order: lesson.order,
        completions,
        completionRate: totalEnrollments > 0
          ? Math.round((completions / totalEnrollments) * 100)
          : 0,
        avgTimeSpent: completions > 0 ? Math.round(totalTimeSpent / completions) : 0
      };
    });

    // Module stats (aggregate lesson stats)
    const moduleStats = course.modules.map(module => {
      const moduleLessonStats = lessonStats.filter(ls =>
        module.lessons.some(l => l.id === ls.id)
      );
      const avgCompletion = moduleLessonStats.length > 0
        ? Math.round(moduleLessonStats.reduce((sum, ls) => sum + ls.completionRate, 0) / moduleLessonStats.length)
        : 0;

      return {
        id: module.id,
        title: module.title,
        order: module.order,
        lessonCount: module.lessons.length,
        avgCompletionRate: avgCompletion,
        lessons: moduleLessonStats
      };
    });

    // Format enrollments for response
    const enrollmentsList = course.enrollments.map(e => ({
      id: e.id,
      user: {
        id: e.user.id,
        name: e.user.name,
        email: e.user.email,
        avatar: e.user.avatar,
        locations: e.user.locations.map(ul => ul.location.name)
      },
      status: e.status,
      progress: e.progress,
      lessonsCompleted: e.lessonProgress.filter(lp => lp.isCompleted).length,
      totalLessons: allLessons.length,
      enrolledAt: e.createdAt,
      lastAccessedAt: e.lastAccessedAt,
      completedAt: e.completedAt,
      daysSinceEnrollment: Math.ceil(
        (new Date().getTime() - e.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      ),
      daysSinceActivity: e.lastAccessedAt
        ? Math.ceil(
            (new Date().getTime() - e.lastAccessedAt.getTime()) / (1000 * 60 * 60 * 24)
          )
        : null
    }));

    // Identify drop-off points (lessons with significantly lower completion)
    const avgLessonCompletion = lessonStats.length > 0
      ? lessonStats.reduce((sum, ls) => sum + ls.completionRate, 0) / lessonStats.length
      : 0;

    const dropOffLessons = lessonStats.filter(
      ls => ls.completionRate < avgLessonCompletion * 0.7 && ls.completionRate < 50
    );

    return NextResponse.json({
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        coverImage: course.coverImage,
        difficulty: course.difficulty,
        duration: course.duration,
        isPublished: course.isPublished,
        category: course.category
      },
      stats: {
        totalEnrollments,
        activeEnrollments,
        completedEnrollments,
        pausedEnrollments,
        recentEnrollments,
        completionRate,
        avgProgress,
        avgDaysToComplete,
        totalLessons: allLessons.length,
        totalModules: course.modules.length
      },
      moduleStats,
      dropOffLessons,
      enrollments: enrollmentsList
    });
  } catch (error) {
    console.error('Error fetching course details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course details' },
      { status: 500 }
    );
  }
}
