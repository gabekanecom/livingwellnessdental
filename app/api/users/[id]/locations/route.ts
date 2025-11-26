import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userLocations = await prisma.userLocation.findMany({
      where: { userId: id },
      include: { location: true },
      orderBy: [{ isPrimary: 'desc' }, { location: { name: 'asc' } }]
    });

    return NextResponse.json({ userLocations });
  } catch (error) {
    console.error('Error fetching user locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user locations' },
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
    const { locationId, isPrimary } = body;

    if (!locationId) {
      return NextResponse.json(
        { error: 'Location ID is required' },
        { status: 400 }
      );
    }

    if (isPrimary) {
      await prisma.userLocation.updateMany({
        where: { userId: id },
        data: { isPrimary: false }
      });
    }

    const existing = await prisma.userLocation.findFirst({
      where: { userId: id, locationId }
    });

    if (existing) {
      const updated = await prisma.userLocation.update({
        where: { id: existing.id },
        data: { isActive: true, isPrimary },
        include: { location: true }
      });

      return NextResponse.json({
        data: updated,
        message: 'Location assignment updated'
      });
    }

    const userLocation = await prisma.userLocation.create({
      data: {
        userId: id,
        locationId,
        isPrimary: isPrimary || false
      },
      include: { location: true }
    });

    return NextResponse.json({
      data: userLocation,
      message: 'Location assigned successfully'
    });
  } catch (error) {
    console.error('Error assigning location:', error);
    return NextResponse.json(
      { error: 'Failed to assign location' },
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
    const { locationIds } = body;

    if (!Array.isArray(locationIds)) {
      return NextResponse.json(
        { error: 'Location IDs array is required' },
        { status: 400 }
      );
    }

    await prisma.userLocation.deleteMany({
      where: { userId: id }
    });

    if (locationIds.length > 0) {
      await prisma.userLocation.createMany({
        data: locationIds.map((locId: string, index: number) => ({
          userId: id,
          locationId: locId,
          isPrimary: index === 0
        }))
      });
    }

    const userLocations = await prisma.userLocation.findMany({
      where: { userId: id },
      include: { location: true }
    });

    return NextResponse.json({
      data: userLocations,
      message: 'Locations updated successfully'
    });
  } catch (error) {
    console.error('Error updating locations:', error);
    return NextResponse.json(
      { error: 'Failed to update locations' },
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
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');

    if (!locationId) {
      return NextResponse.json(
        { error: 'Location ID is required' },
        { status: 400 }
      );
    }

    await prisma.userLocation.deleteMany({
      where: {
        userId: id,
        locationId
      }
    });

    return NextResponse.json({
      message: 'Location assignment removed'
    });
  } catch (error) {
    console.error('Error removing location:', error);
    return NextResponse.json(
      { error: 'Failed to remove location' },
      { status: 500 }
    );
  }
}
