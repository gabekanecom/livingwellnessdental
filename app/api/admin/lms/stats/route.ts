import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = parseInt(searchParams.get('period') || '30'); // days
    const locationId = searchParams.get('locationId');

    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - period);

    // Base filter for enrollments
    const enrollmentFilter: any = {};
    if (locationId) {
      enrollmentFilter.user = {
        locations: {
          some: {
            locationId,
            isActive: true
          }
        }
      };
    }

    // Get overall stats
    const [
      totalEnrollments,
      activeEnrollments,
      completedEnrollments,
      totalCourses,
      recentEnrollments,
      enrollmentsByStatus
    ] = await Promise.all([
      // Total enrollments
      prisma.enrollment.count({ where: enrollmentFilter }),

      // Active enrollments
      prisma.enrollment.count({
        where: { ...enrollmentFilter, status: 'ACTIVE' }
      }),

      // Completed enrollments
      prisma.enrollment.count({
        where: { ...enrollmentFilter, status: 'COMPLETED' }
      }),

      // Total published courses
      prisma.course.count({
        where: { isPublished: true }
      }),

      // Enrollments in period
      prisma.enrollment.count({
        where: {
          ...enrollmentFilter,
          createdAt: { gte: periodStart }
        }
      }),

      // Enrollments grouped by status
      prisma.enrollment.groupBy({
        by: ['status'],
        _count: true,
        where: enrollmentFilter
      })
    ]);

    // Calculate completion rate
    const completionRate = totalEnrollments > 0
      ? Math.round((completedEnrollments / totalEnrollments) * 100)
      : 0;

    // Thresholds for stalled learners
    const stalledThreshold = new Date();
    stalledThreshold.setDate(stalledThreshold.getDate() - 14);
    const inactiveThreshold = new Date();
    inactiveThreshold.setDate(inactiveThreshold.getDate() - 7);

    // Run all remaining queries in parallel
    const [
      avgProgressResult,
      completedWithDates,
      enrollmentTrend,
      coursePerformance,
      stalledLearners,
      recentEnrollmentsList
    ] = await Promise.all([
      // Average progress for active enrollments
      prisma.enrollment.aggregate({
        _avg: { progress: true },
        where: { ...enrollmentFilter, status: 'ACTIVE' }
      }),

      // Completed enrollments for avg days calculation
      prisma.enrollment.findMany({
        where: {
          ...enrollmentFilter,
          status: 'COMPLETED',
          completedAt: { not: null }
        },
        select: {
          createdAt: true,
          completedAt: true
        },
        take: 100,
        orderBy: { completedAt: 'desc' }
      }),

      // Enrollment trend
      getEnrollmentTrend(period, locationId),

      // Course performance
      prisma.course.findMany({
        where: { isPublished: true },
        select: {
          id: true,
          title: true,
          coverImage: true,
          _count: {
            select: { enrollments: true }
          },
          enrollments: {
            select: {
              progress: true,
              status: true,
              createdAt: true
            },
            where: enrollmentFilter.user ? { user: enrollmentFilter.user } : undefined
          }
        },
        orderBy: { createdAt: 'desc' }
      }),

      // Stalled learners
      prisma.enrollment.findMany({
        where: {
          ...enrollmentFilter,
          status: 'ACTIVE',
          progress: { lt: 50 },
          createdAt: { lt: stalledThreshold },
          OR: [
            { lastAccessedAt: { lt: inactiveThreshold } },
            { lastAccessedAt: null }
          ]
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          },
          course: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: { createdAt: 'asc' },
        take: 10
      }),

      // Recent enrollments
      prisma.enrollment.findMany({
        where: {
          ...enrollmentFilter,
          createdAt: { gte: periodStart }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          },
          course: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    const avgProgress = Math.round(avgProgressResult._avg.progress || 0);

    // Calculate avg days to complete
    let avgDaysToComplete = 0;
    if (completedWithDates.length > 0) {
      const totalDays = completedWithDates.reduce((sum, e) => {
        if (e.completedAt) {
          const days = Math.ceil(
            (e.completedAt.getTime() - e.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          );
          return sum + days;
        }
        return sum;
      }, 0);
      avgDaysToComplete = Math.round(totalDays / completedWithDates.length);
    }

    // Process course stats
    const courseStats = coursePerformance.map(course => {
      const enrollments = course.enrollments;
      const totalEnrolled = enrollments.length;
      const completed = enrollments.filter(e => e.status === 'COMPLETED').length;
      const courseAvgProgress = totalEnrolled > 0
        ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / totalEnrolled)
        : 0;
      const courseCompletionRate = totalEnrolled > 0
        ? Math.round((completed / totalEnrolled) * 100)
        : 0;
      const courseRecentEnrollments = enrollments.filter(
        e => e.createdAt >= periodStart
      ).length;

      return {
        id: course.id,
        title: course.title,
        coverImage: course.coverImage,
        totalEnrollments: totalEnrolled,
        recentEnrollments: courseRecentEnrollments,
        avgProgress: courseAvgProgress,
        completionRate: courseCompletionRate,
        completedCount: completed
      };
    }).sort((a, b) => b.totalEnrollments - a.totalEnrollments);

    // Format stalled learners
    const stalledLearnersFormatted = stalledLearners.map(e => ({
      id: e.id,
      user: e.user,
      course: e.course,
      progress: e.progress,
      enrolledAt: e.createdAt,
      lastAccessedAt: e.lastAccessedAt,
      daysSinceEnrollment: Math.ceil(
        (new Date().getTime() - e.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      ),
      daysSinceActivity: e.lastAccessedAt
        ? Math.ceil(
            (new Date().getTime() - e.lastAccessedAt.getTime()) / (1000 * 60 * 60 * 24)
          )
        : null
    }));

    return NextResponse.json({
      overview: {
        totalEnrollments,
        activeEnrollments,
        completedEnrollments,
        totalCourses,
        recentEnrollments,
        completionRate,
        avgProgress,
        avgDaysToComplete
      },
      enrollmentsByStatus: enrollmentsByStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
      enrollmentTrend,
      courseStats,
      stalledLearners: stalledLearnersFormatted,
      recentEnrollments: recentEnrollmentsList.map(e => ({
        id: e.id,
        user: e.user,
        course: e.course,
        progress: e.progress,
        status: e.status,
        enrolledAt: e.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching admin LMS stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch LMS statistics' },
      { status: 500 }
    );
  }
}

async function getEnrollmentTrend(days: number, locationId?: string | null) {
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - days);
  periodStart.setHours(0, 0, 0, 0);

  const userFilter = locationId ? {
    user: {
      locations: {
        some: {
          locationId,
          isActive: true
        }
      }
    }
  } : {};

  // Fetch all enrollments and completions in the period with just 2 queries
  const [enrollments, completions] = await Promise.all([
    prisma.enrollment.findMany({
      where: {
        ...userFilter,
        createdAt: { gte: periodStart }
      },
      select: { createdAt: true }
    }),
    prisma.enrollment.findMany({
      where: {
        ...userFilter,
        completedAt: { gte: periodStart }
      },
      select: { completedAt: true }
    })
  ]);

  // Create a map for each day
  const dayMap = new Map<string, { enrollments: number; completions: number }>();

  // Initialize all days in the period
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    dayMap.set(dateKey, { enrollments: 0, completions: 0 });
  }

  // Count enrollments per day
  for (const e of enrollments) {
    const dateKey = e.createdAt.toISOString().split('T')[0];
    const day = dayMap.get(dateKey);
    if (day) {
      day.enrollments++;
    }
  }

  // Count completions per day
  for (const c of completions) {
    if (c.completedAt) {
      const dateKey = c.completedAt.toISOString().split('T')[0];
      const day = dayMap.get(dateKey);
      if (day) {
        day.completions++;
      }
    }
  }

  // Convert map to sorted array
  return Array.from(dayMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, counts]) => ({
      date,
      enrollments: counts.enrollments,
      completions: counts.completions
    }));
}
