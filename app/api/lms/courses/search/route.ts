import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '5');

    if (!q || q.length < 2) {
      return NextResponse.json({ courses: [] });
    }

    const courses = await prisma.course.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { shortDescription: { contains: q, mode: 'insensitive' } },
          { category: { name: { contains: q, mode: 'insensitive' } } }
        ]
      },
      select: {
        id: true,
        title: true,
        shortDescription: true,
        coverImage: true,
        difficulty: true,
        duration: true,
        category: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        _count: {
          select: { enrollments: true }
        }
      },
      take: limit,
      orderBy: [
        { isFeatured: 'desc' },
        { enrollments: { _count: 'desc' } }
      ]
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Error searching courses:', error);
    return NextResponse.json(
      { error: 'Failed to search courses' },
      { status: 500 }
    );
  }
}
