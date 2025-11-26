import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userType = await prisma.userType.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            permissions: {
              include: { permission: true }
            },
            _count: {
              select: { userRoles: { where: { isActive: true } } }
            }
          },
          orderBy: { displayOrder: 'asc' }
        }
      }
    });

    if (!userType) {
      return NextResponse.json(
        { error: 'User type not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ userType });
  } catch (error) {
    console.error('Error fetching user type:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user type' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, displayOrder, isActive } = body;

    const userType = await prisma.userType.update({
      where: { id },
      data: {
        name,
        description,
        displayOrder,
        isActive
      }
    });

    return NextResponse.json({
      data: userType,
      message: 'User type updated successfully'
    });
  } catch (error) {
    console.error('Error updating user type:', error);
    return NextResponse.json(
      { error: 'Failed to update user type' },
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
    const rolesCount = await prisma.role.count({
      where: { userTypeId: id }
    });

    if (rolesCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete user type with existing roles. Delete roles first.' },
        { status: 400 }
      );
    }

    await prisma.userType.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'User type deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user type:', error);
    return NextResponse.json(
      { error: 'Failed to delete user type' },
      { status: 500 }
    );
  }
}
