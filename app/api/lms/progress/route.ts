import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const enrollmentId = searchParams.get('enrollmentId');
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');

    if (enrollmentId) {
      const enrollment = await prisma.enrollment.findUnique({
        where: { id: enrollmentId },
        include: {
          lessonProgress: {
            include: {
              lesson: true
            }
          },
          course: {
            include: {
              modules: {
                include: {
                  lessons: true
                }
              }
            }
          }
        }
      });

      if (!enrollment) {
        return NextResponse.json(
          { error: 'Enrollment not found' },
          { status: 404 }
        );
      }

      const totalLessons = enrollment.course.modules.reduce(
        (sum, module) => sum + module.lessons.length,
        0
      );
      const completedLessons = enrollment.lessonProgress.filter(
        (p) => p.isCompleted
      ).length;
      const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

      return NextResponse.json({
        enrollment,
        progress: {
          totalLessons,
          completedLessons,
          percentage: Math.round(progress)
        }
      });
    }

    if (userId && courseId) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId
          }
        },
        include: {
          lessonProgress: true
        }
      });

      return NextResponse.json({ enrollment });
    }

    return NextResponse.json(
      { error: 'Enrollment ID or User ID and Course ID are required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { enrollmentId, lessonId, isCompleted, timeSpent } = body;

    if (!enrollmentId || !lessonId) {
      return NextResponse.json(
        { error: 'Enrollment ID and Lesson ID are required' },
        { status: 400 }
      );
    }

    const lessonProgress = await prisma.lessonProgress.upsert({
      where: {
        enrollmentId_lessonId: {
          enrollmentId,
          lessonId
        }
      },
      update: {
        isCompleted: isCompleted ?? false,
        completedAt: isCompleted ? new Date() : null,
        timeSpent: timeSpent ?? 0
      },
      create: {
        enrollmentId,
        lessonId,
        isCompleted: isCompleted ?? false,
        completedAt: isCompleted ? new Date() : null,
        timeSpent: timeSpent ?? 0
      }
    });

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        lessonProgress: true,
        course: {
          include: {
            modules: {
              include: {
                lessons: true
              }
            }
          }
        }
      }
    });

    if (enrollment) {
      const totalLessons = enrollment.course.modules.reduce(
        (sum, module) => sum + module.lessons.length,
        0
      );
      const completedLessons = enrollment.lessonProgress.filter(
        (p) => p.isCompleted
      ).length;
      const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

      await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: {
          progress,
          lastAccessedAt: new Date(),
          completedAt: progress >= 100 ? new Date() : null,
          status: progress >= 100 ? 'COMPLETED' : 'ACTIVE'
        }
      });
    }

    return NextResponse.json({
      data: lessonProgress,
      message: 'Progress updated successfully'
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}
