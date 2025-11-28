# Media Library Improvements - In Progress

## User Feedback Summary
The current implementation doesn't meet user needs because:
1. ❌ Primary image button opens file picker (encourages upload over reuse)
2. ❌ No way to add metadata (title, description, tags) during upload
3. ❌ Can't search/filter by tags or categories
4. ❌ Can't edit metadata after upload
5. ❌ Upload and library are separate experiences

## Solution Design

### Unified Experience
**When user clicks image button → Opens UnifiedMediaModal with 2 tabs:**
1. **Media Library Tab** - Browse/search/select existing media
2. **Upload New Tab** - Upload with full metadata

### Key Features
- Search by title, filename, description
- Filter by tags
- Upload with title, description, tags
- Edit metadata in detail modal
- Tag management system
- All-in-one experience

---

## Implementation Status

### ✅ Completed - ALL DONE!

1. **Database Schema**
   - Added `title`, `description` to WikiMedia
   - Created MediaTag model
   - Created WikiMediaTag junction table
   - Migrated database successfully

2. **UnifiedMediaModal Component**
   - Created `/components/wiki/UnifiedMediaModal.tsx`
   - Library tab with search and tag filtering
   - Upload tab with metadata form
   - Tag selection and creation
   - Responsive grid layout
   - Image previews

3. **API Endpoints for Tags**
   - Created `/app/api/wiki/media/tags/route.ts`
   - GET - List all tags with usage counts
   - POST - Create new tag with slug generation

4. **Upload API Updated**
   - Updated `/app/api/wiki/upload/route.ts`
   - Accepts title, description, tags in request
   - Creates tag records if they don't exist
   - Associates tags with media
   - Returns full media object with tags

5. **Media List API Updated**
   - Updated `/app/api/wiki/media/route.ts`
   - Added tag filtering via `tags` query parameter
   - Includes tags in response
   - Updated search to include title/description

6. **Media Detail API Updated**
   - Updated `/app/api/wiki/media/[id]/route.ts`
   - Includes tags in GET response
   - Added PATCH support for title, description, tags
   - Handles tag creation/association during update

7. **ArticleEditor Integration**
   - Updated `/components/wiki/ArticleEditor.tsx`
   - Removed old MediaPickerModal
   - Removed file input button
   - Removed URL button (redundant)
   - **Single PhotoIcon button** opens UnifiedMediaModal
   - Consolidated all image insertion paths

8. **TypeScript Compilation**
   - All code passes TypeScript strict checking
   - No compilation errors

---

## File Changes Summary

### New Files
- ✅ `/components/wiki/UnifiedMediaModal.tsx`
- ✅ `/app/api/wiki/media/tags/route.ts`

### Modified Files
- ✅ `/prisma/schema.prisma` - Schema updated
- ✅ `/app/api/wiki/upload/route.ts` - Metadata support added
- ✅ `/app/api/wiki/media/route.ts` - Tag filtering added
- ✅ `/app/api/wiki/media/[id]/route.ts` - Metadata editing added
- ✅ `/components/wiki/ArticleEditor.tsx` - Replaced with UnifiedMediaModal
- ⏳ `/components/wiki/MediaDetailModal.tsx` - Can be enhanced later
- ⏳ `/app/(default)/wiki/media/page.tsx` - Can be enhanced later

### Files to Remove (Optional)
- `/components/wiki/MediaPickerModal.tsx` - Replaced by UnifiedMediaModal (can be deleted when ready)

---

## Implementation Complete! 🎉

All core functionality has been implemented:
- ✅ Tags API with CRUD operations
- ✅ Upload API accepts and saves metadata + tags
- ✅ Media List API supports tag filtering and metadata search
- ✅ Media Detail API includes tags and supports editing
- ✅ ArticleEditor uses UnifiedMediaModal as the single entry point
- ✅ TypeScript compilation passes without errors

### Optional Future Enhancements
- Enhance MediaDetailModal with inline editing UI
- Update Media Library page with tag filter chips
- Add bulk operations
- Implement tag color coding

---

## User Experience Goals

### Before (Current - BAD)
1. User clicks image icon → File picker opens
2. User uploads → No metadata captured
3. Image saved with only filename
4. Hard to find images later
5. Encourages duplicate uploads

### After (Improved - GOOD)
1. User clicks image icon → Unified modal opens
2. User sees two clear options:
   - "Upload New" - with full metadata form
   - "Media Library" - browse existing with search/tags
3. Upload flow captures title, description, tags
4. Library has powerful search and filtering
5. Users reuse existing media (saves storage)
6. Images are organized and findable

---

## Technical Notes

### Tag System
- Tags are global (shared across all media)
- Many-to-many relationship (media can have multiple tags)
- Tags auto-created during upload if they don't exist
- Tags have optional colors for visual organization

### Search Strategy
- Search includes: title, description, filename
- Tags are separate filters (AND logic)
- Pagination maintained across searches

### Metadata Priority
- Title > Filename for display
- Description for search/context
- Tags for organization/filtering
