import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const isActive = searchParams.get('isActive');
    const includeStats = searchParams.get('includeStats') === 'true';

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const locations = await prisma.location.findMany({
      where,
      include: includeStats ? {
        _count: {
          select: {
            users: { where: { isActive: true } }
          }
        }
      } : undefined,
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ locations });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, address, city, state, zipCode, phone, email, timezone } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const location = await prisma.location.create({
      data: {
        name,
        address,
        city,
        state,
        zipCode,
        phone,
        email,
        timezone: timezone || 'America/Edmonton'
      }
    });

    return NextResponse.json({
      data: location,
      message: 'Location created successfully'
    });
  } catch (error: unknown) {
    console.error('Error creating location:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create location', details: message },
      { status: 500 }
    );
  }
}
