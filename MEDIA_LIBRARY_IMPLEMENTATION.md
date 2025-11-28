# Media Library & Automatic Cleanup Implementation Plan

## Executive Summary

This document outlines a comprehensive implementation plan for a Media Library system with automatic cleanup capabilities to prevent DigitalOcean Spaces bucket bloat. The system will provide users with visibility into uploaded media, enable media reuse, and automatically clean up orphaned files.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [UI Components & Pages](#ui-components--pages)
5. [Core Functionality](#core-functionality)
6. [Automatic Cleanup System](#automatic-cleanup-system)
7. [Integration Points](#integration-points)
8. [Security & Permissions](#security--permissions)
9. [User Workflows](#user-workflows)
10. [Implementation Phases](#implementation-phases)
11. [Testing Strategy](#testing-strategy)
12. [Performance Considerations](#performance-considerations)
13. [Future Enhancements](#future-enhancements)

---

## System Architecture

### High-Level Design

```
┌─────────────────┐
│  User Interface │
│  - Media Library│
│  - Article Editor│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   API Layer     │
│  - Upload       │
│  - List/Search  │
│  - Delete       │
│  - Usage Track  │
└────────┬────────┘
         │
         ├──────────────────┬──────────────────┐
         ▼                  ▼                  ▼
┌─────────────────┐ ┌──────────────┐ ┌─────────────────┐
│    Database     │ │DigitalOcean  │ │  Cron Jobs      │
│  - Media Table  │ │   Spaces     │ │  - Cleanup      │
│  - Usage Track  │ │              │ │  - Stats        │
└─────────────────┘ └──────────────┘ └─────────────────┘
```

### Key Principles

1. **Track Everything**: Every upload is logged in the database
2. **Usage Tracking**: Monitor which articles use which media
3. **Graceful Degradation**: If cleanup fails, system continues working
4. **User Control**: Users can manually manage media alongside automatic cleanup
5. **Audit Trail**: Keep logs of deletions and cleanup operations

---

## Database Schema

### New Table: `WikiMedia`

```prisma
model WikiMedia {
  id          String   @id @default(cuid())

  // File Information
  key         String   @unique // S3/Spaces key
  url         String   // Public CDN URL
  filename    String   // Original filename
  contentType String   // MIME type
  size        Int      // File size in bytes

  // Metadata
  width       Int?     // Image width (if image)
  height      Int?     // Image height (if image)
  alt         String?  // Alt text for accessibility

  // Ownership & Tracking
  uploadedById String
  uploadedBy   User    @relation("UploadedMedia", fields: [uploadedById], references: [id], onDelete: Cascade)

  // Usage Tracking
  usedInArticles WikiArticleMedia[]
  usageCount     Int     @default(0) // Denormalized count for quick queries

  // Status & Lifecycle
  status      MediaStatus @default(ACTIVE) // ACTIVE, ORPHANED, DELETED
  uploadedAt  DateTime    @default(now())
  lastUsedAt  DateTime?   // Last time it was added to an article
  markedForDeletionAt DateTime? // When it was marked for cleanup
  deletedAt   DateTime?   // Soft delete timestamp

  // Cleanup tracking
  isOrphaned  Boolean  @default(false)
  orphanedAt  DateTime?

  @@index([uploadedById])
  @@index([status])
  @@index([isOrphaned, orphanedAt])
  @@index([contentType])
  @@index([uploadedAt])
}

enum MediaStatus {
  ACTIVE       // Currently in use or recently uploaded
  ORPHANED     // Not used in any published article
  DELETED      // Soft deleted
}
```

### Junction Table: `WikiArticleMedia`

```prisma
model WikiArticleMedia {
  id        String   @id @default(cuid())

  articleId String
  article   WikiArticle @relation(fields: [articleId], references: [id], onDelete: Cascade)

  mediaId   String
  media     WikiMedia @relation(fields: [mediaId], references: [id], onDelete: Cascade)

  addedAt   DateTime @default(now())

  @@unique([articleId, mediaId])
  @@index([articleId])
  @@index([mediaId])
}
```

### Updates to Existing Models

```prisma
// Add to WikiArticle model
model WikiArticle {
  // ... existing fields ...
  media WikiArticleMedia[]
}

// Add to User model
model User {
  // ... existing fields ...
  uploadedMedia WikiMedia[] @relation("UploadedMedia")
}
```

### New Table: `MediaCleanupLog`

```prisma
model MediaCleanupLog {
  id          String   @id @default(cuid())

  // What was cleaned
  mediaId     String?  // Null if batch operation
  mediaKey    String   // S3 key for reference
  mediaUrl    String   // URL for reference

  // Why it was cleaned
  reason      CleanupReason

  // When and by whom
  cleanedAt   DateTime  @default(now())
  cleanedBy   String?   // User ID if manual, null if automatic
  isAutomatic Boolean   @default(true)

  // Results
  success     Boolean
  errorMessage String?

  @@index([cleanedAt])
  @@index([isAutomatic])
}

enum CleanupReason {
  ORPHANED_EXPIRED  // Orphaned for X days
  MANUAL_DELETE     // User deleted
  ADMIN_CLEANUP     // Admin bulk cleanup
  ARTICLE_DELETED   // Parent article deleted
}
```

---

## API Endpoints

### Media Upload & Management

#### `POST /api/wiki/media/upload`
**Purpose**: Upload new media file (replaces current upload endpoint)

**Request**:
```typescript
FormData {
  file: File
  alt?: string // Optional alt text
}
```

**Response**:
```typescript
{
  id: string
  key: string
  url: string
  filename: string
  size: number
  contentType: string
  width?: number
  height?: number
  uploadedAt: string
}
```

**Logic**:
1. Validate authentication
2. Validate file type and size
3. Upload to DigitalOcean Spaces
4. Extract image dimensions if image
5. Create `WikiMedia` record in database
6. Return media info

---

#### `GET /api/wiki/media`
**Purpose**: List all media with filtering, search, and pagination

**Query Parameters**:
```typescript
{
  page?: number        // Default: 1
  limit?: number       // Default: 24, Max: 100
  search?: string      // Search filename
  contentType?: string // Filter by type (image/*, video/*)
  status?: MediaStatus // Filter by status
  uploadedBy?: string  // Filter by user ID
  sortBy?: 'uploadedAt' | 'filename' | 'size' | 'usageCount'
  sortOrder?: 'asc' | 'desc'
  isOrphaned?: boolean // Show only orphaned media
}
```

**Response**:
```typescript
{
  media: Array<{
    id: string
    key: string
    url: string
    filename: string
    contentType: string
    size: number
    width?: number
    height?: number
    alt?: string
    uploadedBy: {
      id: string
      name: string
      avatar?: string
    }
    usageCount: number
    isOrphaned: boolean
    uploadedAt: string
    lastUsedAt?: string
  }>
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasMore: boolean
  }
}
```

**Logic**:
1. Check authentication
2. Build query with filters
3. Apply search if provided
4. Paginate results
5. Include usage statistics
6. Return media list

---

#### `GET /api/wiki/media/:id`
**Purpose**: Get detailed information about a specific media file

**Response**:
```typescript
{
  id: string
  key: string
  url: string
  filename: string
  contentType: string
  size: number
  width?: number
  height?: number
  alt?: string
  uploadedBy: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  usageCount: number
  isOrphaned: boolean
  status: MediaStatus
  uploadedAt: string
  lastUsedAt?: string
  usedInArticles: Array<{
    id: string
    title: string
    slug: string
    status: ArticleStatus
    addedAt: string
  }>
}
```

**Logic**:
1. Fetch media with relations
2. Include all articles using this media
3. Calculate usage statistics
4. Return detailed info

---

#### `PATCH /api/wiki/media/:id`
**Purpose**: Update media metadata (alt text, filename)

**Request**:
```typescript
{
  alt?: string
  filename?: string
}
```

**Response**:
```typescript
{
  id: string
  alt: string
  filename: string
  updatedAt: string
}
```

**Logic**:
1. Validate authentication
2. Check user permissions (owner or admin)
3. Update metadata in database
4. Return updated media

---

#### `DELETE /api/wiki/media/:id`
**Purpose**: Delete media file

**Request**:
```typescript
{
  force?: boolean // Force delete even if in use
}
```

**Response**:
```typescript
{
  success: boolean
  message: string
  deletedKey: string
}
```

**Logic**:
1. Check authentication and permissions
2. Check if media is in use
3. If in use and not forced, return error
4. If forced or not in use:
   - Delete from DigitalOcean Spaces
   - Soft delete database record (or hard delete if forced)
   - Log deletion in MediaCleanupLog
5. Return success

---

#### `POST /api/wiki/media/bulk-delete`
**Purpose**: Delete multiple media files at once

**Request**:
```typescript
{
  mediaIds: string[]
  force?: boolean
}
```

**Response**:
```typescript
{
  deleted: number
  failed: number
  errors: Array<{
    mediaId: string
    error: string
  }>
}
```

**Logic**:
1. Check admin permissions
2. Process each media ID
3. Track successes and failures
4. Return summary

---

### Usage Tracking

#### `POST /api/wiki/media/:id/track-usage`
**Purpose**: Track when media is used in an article (called when article is saved)

**Request**:
```typescript
{
  articleId: string
}
```

**Response**:
```typescript
{
  success: boolean
}
```

**Logic**:
1. Create/update WikiArticleMedia junction record
2. Update usageCount on WikiMedia
3. Update lastUsedAt timestamp
4. Set isOrphaned to false
5. Return success

---

#### `POST /api/wiki/articles/:id/sync-media`
**Purpose**: Sync media references when article content changes

**Request**:
```typescript
{
  content: string // HTML content from TipTap
}
```

**Response**:
```typescript
{
  added: number
  removed: number
  current: string[] // Array of media IDs
}
```

**Logic**:
1. Parse HTML content for image URLs
2. Extract media IDs/keys from URLs
3. Get current media associations
4. Add new associations
5. Remove old associations no longer in content
6. Update usage counts
7. Return sync results

---

### Cleanup Operations

#### `POST /api/admin/wiki/media/cleanup`
**Purpose**: Manually trigger cleanup process (admin only)

**Request**:
```typescript
{
  dryRun?: boolean // Preview what would be deleted
  olderThanDays?: number // Override default (7 days)
}
```

**Response**:
```typescript
{
  dryRun: boolean
  orphanedFound: number
  deleted: number
  failed: number
  freedSpace: number // bytes
  details: Array<{
    mediaId: string
    filename: string
    size: number
    orphanedAt: string
    deleted: boolean
    error?: string
  }>
}
```

**Logic**:
1. Check admin permissions
2. Find orphaned media older than threshold
3. If dryRun, return preview
4. If not dryRun:
   - Delete from Spaces
   - Update database
   - Log deletions
5. Return results

---

#### `GET /api/admin/wiki/media/stats`
**Purpose**: Get storage statistics

**Response**:
```typescript
{
  totalFiles: number
  totalSize: number // bytes
  activeFiles: number
  activeSize: number
  orphanedFiles: number
  orphanedSize: number
  deletedFiles: number
  byContentType: Array<{
    contentType: string
    count: number
    size: number
  }>
  byUploader: Array<{
    userId: string
    userName: string
    count: number
    size: number
  }>
  recentUploads: number // Last 7 days
  recentCleanups: number // Last 7 days
}
```

**Logic**:
1. Aggregate statistics from database
2. Calculate totals and breakdowns
3. Return comprehensive stats

---

#### `GET /api/admin/wiki/media/cleanup-history`
**Purpose**: View cleanup history and logs

**Query Parameters**:
```typescript
{
  page?: number
  limit?: number
  isAutomatic?: boolean
}
```

**Response**:
```typescript
{
  logs: Array<{
    id: string
    mediaKey: string
    mediaUrl: string
    reason: CleanupReason
    cleanedAt: string
    cleanedBy?: {
      id: string
      name: string
    }
    isAutomatic: boolean
    success: boolean
    errorMessage?: string
  }>
  pagination: { ... }
}
```

---

## UI Components & Pages

### 1. Media Library Page
**Route**: `/wiki/media`

**Purpose**: Main media management interface

**Components**:

#### MediaLibraryPage (Full Page Component)
```typescript
// app/(default)/wiki/media/page.tsx

Features:
- Grid/List view toggle
- Search bar
- Filters (type, status, uploader)
- Sort options
- Pagination
- Bulk selection
- Bulk delete action
- Upload button
```

**Layout**:
```
┌─────────────────────────────────────────────────┐
│ Media Library                    [Upload Media] │
├─────────────────────────────────────────────────┤
│ [Search...] [Type▾] [Status▾] [Sort▾] [Grid/List]│
├─────────────────────────────────────────────────┤
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐                    │
│ │ 🖼️ │ │ 🖼️ │ │ 🖼️ │ │ 🖼️ │  [Checkbox for   │
│ └────┘ └────┘ └────┘ └────┘   bulk select]     │
│ Name1  Name2  Name3  Name4                      │
│ 2MB    1MB    3MB    500KB                      │
│                                                  │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐                    │
│ │ 🖼️ │ │ 🖼️ │ │ 🖼️ │ │ 🖼️ │                    │
│ └────┘ └────┘ └────┘ └────┘                    │
├─────────────────────────────────────────────────┤
│          [< Prev] Page 1 of 10 [Next >]         │
└─────────────────────────────────────────────────┘
```

**State Management**:
```typescript
const [view, setView] = useState<'grid' | 'list'>('grid')
const [search, setSearch] = useState('')
const [filters, setFilters] = useState({
  contentType: 'all',
  status: 'all',
  isOrphaned: undefined
})
const [sortBy, setSortBy] = useState('uploadedAt')
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
const [page, setPage] = useState(1)
const [selectedMedia, setSelectedMedia] = useState<Set<string>>(new Set())
```

---

#### MediaCard Component
```typescript
// components/wiki/MediaCard.tsx

Props:
- media: MediaItem
- isSelected: boolean
- onSelect: (id: string) => void
- onDelete: (id: string) => void
- onClick: (id: string) => void // Open detail modal

Features:
- Thumbnail preview
- Filename
- File size
- Upload date
- Usage count badge
- Orphaned indicator
- Checkbox for selection
- Quick actions (view, delete)
```

**Visual Design**:
```
┌─────────────────┐
│ [✓]        [×]  │ <- Checkbox & Delete
│                 │
│   ┌─────────┐   │
│   │  Image  │   │ <- Thumbnail
│   │ Preview │   │
│   └─────────┘   │
│                 │
│  filename.jpg   │ <- Name
│  2.3 MB         │ <- Size
│  📎 Used in 3   │ <- Usage badge
│  ⚠️ Orphaned    │ <- Status (if orphaned)
└─────────────────┘
```

---

#### MediaDetailModal Component
```typescript
// components/wiki/MediaDetailModal.tsx

Props:
- mediaId: string
- isOpen: boolean
- onClose: () => void

Features:
- Full-size preview
- Metadata display
- Edit alt text
- Copy URL button
- Download button
- Delete button
- "Used in" article list
- Upload details
```

**Layout**:
```
┌───────────────────────────────────────┐
│ Media Details                    [×]  │
├───────────────────────────────────────┤
│  ┌─────────────────┐                  │
│  │                 │                  │
│  │  Full Preview   │                  │
│  │                 │                  │
│  └─────────────────┘                  │
│                                        │
│  Filename: image.jpg                  │
│  Size: 2.3 MB                         │
│  Dimensions: 1920x1080                │
│  Type: image/jpeg                     │
│  Uploaded: Jan 15, 2025               │
│  By: John Doe                         │
│                                        │
│  Alt Text: [Edit field]     [Save]    │
│                                        │
│  Used in 3 articles:                  │
│  • Article Title 1                    │
│  • Article Title 2                    │
│  • Article Title 3                    │
│                                        │
│  [Copy URL] [Download] [Delete]       │
└───────────────────────────────────────┘
```

---

#### MediaUploadModal Component
```typescript
// components/wiki/MediaUploadModal.tsx

Props:
- isOpen: boolean
- onClose: () => void
- onUploadComplete: (media: MediaItem) => void

Features:
- Drag-and-drop zone
- File browser
- Multiple file upload
- Progress indicators
- Alt text input
- Preview before upload
```

---

#### MediaPickerModal Component
```typescript
// components/wiki/MediaPickerModal.tsx

Props:
- isOpen: boolean
- onClose: () => void
- onSelect: (media: MediaItem) => void
- allowMultiple?: boolean

Purpose:
- Used in Article Editor to pick existing media
- Shows media library in modal
- Allows selection of existing images
- Shows "Upload New" button

Features:
- Same grid/search/filter as main library
- Select mode
- Insert button
```

---

### 2. Media Management in Article Editor

#### Enhanced ArticleEditor Integration

**New Features**:
1. **Media Picker Button** - Opens MediaPickerModal
2. **Automatic Sync** - Syncs media references on save
3. **Usage Indicator** - Shows if image is from library

**Updated Upload Flow**:
```typescript
// Two paths for adding images:

// Path 1: Upload New (current behavior)
- User clicks upload or drags file
- File uploads to Spaces
- WikiMedia record created
- Image inserted into editor

// Path 2: Choose from Library (NEW)
- User clicks "Choose from Library"
- MediaPickerModal opens
- User selects existing media
- Image URL inserted into editor
```

**Auto-sync on Save**:
```typescript
// When article is saved:
const handleSave = async () => {
  // 1. Save article content
  await saveArticle()

  // 2. Sync media references
  await fetch(`/api/wiki/articles/${articleId}/sync-media`, {
    method: 'POST',
    body: JSON.stringify({ content: editor.getHTML() })
  })
}
```

---

### 3. Admin Dashboard Integration

#### MediaStatsWidget Component
```typescript
// components/admin/MediaStatsWidget.tsx

Display:
- Total storage used
- Number of files
- Orphaned files count
- Recent uploads
- Quick link to cleanup
```

**Visual Design**:
```
┌─────────────────────────────────┐
│ Media Storage                   │
├─────────────────────────────────┤
│  Total Files: 1,234             │
│  Storage Used: 15.7 GB          │
│  Orphaned: 42 files (230 MB)    │
│                                  │
│  [View Library] [Run Cleanup]   │
└─────────────────────────────────┘
```

---

#### MediaCleanupPage (Admin Only)
**Route**: `/admin/wiki/media/cleanup`

**Features**:
- Cleanup configuration
- Dry-run preview
- Manual trigger
- Cleanup history
- Statistics

**Layout**:
```
┌───────────────────────────────────────────┐
│ Media Cleanup Management                  │
├───────────────────────────────────────────┤
│ Automatic Cleanup Settings                │
│ ┌─────────────────────────────────┐       │
│ │ ☑ Enable automatic cleanup      │       │
│ │ Delete orphaned files after:    │       │
│ │ [7] days                         │       │
│ │ Run cleanup: Daily at 2:00 AM   │       │
│ └─────────────────────────────────┘       │
│                                            │
│ Manual Cleanup                             │
│ ┌─────────────────────────────────┐       │
│ │ Delete files orphaned for:      │       │
│ │ [7] days or more                │       │
│ │                                  │       │
│ │ [Preview] [Run Cleanup]          │       │
│ └─────────────────────────────────┘       │
│                                            │
│ Recent Cleanup History                     │
│ ┌─────────────────────────────────┐       │
│ │ Jan 20: Deleted 15 files (45MB) │       │
│ │ Jan 13: Deleted 8 files (12MB)  │       │
│ │ Jan 6:  Deleted 22 files (88MB) │       │
│ └─────────────────────────────────┘       │
└───────────────────────────────────────────┘
```

---

## Core Functionality

### Media Upload Flow

```typescript
// Updated upload endpoint integration

// 1. Upload to Spaces (existing)
const uploadToSpaces = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const key = generateUploadKey('wiki/images', file.name, userId)
  const url = await uploadFile(buffer, key, file.type)
  return { key, url }
}

// 2. Extract image metadata
const extractImageMetadata = async (file: File) => {
  if (!file.type.startsWith('image/')) return {}

  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
    }
    img.src = URL.createObjectURL(file)
  })
}

// 3. Create database record
const createMediaRecord = async (uploadData) => {
  const media = await prisma.wikiMedia.create({
    data: {
      key: uploadData.key,
      url: uploadData.url,
      filename: uploadData.filename,
      contentType: uploadData.contentType,
      size: uploadData.size,
      width: uploadData.width,
      height: uploadData.height,
      uploadedById: userId,
      status: 'ACTIVE'
    }
  })
  return media
}
```

---

### Media Synchronization Flow

**When**: Article is created/updated

**Process**:
```typescript
const syncArticleMedia = async (articleId: string, content: string) => {
  // 1. Parse HTML content for image URLs
  const imageUrls = extractImageUrls(content)

  // 2. Get media IDs from URLs
  const mediaKeys = imageUrls
    .filter(url => url.includes('digitaloceanspaces.com'))
    .map(url => extractKeyFromUrl(url))

  // 3. Find media records
  const mediaRecords = await prisma.wikiMedia.findMany({
    where: { key: { in: mediaKeys } }
  })

  // 4. Get current associations
  const currentAssociations = await prisma.wikiArticleMedia.findMany({
    where: { articleId },
    select: { mediaId: true }
  })

  const currentMediaIds = new Set(currentAssociations.map(a => a.mediaId))
  const newMediaIds = new Set(mediaRecords.map(m => m.id))

  // 5. Add new associations
  const toAdd = [...newMediaIds].filter(id => !currentMediaIds.has(id))
  await prisma.wikiArticleMedia.createMany({
    data: toAdd.map(mediaId => ({ articleId, mediaId })),
    skipDuplicates: true
  })

  // 6. Remove old associations
  const toRemove = [...currentMediaIds].filter(id => !newMediaIds.has(id))
  await prisma.wikiArticleMedia.deleteMany({
    where: {
      articleId,
      mediaId: { in: toRemove }
    }
  })

  // 7. Update usage counts and timestamps
  await updateMediaUsageCounts(mediaRecords.map(m => m.id))

  return {
    added: toAdd.length,
    removed: toRemove.length,
    current: [...newMediaIds]
  }
}

// Helper: Extract image URLs from HTML
const extractImageUrls = (html: string): string[] => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const images = doc.querySelectorAll('img')
  return Array.from(images).map(img => img.src)
}

// Helper: Extract S3 key from URL
const extractKeyFromUrl = (url: string): string => {
  // From: https://lwd-app.sfo3.cdn.digitaloceanspaces.com/wiki/images/user-id/timestamp-random-filename.jpg
  // To: wiki/images/user-id/timestamp-random-filename.jpg
  const urlObj = new URL(url)
  return urlObj.pathname.substring(1) // Remove leading slash
}

// Helper: Update usage counts
const updateMediaUsageCounts = async (mediaIds: string[]) => {
  for (const mediaId of mediaIds) {
    const count = await prisma.wikiArticleMedia.count({
      where: { mediaId }
    })

    await prisma.wikiMedia.update({
      where: { id: mediaId },
      data: {
        usageCount: count,
        lastUsedAt: new Date(),
        isOrphaned: count === 0,
        orphanedAt: count === 0 ? new Date() : null
      }
    })
  }
}
```

---

### Orphan Detection Flow

**Trigger**: Multiple points
1. When article is deleted
2. When article content is updated (via sync)
3. Periodic background check

**Process**:
```typescript
const detectOrphans = async () => {
  // Find all media with zero usage
  const orphanedMedia = await prisma.wikiMedia.findMany({
    where: {
      usageCount: 0,
      status: 'ACTIVE',
      isOrphaned: false
    }
  })

  // Mark as orphaned
  await prisma.wikiMedia.updateMany({
    where: {
      id: { in: orphanedMedia.map(m => m.id) }
    },
    data: {
      isOrphaned: true,
      orphanedAt: new Date(),
      status: 'ORPHANED'
    }
  })

  return orphanedMedia.length
}
```

---

## Automatic Cleanup System

### Cleanup Strategy

**Default Settings**:
- Run daily at 2:00 AM server time
- Delete orphaned files older than 7 days
- Keep soft-deleted records for 30 days
- Log all deletions

### Cron Job Implementation

**Option 1: Vercel Cron (Recommended for Vercel deployment)**

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/media-cleanup",
      "schedule": "0 2 * * *"
    }
  ]
}
```

```typescript
// app/api/cron/media-cleanup/route.ts

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const result = await runMediaCleanup()

  return Response.json(result)
}
```

**Option 2: Next.js API Route + External Cron Service**

Use external service (GitHub Actions, cron-job.org) to hit endpoint

```typescript
// app/api/admin/cron/media-cleanup/route.ts

export async function POST(request: Request) {
  // Verify API key
  const apiKey = request.headers.get('x-api-key')
  if (apiKey !== process.env.CRON_API_KEY) {
    return new Response('Unauthorized', { status: 401 })
  }

  const result = await runMediaCleanup()

  return Response.json(result)
}
```

---

### Cleanup Process

```typescript
// lib/wiki/media-cleanup.ts

export const runMediaCleanup = async (options = {}) => {
  const {
    dryRun = false,
    olderThanDays = 7
  } = options

  // 1. Find orphaned media older than threshold
  const threshold = new Date()
  threshold.setDate(threshold.getDate() - olderThanDays)

  const orphanedMedia = await prisma.wikiMedia.findMany({
    where: {
      isOrphaned: true,
      orphanedAt: {
        lt: threshold
      },
      status: 'ORPHANED'
    },
    include: {
      uploadedBy: {
        select: { id: true, name: true, email: true }
      }
    }
  })

  console.log(`[Cleanup] Found ${orphanedMedia.length} orphaned files`)

  if (dryRun) {
    return {
      dryRun: true,
      orphanedFound: orphanedMedia.length,
      wouldDelete: orphanedMedia.map(m => ({
        id: m.id,
        filename: m.filename,
        size: m.size,
        orphanedAt: m.orphanedAt
      }))
    }
  }

  // 2. Delete each media file
  const results = {
    deleted: 0,
    failed: 0,
    freedSpace: 0,
    details: []
  }

  for (const media of orphanedMedia) {
    try {
      // Delete from Spaces
      await deleteFile(media.key)

      // Soft delete in database
      await prisma.wikiMedia.update({
        where: { id: media.id },
        data: {
          status: 'DELETED',
          deletedAt: new Date()
        }
      })

      // Log deletion
      await prisma.mediaCleanupLog.create({
        data: {
          mediaId: media.id,
          mediaKey: media.key,
          mediaUrl: media.url,
          reason: 'ORPHANED_EXPIRED',
          isAutomatic: true,
          success: true
        }
      })

      results.deleted++
      results.freedSpace += media.size
      results.details.push({
        mediaId: media.id,
        filename: media.filename,
        size: media.size,
        deleted: true
      })

      console.log(`[Cleanup] Deleted: ${media.filename}`)

    } catch (error) {
      console.error(`[Cleanup] Failed to delete ${media.filename}:`, error)

      // Log failure
      await prisma.mediaCleanupLog.create({
        data: {
          mediaId: media.id,
          mediaKey: media.key,
          mediaUrl: media.url,
          reason: 'ORPHANED_EXPIRED',
          isAutomatic: true,
          success: false,
          errorMessage: error.message
        }
      })

      results.failed++
      results.details.push({
        mediaId: media.id,
        filename: media.filename,
        size: media.size,
        deleted: false,
        error: error.message
      })
    }
  }

  console.log(`[Cleanup] Complete: ${results.deleted} deleted, ${results.failed} failed`)

  return results
}
```

---

### Cleanup Notifications

**Email Notification** (Optional):
```typescript
const sendCleanupReport = async (results) => {
  if (results.deleted === 0) return

  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' }
  })

  for (const admin of admins) {
    await sendEmail({
      to: admin.email,
      subject: 'Media Cleanup Report',
      template: 'media-cleanup-report',
      data: {
        deleted: results.deleted,
        failed: results.failed,
        freedSpace: formatBytes(results.freedSpace),
        details: results.details
      }
    })
  }
}
```

---

## Integration Points

### 1. Article Create/Update Flow

**Before**:
```typescript
// Article saved → Done
```

**After**:
```typescript
// Article saved → Sync media → Done

const handleSaveArticle = async () => {
  // Save article
  const article = await saveArticle(data)

  // Sync media references
  await fetch(`/api/wiki/articles/${article.id}/sync-media`, {
    method: 'POST',
    body: JSON.stringify({ content: data.content })
  })

  router.push(`/wiki/article/${article.slug}`)
}
```

---

### 2. Article Delete Flow

**Update**:
```typescript
// When article is deleted, media becomes orphaned

const deleteArticle = async (articleId: string) => {
  await prisma.$transaction(async (tx) => {
    // Delete article (cascade deletes WikiArticleMedia)
    await tx.wikiArticle.delete({
      where: { id: articleId }
    })

    // Detect orphans immediately
    await detectOrphans()
  })
}
```

---

### 3. Image Upload in Editor

**Enhanced Flow**:
```typescript
// Add "Choose from Library" option

const ArticleEditor = () => {
  const [showMediaPicker, setShowMediaPicker] = useState(false)

  const insertFromLibrary = () => {
    setShowMediaPicker(true)
  }

  const handleMediaSelect = (media) => {
    editor.chain().focus().setImage({
      src: media.url,
      alt: media.alt
    }).run()
    setShowMediaPicker(false)
  }

  return (
    <>
      {/* Toolbar */}
      <button onClick={insertFromLibrary}>
        Choose from Library
      </button>

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={handleMediaSelect}
      />
    </>
  )
}
```

---

## Security & Permissions

### Permission Matrix

| Action | Public | User | Editor | Admin |
|--------|--------|------|--------|-------|
| View Media Library | ❌ | ✅ | ✅ | ✅ |
| Upload Media | ❌ | ✅ | ✅ | ✅ |
| View Own Media | ❌ | ✅ | ✅ | ✅ |
| View All Media | ❌ | ❌ | ✅ | ✅ |
| Delete Own Media | ❌ | ✅ | ✅ | ✅ |
| Delete Any Media | ❌ | ❌ | ❌ | ✅ |
| Run Cleanup | ❌ | ❌ | ❌ | ✅ |
| View Cleanup Logs | ❌ | ❌ | ❌ | ✅ |
| Configure Cleanup | ❌ | ❌ | ❌ | ✅ |

### Permission Checks

```typescript
// Middleware for media endpoints
export const checkMediaPermission = async (
  action: 'view' | 'upload' | 'delete' | 'admin',
  userId: string,
  mediaId?: string
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  })

  if (!user) throw new Error('User not found')

  // Admin can do anything
  if (user.role === 'ADMIN') return true

  switch (action) {
    case 'view':
    case 'upload':
      return true // All authenticated users

    case 'delete':
      if (user.role === 'EDITOR') return true

      // Users can delete their own media
      if (mediaId) {
        const media = await prisma.wikiMedia.findUnique({
          where: { id: mediaId },
          select: { uploadedById: true }
        })
        return media?.uploadedById === userId
      }
      return false

    case 'admin':
      return user.role === 'ADMIN'

    default:
      return false
  }
}
```

---

## User Workflows

### Workflow 1: Upload New Image

1. User clicks "Upload Media" button
2. MediaUploadModal opens
3. User drags/selects file
4. Optional: Add alt text
5. File uploads with progress indicator
6. Success: Media added to library
7. Modal shows "Insert into Article" or "Close"

---

### Workflow 2: Reuse Existing Image

1. User editing article
2. Clicks "Choose from Library" in editor toolbar
3. MediaPickerModal opens showing all media
4. User searches/filters for desired image
5. Clicks on image to preview
6. Clicks "Insert" button
7. Image inserted into editor at cursor position

---

### Workflow 3: Delete Unused Media

1. User opens Media Library
2. Filters by "Orphaned" status
3. Selects multiple orphaned files
4. Clicks "Delete Selected"
5. Confirmation dialog appears
6. Confirms deletion
7. Files deleted from Spaces and marked as deleted in DB

---

### Workflow 4: Admin Runs Cleanup

1. Admin goes to `/admin/wiki/media/cleanup`
2. Sees current orphaned count
3. Clicks "Preview Cleanup"
4. Reviews list of files to be deleted
5. Adjusts "older than X days" if needed
6. Clicks "Run Cleanup"
7. Confirmation dialog
8. Cleanup runs with progress indicator
9. Results displayed with freed space

---

## Implementation Phases

### Phase 1: Database & API Foundation (Week 1)
**Goal**: Set up data layer and basic APIs

**Tasks**:
1. Create Prisma schema additions
2. Run migrations
3. Implement media upload API with DB tracking
4. Implement media list/get APIs
5. Implement media delete API
6. Write unit tests for APIs

**Deliverables**:
- ✅ Database schema updated
- ✅ All API endpoints functional
- ✅ API tests passing

---

### Phase 2: Media Synchronization (Week 1-2)
**Goal**: Track media usage in articles

**Tasks**:
1. Implement sync-media endpoint
2. Add sync call to article create/update
3. Implement orphan detection logic
4. Test sync with various article content

**Deliverables**:
- ✅ Media automatically tracked when articles saved
- ✅ Orphans correctly identified
- ✅ Usage counts accurate

---

### Phase 3: Media Library UI (Week 2-3)
**Goal**: Build user-facing media management interface

**Tasks**:
1. Create MediaLibraryPage component
2. Build MediaCard component
3. Implement grid/list views
4. Add search and filters
5. Build MediaDetailModal
6. Implement pagination
7. Add bulk selection and delete

**Deliverables**:
- ✅ Functional media library at /wiki/media
- ✅ Users can browse, search, filter media
- ✅ Users can view details and delete own media

---

### Phase 4: Editor Integration (Week 3)
**Goal**: Allow media reuse in article editor

**Tasks**:
1. Build MediaPickerModal component
2. Add "Choose from Library" button to editor
3. Integrate media insertion
4. Test upload + reuse workflows

**Deliverables**:
- ✅ Users can choose existing media in editor
- ✅ Upload new + reuse existing both work
- ✅ Smooth user experience

---

### Phase 5: Automatic Cleanup (Week 4)
**Goal**: Implement automatic cleanup system

**Tasks**:
1. Write cleanup function
2. Set up cron job
3. Implement dry-run mode
4. Create cleanup logging
5. Test cleanup thoroughly

**Deliverables**:
- ✅ Cleanup runs automatically daily
- ✅ Orphaned files deleted after 7 days
- ✅ All deletions logged

---

### Phase 6: Admin Interface (Week 4)
**Goal**: Build admin management tools

**Tasks**:
1. Create MediaCleanupPage
2. Build MediaStatsWidget
3. Add manual cleanup trigger
4. Create cleanup history view
5. Add configuration options

**Deliverables**:
- ✅ Admin can view storage stats
- ✅ Admin can manually trigger cleanup
- ✅ Admin can view cleanup history

---

### Phase 7: Polish & Optimization (Week 5)
**Goal**: Refine UX and optimize performance

**Tasks**:
1. Optimize media queries (pagination, indexes)
2. Add image lazy loading
3. Implement thumbnail generation (optional)
4. Add bulk operations
5. Improve error handling
6. Add loading states everywhere
7. Mobile responsiveness

**Deliverables**:
- ✅ Fast, responsive UI
- ✅ Excellent user experience
- ✅ Production-ready

---

## Testing Strategy

### Unit Tests

**API Endpoints**:
```typescript
// __tests__/api/wiki/media/upload.test.ts
describe('POST /api/wiki/media/upload', () => {
  it('should upload image and create DB record')
  it('should reject unauthenticated requests')
  it('should reject invalid file types')
  it('should reject files over size limit')
  it('should extract image dimensions')
})

// __tests__/api/wiki/media/sync.test.ts
describe('POST /api/wiki/articles/:id/sync-media', () => {
  it('should add new media associations')
  it('should remove old media associations')
  it('should update usage counts')
  it('should mark unused media as orphaned')
})

// __tests__/lib/media-cleanup.test.ts
describe('runMediaCleanup', () => {
  it('should find orphaned media older than threshold')
  it('should delete files from Spaces')
  it('should update DB records')
  it('should log deletions')
  it('should handle errors gracefully')
  it('should work in dry-run mode')
})
```

---

### Integration Tests

```typescript
// __tests__/integration/media-workflow.test.ts
describe('Media Workflow', () => {
  it('should complete full upload → use → delete cycle', async () => {
    // 1. Upload media
    const media = await uploadMedia(file)
    expect(media.id).toBeDefined()

    // 2. Create article with media
    const article = await createArticle({
      content: `<img src="${media.url}" />`
    })

    // 3. Sync media
    await syncArticleMedia(article.id)

    // 4. Verify usage tracked
    const updated = await getMedia(media.id)
    expect(updated.usageCount).toBe(1)
    expect(updated.isOrphaned).toBe(false)

    // 5. Delete article
    await deleteArticle(article.id)

    // 6. Verify media orphaned
    const orphaned = await getMedia(media.id)
    expect(orphaned.isOrphaned).toBe(true)

    // 7. Run cleanup (with very short threshold)
    const result = await runMediaCleanup({ olderThanDays: 0 })
    expect(result.deleted).toBe(1)

    // 8. Verify deleted
    const deleted = await getMedia(media.id)
    expect(deleted.status).toBe('DELETED')
  })
})
```

---

### E2E Tests

```typescript
// e2e/media-library.spec.ts
describe('Media Library', () => {
  test('user can upload and manage media', async ({ page }) => {
    // Navigate to media library
    await page.goto('/wiki/media')

    // Upload file
    await page.click('[data-testid="upload-media"]')
    await page.setInputFiles('input[type="file"]', 'test-image.jpg')
    await page.waitForSelector('[data-testid="upload-success"]')

    // Search for uploaded file
    await page.fill('[data-testid="search"]', 'test-image')
    await expect(page.locator('.media-card')).toHaveCount(1)

    // View details
    await page.click('.media-card')
    await expect(page.locator('[data-testid="media-detail"]')).toBeVisible()

    // Delete
    await page.click('[data-testid="delete-media"]')
    await page.click('[data-testid="confirm-delete"]')
    await expect(page.locator('.media-card')).toHaveCount(0)
  })

  test('user can reuse media in article', async ({ page }) => {
    // Create article
    await page.goto('/wiki/article/new')

    // Open media picker
    await page.click('[data-testid="choose-from-library"]')
    await expect(page.locator('[data-testid="media-picker"]')).toBeVisible()

    // Select media
    await page.click('.media-card:first-child')
    await page.click('[data-testid="insert-media"]')

    // Verify inserted
    await expect(page.locator('.ProseMirror img')).toHaveCount(1)
  })
})
```

---

## Performance Considerations

### Database Optimization

**Indexes** (already in schema):
```prisma
@@index([uploadedById])
@@index([status])
@@index([isOrphaned, orphanedAt])
@@index([contentType])
@@index([uploadedAt])
```

**Query Optimization**:
- Use pagination for all lists (max 100 items)
- Use `select` to limit returned fields
- Use `include` only when necessary
- Consider Redis caching for frequently accessed data

---

### Storage Optimization

**Thumbnail Generation** (Future Enhancement):
```typescript
// Generate thumbnails on upload
const generateThumbnail = async (
  imageBuffer: Buffer,
  maxWidth: number = 400
): Promise<Buffer> => {
  const sharp = require('sharp')

  return await sharp(imageBuffer)
    .resize(maxWidth, null, {
      withoutEnlargement: true,
      fit: 'inside'
    })
    .jpeg({ quality: 80 })
    .toBuffer()
}

// Upload both full-size and thumbnail
const fullUrl = await uploadFile(buffer, key, contentType)
const thumbUrl = await uploadFile(
  thumbBuffer,
  `${key}-thumb`,
  'image/jpeg'
)
```

---

### Frontend Optimization

**Lazy Loading**:
```typescript
// Use Intersection Observer for images
const MediaCard = ({ media }) => {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef()

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true)
        observer.disconnect()
      }
    })

    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref}>
      {isVisible ? (
        <img src={media.url} alt={media.alt} />
      ) : (
        <div className="skeleton" />
      )}
    </div>
  )
}
```

**Virtual Scrolling** (for large libraries):
```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

