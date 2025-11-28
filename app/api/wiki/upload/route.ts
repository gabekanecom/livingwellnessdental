import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  uploadFile,
  generateUploadKey,
  isAllowedImageType,
  MAX_IMAGE_SIZE,
  ALLOWED_IMAGE_TYPES,
} from '@/lib/s3';
import { prisma } from '@/lib/prisma';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Extract metadata from form data
    const title = formData.get('title') as string | null;
    const description = formData.get('description') as string | null;
    const module = formData.get('module') as string | null; // Which module is uploading (wiki, lms, etc.)
    const tagsJson = formData.get('tags') as string | null;
    let tagNames: string[] = [];

    if (tagsJson) {
      try {
        tagNames = JSON.parse(tagsJson);
      } catch (error) {
        console.warn('Failed to parse tags JSON:', error);
      }
    }

    // Validate file type
    if (!isAllowedImageType(file.type)) {
      return NextResponse.json(
        {
          error: `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_IMAGE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get image dimensions using sharp
    let width: number | null = null;
    let height: number | null = null;

    try {
      const metadata = await sharp(buffer).metadata();
      width = metadata.width ?? null;
      height = metadata.height ?? null;
    } catch (error) {
      console.warn('Failed to extract image metadata:', error);
      // Continue with upload even if metadata extraction fails
    }

    // Generate unique key
    const key = generateUploadKey('wiki/images', file.name, user.id);

    // Upload to storage (S3 or DigitalOcean Spaces)
    const url = await uploadFile(buffer, key, file.type);

    // Process tags: find or create them
    const tagRecords = [];
    for (const tagName of tagNames) {
      if (!tagName.trim()) continue;

      // Try to find existing tag
      let tag = await prisma.mediaTag.findFirst({
        where: { name: { equals: tagName.trim(), mode: 'insensitive' } },
      });

      // Create if doesn't exist
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

    // Record media in database with metadata and tags
    const wikiMedia = await prisma.wikiMedia.create({
      data: {
        key,
        url,
        filename: file.name,
        contentType: file.type,
        size: file.size,
        width,
        height,
        title: title?.trim() || null,
        description: description?.trim() || null,
        module: module?.trim() || null,
        uploadedById: user.id,
        status: 'ACTIVE',
        lastUsedAt: new Date(),
        tags: {
          create: tagRecords.map(tag => ({
            tagId: tag.id,
          })),
        },
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: wikiMedia.id,
      url: wikiMedia.url,
      key: wikiMedia.key,
      filename: wikiMedia.filename,
      title: wikiMedia.title,
      description: wikiMedia.description,
      size: wikiMedia.size,
      contentType: wikiMedia.contentType,
      width: wikiMedia.width,
      height: wikiMedia.height,
      tags: wikiMedia.tags.map(wmt => wmt.tag),
    });
  } catch (error) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// Configure body size limit for Next.js
export const config = {
  api: {
    bodyParser: false,
  },
};
