import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const categories = await prisma.courseCategory.findMany({
      include: {
        _count: {
          select: {
            courses: true
          }
        }
      },
      orderBy: [
        { order: 'asc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, icon, color } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const lastCategory = await prisma.courseCategory.findFirst({
      orderBy: { order: 'desc' }
    });

    const category = await prisma.courseCategory.create({
      data: {
        name,
        slug,
        description,
        icon,
        color: color || '#6366f1',
        order: (lastCategory?.order || 0) + 1
      }
    });

    return NextResponse.json({
      data: category,
      message: 'Category created successfully'
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