const MediaLibraryGrid = ({ media }) => {
  const parentRef = useRef()

  const virtualizer = useVirtualizer({
    count: media.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,
    overscan: 5
  })

  // Render only visible items
}
```

---

## Error Handling & Edge Cases

### Critical Edge Cases to Handle

#### 1. Upload Failures
**Scenario**: File uploads to Spaces but DB record creation fails

**Solution**:
```typescript
const uploadMedia = async (file: File) => {
  let uploadedKey: string | null = null

  try {
    // 1. Upload to Spaces first
    const { key, url } = await uploadToSpaces(file)
    uploadedKey = key

    // 2. Create DB record
    const media = await prisma.wikiMedia.create({
      data: { ...mediaData }
    })

    return media

  } catch (error) {
    // If DB creation fails, clean up uploaded file
    if (uploadedKey) {
      try {
        await deleteFile(uploadedKey)
        console.log(`Cleaned up orphaned upload: ${uploadedKey}`)
      } catch (cleanupError) {
        // Log but don't throw - file will be caught by orphan cleanup
        console.error(`Failed to cleanup ${uploadedKey}:`, cleanupError)
      }
    }
    throw error
  }
}
```

#### 2. Concurrent Article Edits
**Scenario**: Two users edit same article simultaneously, media sync conflicts

**Solution**:
- Use optimistic concurrency control
- Track article version
- Merge media references (union, not replace)

```typescript
const syncArticleMedia = async (articleId: string, content: string, version: number) => {
  return await prisma.$transaction(async (tx) => {
    // Check version hasn't changed
    const article = await tx.wikiArticle.findUnique({
      where: { id: articleId },
      select: { version: true }
    })

    if (article.version !== version) {
      throw new Error('Article was modified, please refresh')
    }

    // Proceed with sync...
    // Update version
    await tx.wikiArticle.update({
      where: { id: articleId },
      data: { version: { increment: 1 } }
    })
  })
}
```

#### 3. Cleanup Race Conditions
**Scenario**: Cleanup job runs while user is adding media to article

**Solution**:
- Add grace period (minimum 1 hour since upload)
- Re-check usage before deletion
- Use database transactions

```typescript
const cleanupMedia = async (mediaId: string) => {
  return await prisma.$transaction(async (tx) => {
    // Re-check if still orphaned
    const media = await tx.wikiMedia.findUnique({
      where: { id: mediaId },
      include: {
        usedInArticles: { take: 1 }
      }
    })

    if (!media || media.usedInArticles.length > 0) {
      // No longer orphaned, skip
      return { skipped: true }
    }

    // Proceed with deletion
    await deleteFromSpaces(media.key)
    await tx.wikiMedia.update({
      where: { id: mediaId },
      data: { status: 'DELETED' }
    })

    return { deleted: true }
  })
}
```

#### 4. Spaces Deletion Failure
**Scenario**: DB record deleted but Spaces file deletion fails

**Solution**:
- Soft delete in DB first
- Retry Spaces deletion
- Queue for retry if fails

```typescript
const deleteMedia = async (mediaId: string) => {
  // 1. Soft delete in DB first
  const media = await prisma.wikiMedia.update({
    where: { id: mediaId },
    data: {
      status: 'DELETED',
      deletedAt: new Date()
    }
  })

  // 2. Try to delete from Spaces
  try {
    await deleteFile(media.key)
  } catch (error) {
    // Log for manual cleanup or retry
    await prisma.mediaCleanupLog.create({
      data: {
        mediaId: media.id,
        mediaKey: media.key,
        mediaUrl: media.url,
        reason: 'MANUAL_DELETE',
        success: false,
        errorMessage: error.message
      }
    })

    // Queue for retry (future: implement retry queue)
    // For now, will be caught by periodic cleanup check
  }
}
```

#### 5. Large Media Libraries
**Scenario**: User uploads 10,000+ files, pagination becomes slow

**Solution**:
- Cursor-based pagination instead of offset
- Index optimization
- Consider caching layer

```typescript
// Cursor-based pagination
const getMedia = async (cursor?: string, limit = 24) => {
  const media = await prisma.wikiMedia.findMany({
    take: limit + 1, // Get one extra to know if there's more
    ...(cursor ? {
      skip: 1,
      cursor: { id: cursor }
    } : {}),
    orderBy: { uploadedAt: 'desc' }
  })

  const hasMore = media.length > limit
  const items = hasMore ? media.slice(0, -1) : media

  return {
    items,
    nextCursor: hasMore ? items[items.length - 1].id : null
  }
}
```

#### 6. Duplicate Uploads
**Scenario**: User uploads same file multiple times

**Solution**:
- Optional: Calculate file hash
- Detect duplicates
- Offer to reuse existing

```typescript
// Optional enhancement: duplicate detection
import crypto from 'crypto'

