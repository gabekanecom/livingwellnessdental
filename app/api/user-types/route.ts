import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const includeRoles = searchParams.get('includeRoles') === 'true';

    const where: any = {};

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const userTypes = await prisma.userType.findMany({
      where,
      include: includeRoles ? {
        roles: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' }
        }
      } : undefined,
      orderBy: { hierarchyLevel: 'asc' }
    });

    return NextResponse.json({ userTypes });
  } catch (error) {
    console.error('Error fetching user types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user types' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, hierarchyLevel, isActive } = body;

    if (!id || !name) {
      return NextResponse.json(
        { error: 'ID and name are required' },
        { status: 400 }
      );
    }

    const existingUserType = await prisma.userType.findUnique({
      where: { id }
    });

    if (existingUserType) {
      return NextResponse.json(
        { error: 'A user type with this ID already exists' },
        { status: 400 }
      );
    }

    const userType = await prisma.userType.create({
      data: {
        id,
        name,
        description,
        hierarchyLevel: hierarchyLevel ?? 0,
        isActive: isActive ?? true
      }
    });

    return NextResponse.json({
      data: userType,
      message: 'User type created successfully'
    });
  } catch (error) {
    console.error('Error creating user type:', error);
    return NextResponse.json(
      { error: 'Failed to create user type' },
      { status: 500 }
    );
  }
}
