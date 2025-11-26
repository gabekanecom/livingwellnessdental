# Living Wellness Dental Wiki Module - Development Plan

## 🚀 Implementation Status

**Last Updated:** November 25, 2025

### ✅ Core Implementation Completed:
1. ✅ All dependencies installed (Prisma, TipTap, @heroicons/react, OpenAI, etc.)
2. ✅ Prisma initialized with complete database schema
3. ✅ Database migrations created and applied successfully
4. ✅ Prisma client generated
5. ✅ TypeScript types and interfaces created
6. ✅ Wiki constants and utility functions implemented
7. ✅ WikiContext provider for state management
8. ✅ Core React components:
   - SearchBar, WikiBreadcrumb, ArticleCard
   - CategoryTree, WikiSidebar, ArticleView
   - ArticleEditor with TipTap rich text editor
9. ✅ Complete API routes:
   - `/api/wiki/categories` - CRUD for categories
   - `/api/wiki/articles` - CRUD for articles with versioning
   - `/api/wiki/search` - Full-text search
   - `/api/wiki/embeddings` - AI embedding generation
10. ✅ Wiki pages implemented:
    - `/wiki` - Home page
    - `/wiki/article/[slug]` - Article view
    - `/wiki/article/new` - Create article
    - `/wiki/category/[slug]` - Category view
    - `/wiki/search` - Search results
11. ✅ Seed script created with sample data

### 📝 Setup Notes:
- **Database:** Prisma Postgres running locally (use `npx prisma dev start default`)
- **pgvector:** Commented out temporarily (not available in local dev environment)
- **Seed Data:** Script created at `prisma/seed.ts` (requires manual setup due to import path configuration)

### 🔄 Next Steps for Production:
1. Integrate with existing authentication system (replace placeholder user IDs)
2. Enable pgvector extension in production database
3. Uncomment WikiEmbedding model and regenerate migrations
4. Add admin pages for category management
5. Implement file upload functionality for article images
6. Add role-based permissions (read/write/admin)
7. Set up automated embedding generation on article publish
8. Create initial categories and articles through the UI or manually run seed script

---

## Executive Summary

