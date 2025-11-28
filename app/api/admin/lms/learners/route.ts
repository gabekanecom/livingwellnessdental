import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const courseId = searchParams.get('courseId') || '';
    const locationId = searchParams.get('locationId') || '';
    const completionStatus = searchParams.get('completionStatus') || ''; // all, completed, in_progress, not_started
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    const skip = (page - 1) * limit;

    // Build user filter
    const userWhere: any = {
      isActive: true,
    };

    if (search) {
      userWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (locationId) {
      userWhere.locations = {
        some: {
          locationId,
          isActive: true,
        },
      };
    }

    // Get users with their enrollments
    const users = await prisma.user.findMany({
      where: userWhere,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        jobTitle: true,
        locations: {
          where: { isActive: true },
          select: {
            location: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        enrollments: {
          where: courseId ? { courseId } : {},
          select: {
            id: true,
            status: true,
            progress: true,
            createdAt: true,
            lastAccessedAt: true,
            completedAt: true,
            course: {
              select: {
                id: true,
                title: true,
              },
            },
            lessonProgress: {
              select: {
                isCompleted: true,
              },
            },
          },
        },
      },
      skip,
      take: limit,
      orderBy: sortBy === 'name'
        ? { name: sortOrder as 'asc' | 'desc' }
        : sortBy === 'email'
        ? { email: sortOrder as 'asc' | 'desc' }
        : { name: 'asc' },
    });

    // Process users to calculate stats
    const processedUsers = users.map(user => {
      const enrollmentDetails = user.enrollments.map(enrollment => {
        const totalLessons = enrollment.lessonProgress.length;
        const lessonsCompleted = enrollment.lessonProgress.filter(lp => lp.isCompleted).length;

        return {
          id: enrollment.id,
          courseId: enrollment.course.id,
          courseTitle: enrollment.course.title,
          status: enrollment.status,
          progress: Math.round(enrollment.progress),
          lessonsCompleted,
          totalLessons,
          enrolledAt: enrollment.createdAt,
          lastAccessedAt: enrollment.lastAccessedAt,
          completedAt: enrollment.completedAt,
        };
      });

      const totalEnrollments = enrollmentDetails.length;
      const completedCourses = enrollmentDetails.filter(e => e.status === 'COMPLETED').length;
      const activeCourses = enrollmentDetails.filter(e => e.status === 'ACTIVE').length;
      const avgProgress = totalEnrollments > 0
        ? Math.round(enrollmentDetails.reduce((acc, e) => acc + e.progress, 0) / totalEnrollments)
        : 0;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        jobTitle: user.jobTitle,
        locations: user.locations.map(l => l.location.name),
        totalEnrollments,
        completedCourses,
        activeCourses,
        avgProgress,
        enrollments: enrollmentDetails,
      };
    });

    // Filter by completion status if specified
    let filteredUsers = processedUsers;
    if (completionStatus === 'completed') {
      filteredUsers = processedUsers.filter(u => u.completedCourses > 0);
    } else if (completionStatus === 'in_progress') {
      filteredUsers = processedUsers.filter(u => u.activeCourses > 0 && u.avgProgress > 0);
    } else if (completionStatus === 'not_started') {
      filteredUsers = processedUsers.filter(u => u.totalEnrollments === 0 || u.avgProgress === 0);
    }

    // Sort by progress if requested
    if (sortBy === 'progress') {
      filteredUsers.sort((a, b) => {
        const comparison = a.avgProgress - b.avgProgress;
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    } else if (sortBy === 'enrollments') {
      filteredUsers.sort((a, b) => {
        const comparison = a.totalEnrollments - b.totalEnrollments;
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    // Get total count for pagination
    const totalCount = await prisma.user.count({ where: userWhere });

    return NextResponse.json({
      learners: filteredUsers,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching learners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learners' },
      { status: 500 }
    );
  }
}
