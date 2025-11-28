import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { deleteFile } from '@/lib/s3';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get media details
    const media = await prisma.wikiMedia.findUnique({
      where: { id },
      include: {
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
        usedInArticles: {
          include: {
            article: {
              select: {
                id: true,
                title: true,
                slug: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!media) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ media });
  } catch (error) {
    console.error('Media detail error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch media details';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Extract fields to update
    const { alt, title, description, tags } = body;

    if (alt !== undefined && typeof alt !== 'string') {
      return NextResponse.json(
        { error: 'Alt text must be a string' },
        { status: 400 }
      );
    }

    if (title !== undefined && title !== null && typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Title must be a string' },
        { status: 400 }
      );
    }

    if (description !== undefined && description !== null && typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Description must be a string' },
        { status: 400 }
      );
    }

    if (tags !== undefined && !Array.isArray(tags)) {
      return NextResponse.json(
        { error: 'Tags must be an array' },
        { status: 400 }
      );
    }

    // Check if media exists and user owns it
    const existingMedia = await prisma.wikiMedia.findUnique({
      where: { id },
    });

    if (!existingMedia) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      );
    }

    if (existingMedia.uploadedById !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only update your own media' },
        { status: 403 }
      );
    }

    // Process tags if provided
    let tagUpdates = {};
    if (tags !== undefined) {
      // First, delete existing tag associations
      await prisma.wikiMediaTag.deleteMany({
        where: { mediaId: id },
      });

      // Then create new ones
      const tagRecords = [];
      for (const tagName of tags) {
        if (!tagName.trim()) continue;

        // Find or create tag
        let tag = await prisma.mediaTag.findFirst({
          where: { name: { equals: tagName.trim(), mode: 'insensitive' } },
        });

        if (!tag) {
          const slug = tagName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

          tag = await prisma.mediaTag.create({
            data: {
              name: tagName.trim(),
              slug,
            },
          });
        }

        tagRecords.push(tag);
      }

      tagUpdates = {
        tags: {
          create: tagRecords.map(tag => ({
            tagId: tag.id,
          })),
        },
      };
    }

    // Build update data
    const updateData: any = {};
    if (alt !== undefined) updateData.alt = alt;
    if (title !== undefined) updateData.title = title?.trim() || null;
    if (description !== undefined) updateData.description = description?.trim() || null;

    // Update media
    const updatedMedia = await prisma.wikiMedia.update({
      where: { id },
      data: {
        ...updateData,
        ...tagUpdates,
      },
      include: {
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
      },
    });

    return NextResponse.json({ media: updatedMedia });
  } catch (error) {
    console.error('Media update error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update media';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if media exists and user owns it
    const existingMedia = await prisma.wikiMedia.findUnique({
      where: { id },
      include: {
        usedInArticles: true,
      },
    });

    if (!existingMedia) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      );
    }

    if (existingMedia.uploadedById !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own media' },
        { status: 403 }
      );
    }

    // Check if media is in use
    if (existingMedia.usedInArticles.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete media that is currently in use',
          usedIn: existingMedia.usedInArticles.length,
        },
        { status: 409 }
      );
    }

    try {
      // Delete from storage
      await deleteFile(existingMedia.key);
    } catch (storageError) {
      console.error('Failed to delete from storage:', storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Log the cleanup
    await prisma.mediaCleanupLog.create({
      data: {
        mediaId: existingMedia.id,
        mediaKey: existingMedia.key,
        mediaUrl: existingMedia.url,
        reason: 'MANUAL_DELETE',
        cleanedBy: user.id,
        isAutomatic: false,
        success: true,
      },
    });

    // Delete from database
    await prisma.wikiMedia.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Media deleted successfully',
    });
  } catch (error) {
    console.error('Media delete error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete media';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
