import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const { moduleId } = await params;
    const lessons = await prisma.lesson.findMany({
      where: { moduleId },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json({ lessons });
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lessons' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const { moduleId } = await params;
    const body = await request.json();
    const { title, content, lessonType, duration, videoUrl, attachments } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const lastLesson = await prisma.lesson.findFirst({
      where: { moduleId },
      orderBy: { order: 'desc' }
    });

    const lesson = await prisma.lesson.create({
      data: {
        moduleId,
        title,
        content,
        lessonType: lessonType || 'TEXT',
        duration,
        videoUrl,
        attachments: attachments || [],
        order: (lastLesson?.order || 0) + 1
      }
    });

    return NextResponse.json({
      data: lesson,
      message: 'Lesson created successfully'
    });
  } catch (error) {
    console.error('Error creating lesson:', error);
    return NextResponse.json(
      { error: 'Failed to create lesson' },
      { status: 500 }
    );
  }
}
