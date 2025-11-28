import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // Get all enrollments for this user with course and progress details
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            coverImage: true,
            difficulty: true,
            duration: true,
            isPublished: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        lessonProgress: {
          select: {
            isCompleted: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate stats
    const totalEnrollments = enrollments.length;
    const completedEnrollments = enrollments.filter(e => e.status === 'COMPLETED').length;
    const activeEnrollments = enrollments.filter(e => e.status === 'ACTIVE').length;

    // Calculate overall progress
    let totalProgress = 0;
    const enrichedEnrollments = enrollments.map(enrollment => {
      const totalLessons = enrollment.lessonProgress.length;
      const lessonsCompleted = enrollment.lessonProgress.filter(lp => lp.isCompleted).length;
      const progress = Math.round(enrollment.progress);
      totalProgress += progress;

      const daysSinceEnrollment = Math.floor(
        (Date.now() - new Date(enrollment.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      const daysSinceActivity = enrollment.lastAccessedAt
        ? Math.floor(
            (Date.now() - new Date(enrollment.lastAccessedAt).getTime()) / (1000 * 60 * 60 * 24)
          )
        : null;

      return {
        id: enrollment.id,
        status: enrollment.status,
        progress,
        lessonsCompleted,
        totalLessons,
        enrolledAt: enrollment.createdAt,
        lastAccessedAt: enrollment.lastAccessedAt,
        completedAt: enrollment.completedAt,
        daysSinceEnrollment,
        daysSinceActivity,
        course: {
          id: enrollment.course.id,
          title: enrollment.course.title,
          description: enrollment.course.description,
          coverImage: enrollment.course.coverImage,
          difficulty: enrollment.course.difficulty,
          duration: enrollment.course.duration,
          category: enrollment.course.category,
        },
      };
    });

    const avgProgress = totalEnrollments > 0 ? Math.round(totalProgress / totalEnrollments) : 0;

    // Calculate average days to complete for completed courses
    const completedWithDates = enrollments.filter(e => e.status === 'COMPLETED' && e.completedAt);
    const avgDaysToComplete = completedWithDates.length > 0
      ? Math.round(
          completedWithDates.reduce((acc, e) => {
            const days = Math.floor(
              (new Date(e.completedAt!).getTime() - new Date(e.createdAt).getTime()) / (1000 * 60 * 60 * 24)
            );
            return acc + days;
          }, 0) / completedWithDates.length
        )
      : 0;

    return NextResponse.json({
      stats: {
        totalEnrollments,
        completedEnrollments,
        activeEnrollments,
        avgProgress,
        avgDaysToComplete,
        completionRate: totalEnrollments > 0
          ? Math.round((completedEnrollments / totalEnrollments) * 100)
          : 0,
      },
      enrollments: enrichedEnrollments,
    });
  } catch (error) {
    console.error('Error fetching user learning data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learning data' },
      { status: 500 }
    );
  }
}
