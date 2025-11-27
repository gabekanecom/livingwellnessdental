import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        category: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        modules: {
          include: {
            lessons: {
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        },
        allowedRoles: {
          include: {
            role: {
              include: {
                userType: true
              }
            }
          }
        },
        _count: {
          select: {
            enrollments: true
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

    return NextResponse.json({ course });
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      title,
      description,
      shortDescription,
      coverImage,
      difficulty,
      duration,
      learningObjectives,
      prerequisites,
      tags,
      categoryId,
      isPublished,
      isFeatured,
      restrictByRole,
      allowedRoleIds
    } = body;

    await prisma.courseRoleAccess.deleteMany({
      where: { courseId: id }
    });

    const course = await prisma.course.update({
      where: { id },
      data: {
        title,
        description,
        shortDescription,
        coverImage,
        difficulty,
        duration,
        learningObjectives,
        prerequisites,
        tags,
        categoryId,
        isPublished,
        isFeatured,
        restrictByRole: restrictByRole || false,
        allowedRoles: restrictByRole && allowedRoleIds?.length > 0 ? {
          create: allowedRoleIds.map((roleId: string) => ({
            roleId
          }))
        } : undefined
      },
      include: {
        category: true,
        createdBy: true,
        allowedRoles: {
          include: {
            role: true
          }
        }
      }
    });

    return NextResponse.json({
      data: course,
      message: 'Course updated successfully'
    });
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.course.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    );
  }
}
