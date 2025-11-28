import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const search = searchParams.get('search') || '';
    const contentType = searchParams.get('contentType') || '';
    const status = searchParams.get('status') || 'ACTIVE';
    const sortBy = searchParams.get('sortBy') || 'uploadedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const tagsParam = searchParams.get('tags') || '';
    const tagIds = tagsParam ? tagsParam.split(',').filter(Boolean) : [];

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { filename: { contains: search, mode: 'insensitive' } },
        { alt: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (contentType) {
      where.contentType = { startsWith: contentType };
    }

    if (tagIds.length > 0) {
      where.tags = {
        some: {
          tagId: { in: tagIds },
        },
      };
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === 'uploadedAt' || sortBy === 'lastUsedAt' || sortBy === 'usageCount' || sortBy === 'size') {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.uploadedAt = 'desc';
    }

    // Get total count for pagination
    const total = await prisma.wikiMedia.count({ where });

    // Get media items
    const media = await prisma.wikiMedia.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        key: true,
        url: true,
        filename: true,
        title: true,
        description: true,
        contentType: true,
        size: true,
        width: true,
        height: true,
        alt: true,
        uploadedById: true,
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        usageCount: true,
        status: true,
        uploadedAt: true,
        lastUsedAt: true,
        isOrphaned: true,
        orphanedAt: true,
      },
    });

    return NextResponse.json({
      media,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error('Media list error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch media';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