This document outlines the complete development plan for a training documentation wiki module within the Living Wellness Dental application. The wiki will serve as a centralized knowledge base for staff training, operational procedures, and company documentation with AI-ready vectorization capabilities.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technical Architecture](#2-technical-architecture)
3. [Database Schema](#3-database-schema)
4. [Feature Specifications](#4-feature-specifications)
5. [UI/UX Design Principles](#5-uiux-design-principles)
6. [AI Integration & Vectorization](#6-ai-integration--vectorization)
7. [Development Phases](#7-development-phases)
8. [Step-by-Step Implementation Guide](#8-step-by-step-implementation-guide)

---

## 1. Project Overview

### 1.1 Goals
- Create an intuitive, searchable wiki for training documentation
- Enable easy content organization with hierarchical categories
- Provide rich text editing capabilities for content creators
- Implement full-text and semantic search
- Prepare content for AI integration via vector embeddings
- Follow the existing app architecture and design patterns

### 1.2 Target Users
- **Readers**: All staff members accessing training materials
- **Writers/Editors**: Managers and designated content creators
- **Administrators**: System admins managing structure and permissions

### 1.3 Key Requirements
- Seamless integration with existing Next.js 15 / React 19 architecture
- Consistent UI using existing Tailwind CSS v4 and component patterns
- Mobile-responsive design
- Role-based access control (read/write/admin)
- Version history for articles
- AI-ready content vectorization

---

## 2. Technical Architecture

### 2.1 Tech Stack Alignment
```
Framework:        Next.js 15.1.6 (existing)
UI:               Tailwind CSS v4, Headless UI, Radix UI (existing)
State:            React Context API (existing pattern)
Database:         PostgreSQL via Prisma ORM (new)
Search:           PostgreSQL full-text + pgvector extension
Vector Store:     pgvector for embeddings
Rich Text Editor: TipTap (headless, React-friendly)
File Storage:     Vercel Blob or S3-compatible storage
```

### 2.2 Folder Structure
```
app/
├── (default)/
│   └── wiki/
│       ├── page.tsx                    # Wiki home/dashboard
│       ├── layout.tsx                  # Wiki-specific layout
│       ├── search/
│       │   └── page.tsx                # Search results page
│       ├── category/
│       │   └── [slug]/
│       │       └── page.tsx            # Category listing
│       ├── article/
│       │   ├── [slug]/
│       │   │   └── page.tsx            # Article view
│       │   └── new/
│       │       └── page.tsx            # Create article
│       ├── edit/
│       │   └── [slug]/
│       │       └── page.tsx            # Edit article
│       └── admin/
│           ├── page.tsx                # Admin dashboard
│           ├── categories/
│           │   └── page.tsx            # Category management
│           └── users/
│               └── page.tsx            # Permission management

├── api/
│   └── wiki/
│       ├── articles/
│       │   ├── route.ts                # GET all, POST new
│       │   └── [id]/
│       │       ├── route.ts            # GET, PUT, DELETE article
│       │       └── versions/
│       │           └── route.ts        # Version history
│       ├── categories/
│       │   ├── route.ts                # GET all, POST new
│       │   └── [id]/
│       │       └── route.ts            # GET, PUT, DELETE category
│       ├── search/
│       │   └── route.ts                # Full-text & semantic search
│       ├── embeddings/
│       │   └── route.ts                # Generate/update embeddings
│       └── upload/
│           └── route.ts                # File uploads

components/
├── wiki/
│   ├── WikiSidebar.tsx                 # Wiki navigation sidebar
│   ├── WikiBreadcrumb.tsx              # Breadcrumb navigation
│   ├── ArticleCard.tsx                 # Article preview card
│   ├── ArticleList.tsx                 # Article listing component
│   ├── ArticleView.tsx                 # Article reading view
│   ├── ArticleEditor.tsx               # TipTap rich text editor
│   ├── CategoryTree.tsx                # Hierarchical category nav
│   ├── SearchBar.tsx                   # Search input component
│   ├── SearchResults.tsx               # Search results display
│   ├── TableOfContents.tsx             # In-article TOC
│   ├── VersionHistory.tsx              # Article versions
│   ├── WikiHeader.tsx                  # Wiki section header
│   └── TagInput.tsx                    # Tag management

lib/
├── wiki/
│   ├── types.ts                        # TypeScript interfaces
│   ├── constants.ts                    # Wiki constants
│   ├── utils.ts                        # Wiki utilities
│   └── embeddings.ts                   # Vector embedding utilities

contexts/
└── WikiContext.tsx                     # Wiki state management
```

### 2.3 Data Flow Architecture
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React UI      │────▶│   API Routes    │────▶│   PostgreSQL    │
│   Components    │◀────│   (Next.js)     │◀────│   + pgvector    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │   OpenAI API    │
                        │   (Embeddings)  │
                        └─────────────────┘
```

---

## 3. Database Schema

### 3.1 Prisma Schema
```prisma
// prisma/schema.prisma additions

model WikiCategory {
  id          String         @id @default(cuid())
  name        String
  slug        String         @unique
  description String?
  icon        String?
  parentId    String?
  parent      WikiCategory?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    WikiCategory[] @relation("CategoryHierarchy")
  articles    WikiArticle[]
  order       Int            @default(0)
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
}

model WikiArticle {
  id           String              @id @default(cuid())
  title        String
  slug         String              @unique
  content      String              @db.Text
  contentPlain String              @db.Text        // Plain text for search
  excerpt      String?
  coverImage   String?
  status       ArticleStatus       @default(DRAFT)
  categoryId   String
  category     WikiCategory        @relation(fields: [categoryId], references: [id])
  authorId     String
  author       User                @relation(fields: [authorId], references: [id])
  tags         WikiTag[]
  versions     WikiArticleVersion[]
  views        Int                 @default(0)
  order        Int                 @default(0)
  publishedAt  DateTime?
  createdAt    DateTime            @default(now())
  updatedAt    DateTime            @updatedAt

  @@index([categoryId])
  @@index([authorId])
  @@index([status])
}

model WikiArticleVersion {
  id         String      @id @default(cuid())
  articleId  String
  article    WikiArticle @relation(fields: [articleId], references: [id], onDelete: Cascade)
  title      String
  content    String      @db.Text
  authorId   String
  author     User        @relation(fields: [authorId], references: [id])
  createdAt  DateTime    @default(now())

  @@index([articleId])
}

model WikiTag {
  id       String        @id @default(cuid())
  name     String        @unique
  slug     String        @unique
  articles WikiArticle[]
}

model WikiEmbedding {
  id         String   @id @default(cuid())
  articleId  String   @unique
  embedding  Unsupported("vector(1536)")
  chunkIndex Int      @default(0)
  chunkText  String   @db.Text
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([articleId])
}

model WikiSearchLog {
  id        String   @id @default(cuid())
  query     String
  userId    String?
  results   Int
  createdAt DateTime @default(now())
}

enum ArticleStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}
```

### 3.2 PostgreSQL Extensions Required
```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;      -- Fuzzy text search
CREATE EXTENSION IF NOT EXISTS pgvector;      -- Vector similarity search
CREATE EXTENSION IF NOT EXISTS unaccent;      -- Accent-insensitive search

-- Create search configuration
CREATE TEXT SEARCH CONFIGURATION wiki_search (COPY = english);
ALTER TEXT SEARCH CONFIGURATION wiki_search
  ALTER MAPPING FOR hword, hword_part, word WITH unaccent, english_stem;

-- Add full-text search index
CREATE INDEX wiki_article_search_idx ON "WikiArticle" 
  USING GIN (to_tsvector('wiki_search', coalesce(title,'') || ' ' || coalesce("contentPlain",'')));

-- Add vector similarity index
CREATE INDEX wiki_embedding_vector_idx ON "WikiEmbedding" 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

---

## 4. Feature Specifications

### 4.1 Core Features

#### 4.1.1 Article Management
- Create, edit, publish, archive articles
- Rich text editor with formatting (headings, lists, tables, code blocks, images)
- Auto-save drafts every 30 seconds
- Version history with diff view
- Cover images and excerpts
- Custom slugs for SEO-friendly URLs

#### 4.1.2 Organization
- Hierarchical categories (unlimited depth)
- Tags for cross-category linking
- Drag-and-drop reordering
- Bulk operations (move, archive, delete)

#### 4.1.3 Navigation & Discovery
- Category tree sidebar
- Breadcrumb navigation
- Related articles suggestions
- Recently viewed articles
- Popular/trending articles
- Table of contents for long articles

#### 4.1.4 Search
- Full-text search with highlighting
- Fuzzy matching for typos
- Filter by category, tag, author, date
- Search suggestions/autocomplete
- Semantic search using vector similarity

#### 4.1.5 User Features
- Bookmark/favorite articles
- Reading progress tracking
- Article feedback (helpful/not helpful)
- Print-friendly view

### 4.2 Writer/Editor Features
- WYSIWYG editor with markdown support
- Image upload and management
- Link to other wiki articles (internal links)
- Preview mode
- Publishing workflow (draft → review → published)
- Article templates

### 4.3 Admin Features
- Category structure management
- User permission management
- Content moderation
- Analytics dashboard (views, searches, popular content)
- Bulk import/export
- Audit log

---

## 5. UI/UX Design Principles

### 5.1 Reader Experience

#### 5.1.1 Clean Reading Interface
- Maximum content width of 720px for optimal readability
- Typography: 18px base size, 1.7 line height
- Generous whitespace and padding
- High contrast text (gray-900 on white)
- Syntax highlighting for code blocks

#### 5.1.2 Effortless Navigation
- Persistent category sidebar (collapsible on mobile)
- Sticky table of contents for long articles
- Keyboard shortcuts (j/k for next/prev, / for search)
- "Back to top" button
- Progress indicator for long articles

#### 5.1.3 Quick Information Access
- Search always accessible (top of sidebar)
- Category icons for visual recognition
- Article cards show reading time estimate
- Clear visual hierarchy in listings

### 5.2 Writer Experience

#### 5.2.1 Distraction-Free Writing
- Full-screen editor option
- Minimal toolbar (expandable for advanced options)
- Live preview side-by-side or toggle
- Word count and reading time estimate
- Autosave with visual indicator

#### 5.2.2 Efficient Content Management
- Quick-access recent drafts
- Template library
- Bulk media upload
- Internal link autocomplete
- Drag-and-drop image insertion

### 5.3 Mobile Responsiveness
- Collapsible sidebar (hamburger menu)
- Touch-friendly navigation
- Swipe gestures for navigation
- Responsive images
- Mobile-optimized editor

### 5.4 Accessibility
- ARIA labels on all interactive elements
- Keyboard navigation support
- Screen reader optimized
- Sufficient color contrast (WCAG AA)
- Focus indicators

### 5.5 Component Design Patterns
```
┌─────────────────────────────────────────────────────────────────┐
│ Header (existing app header)                                     │
├──────────────┬──────────────────────────────────────────────────┤
│              │  Breadcrumb: Wiki > Category > Article           │
│   Category   ├──────────────────────────────────────────────────┤
│    Tree      │                                                   │
│   Sidebar    │     Article Title                                │
│              │     Author • Date • 5 min read                   │
│  ┌────────┐  │     ─────────────────────────────                │
│  │ Search │  │                                                   │
│  └────────┘  │     Article content with proper          ┌─────┐ │
│              │     typography and spacing...            │ TOC │ │
│  Categories  │                                          │     │ │
│  ├── Intro   │     ## Heading                           │ •─┐ │ │
│  ├── HR      │     Content...                           │ •─┤ │ │
│  │   ├── On  │                                          │ •─┘ │ │
│  │   └── Off │     ## Another Heading                   └─────┘ │
│  └── Ops     │     Content...                                   │
│              │                                                   │
│  Recent      │     [Related Articles]                           │
│  • Article 1 │                                                   │
│  • Article 2 │     Was this helpful? [Yes] [No]                 │
└──────────────┴──────────────────────────────────────────────────┘
```

---

## 6. AI Integration & Vectorization

### 6.1 Embedding Strategy

#### 6.1.1 When to Generate Embeddings
- On article publish/update
- Batch process for existing content
- Regenerate on content structure changes

#### 6.1.2 Chunking Strategy
```typescript
// Chunk articles for optimal embedding
const CHUNK_SIZE = 1000;      // tokens
const CHUNK_OVERLAP = 200;    // tokens overlap between chunks

interface EmbeddingChunk {
  articleId: string;
  chunkIndex: number;
  chunkText: string;
  embedding: number[];        // 1536 dimensions for text-embedding-3-small
  metadata: {
    title: string;
    category: string;
    headingPath: string[];    // Section hierarchy
  };
}
```

#### 6.1.3 Embedding Generation Flow
```
Article Saved
     │
     ▼
Extract Plain Text
     │
     ▼
Split into Chunks (by headings + size)
     │
     ▼
Generate Embeddings (OpenAI API)
     │
     ▼
Store in pgvector
     │
     ▼
Index for Similarity Search
```

### 6.2 Search Implementation

#### 6.2.1 Hybrid Search Strategy
```typescript
async function hybridSearch(query: string): Promise<SearchResult[]> {
  // 1. Full-text search (PostgreSQL tsvector)
  const textResults = await fullTextSearch(query);
  
  // 2. Semantic search (vector similarity)
  const queryEmbedding = await generateEmbedding(query);
  const semanticResults = await vectorSearch(queryEmbedding);
  
  // 3. Combine and rank results
  return mergeAndRankResults(textResults, semanticResults);
}
```

#### 6.2.2 Vector Search Query
```sql
SELECT 
  wa.id,
  wa.title,
  wa.excerpt,
  we.chunk_text,
  1 - (we.embedding <=> $1) as similarity
FROM wiki_embedding we
JOIN wiki_article wa ON wa.id = we.article_id
WHERE wa.status = 'PUBLISHED'
ORDER BY we.embedding <=> $1
LIMIT 10;
```

### 6.3 AI Chatbot Integration Points

#### 6.3.1 Context Retrieval API
```typescript
// API endpoint for AI systems
// GET /api/wiki/ai/context?query=...

interface AIContextResponse {
  query: string;
  relevantChunks: {
    articleId: string;
    articleTitle: string;
    articleUrl: string;
    chunkText: string;
    similarity: number;
  }[];
  suggestedArticles: {
    id: string;
    title: string;
    url: string;
  }[];
}
```

#### 6.3.2 Content Generation Support
```typescript
// API endpoint for AI content creation
// POST /api/wiki/ai/generate

interface GenerateRequest {
  type: 'outline' | 'draft' | 'improve' | 'summarize';
  context: {
    title?: string;
    category?: string;
    existingContent?: string;
    relatedArticles?: string[];
  };
  instructions: string;
}
```

### 6.4 Future AI Features (Prepared For)
- AI-powered article summarization
- Auto-generate related article suggestions
- Content gap analysis
- Auto-tagging
- Translation support
- Q&A chatbot interface

---

## 7. Development Phases

### Phase 1: Foundation (Week 1-2)
- Database setup with Prisma
- Basic CRUD API routes
- Core TypeScript types and utilities
- Wiki layout and navigation components

### Phase 2: Reading Experience (Week 3-4)
- Category tree navigation
- Article view page
- Breadcrumb navigation
- Table of contents
- Basic search (full-text)

### Phase 3: Writing Experience (Week 5-6)
- TipTap editor integration
- Image upload
- Draft auto-save
- Version history
- Publishing workflow

### Phase 4: Advanced Features (Week 7-8)
- Advanced search with filters
- Tags and related articles
- Bookmarks and reading history
- Article feedback
- Print view

### Phase 5: AI Integration (Week 9-10)
- Vector embedding generation
- Semantic search
- AI context API
- Admin analytics

### Phase 6: Polish & Testing (Week 11-12)
- Performance optimization
- Accessibility audit
- Mobile testing
- Documentation
- User acceptance testing

---

## 8. Step-by-Step Implementation Guide

Below are the detailed implementation steps for Claude Code to execute in sequence.

---

### STEP 1: Install Dependencies

```bash
# Database and ORM
npm install prisma @prisma/client

# Rich text editor
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/extension-image @tiptap/extension-link @tiptap/extension-code-block-lowlight @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-cell @tiptap/extension-table-header @tiptap/extension-highlight @tiptap/extension-typography

# Syntax highlighting for code blocks
npm install lowlight

# Slug generation
npm install slugify

# Date formatting
npm install date-fns

# AI/Embeddings (for later phases)
npm install openai

# File uploads
npm install @vercel/blob
```

---

### STEP 2: Initialize Prisma

```bash
npx prisma init
```

Then update `prisma/schema.prisma` with the wiki models defined in Section 3.1.

---

### STEP 3: Create TypeScript Types

Create `/lib/wiki/types.ts`:

```typescript
export interface WikiCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parentId?: string;
  parent?: WikiCategory;
  children?: WikiCategory[];
  articles?: WikiArticle[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WikiArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  contentPlain: string;
  excerpt?: string;
  coverImage?: string;
  status: ArticleStatus;
  categoryId: string;
  category?: WikiCategory;
  authorId: string;
  author?: User;
  tags?: WikiTag[];
  versions?: WikiArticleVersion[];
  views: number;
  order: number;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface WikiArticleVersion {
  id: string;
  articleId: string;
  title: string;
  content: string;
  authorId: string;
  author?: User;
  createdAt: Date;
}

export interface WikiTag {
  id: string;
  name: string;
  slug: string;
}

export interface WikiSearchResult {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  categoryName: string;
  categorySlug: string;
  highlights?: string[];
  score: number;
}

export type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}
```

---

### STEP 4: Create Wiki Constants

Create `/lib/wiki/constants.ts`:

```typescript
export const WIKI_CONFIG = {
  ARTICLE_EXCERPT_LENGTH: 200,
  SEARCH_RESULTS_PER_PAGE: 20,
  ARTICLES_PER_PAGE: 20,
  AUTO_SAVE_INTERVAL: 30000, // 30 seconds
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  READING_SPEED_WPM: 200, // words per minute for reading time estimate
};

export const CATEGORY_ICONS = {
  general: 'BookOpenIcon',
  hr: 'UsersIcon',
  operations: 'CogIcon',
  clinical: 'HeartIcon',
  training: 'AcademicCapIcon',
  policies: 'DocumentTextIcon',
  safety: 'ShieldCheckIcon',
  technology: 'ComputerDesktopIcon',
};

export const EDITOR_EXTENSIONS = [
  'bold',
  'italic',
  'underline',
  'strike',
  'heading',
  'bulletList',
  'orderedList',
  'taskList',
  'blockquote',
  'codeBlock',
  'table',
  'image',
  'link',
  'highlight',
];
```

---

### STEP 5: Create Wiki Utilities

Create `/lib/wiki/utils.ts`:

```typescript
import slugify from 'slugify';
import { WIKI_CONFIG } from './constants';

export function generateSlug(title: string): string {
  return slugify(title, {
    lower: true,
    strict: true,
    trim: true,
  });
}

export function calculateReadingTime(content: string): number {
  const plainText = stripHtml(content);
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  return Math.ceil(wordCount / WIKI_CONFIG.READING_SPEED_WPM);
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

export function generateExcerpt(content: string, length = WIKI_CONFIG.ARTICLE_EXCERPT_LENGTH): string {
  const plainText = stripHtml(content);
  if (plainText.length <= length) return plainText;
  return plainText.substring(0, length).trim() + '...';
}

export function extractHeadings(html: string): { level: number; text: string; id: string }[] {
  const headingRegex = /<h([1-6])[^>]*id="([^"]*)"[^>]*>([^<]*)<\/h[1-6]>/gi;
  const headings: { level: number; text: string; id: string }[] = [];
  let match;
  
  while ((match = headingRegex.exec(html)) !== null) {
    headings.push({
      level: parseInt(match[1]),
      text: match[3],
      id: match[2],
    });
  }
  
  return headings;
}

export function buildCategoryTree(categories: any[]): any[] {
  const map = new Map();
  const roots: any[] = [];

  categories.forEach(cat => {
    map.set(cat.id, { ...cat, children: [] });
  });

  categories.forEach(cat => {
    const node = map.get(cat.id);
    if (cat.parentId && map.has(cat.parentId)) {
      map.get(cat.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

export function flattenCategoryTree(tree: any[], depth = 0): any[] {
  const result: any[] = [];
  
  tree.forEach(node => {
    result.push({ ...node, depth });
    if (node.children?.length) {
      result.push(...flattenCategoryTree(node.children, depth + 1));
    }
  });
  
  return result;
}
```

---

### STEP 6: Create Wiki Context Provider

Create `/contexts/WikiContext.tsx`:

```typescript
'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { WikiCategory, WikiArticle, WikiSearchResult } from '@/lib/wiki/types';

interface WikiContextType {
  categories: WikiCategory[];
  setCategories: (categories: WikiCategory[]) => void;
  currentCategory: WikiCategory | null;
  setCurrentCategory: (category: WikiCategory | null) => void;
  currentArticle: WikiArticle | null;
  setCurrentArticle: (article: WikiArticle | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: WikiSearchResult[];
  setSearchResults: (results: WikiSearchResult[]) => void;
  isSearching: boolean;
  setIsSearching: (isSearching: boolean) => void;
  recentArticles: WikiArticle[];
  addToRecentArticles: (article: WikiArticle) => void;
  sidebarExpanded: boolean;
  setSidebarExpanded: (expanded: boolean) => void;
  expandedCategories: Set<string>;
  toggleCategoryExpanded: (categoryId: string) => void;
}

const WikiContext = createContext<WikiContextType | undefined>(undefined);

export function WikiProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<WikiCategory[]>([]);
  const [currentCategory, setCurrentCategory] = useState<WikiCategory | null>(null);
  const [currentArticle, setCurrentArticle] = useState<WikiArticle | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WikiSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentArticles, setRecentArticles] = useState<WikiArticle[]>([]);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const addToRecentArticles = useCallback((article: WikiArticle) => {
    setRecentArticles(prev => {
      const filtered = prev.filter(a => a.id !== article.id);
      return [article, ...filtered].slice(0, 10);
    });
  }, []);

  const toggleCategoryExpanded = useCallback((categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  return (
    <WikiContext.Provider
      value={{
        categories,
        setCategories,
        currentCategory,
        setCurrentCategory,
        currentArticle,
        setCurrentArticle,
        searchQuery,
        setSearchQuery,
        searchResults,
        setSearchResults,
        isSearching,
        setIsSearching,
        recentArticles,
        addToRecentArticles,
        sidebarExpanded,
        setSidebarExpanded,
        expandedCategories,
        toggleCategoryExpanded,
      }}
    >
      {children}
    </WikiContext.Provider>
  );
}

export function useWiki() {
  const context = useContext(WikiContext);
  if (context === undefined) {
    throw new Error('useWiki must be used within a WikiProvider');
  }
  return context;
}
```

---

### STEP 7: Create Wiki Layout

Create `/app/(default)/wiki/layout.tsx`:

```typescript
import { WikiProvider } from '@/contexts/WikiContext';
import WikiSidebar from '@/components/wiki/WikiSidebar';

export const metadata = {
  title: 'Wiki - Living Wellness Dental',
  description: 'Training documentation and knowledge base',
};

export default function WikiLayout({ children }: { children: React.ReactNode }) {
  return (
    <WikiProvider>
      <div className="flex h-full">
        <WikiSidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </WikiProvider>
  );
}
```

---

### STEP 8: Create Wiki Sidebar Component

Create `/components/wiki/WikiSidebar.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWiki } from '@/contexts/WikiContext';
import SearchBar from './SearchBar';
import CategoryTree from './CategoryTree';

export default function WikiSidebar() {
  const pathname = usePathname();
  const { 
    categories, 
    setCategories, 
    recentArticles,
    sidebarExpanded,
    setSidebarExpanded 
  } = useWiki();

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/wiki/categories');
        const data = await res.json();
        setCategories(data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    }
    fetchCategories();
  }, [setCategories]);

  return (
    <aside className={`
      ${sidebarExpanded ? 'w-72' : 'w-0 -ml-72'}
      shrink-0 border-r border-gray-200 bg-white
      transition-all duration-300 overflow-hidden
      lg:w-72 lg:ml-0
    `}>
      <div className="h-full flex flex-col p-4">
        {/* Search */}
        <div className="mb-6">
          <SearchBar />
        </div>

        {/* New Article Button */}
        <Link
          href="/wiki/article/new"
          className="mb-6 flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Article
        </Link>

        {/* Category Tree */}
        <div className="flex-1 overflow-auto">
          <h3 className="text-xs font-semibold uppercase text-gray-500 mb-3">Categories</h3>
          <CategoryTree categories={categories} currentPath={pathname} />
        </div>

        {/* Recent Articles */}
        {recentArticles.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-xs font-semibold uppercase text-gray-500 mb-3">Recently Viewed</h3>
            <ul className="space-y-1">
              {recentArticles.slice(0, 5).map((article) => (
                <li key={article.id}>
                  <Link
                    href={`/wiki/article/${article.slug}`}
                    className="block text-sm text-gray-700 hover:text-violet-600 truncate py-1"
                  >
                    {article.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
}
```

---

### STEP 9: Create Category Tree Component

Create `/components/wiki/CategoryTree.tsx`:

```typescript
'use client';

import Link from 'next/link';
import { useWiki } from '@/contexts/WikiContext';
import { WikiCategory } from '@/lib/wiki/types';
import { buildCategoryTree } from '@/lib/wiki/utils';

interface CategoryTreeProps {
  categories: WikiCategory[];
  currentPath: string;
}

interface CategoryNodeProps {
  category: WikiCategory & { children?: WikiCategory[] };
  currentPath: string;
  depth?: number;
}

function CategoryNode({ category, currentPath, depth = 0 }: CategoryNodeProps) {
  const { expandedCategories, toggleCategoryExpanded } = useWiki();
  const isExpanded = expandedCategories.has(category.id);
  const hasChildren = category.children && category.children.length > 0;
  const isActive = currentPath.includes(`/category/${category.slug}`);

  return (
    <li>
      <div 
        className={`
          flex items-center gap-2 py-1.5 px-2 rounded-md text-sm
          ${isActive ? 'bg-violet-50 text-violet-700' : 'text-gray-700 hover:bg-gray-50'}
        `}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {hasChildren && (
          <button
            onClick={() => toggleCategoryExpanded(category.id)}
            className="p-0.5 hover:bg-gray-200 rounded"
          >
            <svg 
              className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        )}
        {!hasChildren && <span className="w-4" />}
        <Link 
          href={`/wiki/category/${category.slug}`}
          className="flex-1 truncate"
        >
          {category.name}
        </Link>
        {category.articles && (
          <span className="text-xs text-gray-400">{category.articles.length}</span>
        )}
      </div>
      {hasChildren && isExpanded && (
        <ul>
          {category.children!.map((child) => (
            <CategoryNode 
              key={child.id} 
              category={child as WikiCategory & { children?: WikiCategory[] }} 
              currentPath={currentPath}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function CategoryTree({ categories, currentPath }: CategoryTreeProps) {
  const tree = buildCategoryTree(categories);

  if (categories.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic">No categories yet</p>
    );
  }

  return (
    <ul className="space-y-0.5">
      {tree.map((category) => (
        <CategoryNode 
          key={category.id} 
          category={category} 
          currentPath={currentPath}
        />
      ))}
    </ul>
  );
}
```

---

### STEP 10: Create Search Bar Component

Create `/components/wiki/SearchBar.tsx`:

```typescript
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useWiki } from '@/contexts/WikiContext';

export default function SearchBar() {
  const router = useRouter();
  const { searchQuery, setSearchQuery, setIsSearching } = useWiki();
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim()) {
      setSearchQuery(localQuery);
      setIsSearching(true);
      router.push(`/wiki/search?q=${encodeURIComponent(localQuery)}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        placeholder="Search wiki..."
        className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-sm placeholder-gray-500 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-violet-500"
      />
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center px-1.5 py-0.5 text-xs text-gray-400 bg-gray-100 rounded border border-gray-200">
        /
      </kbd>
    </form>
  );
}
```

---

### STEP 11: Create Article Card Component

Create `/components/wiki/ArticleCard.tsx`:

```typescript
import Link from 'next/link';
import { WikiArticle } from '@/lib/wiki/types';
import { calculateReadingTime } from '@/lib/wiki/utils';
import { format } from 'date-fns';

interface ArticleCardProps {
  article: WikiArticle;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const readingTime = calculateReadingTime(article.content);
  
  return (
    <article className="group rounded-lg border border-gray-200 bg-white p-5 hover:border-violet-200 hover:shadow-sm transition-all">
      <Link href={`/wiki/article/${article.slug}`}>
        {article.coverImage && (
          <div className="mb-4 aspect-video rounded-md overflow-hidden bg-gray-100">
            <img 
              src={article.coverImage} 
              alt="" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-violet-600 transition-colors mb-2">
          {article.title}
        </h3>
        
        {article.excerpt && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-4">
            {article.excerpt}
          </p>
        )}
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            {article.author && (
              <span>{article.author.name}</span>
            )}
            <span>{format(new Date(article.updatedAt), 'MMM d, yyyy')}</span>
          </div>
          <span>{readingTime} min read</span>
        </div>
      </Link>
      
      {article.tags && article.tags.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-1.5">
          {article.tags.slice(0, 3).map((tag) => (
            <Link 
              key={tag.id}
              href={`/wiki/search?tag=${tag.slug}`}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600 hover:bg-violet-100 hover:text-violet-700"
            >
              {tag.name}
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
```

---

### STEP 12: Create Article View Component

Create `/components/wiki/ArticleView.tsx`:

```typescript
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { WikiArticle } from '@/lib/wiki/types';
import { calculateReadingTime, extractHeadings } from '@/lib/wiki/utils';
import { useWiki } from '@/contexts/WikiContext';
import WikiBreadcrumb from './WikiBreadcrumb';
import TableOfContents from './TableOfContents';
import { format } from 'date-fns';

interface ArticleViewProps {
  article: WikiArticle;
}

export default function ArticleView({ article }: ArticleViewProps) {
  const { addToRecentArticles } = useWiki();
  const readingTime = calculateReadingTime(article.content);
  const headings = extractHeadings(article.content);

  useEffect(() => {
    addToRecentArticles(article);
  }, [article, addToRecentArticles]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <WikiBreadcrumb 
        items={[
          { label: 'Wiki', href: '/wiki' },
          { label: article.category?.name || 'Uncategorized', href: `/wiki/category/${article.category?.slug}` },
          { label: article.title },
        ]} 
      />

      <div className="mt-6 flex gap-8">
        {/* Main Content */}
        <article className="flex-1 min-w-0">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{article.title}</h1>
            
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {article.author && (
                <div className="flex items-center gap-2">
                  {article.author.avatar && (
                    <img 
                      src={article.author.avatar} 
                      alt="" 
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <span>{article.author.name}</span>
                </div>
              )}
              <span>•</span>
              <span>{format(new Date(article.updatedAt), 'MMMM d, yyyy')}</span>
              <span>•</span>
              <span>{readingTime} min read</span>
            </div>

            {article.tags && article.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/wiki/search?tag=${tag.slug}`}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-violet-50 text-violet-700 hover:bg-violet-100"
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
            )}
          </header>

          {article.coverImage && (
            <div className="mb-8 rounded-xl overflow-hidden">
              <img 
                src={article.coverImage} 
                alt="" 
                className="w-full"
              />
            </div>
          )}

          <div 
            className="prose prose-lg max-w-none prose-headings:scroll-mt-20 prose-a:text-violet-600 prose-code:text-violet-600 prose-code:bg-violet-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* Article Footer */}
          <footer className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Last updated {format(new Date(article.updatedAt), 'MMMM d, yyyy')}
              </div>
              <Link
                href={`/wiki/edit/${article.slug}`}
                className="inline-flex items-center gap-2 text-sm text-violet-600 hover:text-violet-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit this article
              </Link>
            </div>

            {/* Feedback */}
            <div className="mt-8 p-6 bg-gray-50 rounded-xl text-center">
              <p className="text-sm text-gray-600 mb-3">Was this article helpful?</p>
              <div className="flex items-center justify-center gap-3">
                <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                  Yes
                </button>
                <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                  </svg>
                  No
                </button>
              </div>
            </div>
          </footer>
        </article>

        {/* Table of Contents */}
        {headings.length > 2 && (
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-8">
              <TableOfContents headings={headings} />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
```

---

### STEP 13: Create Breadcrumb Component

Create `/components/wiki/WikiBreadcrumb.tsx`:

```typescript
import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface WikiBreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function WikiBreadcrumb({ items }: WikiBreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-sm text-gray-500">
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-2">
          {index > 0 && (
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          )}
          {item.href ? (
            <Link href={item.href} className="hover:text-violet-600">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
```

---

### STEP 14: Create Table of Contents Component

Create `/components/wiki/TableOfContents.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';

interface Heading {
  level: number;
  text: string;
  id: string;
}

interface TableOfContentsProps {
  headings: Heading[];
}

export default function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0px -80% 0px' }
    );

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  return (
    <nav className="border-l-2 border-gray-200">
      <h4 className="mb-3 pl-4 text-xs font-semibold uppercase text-gray-500">
        On this page
      </h4>
      <ul className="space-y-1">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className={`
                block py-1 text-sm transition-colors
                ${heading.level === 2 ? 'pl-4' : 'pl-8'}
                ${activeId === heading.id 
                  ? 'border-l-2 border-violet-600 -ml-[2px] text-violet-600 font-medium' 
                  : 'text-gray-600 hover:text-gray-900'}
              `}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

---

### STEP 15: Create Article Editor Component

Create `/components/wiki/ArticleEditor.tsx`:

```typescript
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import { common, createLowlight } from 'lowlight';

const lowlight = createLowlight(common);

interface ArticleEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export default function ArticleEditor({ content, onChange, placeholder = 'Start writing...' }: ArticleEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-violet-600 underline',
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      Highlight,
      Typography,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
          </svg>
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 4h4m-2 0v16m-4 0h8" transform="skewX(-10)" />
          </svg>
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          H2
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          H3
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h10M7 16h10M3 8h.01M3 12h.01M3 16h.01" />
          </svg>
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Quote"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
          title="Code Block"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <ToolbarButton
          onClick={() => {
            const url = window.prompt('Enter link URL:');
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          isActive={editor.isActive('link')}
          title="Link"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => {
            const url = window.prompt('Enter image URL:');
            if (url) {
              editor.chain().focus().setImage({ src: url }).run();
            }
          }}
          title="Image"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run()}
          title="Table"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </ToolbarButton>
      </div>

      {/* Editor */}
      <EditorContent 
        editor={editor} 
        className="prose prose-lg max-w-none p-6 min-h-[400px] focus:outline-none"
      />
    </div>
  );
}

function ToolbarButton({ 
  onClick, 
  isActive, 
  title, 
  children 
}: { 
  onClick: () => void; 
  isActive?: boolean; 
  title: string; 
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`
        p-2 rounded text-sm font-medium transition-colors
        ${isActive 
          ? 'bg-violet-100 text-violet-700' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
      `}
    >
      {children}
    </button>
  );
}
```

---

### STEP 16: Create API Routes - Categories

Create `/app/api/wiki/categories/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const categories = await prisma.wikiCategory.findMany({
      include: {
        _count: {
          select: { articles: true },
        },
      },
      orderBy: [
        { order: 'asc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, description, icon, parentId, order } = body;

    const category = await prisma.wikiCategory.create({
      data: {
        name,
        slug,
        description,
        icon,
        parentId,
        order: order ?? 0,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Failed to create category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
```

---

### STEP 17: Create API Routes - Articles

Create `/app/api/wiki/articles/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSlug, generateExcerpt, stripHtml } from '@/lib/wiki/utils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categorySlug = searchParams.get('category');
    const status = searchParams.get('status') || 'PUBLISHED';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {
      status,
    };

    if (categorySlug) {
      where.category = { slug: categorySlug };
    }

    const [articles, total] = await Promise.all([
      prisma.wikiArticle.findMany({
        where,
        include: {
          category: true,
          author: {
            select: { id: true, name: true, avatar: true },
          },
          tags: true,
        },
        orderBy: [
          { order: 'asc' },
          { publishedAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.wikiArticle.count({ where }),
    ]);

    return NextResponse.json({
      articles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch articles:', error);
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, categoryId, authorId, tags, status, coverImage } = body;

    const slug = generateSlug(title);
    const contentPlain = stripHtml(content);
    const excerpt = generateExcerpt(content);

    const article = await prisma.wikiArticle.create({
      data: {
        title,
        slug,
        content,
        contentPlain,
        excerpt,
        coverImage,
        status: status || 'DRAFT',
        categoryId,
        authorId,
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
        tags: tags?.length ? {
          connectOrCreate: tags.map((tag: string) => ({
            where: { slug: generateSlug(tag) },
            create: { name: tag, slug: generateSlug(tag) },
          })),
        } : undefined,
      },
      include: {
        category: true,
        author: {
          select: { id: true, name: true, avatar: true },
        },
        tags: true,
      },
    });

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    console.error('Failed to create article:', error);
    return NextResponse.json({ error: 'Failed to create article' }, { status: 500 });
  }
}
```

---

### STEP 18: Create API Routes - Single Article

Create `/app/api/wiki/articles/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSlug, generateExcerpt, stripHtml } from '@/lib/wiki/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const article = await prisma.wikiArticle.findFirst({
      where: {
        OR: [
          { id: params.id },
          { slug: params.id },
        ],
      },
      include: {
        category: true,
        author: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        tags: true,
      },
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    await prisma.wikiArticle.update({
      where: { id: article.id },
      data: { views: { increment: 1 } },
    });

    return NextResponse.json(article);
  } catch (error) {
    console.error('Failed to fetch article:', error);
    return NextResponse.json({ error: 'Failed to fetch article' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, content, categoryId, tags, status, coverImage, authorId } = body;

    const existingArticle = await prisma.wikiArticle.findUnique({
      where: { id: params.id },
    });

    if (!existingArticle) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    await prisma.wikiArticleVersion.create({
      data: {
        articleId: existingArticle.id,
        title: existingArticle.title,
        content: existingArticle.content,
        authorId: authorId,
      },
    });

    const contentPlain = content ? stripHtml(content) : existingArticle.contentPlain;
    const excerpt = content ? generateExcerpt(content) : existingArticle.excerpt;

    const article = await prisma.wikiArticle.update({
      where: { id: params.id },
      data: {
        title,
        slug: title ? generateSlug(title) : undefined,
        content,
        contentPlain,
        excerpt,
        coverImage,
        status,
        categoryId,
        publishedAt: status === 'PUBLISHED' && !existingArticle.publishedAt ? new Date() : undefined,
        tags: tags ? {
          set: [],
          connectOrCreate: tags.map((tag: string) => ({
            where: { slug: generateSlug(tag) },
            create: { name: tag, slug: generateSlug(tag) },
          })),
        } : undefined,
      },
      include: {
        category: true,
        author: {
          select: { id: true, name: true, avatar: true },
        },
        tags: true,
      },
    });

    return NextResponse.json(article);
  } catch (error) {
    console.error('Failed to update article:', error);
    return NextResponse.json({ error: 'Failed to update article' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.wikiArticle.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete article:', error);
    return NextResponse.json({ error: 'Failed to delete article' }, { status: 500 });
  }
}
```

---

### STEP 19: Create API Routes - Search

Create `/app/api/wiki/search/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query && !tag) {
      return NextResponse.json({ results: [], total: 0 });
    }

    const where: any = {
      status: 'PUBLISHED',
    };

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { contentPlain: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = { slug: category };
    }

    if (tag) {
      where.tags = { some: { slug: tag } };
    }

    const [results, total] = await Promise.all([
      prisma.wikiArticle.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          category: {
            select: { name: true, slug: true },
          },
          tags: true,
          publishedAt: true,
        },
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.wikiArticle.count({ where }),
    ]);

    await prisma.wikiSearchLog.create({
      data: {
        query,
        results: total,
      },
    });

    return NextResponse.json({
      results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Search failed:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
```

---

### STEP 20: Create API Routes - Embeddings

Create `/app/api/wiki/embeddings/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }
  
  return chunks;
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  
  return response.data[0].embedding;
}

export async function POST(request: NextRequest) {
  try {
    const { articleId } = await request.json();

    const article = await prisma.wikiArticle.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    await prisma.wikiEmbedding.deleteMany({
      where: { articleId },
    });

    const chunks = chunkText(article.contentPlain, CHUNK_SIZE, CHUNK_OVERLAP);
    
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await generateEmbedding(chunks[i]);
      
      await prisma.$executeRaw`
        INSERT INTO "WikiEmbedding" ("id", "articleId", "chunkIndex", "chunkText", "embedding", "createdAt", "updatedAt")
        VALUES (
          ${crypto.randomUUID()},
          ${articleId},
          ${i},
          ${chunks[i]},
          ${embedding}::vector,
          NOW(),
          NOW()
        )
      `;
    }

    return NextResponse.json({ 
      success: true, 
      chunksProcessed: chunks.length 
    });
  } catch (error) {
    console.error('Failed to generate embeddings:', error);
    return NextResponse.json({ error: 'Failed to generate embeddings' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '5');

    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    const queryEmbedding = await generateEmbedding(query);

    const results = await prisma.$queryRaw`
      SELECT 
        we."articleId",
        we."chunkText",
        wa.title,
        wa.slug,
        1 - (we.embedding <=> ${queryEmbedding}::vector) as similarity
      FROM "WikiEmbedding" we
      JOIN "WikiArticle" wa ON wa.id = we."articleId"
      WHERE wa.status = 'PUBLISHED'
      ORDER BY we.embedding <=> ${queryEmbedding}::vector
      LIMIT ${limit}
    `;

    return NextResponse.json(results);
  } catch (error) {
    console.error('Semantic search failed:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
```

---

### STEP 21: Create Wiki Home Page

Create `/app/(default)/wiki/page.tsx`:

```typescript
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import ArticleCard from '@/components/wiki/ArticleCard';
import WikiBreadcrumb from '@/components/wiki/WikiBreadcrumb';

export const metadata = {
  title: 'Wiki - Living Wellness Dental',
  description: 'Training documentation and knowledge base',
};

async function getWikiData() {
  const [categories, recentArticles, popularArticles] = await Promise.all([
    prisma.wikiCategory.findMany({
      where: { parentId: null },
      include: {
        _count: { select: { articles: true } },
        children: {
          include: {
            _count: { select: { articles: true } },
          },
        },
      },
      orderBy: { order: 'asc' },
    }),
    prisma.wikiArticle.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        category: true,
        author: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { publishedAt: 'desc' },
      take: 6,
    }),
    prisma.wikiArticle.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        category: true,
        author: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { views: 'desc' },
      take: 5,
    }),
  ]);

  return { categories, recentArticles, popularArticles };
}

export default async function WikiHomePage() {
  const { categories, recentArticles, popularArticles } = await getWikiData();

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <WikiBreadcrumb items={[{ label: 'Wiki' }]} />

      {/* Hero */}
      <div className="mt-6 mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Living Wellness Dental Wiki
        </h1>
        <p className="text-lg text-gray-600">
          Training documentation, procedures, and knowledge base for our team.
        </p>
      </div>

      {/* Categories Grid */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Browse by Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/wiki/category/${category.slug}`}
              className="group p-5 rounded-xl border border-gray-200 bg-white hover:border-violet-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-violet-600 transition-colors">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                </div>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                  {category._count.articles} articles
                </span>
              </div>
              {category.children.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {category.children.slice(0, 3).map((child) => (
                    <span 
                      key={child.id}
                      className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded"
                    >
                      {child.name}
                    </span>
                  ))}
                  {category.children.length > 3 && (
                    <span className="text-xs text-gray-400">
                      +{category.children.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Articles */}
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recently Updated</h2>
            <Link 
              href="/wiki/search?sort=recent"
              className="text-sm text-violet-600 hover:text-violet-700"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>

        {/* Popular Articles Sidebar */}
        <aside>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Popular Articles</h2>
          <ul className="space-y-3">
            {popularArticles.map((article, index) => (
              <li key={article.id}>
                <Link
                  href={`/wiki/article/${article.slug}`}
                  className="flex items-start gap-3 group"
                >
                  <span className="text-2xl font-bold text-gray-200 group-hover:text-violet-200 transition-colors">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 group-hover:text-violet-600 transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {article.views} views
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
```

---

### STEP 22: Create Article View Page

Create `/app/(default)/wiki/article/[slug]/page.tsx`:

```typescript
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ArticleView from '@/components/wiki/ArticleView';

interface PageProps {
  params: { slug: string };
}

async function getArticle(slug: string) {
  const article = await prisma.wikiArticle.findFirst({
    where: {
      slug,
      status: 'PUBLISHED',
    },
    include: {
      category: true,
      author: {
        select: { id: true, name: true, email: true, avatar: true },
      },
      tags: true,
    },
  });

  return article;
}

export async function generateMetadata({ params }: PageProps) {
  const article = await getArticle(params.slug);
  
  if (!article) {
    return { title: 'Article Not Found' };
  }

  return {
    title: `${article.title} - Wiki`,
    description: article.excerpt,
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const article = await getArticle(params.slug);

  if (!article) {
    notFound();
  }

  await prisma.wikiArticle.update({
    where: { id: article.id },
    data: { views: { increment: 1 } },
  });

  return <ArticleView article={article} />;
}
```

---

### STEP 23: Create New Article Page

Create `/app/(default)/wiki/article/new/page.tsx`:

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ArticleEditor from '@/components/wiki/ArticleEditor';
import WikiBreadcrumb from '@/components/wiki/WikiBreadcrumb';
import TagInput from '@/components/wiki/TagInput';
import { WikiCategory } from '@/lib/wiki/types';
import { WIKI_CONFIG } from '@/lib/wiki/constants';

export default function NewArticlePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState('');
  const [categories, setCategories] = useState<WikiCategory[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');

  useEffect(() => {
    fetch('/api/wiki/categories')
      .then((res) => res.json())
      .then(setCategories);
  }, []);

  const saveArticle = useCallback(async (publish = false) => {
    if (!title || !categoryId) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/wiki/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          categoryId,
          tags,
          coverImage,
          status: publish ? 'PUBLISHED' : 'DRAFT',
          authorId: 'current-user-id',
        }),
      });

      if (res.ok) {
        const article = await res.json();
        setLastSaved(new Date());
        if (publish) {
          router.push(`/wiki/article/${article.slug}`);
        }
      }
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  }, [title, content, categoryId, tags, coverImage, router]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (title && content) {
        saveArticle(false);
      }
    }, WIKI_CONFIG.AUTO_SAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [title, content, saveArticle]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <WikiBreadcrumb
        items={[
          { label: 'Wiki', href: '/wiki' },
          { label: 'New Article' },
        ]}
      />

      <div className="mt-6 mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Create New Article</h1>
        <div className="flex items-center gap-3">
          {lastSaved && (
            <span className="text-sm text-gray-500">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => saveArticle(false)}
            disabled={isSaving || !title}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            onClick={() => saveArticle(true)}
            disabled={isSaving || !title || !categoryId}
            className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50"
          >
            Publish
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Article title"
            className="w-full text-3xl font-bold text-gray-900 placeholder-gray-400 border-0 border-b-2 border-transparent focus:border-violet-500 focus:ring-0 px-0 py-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border-gray-300 focus:border-violet-500 focus:ring-violet-500"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cover Image URL
            </label>
            <input
              type="url"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border-gray-300 focus:border-violet-500 focus:ring-violet-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags
          </label>
          <TagInput tags={tags} onChange={setTags} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Content
          </label>
          <ArticleEditor
            content={content}
            onChange={setContent}
            placeholder="Start writing your article..."
          />
        </div>
      </div>
    </div>
  );
}
```

---

### STEP 24: Create Tag Input Component

Create `/components/wiki/TagInput.tsx`:

```typescript
'use client';

import { useState, KeyboardEvent } from 'react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export default function TagInput({ tags, onChange }: TagInputProps) {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = input.trim();
      if (tag && !tags.includes(tag)) {
        onChange([...tags, tag]);
      }
      setInput('');
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 border border-gray-300 rounded-lg focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-50 text-violet-700 text-sm rounded-full"
        >
          {tag}
          <button
            onClick={() => removeTag(tag)}
            className="hover:text-violet-900"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? 'Add tags...' : ''}
        className="flex-1 min-w-[120px] border-0 focus:ring-0 text-sm p-0"
      />
    </div>
  );
}
```

---

### STEP 25: Create Search Results Page

Create `/app/(default)/wiki/search/page.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import WikiBreadcrumb from '@/components/wiki/WikiBreadcrumb';
import ArticleCard from '@/components/wiki/ArticleCard';
import { WikiSearchResult } from '@/lib/wiki/types';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const tag = searchParams.get('tag') || '';
  const [results, setResults] = useState<WikiSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function search() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (tag) params.set('tag', tag);

        const res = await fetch(`/api/wiki/search?${params}`);
        const data = await res.json();
        setResults(data.results || []);
        setTotal(data.pagination?.total || 0);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (query || tag) {
      search();
    }
  }, [query, tag]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <WikiBreadcrumb
        items={[
          { label: 'Wiki', href: '/wiki' },
          { label: 'Search Results' },
        ]}
      />

      <div className="mt-6 mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {tag ? (
            <>Articles tagged &ldquo;{tag}&rdquo;</>
          ) : (
            <>Search results for &ldquo;{query}&rdquo;</>
          )}
        </h1>
        <p className="text-gray-600 mt-1">
          {isLoading ? 'Searching...' : `${total} result${total === 1 ? '' : 's'} found`}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-full mb-1" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-lg font-medium text-gray-900 mb-1">No results found</h2>
          <p className="text-gray-600">Try adjusting your search terms</p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((result) => (
            <Link
              key={result.id}
              href={`/wiki/article/${result.slug}`}
              className="block p-5 rounded-lg border border-gray-200 hover:border-violet-200 hover:shadow-sm transition-all"
            >
              <h2 className="text-lg font-semibold text-gray-900 hover:text-violet-600 mb-1">
                {result.title}
              </h2>
              <p className="text-sm text-gray-600 line-clamp-2">{result.excerpt}</p>
              <div className="mt-2 text-xs text-gray-500">
                in {result.categoryName}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### STEP 26: Create Category Page

Create `/app/(default)/wiki/category/[slug]/page.tsx`:

```typescript
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import WikiBreadcrumb from '@/components/wiki/WikiBreadcrumb';
import ArticleCard from '@/components/wiki/ArticleCard';

interface PageProps {
  params: { slug: string };
}

async function getCategoryData(slug: string) {
  const category = await prisma.wikiCategory.findUnique({
    where: { slug },
    include: {
      parent: true,
      children: {
        include: {
          _count: { select: { articles: true } },
        },
      },
      articles: {
        where: { status: 'PUBLISHED' },
        include: {
          author: { select: { id: true, name: true, avatar: true } },
          tags: true,
        },
        orderBy: [
          { order: 'asc' },
          { publishedAt: 'desc' },
        ],
      },
    },
  });

  return category;
}

export async function generateMetadata({ params }: PageProps) {
  const category = await getCategoryData(params.slug);
  
  if (!category) {
    return { title: 'Category Not Found' };
  }

  return {
    title: `${category.name} - Wiki`,
    description: category.description,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const category = await getCategoryData(params.slug);

  if (!category) {
    notFound();
  }

  const breadcrumbItems = [
    { label: 'Wiki', href: '/wiki' },
  ];
  
  if (category.parent) {
    breadcrumbItems.push({
      label: category.parent.name,
      href: `/wiki/category/${category.parent.slug}`,
    });
  }
  
  breadcrumbItems.push({ label: category.name });

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <WikiBreadcrumb items={breadcrumbItems} />

      <div className="mt-6 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{category.name}</h1>
        {category.description && (
          <p className="text-lg text-gray-600">{category.description}</p>
        )}
      </div>

      {category.children.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Subcategories</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {category.children.map((child) => (
              <Link
                key={child.id}
                href={`/wiki/category/${child.slug}`}
                className="p-4 rounded-lg border border-gray-200 hover:border-violet-200 hover:shadow-sm transition-all"
              >
                <h3 className="font-medium text-gray-900">{child.name}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {child._count.articles} articles
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Articles ({category.articles.length})
          </h2>
          <Link
            href={`/wiki/article/new?category=${category.id}`}
            className="text-sm text-violet-600 hover:text-violet-700"
          >
            + Add article
          </Link>
        </div>

        {category.articles.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <p className="text-gray-600">No articles in this category yet.</p>
            <Link
              href={`/wiki/article/new?category=${category.id}`}
              className="inline-flex items-center mt-3 text-sm text-violet-600 hover:text-violet-700"
            >
              Create the first article →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {category.articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
```

---

### STEP 27: Update Sidebar Navigation

Add wiki link to the main app sidebar by updating the existing sidebar component to include:

```typescript
{
  name: 'Wiki',
  href: '/wiki',
  icon: 'BookOpenIcon',
}
```

---

### STEP 28: Environment Variables Setup

Add to `.env.local`:

```bash
DATABASE_URL="postgresql://..."
OPENAI_API_KEY="sk-..."
BLOB_READ_WRITE_TOKEN="..." # For Vercel Blob uploads
```

---

### STEP 29: Run Database Migrations

```bash
npx prisma migrate dev --name add-wiki-module
npx prisma generate
```

---

### STEP 30: Seed Initial Categories

Create `/prisma/seed-wiki.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categories = [
    { name: 'Getting Started', slug: 'getting-started', description: 'Onboarding and orientation materials', order: 0 },
    { name: 'HR & Policies', slug: 'hr-policies', description: 'Human resources policies and procedures', order: 1 },
    { name: 'Clinical Procedures', slug: 'clinical-procedures', description: 'Dental clinical protocols and guidelines', order: 2 },
    { name: 'Front Office', slug: 'front-office', description: 'Reception and administrative procedures', order: 3 },
    { name: 'Safety & Compliance', slug: 'safety-compliance', description: 'OSHA, HIPAA, and safety protocols', order: 4 },
    { name: 'Technology', slug: 'technology', description: 'Software and equipment guides', order: 5 },
  ];

  for (const category of categories) {
    await prisma.wikiCategory.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }

  console.log('Wiki categories seeded!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run with:
```bash
npx tsx prisma/seed-wiki.ts
```

---

## Summary of Development Order

1. **Phase 1 - Setup (Steps 1-6)**: Dependencies, database, types, utilities, context
2. **Phase 2 - Layout (Steps 7-14)**: Layout, sidebar, navigation components
3. **Phase 3 - Editor (Step 15)**: Rich text editor
4. **Phase 4 - API (Steps 16-20)**: Backend API routes
5. **Phase 5 - Pages (Steps 21-26)**: Frontend pages
6. **Phase 6 - Integration (Steps 27-30)**: Sidebar link, env vars, migrations, seeding

---

## Post-Launch Improvements

After initial launch, consider:

1. **Analytics Dashboard** - Track article views, search queries, user engagement
2. **Permissions System** - Role-based access for read/write/admin
3. **Import/Export** - Bulk import from markdown files
4. **AI Features** - Chatbot interface, content suggestions, auto-summarization
5. **Notifications** - Email/Slack alerts for new articles or updates
6. **Mobile App** - Progressive Web App (PWA) support
7. **Offline Mode** - Cache articles for offline reading
8. **Multi-language** - Translation support

---

*This document serves as the complete implementation guide for the Living Wellness Dental Wiki Module.*
