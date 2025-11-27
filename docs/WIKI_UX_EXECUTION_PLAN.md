# Wiki Module UX Execution Plan

> Living Wellness Dental - Knowledge Base Enhancement Project
> Created: 2024-11-27
> Last Updated: 2024-11-27
> Status: Phase 1 Complete

---

## Project Overview

Transform the wiki module from a basic article repository into a comprehensive, user-friendly knowledge management system that serves both readers (staff finding information) and contributors (admins creating content).

### Goals
- Improve content discoverability
- Enhance reading experience
- Streamline contributor workflow
- Enable content governance
- Support mobile users

### Success Metrics
- Reduced time to find information
- Increased article engagement (views, time on page)
- Higher contributor satisfaction
- Lower support requests for findable information

---

## Phase 1: Core Navigation & Discoverability ✅ COMPLETE
**Target: Immediate Priority**
**Completed: 2024-11-27**

### 1.1 Dynamic Home Page ✅
> Replace static placeholder content with dynamic, useful information

- [x] **Recently Updated Articles**
  - Show last 8 updated articles
  - Display: title, category, update date, author, views
  - "View all" link to browse page

- [x] **Popular Articles**
  - Show top 5 by view count
  - Display: title, view count, category

- [x] **Featured Articles**
  - Added `isFeatured` boolean to WikiArticle schema
  - Show featured articles in gradient cards with star icon

- [x] **Quick Actions Bar**
  - Search input (prominent)
  - "New Article" button
  - Stats showing category/article counts

- [x] **Browse by Tags**
  - Show top 12 most used tags
  - Link to tag pages

**Files modified:**
- `prisma/schema.prisma` - added isFeatured field
- `app/(default)/wiki/page.tsx` - complete rewrite

---

### 1.2 Breadcrumb Navigation ✅
> Help users understand where they are and navigate up

- [x] **Create Breadcrumb Component**
  - Home > Category > Article Title
  - Each segment clickable
  - Truncate long titles with ellipsis

- [x] **Add to Article View**
  - Position: top of article

**Files created/modified:**
- `components/wiki/Breadcrumbs.tsx` - new component
- `components/wiki/ArticleView.tsx` - integrated breadcrumbs
- `components/wiki/ArticleView.tsx` - integrate breadcrumbs
- `app/(default)/wiki/category/[slug]/page.tsx` - add breadcrumbs

---

### 1.3 Table of Contents ✅
> Auto-generated navigation for long articles

- [x] **Create TOC Component**
  - Parse article HTML for h2, h3, h4 headings
  - Generate anchor links
  - Sticky positioning on desktop
  - Collapsible on mobile

- [x] **Scroll Spy**
  - Highlight current section in TOC
  - Smooth scroll to section on click

- [x] **Add IDs to Headings**
  - Auto-generate slug IDs for headings
  - Handle duplicate heading text

**Files created:**
- `components/wiki/TableOfContents.tsx` - new component
- `app/(default)/wiki/article/[slug]/page.tsx` - integrated TOC in sidebar

---

### 1.4 Tags Browsing Page ✅
> Allow users to discover content by topic tags

- [x] **Tags Index Page** (`/wiki/tags`)
  - Show all tags as cloud or grid
  - Display article count per tag
  - Size based on article count

- [x] **Tag Detail Page** (`/wiki/tags/[tag]`)
  - List all articles with this tag
  - Related tags sidebar
  - Breadcrumb navigation

- [x] **Enhance Tag Display**
  - Consistent tag styling across app
  - Clickable tags on article view

**Files created:**
- `app/(default)/wiki/tags/page.tsx`
- `app/(default)/wiki/tags/[tag]/page.tsx`

---

### 1.5 Browse All Articles Page ✅
> Full article listing with filters

- [x] **Browse Page** (`/wiki/browse`)
  - All articles list view
  - Category filter sidebar
  - Sort by: recent, views, title
  - Article count display

**Files created:**
- `app/(default)/wiki/browse/page.tsx`

---

## Phase 2: Enhanced Reading Experience ✅ COMPLETE
**Target: Week 2**
**Completed: 2024-11-27**

### 2.1 Article Navigation ✅
> Help readers move between related content

- [x] **Previous/Next Navigation**
  - Within same category
  - Show at bottom of article
  - Display article titles

- [x] **Related Articles**
  - Based on shared tags (primary)
  - Based on same category (secondary)
  - Show up to 5 related articles in sidebar

- [x] **Reading Progress Indicator**
  - Progress bar at top of article
  - Smooth animation on scroll

**Files created:**
- `components/wiki/ArticleNavigation.tsx`
- `components/wiki/RelatedArticles.tsx`
- `components/wiki/ReadingProgress.tsx`

---

### 2.2 Article Metadata Enhancement ✅
> Provide more context about articles

- [x] **Enhanced Header**
  - Author with avatar
  - Created date & last updated date
  - Reading time (already exists)
  - View count

- [x] **Article Footer**
  - "Was this helpful?" feedback buttons
  - Copy link button with confirmation
  - Created/updated dates