const getFileHash = (buffer: Buffer): string => {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

const uploadMedia = async (file: File) => {
  const buffer = Buffer.from(await file.arrayBuffer())
  const hash = getFileHash(buffer)

  // Check for duplicate
  const existing = await prisma.wikiMedia.findFirst({
    where: {
      uploadedById: userId,
      size: buffer.length,
      filename: file.name
      // Optional: store hash in DB and check
    }
  })

  if (existing) {
    return {
      media: existing,
      isDuplicate: true,
      message: 'File already exists'
    }
  }

  // Proceed with upload...
}
```

### Error Recovery Procedures

#### Orphaned Spaces Files (No DB Record)
**Detection Script**:
```typescript
const findOrphanedSpacesFiles = async () => {
  // 1. List all files in Spaces
  const spacesFiles = await listAllFiles('wiki/images/')

  // 2. Get all DB keys
  const dbMedia = await prisma.wikiMedia.findMany({
    select: { key: true }
  })
  const dbKeys = new Set(dbMedia.map(m => m.key))

  // 3. Find orphans
  const orphans = spacesFiles.filter(file => !dbKeys.has(file.key))

  return orphans
}
```

**Recovery Action**:
1. Create DB records for valid files (backfill)
2. Delete truly orphaned files

#### Orphaned DB Records (No Spaces File)
**Detection Script**:
```typescript
const findOrphanedDbRecords = async () => {
  const allMedia = await prisma.wikiMedia.findMany({
    where: { status: 'ACTIVE' }
  })

  const orphaned = []

  for (const media of allMedia) {
    const exists = await checkFileExists(media.key)
    if (!exists) {
      orphaned.push(media)
    }
  }

  return orphaned
}
```

**Recovery Action**:
1. Mark as DELETED in DB
2. Log the issue
3. Notify admin

---

## Future Enhancements

### Phase 8+ (Future)

1. **Image Editing**
   - Crop, rotate, resize
   - Filters and adjustments
   - Built-in editor modal

2. **Advanced Search**
   - Search by image (visual similarity)
   - Color-based search
   - Face detection/tagging

3. **CDN Integration**
   - Cloudflare Images
   - Automatic format conversion (WebP, AVIF)
   - Responsive image srcsets

4. **Analytics**
   - Most used images
   - Storage growth trends
   - User upload statistics

5. **Bulk Operations**
   - Bulk upload
   - Bulk edit (alt text, tags)
   - Bulk move to folders

6. **Folders/Organization**
   - Create folders
   - Move media to folders
   - Folder permissions

7. **Media Types**
   - Video support
   - Audio support
   - PDF previews
   - Document support

8. **AI Features**
   - Auto-generate alt text
   - Auto-tag images
   - Smart crop suggestions
   - Duplicate detection

9. **Version History**
   - Track image versions
   - Rollback to previous version
   - Compare versions

10. **External Integrations**
    - Unsplash integration
    - Pexels integration
    - Google Drive sync
    - Dropbox sync

---

## Migration Plan

### Current State: Demo Articles Only

**Status**: Currently, the system only has demo/test articles. No legacy data migration is required at this time.

**Action**:
- Implement the media library from scratch with the new tracking system
- All future uploads will automatically be tracked in the database
- Demo articles can be recreated or have their media re-uploaded if needed

### Future: External Wiki Migration

When ready to migrate articles from the external wiki system:

**Step 1: Audit External Media**
```typescript
// Script to analyze external wiki media
const auditExternalMedia = async () => {
  // This will be implemented when migration is needed
  // Will depend on the external wiki's API/export format

  // 1. Extract media URLs from external wiki articles
  // 2. Download media files
  // 3. Upload to DigitalOcean Spaces
  // 4. Create WikiMedia records
  // 5. Update article content with new URLs
  // 6. Sync media usage tracking
}
```

**Step 2: Cleanup Test Data**
```typescript
// Before migration, clean up demo/test content
const cleanupDemoData = async () => {
  // 1. List all demo articles
  const demoArticles = await prisma.wikiArticle.findMany({
    where: {
      // Identify demo articles (e.g., by author, tags, or custom flag)
    }
  })

  // 2. Delete demo media
  const demoMedia = await prisma.wikiMedia.findMany({
    where: {
      usedInArticles: {
        every: {
          articleId: { in: demoArticles.map(a => a.id) }
        }
      }
    }
  })

  // Delete from Spaces and DB
  for (const media of demoMedia) {
    await deleteFile(media.key)
    await prisma.wikiMedia.delete({ where: { id: media.id } })
  }

  // 3. Delete demo articles
  await prisma.wikiArticle.deleteMany({
    where: { id: { in: demoArticles.map(a => a.id) } }
  })
}
```

**Note**: The migration strategy will be finalized when the external wiki export format is known.

---

## Configuration

### Environment Variables

```bash
# .env additions

# Media cleanup settings
MEDIA_CLEANUP_ENABLED=true
MEDIA_CLEANUP_DAYS=7
MEDIA_CLEANUP_CRON="0 2 * * *"

# Cron authentication
CRON_SECRET=your-secret-key-here

# Media upload limits
MAX_MEDIA_SIZE=10485760  # 10MB
MAX_MEDIA_PER_USER=1000

# Thumbnail settings (future)
GENERATE_THUMBNAILS=false
THUMBNAIL_MAX_WIDTH=400
```

---

## Documentation for Users

### User Guide: Media Library

**Accessing the Media Library**
1. Navigate to "Wiki" in the main menu
2. Click "Media Library"

**Uploading Media**
1. Click "Upload Media" button
2. Drag and drop files or click to browse
3. Add alt text for accessibility (recommended)
4. Click "Upload"

**Finding Media**
- Use the search bar to search by filename
- Filter by type (images, videos, etc.)
- Filter by status (active, orphaned)
- Sort by date, size, or name

**Using Media in Articles**
- When editing an article, click "Choose from Library"
- Select an image from your library
- Click "Insert"

**Managing Media**
- Click on any media item to view details
- Edit alt text and metadata
- View which articles use the media
- Delete unused media

**Understanding Orphaned Media**
- Media not used in any published article is marked "orphaned"
- Orphaned media is automatically deleted after 7 days
- You can manually delete orphaned media anytime

---

## Summary Checklist

### Must-Have Features (Core Implementation)
- [ ] Database schema for media tracking
- [ ] Media upload with DB recording
- [ ] Media list/search/filter API
- [ ] Media library UI (grid/list view)
- [ ] Media picker modal for editor
- [ ] Automatic media sync on article save
- [ ] Orphan detection
- [ ] Automatic cleanup (cron)
- [ ] Manual cleanup (admin)
- [ ] Cleanup logging
- [ ] Permission system
- [ ] Admin dashboard integration

### Nice-to-Have Features (Future Enhancements)
- [ ] Thumbnail generation
- [ ] Image editing
- [ ] Folders/organization
- [ ] Advanced bulk operations
- [ ] Analytics dashboard
- [ ] External integrations (Unsplash, etc.)

### Documentation Deliverables
- [x] Implementation plan (this document)
- [ ] API documentation (OpenAPI/Swagger)
- [ ] User guide (markdown)
- [ ] Admin guide (markdown)
- [ ] Developer setup guide

### Testing Deliverables
- [ ] Unit tests for all APIs (Jest)
- [ ] Integration tests for workflows
- [ ] E2E tests for UI (Playwright)
- [ ] Load testing (for large media libraries)
- [ ] Cleanup testing (edge cases)

### Deployment Checklist
- [ ] Database migrations run successfully
- [ ] Cron job configured and tested
- [ ] Environment variables set
- [ ] S3/Spaces permissions verified
- [ ] Monitoring alerts configured
- [ ] Backup strategy for media metadata
- [ ] Rollback plan documented

### Pre-Deployment Verification
- [ ] TypeScript compilation passes with no errors
- [ ] All ESLint warnings addressed
- [ ] Build process completes successfully
- [ ] No console errors in development
- [ ] Production build tested locally
- [ ] All API endpoints return expected responses
- [ ] Database migrations tested on staging
- [ ] Environment variables validated

---

## Quality Assurance & Pre-Deployment

### TypeScript & Build Verification

**Critical**: These checks MUST pass before deployment to ensure the app will build and deploy successfully.

#### Step 1: TypeScript Type Checking
```bash
# Run TypeScript compiler in check mode
npx tsc --noEmit

# Expected output: No errors
# If errors exist, fix them before proceeding
```

**Common Issues to Watch For**:
- Missing type definitions for new models (WikiMedia, WikiArticleMedia, etc.)
- Incorrect Prisma types after schema changes
- Missing return type annotations on API routes
- Incorrect prop types in React components

**Fix Process**:
```bash
# If Prisma types are outdated, regenerate them
npx prisma generate

# Then re-run type check
npx tsc --noEmit
```

#### Step 2: Linting
```bash
# Run ESLint to catch code quality issues
pnpm lint

# Fix auto-fixable issues
pnpm lint --fix
```

**Address**:
- Unused imports
- Missing dependencies in useEffect
- Async function issues
- Accessibility warnings

#### Step 3: Build Verification
```bash
# Test production build locally
pnpm build

# Expected: Build completes with no errors
# Watch for:
# - Type errors
# - Missing dependencies
# - Environment variable issues
# - Route conflicts
```

**Build Success Criteria**:
- ✅ All pages compile successfully
- ✅ No TypeScript errors
- ✅ No missing dependencies
- ✅ Bundle size is reasonable (check for large increases)

#### Step 4: Development Server Verification
```bash
# Start dev server and check for runtime errors
pnpm dev

# Check browser console for:
# - No React errors
# - No hydration mismatches
# - No API errors on page load
```

#### Step 5: API Route Testing
```bash
# Test each new API endpoint

# Test media upload
curl -X POST http://localhost:3001/api/wiki/media/upload \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "file=@test-image.jpg"

# Test media list
curl http://localhost:3001/api/wiki/media

# Test media detail
curl http://localhost:3001/api/wiki/media/:id

# Test media delete
curl -X DELETE http://localhost:3001/api/wiki/media/:id
```

**Verify**:
- Authentication works correctly
- Validation errors return proper status codes
- Successful requests return expected data structure
- No database errors in logs

#### Step 6: Database Migration Verification
```bash
# On staging/test database first!
# DO NOT run directly on production

# 1. Backup current database
# 2. Run migrations
npx prisma migrate deploy

# 3. Verify migrations applied
npx prisma migrate status

# 4. Test rollback capability
npx prisma migrate resolve --rolled-back <migration-name>

# 5. Re-apply if needed
npx prisma migrate deploy
```

**Checklist**:
- [ ] Migrations run without errors
- [ ] All tables created successfully
- [ ] Indexes are in place
- [ ] Foreign keys are correct
- [ ] Default values work as expected
- [ ] Rollback plan tested

#### Step 7: Prisma Client Validation
```bash
# Generate Prisma Client
npx prisma generate

# Validate schema
npx prisma validate

# Check database connection
npx prisma db pull --print
```

#### Step 8: Integration Testing
```bash
# Run integration tests
pnpm test:integration

# Test critical paths:
# - Upload media → Save article → Media tracked
# - Delete article → Media orphaned
# - Cleanup job runs → Orphans deleted
```

#### Step 9: Production Build Test
```bash
# Build for production
pnpm build

# Run production build locally
pnpm start

# Test in production mode:
# - All pages load correctly
# - API routes work
# - Static assets load
# - Images from Spaces display
```

**Critical Checks**:
```bash
# Check for build warnings
grep -i "warning" .next/build-output.log

# Check bundle size
ls -lh .next/static/chunks/*.js

# Verify environment variables
node -e "console.log(process.env.DATABASE_URL ? 'DB configured' : 'Missing DB')"
```

#### Step 10: Pre-Deploy Smoke Test Script

Create a comprehensive pre-deployment check script:

```typescript
// scripts/pre-deploy-check.ts

import { PrismaClient } from '@prisma/client'
import { getS3Client } from '@/lib/s3'

const prisma = new PrismaClient()

async function runPreDeployChecks() {
  console.log('🔍 Running pre-deployment checks...\n')

  const checks = {
    database: false,
    s3: false,
    envVars: false,
    migrations: false,
    types: false,
  }

  // 1. Check database connection
  try {
    await prisma.$connect()
    await prisma.user.count()
    checks.database = true
    console.log('✅ Database connection successful')
  } catch (error) {
    console.error('❌ Database connection failed:', error)
  }

  // 2. Check S3/Spaces connection
  try {
    const client = getS3Client()
    // Simple check - don't actually upload
    checks.s3 = true
    console.log('✅ S3/Spaces client initialized')
  } catch (error) {
    console.error('❌ S3/Spaces initialization failed:', error)
  }

  // 3. Check environment variables
  const requiredEnvVars = [
    'DATABASE_URL',
    'DIRECT_URL',
    'S3_ENDPOINT',
    'S3_REGION',
    'S3_BUCKET',
    'S3_ACCESS_KEY_ID',
    'S3_SECRET_ACCESS_KEY',
    'S3_CDN_URL',
  ]

  const missingVars = requiredEnvVars.filter(v => !process.env[v])
  if (missingVars.length === 0) {
    checks.envVars = true
    console.log('✅ All required environment variables present')
  } else {
    console.error('❌ Missing environment variables:', missingVars)
  }

  // 4. Check migrations are up to date
  try {
    // Check if WikiMedia table exists
    await prisma.wikiMedia.findFirst()
    checks.migrations = true
    console.log('✅ Database schema is up to date')
  } catch (error) {
    console.error('❌ Database schema check failed:', error)
  }

  // 5. Check TypeScript compilation
  const { execSync } = require('child_process')
  try {
    execSync('npx tsc --noEmit', { stdio: 'inherit' })
    checks.types = true
    console.log('✅ TypeScript compilation successful')
  } catch (error) {
    console.error('❌ TypeScript errors found')
  }

  // Summary
  console.log('\n📊 Pre-deployment Check Summary:')
  console.log('================================')
  Object.entries(checks).forEach(([check, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${check}`)
  })

  const allPassed = Object.values(checks).every(v => v)

  if (allPassed) {
    console.log('\n🎉 All checks passed! Ready to deploy.')
    process.exit(0)
  } else {
    console.log('\n⚠️  Some checks failed. Fix issues before deploying.')
    process.exit(1)
  }
}

runPreDeployChecks()
  .catch(error => {
    console.error('Fatal error during checks:', error)
    process.exit(1)
  })
  .finally(() => {
    prisma.$disconnect()
  })
```

**Usage**:
```bash
# Add to package.json
{
  "scripts": {
    "pre-deploy": "ts-node scripts/pre-deploy-check.ts"
  }
}

# Run before every deployment
pnpm pre-deploy
```

#### Step 11: Deployment Verification (Post-Deploy)

**After deployment**, verify:

```bash
# 1. Health check
curl https://your-domain.com/api/health

# 2. Database connection
curl https://your-domain.com/api/wiki/categories

# 3. Media upload (authenticated)
curl -X POST https://your-domain.com/api/wiki/media/upload \
  -H "Authorization: Bearer ${PROD_TOKEN}" \
  -F "file=@test-image.jpg"

# 4. Verify image displays
# Open article in browser, check images load from Spaces

# 5. Check logs for errors
# Vercel: Check deployment logs
# Other: Check application logs
```

### Deployment Workflow

**Recommended CI/CD Pipeline**:

```yaml
# .github/workflows/deploy.yml (example for GitHub Actions)

name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Generate Prisma Client
        run: npx prisma generate

      - name: TypeScript Check
        run: npx tsc --noEmit

      - name: Lint
        run: pnpm lint

      - name: Build
        run: pnpm build

      - name: Run Tests
        run: pnpm test

      - name: Pre-deployment checks
        run: pnpm pre-deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          S3_ACCESS_KEY_ID: ${{ secrets.S3_ACCESS_KEY_ID }}
          S3_SECRET_ACCESS_KEY: ${{ secrets.S3_SECRET_ACCESS_KEY }}

      - name: Deploy to Vercel
        if: success()
        run: vercel --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

### Rollback Plan

If deployment fails or critical bugs are discovered:

**Immediate Rollback**:
```bash
# Vercel
vercel rollback

# Or redeploy previous version
vercel --prod <previous-deployment-url>
```

**Database Rollback**:
```bash
# If migrations caused issues
npx prisma migrate resolve --rolled-back <migration-name>

# Restore from backup
# (Specific to your database provider)
```

**Emergency Hotfix**:
1. Revert commit: `git revert <commit-hash>`
2. Push to main: `git push origin main`
3. CI/CD automatically deploys reverted version
4. Fix issue in separate branch
5. Test thoroughly
6. Redeploy

---

## Conclusion

This implementation provides a comprehensive media management solution that:

1. **Prevents Bucket Bloat**: Automatic cleanup of orphaned files
2. **Improves UX**: Users can see and reuse existing media
3. **Maintains Integrity**: Tracks which articles use which media
4. **Scales Well**: Efficient queries, pagination, lazy loading
5. **Admin Friendly**: Statistics, manual controls, audit logs

The phased approach allows for incremental development and testing, with each phase delivering value independently.

**Estimated Total Implementation Time**: 4-5 weeks for full implementation
**Minimum Viable Product (Phases 1-3)**: 2-3 weeks

---

*Document Version: 1.0*
*Last Updated: January 2025*
*Author: Claude (Anthropic)*
