import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const courseId = searchParams.get('courseId');
    const status = searchParams.get('status');
    const locationId = searchParams.get('locationId');
    const sortBy = searchParams.get('sortBy') || 'enrolledAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { course: { title: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (courseId) {
      where.courseId = courseId;
    }

    if (status) {
      where.status = status;
    }

    if (locationId) {
      where.user = {
        ...where.user,
        locations: {
          some: {
            locationId,
            isActive: true
          }
        }
      };
    }

    // Build orderBy
    let orderBy: any = {};
    switch (sortBy) {
      case 'enrolledAt':
        orderBy = { createdAt: sortOrder };
        break;
      case 'progress':
        orderBy = { progress: sortOrder };
        break;
      case 'lastActivity':
        orderBy = { lastAccessedAt: sortOrder };
        break;
      case 'userName':
        orderBy = { user: { name: sortOrder } };
        break;
      case 'courseName':
        orderBy = { course: { title: sortOrder } };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where,
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
              },
              userRoles: {
                where: { isActive: true },
                include: { role: true }
              }
            }
          },
          course: {
            select: {
              id: true,
              title: true,
              coverImage: true,
              duration: true
            }
          },
          lessonProgress: {
            select: {
              isCompleted: true
            }
          }
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.enrollment.count({ where })
    ]);

    // Calculate additional fields
    const enrichedEnrollments = enrollments.map(enrollment => {
      const lessonsCompleted = enrollment.lessonProgress.filter(lp => lp.isCompleted).length;
      const totalLessons = enrollment.lessonProgress.length;
      const daysSinceEnrollment = Math.ceil(
        (new Date().getTime() - enrollment.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      const daysSinceActivity = enrollment.lastAccessedAt
        ? Math.ceil(
            (new Date().getTime() - enrollment.lastAccessedAt.getTime()) / (1000 * 60 * 60 * 24)
          )
        : null;

      return {
        id: enrollment.id,
        user: {
          id: enrollment.user.id,
          name: enrollment.user.name,
          email: enrollment.user.email,
          avatar: enrollment.user.avatar,
          locations: enrollment.user.locations.map(ul => ul.location.name),
          roles: enrollment.user.userRoles.map(ur => ur.role.name)
        },
        course: enrollment.course,
        status: enrollment.status,
        progress: enrollment.progress,
        lessonsCompleted,
        totalLessons,
        enrolledAt: enrollment.createdAt,
        lastAccessedAt: enrollment.lastAccessedAt,
        completedAt: enrollment.completedAt,
        daysSinceEnrollment,
        daysSinceActivity
      };
    });

    return NextResponse.json({
      enrollments: enrichedEnrollments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching admin enrollments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enrollments' },
      { status: 500 }
    );
  }
}
