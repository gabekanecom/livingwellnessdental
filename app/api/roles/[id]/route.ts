import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        userType: true,
        permissions: {
          include: { permission: true }
        },
        _count: {
          select: { userRoles: { where: { isActive: true } } }
        }
      }
    });

    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ role });
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json(
      { error: 'Failed to fetch role' },
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
    const { name, description, dataScope, isDefault, isActive, displayOrder } = body;

    const existingRole = await prisma.role.findUnique({
      where: { id }
    });

    if (existingRole?.isProtected) {
      return NextResponse.json(
        { error: 'Cannot modify a protected role' },
        { status: 403 }
      );
    }

    const role = await prisma.role.update({
      where: { id },
      data: {
        name,
        description,
        dataScope,
        isDefault,
        isActive,
        displayOrder
      },
      include: { userType: true }
    });

    return NextResponse.json({
      data: role,
      message: 'Role updated successfully'
    });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { error: 'Failed to update role' },
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
    const existingRole = await prisma.role.findUnique({
      where: { id }
    });

    if (existingRole?.isProtected) {
      return NextResponse.json(
        { error: 'Cannot delete a protected role' },
        { status: 403 }
      );
    }

    const usersWithRole = await prisma.userRole.count({
      where: { roleId: id, isActive: true }
    });

    if (usersWithRole > 0) {
      return NextResponse.json(
        { error: 'Cannot delete role with active assignments. Remove assignments first.' },
        { status: 400 }
      );
    }

    await prisma.role.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { error: 'Failed to delete role' },
      { status: 500 }
    );
  }
}
