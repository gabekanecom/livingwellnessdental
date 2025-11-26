import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const modules = await prisma.courseModule.findMany({
      where: { courseId: id },
      include: {
        lessons: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json({ modules });
  } catch (error) {
    console.error('Error fetching modules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch modules' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const lastModule = await prisma.courseModule.findFirst({
      where: { courseId: id },
      orderBy: { order: 'desc' }
    });

    const module = await prisma.courseModule.create({
      data: {
        courseId: id,
        title,
        description,
        order: (lastModule?.order || 0) + 1
      }
    });

    return NextResponse.json({
      data: module,
      message: 'Module created successfully'
    });
  } catch (error) {
    console.error('Error creating module:', error);
    return NextResponse.json(
      { error: 'Failed to create module' },
      { status: 500 }
    );
  }
}
