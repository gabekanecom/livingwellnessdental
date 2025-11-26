import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userTypeId = searchParams.get('userTypeId');
    const isActive = searchParams.get('isActive');
    const includePermissions = searchParams.get('includePermissions') === 'true';

    const where: any = {};

    if (userTypeId) {
      where.userTypeId = userTypeId;
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const roles = await prisma.role.findMany({
      where,
      include: {
        userType: true,
        ...(includePermissions && {
          permissions: {
            include: { permission: true }
          }
        }),
        _count: {
          select: { userRoles: { where: { isActive: true } } }
        }
      },
      orderBy: [{ userType: { hierarchyLevel: 'asc' } }, { name: 'asc' }]
    });

    return NextResponse.json({ roles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, userTypeId, dataScope, isDefault, displayOrder } = body;

    if (!id || !name || !userTypeId) {
      return NextResponse.json(
        { error: 'ID, name, and user type are required' },
        { status: 400 }
      );
    }

    const existingRole = await prisma.role.findUnique({
      where: { id }
    });

    if (existingRole) {
      return NextResponse.json(
        { error: 'A role with this ID already exists' },
        { status: 400 }
      );
    }

    const role = await prisma.role.create({
      data: {
        id,
        name,
        description,
        userTypeId,
        dataScope: dataScope || 'LOCATION',
        isDefault: isDefault || false,
        displayOrder: displayOrder || 0
      },
      include: { userType: true }
    });

    return NextResponse.json({
      data: role,
      message: 'Role created successfully'
    });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 }
    );
  }
}
