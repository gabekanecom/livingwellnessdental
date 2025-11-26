import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userRoles = await prisma.userRole.findMany({
      where: { userId: id },
      include: {
        role: { include: { userType: true } },
        location: true,
        assignedBy: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ userRoles });
  } catch (error) {
    console.error('Error fetching user roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user roles' },
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
    const { roleId, locationId, assignedById, expiresAt } = body;

    if (!roleId) {
      return NextResponse.json(
        { error: 'Role ID is required' },
        { status: 400 }
      );
    }

    const existing = await prisma.userRole.findFirst({
      where: {
        userId: id,
        roleId,
        locationId: locationId || null
      }
    });

    if (existing) {
      const updated = await prisma.userRole.update({
        where: { id: existing.id },
        data: { isActive: true, expiresAt },
        include: { role: true, location: true }
      });

      return NextResponse.json({
        data: updated,
        message: 'Role assignment reactivated'
      });
    }

    const userRole = await prisma.userRole.create({
      data: {
        userId: id,
        roleId,
        locationId,
        assignedById,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined
      },
      include: {
        role: { include: { userType: true } },
        location: true
      }
    });

    return NextResponse.json({
      data: userRole,
      message: 'Role assigned successfully'
    });
  } catch (error) {
    console.error('Error assigning role:', error);
    return NextResponse.json(
      { error: 'Failed to assign role' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userRoleId = searchParams.get('userRoleId');

    if (!userRoleId) {
      return NextResponse.json(
        { error: 'User role ID is required' },
        { status: 400 }
      );
    }

    await prisma.userRole.update({
      where: { id: userRoleId },
      data: { isActive: false }
    });

    return NextResponse.json({
      message: 'Role assignment removed'
    });
  } catch (error) {
    console.error('Error removing role:', error);
    return NextResponse.json(
      { error: 'Failed to remove role' },
      { status: 500 }
    );
  }
}