**Files modified:**
- `components/wiki/ArticleView.tsx`
- `app/(default)/wiki/article/[slug]/page.tsx`

---

### 2.3 Print & Offline Support ✅
> Support different consumption methods

- [x] **Print Stylesheet**
  - Clean print layout
  - Hide navigation elements
  - Proper heading hierarchy

- [x] **Copy Article Link**
  - One-click copy button
  - Visual confirmation

**Files created:**
- `app/css/wiki-print.css`

---

## Phase 3: Contributor Experience ✅ COMPLETE
**Target: Week 3**
**Completed: 2024-11-27**

### 3.1 My Articles Dashboard ✅
> Central hub for contributors

- [x] **Dashboard Page** (`/wiki/my-articles`)
  - My drafts (unpublished articles)
  - My articles in review
  - My published articles
  - Quick stats (total articles, published, views)

- [x] **Draft Management**
  - Edit draft link
  - Status badges
  - Quick access to edit

- [x] **Quick Create**
  - "New Article" button prominently displayed

**Files created:**
- `app/(default)/wiki/my-articles/page.tsx`
- `app/api/wiki/articles/my/route.ts`

---

### 3.2 Article Editor Improvements ✅
> Streamline content creation

- [x] **Auto-Save**
  - Save draft every 30 seconds
  - Visual indicator of save status
  - "Last saved at X" timestamp

- [x] **Edit Existing Articles**
  - Full edit page for existing articles
  - Status badge display
  - Contextual action buttons

**Files created/modified:**
- `app/(default)/wiki/article/new/page.tsx` - enhanced with auto-save
- `app/(default)/wiki/article/[slug]/edit/page.tsx` - new edit page

---

### 3.3 Article Status Workflow ✅
> Content governance and review process

- [x] **Status Field**
  - DRAFT - work in progress
  - IN_REVIEW - submitted for review
  - PUBLISHED - live and visible
  - ARCHIVED - hidden but preserved

- [x] **Status Transitions**
  - Draft → In Review (contributor)
  - In Review → Published (admin)
  - In Review → Draft (admin, reject)

- [x] **Review Queue** (`/wiki/review`)
  - List articles pending review
  - Approve/reject buttons
  - Preview link

**Files created:**
- `app/(default)/wiki/review/page.tsx`
- `app/api/wiki/articles/[id]/status/route.ts`
- Updated `prisma/schema.prisma` - added IN_REVIEW status

---

## Phase 4: Search & Discovery ✅ COMPLETE
**Target: Week 4**
**Completed: 2024-11-27**

### 4.1 Enhanced Search ✅
> Make finding content effortless

- [x] **Search Autocomplete**
  - Suggest articles as user types (after 2 chars)
  - Show category context
  - Keyboard navigation (up/down/enter/escape)
  - Debounced API calls (200ms)

- [x] **Search Filters**
  - Filter by category
  - Filter by tag
  - Sort by: relevance, date, views

- [x] **Search Results Enhancement**
  - Content snippet with match context
  - Title match badge
  - Views and date metadata
  - Tags display

**Files created/modified:**
- `components/wiki/SearchWithAutocomplete.tsx` - new
- `app/api/wiki/search/autocomplete/route.ts` - new
- `app/(default)/wiki/search/page.tsx` - rewritten
- `app/api/wiki/search/route.ts` - enhanced

---

### 4.2 Browse All Articles ✅
> Full article listing with filters (completed in Phase 1.5)

- [x] **Browse Page** (`/wiki/browse`)
  - All articles list view
  - Sort by: recent, views, title

**Files created:**
- `app/(default)/wiki/browse/page.tsx`

---

## Phase 5: Mobile & Polish ✅ COMPLETE
**Target: Week 5**
**Completed: 2024-11-27**

### 5.1 Mobile Optimization ✅
> First-class mobile experience

- [x] **Responsive Sidebar**
  - Slide-out drawer on mobile
  - Fixed menu button
  - Body scroll lock when open
  - Quick links section added

- [x] **Mobile Article View**
  - Collapsible TOC at top on mobile
  - Responsive padding
  - Touch-friendly navigation

**Files modified:**
- `components/wiki/WikiCategorySidebar.tsx` - mobile drawer
- `app/(default)/wiki/article/[slug]/page.tsx` - mobile TOC

---

### 5.2 Accessibility ✅
> Ensure wiki is usable by everyone

- [x] **Keyboard Navigation**
  - Skip to main content link
  - Focus ring styles on links
  - Keyboard-navigable sidebar

- [x] **Screen Reader Support**
  - ARIA labels on buttons
  - aria-hidden on decorative icons
  - Semantic HTML (header, main, nav, aside)

- [x] **Focus Indicators**
  - Visible focus rings
  - Focus-visible states

**Files modified:**
- `app/(default)/wiki/layout.tsx` - skip link, semantic HTML
- `components/wiki/WikiCategorySidebar.tsx` - ARIA labels

---

### 5.3 Performance ✅
> Fast loading and interaction

