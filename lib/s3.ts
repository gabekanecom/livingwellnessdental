import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// S3-compatible client singleton (works with AWS S3, DigitalOcean Spaces, etc.)
let s3Client: S3Client | null = null;

export function getS3Client(): S3Client {
  if (!s3Client) {
    const endpoint = process.env.S3_ENDPOINT;
    const region = process.env.S3_REGION || 'us-east-1';

    s3Client = new S3Client({
      // For DigitalOcean Spaces, endpoint is like: https://nyc3.digitaloceanspaces.com
      ...(endpoint && { endpoint }),
      region,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      },
      // Required for DigitalOcean Spaces
      forcePathStyle: false,
    });
  }
  return s3Client;
}

export const S3_BUCKET = process.env.S3_BUCKET || '';
export const S3_REGION = process.env.S3_REGION || 'us-east-1';
export const S3_ENDPOINT = process.env.S3_ENDPOINT || '';

// Get the public URL for an object
export function getPublicUrl(key: string): string {
  // If using a CDN (DigitalOcean CDN or CloudFront), use that URL
  if (process.env.S3_CDN_URL) {
    return `${process.env.S3_CDN_URL}/${key}`;
  }

  // DigitalOcean Spaces URL format: https://{bucket}.{region}.digitaloceanspaces.com/{key}
  if (S3_ENDPOINT && S3_ENDPOINT.includes('digitaloceanspaces.com')) {
    const region = S3_ENDPOINT.replace('https://', '').replace('.digitaloceanspaces.com', '');
    return `https://${S3_BUCKET}.${region}.digitaloceanspaces.com/${key}`;
  }

  // AWS S3 URL format
  return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;
}

// Generate a unique key for uploads
export function generateUploadKey(
  folder: string,
  filename: string,
  userId?: string
): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  const userPrefix = userId ? `${userId}/` : '';
  return `${folder}/${userPrefix}${timestamp}-${randomStr}-${sanitizedFilename}`;
}

// Upload a file buffer
export async function uploadFile(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const client = getS3Client();

  await client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read', // Make file publicly readable
      CacheControl: 'public, max-age=31536000', // 1 year cache
    })
  );

  return getPublicUrl(key);
}

// Delete a file
export async function deleteFile(key: string): Promise<void> {
  const client = getS3Client();

  await client.send(
    new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    })
  );
}

// Get a presigned URL for direct upload (useful for large files)
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  const client = getS3Client();

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn });
}

// Allowed image types
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

// Allowed video types (for future use)
export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

// Max file sizes (in bytes)
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

// Validate file type
export function isAllowedImageType(contentType: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(contentType);
}

export function isAllowedVideoType(contentType: string): boolean {
  return ALLOWED_VIDEO_TYPES.includes(contentType);
}
