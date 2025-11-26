import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId: id },
      include: { permission: true }
    });

    return NextResponse.json({ rolePermissions });
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch role permissions' },
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
    const { permissionIds } = body;

    if (!Array.isArray(permissionIds)) {
      return NextResponse.json(
        { error: 'Permission IDs array is required' },
        { status: 400 }
      );
    }

    const existingRole = await prisma.role.findUnique({
      where: { id }
    });

    if (existingRole?.isProtected) {
      return NextResponse.json(
        { error: 'Cannot modify permissions for a protected role' },
        { status: 403 }
      );
    }

    await prisma.rolePermission.deleteMany({
      where: { roleId: id }
    });

    if (permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map((permId: string) => ({
          roleId: id,
          permissionId: permId,
          granted: true
        }))
      });
    }

    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId: id },
      include: { permission: true }
    });

    return NextResponse.json({
      data: rolePermissions,
      message: 'Role permissions updated successfully'
    });
  } catch (error) {
    console.error('Error updating role permissions:', error);
    return NextResponse.json(
      { error: 'Failed to update role permissions' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { permissionId, granted } = body;

    if (!permissionId) {
      return NextResponse.json(
        { error: 'Permission ID is required' },
        { status: 400 }
      );
    }

    const existing = await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId: id,
          permissionId
        }
      }
    });

    if (existing) {
      const updated = await prisma.rolePermission.update({
        where: { id: existing.id },
        data: { granted: granted !== false },
        include: { permission: true }
      });

      return NextResponse.json({
        data: updated,
        message: 'Permission updated'
      });
    }

    const rolePermission = await prisma.rolePermission.create({
      data: {
        roleId: id,
        permissionId,
        granted: granted !== false
      },
      include: { permission: true }
    });

    return NextResponse.json({
      data: rolePermission,
      message: 'Permission assigned successfully'
    });
  } catch (error) {
    console.error('Error assigning permission:', error);
    return NextResponse.json(
      { error: 'Failed to assign permission' },
      { status: 500 }
    );
  }
}
