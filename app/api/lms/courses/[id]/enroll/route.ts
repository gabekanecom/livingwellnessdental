import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        allowedRoles: {
          select: { roleId: true }
        }
      }
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    if (course.restrictByRole && course.allowedRoles.length > 0) {
      const userRoles = await prisma.userRole.findMany({
        where: {
          userId,
          isActive: true
        },
        select: { roleId: true }
      });

      const userRoleIds = userRoles.map(ur => ur.roleId);
      const allowedRoleIds = course.allowedRoles.map(ar => ar.roleId);
      
      const hasAccess = userRoleIds.some(roleId => allowedRoleIds.includes(roleId));
      
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'You do not have permission to enroll in this course' },
          { status: 403 }
        );
      }
    }

    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: id
        }
      }
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'Already enrolled in this course' },
        { status: 400 }
      );
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId: id,
        status: 'ACTIVE',
        progress: 0
      },
      include: {
        course: true
      }
    });

    return NextResponse.json({
      data: enrollment,
      message: 'Successfully enrolled in course'
    });
  } catch (error) {
    console.error('Error enrolling in course:', error);
    return NextResponse.json(
      { error: 'Failed to enroll in course' },
      { status: 500 }
    );
  }
}
