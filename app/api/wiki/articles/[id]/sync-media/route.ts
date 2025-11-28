import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

interface SyncMediaRequest {
  content: string;
}

/**
 * Extract all image URLs from HTML content
 */
function extractImageUrls(html: string): string[] {
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  const urls: string[] = [];
  let match;

  while ((match = imgRegex.exec(html)) !== null) {
    urls.push(match[1]);
  }

  return urls;
}

/**
 * POST /api/wiki/articles/[id]/sync-media
 * Sync media usage for an article based on its content
 */
export async function POST(
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

    const { id: articleId } = await params;
    const body: SyncMediaRequest = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required and must be a string' },
        { status: 400 }
      );
    }

    // Verify article exists and user has access
    const article = await prisma.wikiArticle.findUnique({
      where: { id: articleId },
      select: { id: true, authorId: true },
    });

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Extract all image URLs from content
    const imageUrls = extractImageUrls(content);

    // Find all WikiMedia records that match these URLs
    const mediaRecords = await prisma.wikiMedia.findMany({
      where: {
        url: {
          in: imageUrls,
        },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        url: true,
      },
    });

    // Create a map of URL -> media ID for quick lookup
    const urlToMediaId = new Map(
      mediaRecords.map(m => [m.url, m.id])
    );

    // Get current article-media associations
    const currentAssociations = await prisma.wikiArticleMedia.findMany({
      where: { articleId },
      select: { mediaId: true },
    });

    const currentMediaIds = new Set(
      currentAssociations.map(a => a.mediaId)
    );

    // Determine which media IDs are now being used
    const newMediaIds = new Set(
      imageUrls
        .map(url => urlToMediaId.get(url))
        .filter((id): id is string => id !== undefined)
    );

    // Media to add (in new content but not in current associations)
    const mediaToAdd = Array.from(newMediaIds).filter(
      id => !currentMediaIds.has(id)
    );

    // Media to remove (in current associations but not in new content)
    const mediaToRemove = Array.from(currentMediaIds).filter(
      id => !newMediaIds.has(id)
    );

    // Perform database updates in a transaction
    await prisma.$transaction(async (tx) => {
      // Add new associations
      if (mediaToAdd.length > 0) {
        await tx.wikiArticleMedia.createMany({
          data: mediaToAdd.map(mediaId => ({
            articleId,
            mediaId,
          })),
          skipDuplicates: true,
        });

        // Update lastUsedAt for newly used media
        await tx.wikiMedia.updateMany({
          where: {
            id: { in: mediaToAdd },
          },
          data: {
            lastUsedAt: new Date(),
          },
        });
      }

      // Remove old associations
      if (mediaToRemove.length > 0) {
        await tx.wikiArticleMedia.deleteMany({
          where: {
            articleId,
            mediaId: { in: mediaToRemove },
          },
        });
      }

      // Recalculate usage counts for affected media
      const affectedMediaIds = [
        ...mediaToAdd,
        ...mediaToRemove,
      ];

      if (affectedMediaIds.length > 0) {
        // For each affected media, count how many articles use it
        for (const mediaId of affectedMediaIds) {
          const count = await tx.wikiArticleMedia.count({
            where: { mediaId },
          });

          await tx.wikiMedia.update({
            where: { id: mediaId },
            data: { usageCount: count },
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Media sync completed',
      stats: {
        totalImagesInContent: imageUrls.length,
        trackedMedia: newMediaIds.size,
        added: mediaToAdd.length,
        removed: mediaToRemove.length,
      },
    });
  } catch (error) {
    console.error('Media sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to sync media';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
