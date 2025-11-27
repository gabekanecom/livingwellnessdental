import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: {
        course: {
          include: {
            category: true,
            modules: {
              include: {
                lessons: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        lessonProgress: true
      }
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ enrollment });
  } catch (error) {
    console.error('Error fetching enrollment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enrollment' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, progress } = body;

    const updateData: any = {};

    if (status) {
      updateData.status = status;
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
      }
    }

    if (typeof progress === 'number') {
      updateData.progress = progress;
    }

    const enrollment = await prisma.enrollment.update({
      where: { id },
      data: updateData,
      include: {
        course: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({ enrollment });
  } catch (error) {
    console.error('Error updating enrollment:', error);
    return NextResponse.json(
      { error: 'Failed to update enrollment' },
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

    // First delete related lesson progress records
    await prisma.lessonProgress.deleteMany({
      where: { enrollmentId: id }
    });

    // Then delete the enrollment
    await prisma.enrollment.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Enrollment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting enrollment:', error);
    return NextResponse.json(
      { error: 'Failed to delete enrollment' },
      { status: 500 }
    );
  }
}
