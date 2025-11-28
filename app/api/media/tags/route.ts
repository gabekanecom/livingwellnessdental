import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/wiki/media/tags
 * List all media tags
 */
export async function GET(request: NextRequest) {
  try {
    const tags = await prisma.mediaTag.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { media: true },
        },
      },
    });

    return NextResponse.json({ tags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tags';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * POST /api/wiki/media/tags
 * Create a new media tag
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, color } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Tag name is required' },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if tag already exists
    const existing = await prisma.mediaTag.findFirst({
      where: {
        OR: [
          { name: { equals: name, mode: 'insensitive' } },
          { slug },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Tag with this name already exists' },
        { status: 409 }
      );
    }

    // Create tag
    const tag = await prisma.mediaTag.create({
      data: {
        name,
        slug,
        description,
        color,
      },
    });

    return NextResponse.json({ tag }, { status: 201 });
  } catch (error) {
    console.error('Error creating tag:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create tag';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
