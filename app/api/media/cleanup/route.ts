import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { deleteFile } from '@/lib/s3';

const GRACE_PERIOD_DAYS = 30; // Don't delete files used within the last 30 days
const ORPHAN_AGE_DAYS = 7; // Files must be orphaned for at least 7 days before deletion

/**
 * POST /api/wiki/media/cleanup
 * Automatic cleanup of orphaned media files
 *
 * This endpoint should be called by a cron job
 */
export async function POST(request: NextRequest) {
  try {
    // Verify request is authorized (basic auth check)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get current user for logging (may be null for cron jobs)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const now = new Date();
    const gracePeriodDate = new Date(now.getTime() - GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
    const orphanAgeDate = new Date(now.getTime() - ORPHAN_AGE_DAYS * 24 * 60 * 60 * 1000);

    // Find orphaned media files
    // A file is orphaned if:
    // 1. It has no article associations (usageCount = 0)
    // 2. It hasn't been used recently (lastUsedAt is older than grace period OR null)
    // 3. It was uploaded at least ORPHAN_AGE_DAYS ago
    const orphanedMedia = await prisma.wikiMedia.findMany({
      where: {
        usageCount: 0,
        OR: [
          { lastUsedAt: null },
          { lastUsedAt: { lt: gracePeriodDate } },
        ],
        uploadedAt: { lt: orphanAgeDate },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        key: true,
        url: true,
        filename: true,
        uploadedAt: true,
        lastUsedAt: true,
      },
    });

    const results = {
      found: orphanedMedia.length,
      deleted: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Delete each orphaned file
    for (const media of orphanedMedia) {
      try {
        // Delete from storage
        try {
          await deleteFile(media.key);
        } catch (storageError) {
          console.error(`Failed to delete from storage: ${media.key}`, storageError);
          // Continue with database deletion even if storage deletion fails
        }

        // Log the cleanup
        await prisma.mediaCleanupLog.create({
          data: {
            mediaId: media.id,
            mediaKey: media.key,
            mediaUrl: media.url,
            reason: 'ORPHANED_EXPIRED',
            cleanedBy: user?.id,
            isAutomatic: true,
            success: true,
          },
        });

        // Mark as deleted in database (soft delete)
        await prisma.wikiMedia.update({
          where: { id: media.id },
          data: { status: 'DELETED' },
        });

        results.deleted++;
      } catch (error) {
        console.error(`Failed to delete media ${media.id}:`, error);
        results.failed++;
        results.errors.push(
          `${media.filename}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );

        // Log the failed cleanup
        await prisma.mediaCleanupLog.create({
          data: {
            mediaId: media.id,
            mediaKey: media.key,
            mediaUrl: media.url,
            reason: 'ORPHANED_EXPIRED',
            cleanedBy: user?.id,
            isAutomatic: true,
            success: false,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleanup completed: ${results.deleted} deleted, ${results.failed} failed`,
      results,
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Cleanup failed';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * GET /api/wiki/media/cleanup
 * Preview orphaned media files that would be cleaned up
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const gracePeriodDate = new Date(now.getTime() - GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
    const orphanAgeDate = new Date(now.getTime() - ORPHAN_AGE_DAYS * 24 * 60 * 60 * 1000);

    // Find orphaned media files (same logic as POST)
    const orphanedMedia = await prisma.wikiMedia.findMany({
      where: {
        usageCount: 0,
        OR: [
          { lastUsedAt: null },
          { lastUsedAt: { lt: gracePeriodDate } },
        ],
        uploadedAt: { lt: orphanAgeDate },
        status: 'ACTIVE',
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { uploadedAt: 'asc' },
    });

    // Calculate total size
    const totalSize = orphanedMedia.reduce((sum, media) => sum + media.size, 0);

    return NextResponse.json({
      orphanedMedia,
      stats: {
        count: orphanedMedia.length,
        totalSize,
        totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
        gracePeriodDays: GRACE_PERIOD_DAYS,
        orphanAgeDays: ORPHAN_AGE_DAYS,
      },
    });
  } catch (error) {
    console.error('Cleanup preview error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to preview cleanup';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
