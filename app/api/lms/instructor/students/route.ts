import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const instructorId = searchParams.get('instructorId');
    const courseId = searchParams.get('courseId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'recent';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const courseFilter = courseId 
      ? { courseId }
      : instructorId 
        ? { course: { createdById: instructorId } }
        : {};

    const statusFilter = status ? { status: status as 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'CANCELLED' } : {};

    const searchFilter = search ? {
      user: {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } }
        ]
      }
    } : {};

    const orderBy = sortBy === 'progress' 
      ? { progress: 'desc' as const }
      : sortBy === 'name'
        ? { user: { name: 'asc' as const } }
        : { createdAt: 'desc' as const };

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where: {
          ...courseFilter,
          ...statusFilter,
          ...searchFilter
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
              title: true,
              coverImage: true,
              modules: {
                select: {
                  lessons: {
                    select: { id: true }
                  }
                }
              }
            }
          },
          lessonProgress: {
            where: { isCompleted: true }
          },
          quizAttempts: {
            orderBy: { createdAt: 'desc' },
            take: 5
          },
          certificate: true
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.enrollment.count({
        where: {
          ...courseFilter,
          ...statusFilter,
          ...searchFilter
        }
      })
    ]);

    const students = enrollments.map(e => {
      const totalLessons = e.course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
      const completedLessons = e.lessonProgress.length;
      
      return {
        id: e.id,
        user: e.user,
        course: {
          id: e.course.id,
          title: e.course.title,
          coverImage: e.course.coverImage
        },
        status: e.status,
        progress: e.progress,
        completedLessons,
        totalLessons,
        lastAccessedAt: e.lastAccessedAt,
        enrolledAt: e.createdAt,
        completedAt: e.completedAt,
        hasCertificate: !!e.certificate,
        recentQuizzes: e.quizAttempts.map(q => ({
          score: q.score,
          passed: q.passed,
          date: q.createdAt
        }))
      };
    });

    return NextResponse.json({
      students,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}
