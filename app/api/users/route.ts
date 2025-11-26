import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const locationId = searchParams.get('locationId');
    const roleId = searchParams.get('roleId');
    const isActive = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (locationId) {
      where.locations = {
        some: {
          locationId,
          isActive: true
        }
      };
    }

    if (roleId) {
      where.userRoles = {
        some: {
          roleId,
          isActive: true
        }
      };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          locations: {
            where: { isActive: true },
            include: { location: true }
          },
          userRoles: {
            where: { isActive: true },
            include: {
              role: {
                include: { userType: true }
              },
              location: true
            }
          }
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, jobTitle, avatar, locationIds, roleAssignments } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        jobTitle,
        avatar,
        locations: locationIds?.length ? {
          create: locationIds.map((locId: string, index: number) => ({
            locationId: locId,
            isPrimary: index === 0
          }))
        } : undefined,
        userRoles: roleAssignments?.length ? {
          create: roleAssignments.map((ra: { roleId: string; locationId?: string }) => ({
            roleId: ra.roleId,
            locationId: ra.locationId
          }))
        } : undefined
      },
      include: {
        locations: { include: { location: true } },
        userRoles: { include: { role: true, location: true } }
      }
    });

    return NextResponse.json({
      data: user,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userIds, action } = body;

    if (!userIds?.length || !action) {
      return NextResponse.json(
        { error: 'User IDs and action are required' },
        { status: 400 }
      );
    }

    let updateData: any = {};

    switch (action) {
      case 'activate':
        updateData = { isActive: true };
        break;
      case 'deactivate':
        updateData = { isActive: false };
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: updateData
    });

    return NextResponse.json({
      message: `Users ${action}d successfully`,
      count: userIds.length
    });
  } catch (error) {
    console.error('Error updating users:', error);
    return NextResponse.json(
      { error: 'Failed to update users' },
      { status: 500 }
    );
  }
}
