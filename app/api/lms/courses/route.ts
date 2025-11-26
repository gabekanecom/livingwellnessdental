import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const difficulty = searchParams.get('difficulty');
    const isPublished = searchParams.get('isPublished');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (difficulty) {
      where.difficulty = difficulty.toUpperCase();
    }

    if (isPublished !== null) {
      where.isPublished = isPublished === 'true';
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          category: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              modules: true,
              enrollments: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset
      }),
      prisma.course.count({ where })
    ]);

    return NextResponse.json({
      courses,
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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
      createdById,
      isPublished,
      isFeatured
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();

    const course = await prisma.course.create({
      data: {
        title,
        slug,
        description,
        shortDescription,
        coverImage,
        difficulty: difficulty || 'BEGINNER',
        duration,
        learningObjectives: learningObjectives || [],
        prerequisites: prerequisites || [],
        tags: tags || [],
        categoryId: categoryId || null,
        createdById: createdById || null,
        isPublished: isPublished || false,
        isFeatured: isFeatured || false
      },
      include: {
        category: true,
        createdBy: true
      }
    });

    return NextResponse.json({
      data: course,
      message: 'Course created successfully'
    });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
}
