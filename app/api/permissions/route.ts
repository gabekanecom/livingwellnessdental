import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const permissions = await prisma.permission.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    });

    const categories = await prisma.permission.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: { id: true }
    });

    return NextResponse.json({
      permissions,
      categories: categories.map(c => ({
        name: c.category,
        count: c._count.id
      }))
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, category } = body;

    if (!id || !name) {
      return NextResponse.json(
        { error: 'ID and name are required' },
        { status: 400 }
      );
    }

    const existingPermission = await prisma.permission.findUnique({
      where: { id }
    });

    if (existingPermission) {
      return NextResponse.json(
        { error: 'A permission with this ID already exists' },
        { status: 400 }
      );
    }

    const permission = await prisma.permission.create({
      data: {
        id,
        name,
        description,
        category
      }
    });

    return NextResponse.json({
      data: permission,
      message: 'Permission created successfully'
    });
  } catch (error) {
    console.error('Error creating permission:', error);
    return NextResponse.json(
      { error: 'Failed to create permission' },
      { status: 500 }
    );
  }
}
