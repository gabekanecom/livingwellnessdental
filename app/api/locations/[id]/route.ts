import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        users: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                jobTitle: true
              }
            }
          }
        },
        _count: {
          select: {
            users: { where: { isActive: true } }
          }
        }
      }
    });

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ location });
  } catch (error) {
    console.error('Error fetching location:', error);
    return NextResponse.json(
      { error: 'Failed to fetch location' },
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
    const { name, code, address, city, state, zipCode, phone, email, timezone, isActive } = body;

    if (code) {
      const existingLocation = await prisma.location.findFirst({
        where: {
          code,
          NOT: { id }
        }
      });

      if (existingLocation) {
        return NextResponse.json(
          { error: 'A location with this code already exists' },
          { status: 400 }
        );
      }
    }

    const location = await prisma.location.update({
      where: { id },
      data: {
        name,
        code: code?.toUpperCase(),
        address,
        city,
        state,
        zipCode,
        phone,
        email,
        timezone,
        isActive
      }
    });

    return NextResponse.json({
      data: location,
      message: 'Location updated successfully'
    });
  } catch (error) {
    console.error('Error updating location:', error);
    return NextResponse.json(
      { error: 'Failed to update location' },
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
    const usersAtLocation = await prisma.userLocation.count({
      where: { locationId: id, isActive: true }
    });

    if (usersAtLocation > 0) {
      return NextResponse.json(
        { error: 'Cannot delete location with active users. Deactivate instead.' },
        { status: 400 }
      );
    }

    await prisma.location.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Location deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting location:', error);
    return NextResponse.json(
      { error: 'Failed to delete location' },
      { status: 500 }
    );
  }
}