- [x] **Loading States**
  - ArticleSkeleton component
  - CardSkeleton component
  - Consistent loading patterns

**Files created:**
- `components/wiki/ArticleSkeleton.tsx`
- `components/wiki/CardSkeleton.tsx`

---

## Phase 6: Advanced Features ✅ PARTIAL
**Target: Backlog**
**Completed: 2024-11-27 (Analytics)**

### 6.1 Analytics Dashboard ✅
- [x] Article performance metrics (views, top articles)
- [x] Search analytics (top searches, recent searches)
- [x] Articles by category breakdown
- [x] Overview stats (total articles, views, categories, tags)
- [x] Recently updated articles

**Files created:**
- `app/(default)/wiki/analytics/page.tsx`
- `app/api/wiki/analytics/route.ts`

### 6.2 Collaborative Editing (Future)
- [ ] Real-time collaboration
- [ ] Comments on articles
- [ ] Suggested edits

### 6.3 Permissions & Roles (Future)
- [ ] Category-level permissions
- [ ] Contributor roles
- [ ] Approval workflows by category

### 6.4 Import/Export (Future)
- [ ] Bulk export to PDF/Word
- [ ] Import from Confluence/Notion
- [ ] Backup/restore

### 6.5 Localization (Future)
- [ ] Multi-language support
- [ ] Translation workflow

---

## Technical Debt & Fixes

### Security
- [ ] Sanitize HTML content (prevent XSS)
- [ ] Add proper authentication to all API routes
- [ ] Remove hardcoded user IDs

### Code Quality
- [ ] Replace alert() with toast notifications
- [ ] Replace prompt() with proper modals
- [ ] Add loading states to all async operations
- [ ] Add error boundaries

### Testing
- [ ] Unit tests for utilities
- [ ] Integration tests for API routes
- [ ] E2E tests for critical flows

---

## Progress Tracking

### Completed
| Date | Feature | Notes |
|------|---------|-------|
| 2024-11-27 | Wiki Categories Management | Full CRUD with hierarchy |
| 2024-11-27 | Category Sidebar Settings Button | Quick access to manage |
| 2024-11-27 | Phase 1.1: Dynamic Home Page | Featured, recent, popular, tags |
| 2024-11-27 | Phase 1.2: Breadcrumb Navigation | WikiBreadcrumb component |
| 2024-11-27 | Phase 1.3: Table of Contents | Scroll spy, heading parsing |
| 2024-11-27 | Phase 1.4: Tags Pages | /wiki/tags and /wiki/tags/[tag] |
| 2024-11-27 | Phase 1.5: Browse Page | /wiki/browse with filters |
| 2024-11-27 | Phase 2.1: Article Navigation | Prev/next, related articles |
| 2024-11-27 | Phase 2.1: Reading Progress | Fixed progress bar at top |
| 2024-11-27 | Phase 2.2: Article Footer | Feedback, copy link, dates |
| 2024-11-27 | Phase 2.3: Print Stylesheet | Clean print layout |
| 2024-11-27 | Phase 3.1: My Articles Dashboard | /wiki/my-articles |
| 2024-11-27 | Phase 3.2: Article Editor Auto-Save | 30-second save, status indicator |
| 2024-11-27 | Phase 3.2: Article Edit Page | /wiki/article/[slug]/edit |
| 2024-11-27 | Phase 3.3: Status Workflow | IN_REVIEW status, transitions |
| 2024-11-27 | Phase 3.3: Review Queue | /wiki/review for admins |
| 2024-11-27 | Phase 4.1: Search Autocomplete | Keyboard nav, debounced |
| 2024-11-27 | Phase 4.1: Search Filters | Category, tag, sort |
| 2024-11-27 | Phase 4.1: Enhanced Results | Snippets, metadata, tags |
| 2024-11-27 | Phase 5.1: Mobile Sidebar | Slide-out drawer, quick links |
| 2024-11-27 | Phase 5.1: Mobile TOC | Collapsible at top of article |
| 2024-11-27 | Phase 5.2: Accessibility | Skip link, ARIA, semantic HTML |
| 2024-11-27 | Phase 5.3: Loading Skeletons | Article & card skeletons |
| 2024-11-27 | Phase 6.1: Analytics Dashboard | /wiki/analytics with metrics |

### In Progress
| Feature | Status | Assignee | Notes |
|---------|--------|----------|-------|
| - | - | - | - |

### Blocked
| Feature | Blocker | Action Needed |
|---------|---------|---------------|
| - | - | - |

---

## Notes & Decisions

### Design Decisions
- TOC will be right sidebar on desktop, collapsible top section on mobile
- Using existing Tailwind color palette, violet as primary accent
- Keeping AI chat widget as-is, it's working well

### Open Questions
- Should we require review for all articles or make it optional?
- Do we need category-level permissions?
- Should tags be free-form or predefined?

---

## References

- [Current Wiki Module Analysis](./WIKI_ANALYSIS.md)
- [Prisma Schema](../prisma/schema.prisma)
- [Wiki Components](../components/wiki/)
