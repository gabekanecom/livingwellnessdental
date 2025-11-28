# Media Cleanup Cron Job Setup

This document explains how to set up automated cleanup for orphaned media files in the Wiki module.

## Overview

The media cleanup system automatically identifies and deletes orphaned media files that are:
- Not used in any articles (usageCount = 0)
- Haven't been used in the last 30 days
- Were uploaded at least 7 days ago

## Configuration

### Environment Variables

Add the following to your `.env` file:

```bash
# Cron job authentication secret
CRON_SECRET=your-random-secret-here
```

Generate a secure random secret:
```bash
openssl rand -base64 32
```

### Cleanup Parameters

These are configured in `/app/api/wiki/media/cleanup/route.ts`:

- `GRACE_PERIOD_DAYS = 30` - Files used within this period won't be deleted
- `ORPHAN_AGE_DAYS = 7` - Files must be orphaned for this many days before deletion

## Setup Methods

### Option 1: Vercel Cron Jobs (Recommended for Vercel deployments)

1. Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/wiki/media/cleanup",
      "schedule": "0 2 * * 0"
    }
  ]
}
```

2. The cron expression `0 2 * * 0` means:
   - Run every Sunday at 2:00 AM UTC
   - Adjust as needed for your timezone

3. Vercel automatically handles authentication for cron jobs.

### Option 2: External Cron Service (cron-job.org, EasyCron, etc.)

1. Set up a job with your service to call:
   ```
   POST https://your-domain.com/api/wiki/media/cleanup
   ```

2. Add authentication header:
   ```
   Authorization: Bearer YOUR_CRON_SECRET
   ```

3. Recommended schedule: Weekly (e.g., every Sunday at 2 AM)

### Option 3: System Cron (Linux/macOS)

1. Create a script `cleanup-media.sh`:

```bash
#!/bin/bash
DOMAIN="https://your-domain.com"
SECRET="your-cron-secret"

curl -X POST "$DOMAIN/api/wiki/media/cleanup" \
  -H "Authorization: Bearer $SECRET" \
  -H "Content-Type: application/json"
```

2. Make it executable:
```bash
chmod +x cleanup-media.sh
```

3. Add to crontab:
```bash
crontab -e
```

Add line:
```
0 2 * * 0 /path/to/cleanup-media.sh >> /var/log/wiki-cleanup.log 2>&1
```

## Manual Cleanup

### Preview Orphaned Files

Before running cleanup, preview what would be deleted:

```bash
GET /api/wiki/media/cleanup
```

Response includes:
- List of orphaned media files
- Total count and size
- Configuration parameters

### Run Manual Cleanup

Trigger cleanup manually (requires admin authentication):

```bash
POST /api/wiki/media/cleanup
Authorization: Bearer YOUR_CRON_SECRET
```

Response includes:
- Number of files found
- Number successfully deleted
- Number of failures
- Error details

## Monitoring

### Cleanup Logs

All cleanup operations are logged in the `MediaCleanupLog` table:

```sql
SELECT * FROM "MediaCleanupLog"
ORDER BY "cleanedAt" DESC
LIMIT 20;
```

### Query Orphaned Files

To see current orphaned files:

```sql
SELECT
  filename,
  size,
  "uploadedAt",
  "lastUsedAt",
  "usageCount"
FROM "WikiMedia"
WHERE "usageCount" = 0
  AND "status" = 'ACTIVE'
ORDER BY "uploadedAt" ASC;
```

### Storage Space Recovered

```sql
SELECT
  COUNT(*) as files_cleaned,
  SUM(CAST((metadata->>'size')::int AS bigint)) / 1024 / 1024 as mb_recovered
FROM "MediaCleanupLog"
WHERE success = true
  AND reason = 'AUTO_ORPHAN_CLEANUP'
  AND "cleanedAt" > NOW() - INTERVAL '30 days';
```

## Safety Features

1. **Grace Period**: Files used within 30 days are never deleted
2. **Orphan Age**: Files must be unused for 7+ days before deletion
3. **Soft Delete**: Files are marked as DELETED in DB first
4. **Logging**: Every cleanup operation is logged
5. **Usage Tracking**: Automatic sync tracks article-media relationships

## Troubleshooting

### Cleanup Not Running

1. Check cron job is configured correctly
2. Verify `CRON_SECRET` environment variable is set
3. Check application logs for errors

### Files Not Being Deleted

1. Verify orphan detection criteria (grace period, orphan age)
2. Check if files are actually in use (usageCount > 0)
3. Look at MediaCleanupLog for error messages

### False Positives

If files are being deleted that shouldn't be:
1. Check article-media sync is working correctly
2. Verify sync endpoint is called on article save
3. Increase `GRACE_PERIOD_DAYS` or `ORPHAN_AGE_DAYS`

## Best Practices

1. **Monitor First**: Run preview endpoint before first automated cleanup
2. **Start Conservative**: Begin with longer grace periods (60+ days)
3. **Regular Monitoring**: Check cleanup logs weekly
4. **Backup Policy**: Ensure your storage provider has backup/versioning
5. **Manual Review**: Periodically review orphaned files manually before automated deletion

## Testing

### Test in Development

```bash
# Preview what would be cleaned up
curl http://localhost:3000/api/wiki/media/cleanup

# Run cleanup (requires auth)
curl -X POST http://localhost:3000/api/wiki/media/cleanup \
  -H "Authorization: Bearer test-secret"
```

### Test Article-Media Sync

1. Create an article with an image
2. Check `WikiArticleMedia` table for association
3. Check `WikiMedia.usageCount` is updated
4. Remove image from article
5. Verify association is removed and count decremented
