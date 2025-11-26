# Living Wellness Dental App - Full Setup Execution Plan

Complete setup guide for Next.js + Vercel + GitHub + Supabase (Database & Auth)

---

## Prerequisites

- [ ] Node.js 18+ installed
- [ ] Docker Desktop installed (for local development)
- [ ] GitHub account
- [ ] Vercel account (free tier works)
- [ ] Supabase account (free tier works)

---

## Phase 1: GitHub Repository Setup

### Step 1.1: Initialize Git (if not already)
```bash
cd /Users/Shared/Living\ Wellness/lwd-app
git init
git add .
git commit -m "Initial commit"
```

### Step 1.2: Create GitHub Repository
1. Go to https://github.com/new
2. Name: `lwd-app`
3. Private repository (recommended for business app)
4. Do NOT initialize with README (you already have code)

### Step 1.3: Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/lwd-app.git
git branch -M main
git push -u origin main
```

---

## Phase 2: Supabase Project Setup

### Step 2.1: Create Supabase Project
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Settings:
   - Name: `lwd-app`
   - Database Password: Generate and **save securely**
   - Region: Choose closest to your users
4. Wait for project to provision (~2 minutes)

### Step 2.2: Get Supabase Credentials
From Project Settings > API, copy:
- **Project URL**: `https://xxxxx.supabase.co`
- **anon/public key**: `eyJhbGc...`
- **service_role key**: `eyJhbGc...` (keep secret!)

From Project Settings > Database, copy:
- **Connection string (URI)**: For Prisma
  - Use "Connection pooling" > "Transaction" mode for serverless
  - Format: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true`

### Step 2.3: Enable pgvector Extension
In Supabase SQL Editor, run:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### Step 2.4: Configure Supabase Auth
1. Go to Authentication > Providers
2. Enable **Email** (enabled by default)
3. Optional: Enable Google, Microsoft, etc.
4. Go to Authentication > URL Configuration
5. Set Site URL: `http://localhost:3000` (update later for production)
6. Add Redirect URLs:
   - `http://localhost:3000/**`
   - `https://your-app.vercel.app/**` (add after Vercel setup)

---

## Phase 3: Local Development Environment

### Step 3.1: Start Local PostgreSQL with Docker
```bash
docker run --name lwd-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=lwd \
  -p 5432:5432 \
  -d pgvector/pgvector:pg16
```

Verify it's running:
```bash
docker ps
```

### Step 3.2: Install Dependencies
```bash
npm install prisma @prisma/client
npm install @supabase/supabase-js @supabase/ssr
npm install slugify
npm install openai
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/extension-image @tiptap/extension-link @tiptap/extension-code-block-lowlight @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-cell @tiptap/extension-table-header @tiptap/extension-highlight @tiptap/extension-typography
npm install lowlight
```

### Step 3.3: Create Environment Files

Create `.env.local` (local development - uses Docker PostgreSQL):
```bash
# Database - Local Docker
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lwd"

# Database - Direct connection for migrations (same for local)
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/lwd"

# Supabase Auth (use real Supabase project for auth even locally)
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGc..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."

# OpenAI (for wiki embeddings)
OPENAI_API_KEY="sk-..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Create `.env.production` (template - actual values in Vercel):
```bash
# Database - Supabase Pooled Connection
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Database - Direct connection for migrations
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGc..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."

# OpenAI
OPENAI_API_KEY="sk-..."

# App
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
```

Add to `.gitignore`:
```
.env.local
.env.production
.env*.local
```

### Step 3.4: Initialize Prisma
```bash
npx prisma init
```

### Step 3.5: Configure Prisma Schema
Replace `prisma/schema.prisma`:
```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  directUrl  = env("DIRECT_URL")
  extensions = [pgvector(map: "vector"), pg_trgm]
}

// ============================================
// AUTH - Synced with Supabase Auth
// ============================================

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  avatar        String?
  role          UserRole  @default(MEMBER)
  supabaseId    String?   @unique  // Links to Supabase auth.users
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  articles        WikiArticle[]
  articleVersions WikiArticleVersion[]

  @@index([supabaseId])
}

enum UserRole {
  ADMIN
  MANAGER
  MEMBER
}

// ============================================
// WIKI MODULE
// ============================================

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

  @@index([parentId])
}

model WikiArticle {
  id           String               @id @default(cuid())
  title        String
  slug         String               @unique
  content      String               @db.Text
  contentPlain String               @db.Text
  excerpt      String?
  coverImage   String?
  status       ArticleStatus        @default(DRAFT)
  categoryId   String
  category     WikiCategory         @relation(fields: [categoryId], references: [id])
  authorId     String
  author       User                 @relation(fields: [authorId], references: [id])
  tags         WikiTag[]
  versions     WikiArticleVersion[]
  embeddings   WikiEmbedding[]
  views        Int                  @default(0)
  order        Int                  @default(0)
  publishedAt  DateTime?
  createdAt    DateTime             @default(now())
  updatedAt    DateTime             @updatedAt

  @@index([categoryId])
  @@index([authorId])
  @@index([status])
  @@index([slug])
}

model WikiArticleVersion {
  id        String      @id @default(cuid())
  articleId String
  article   WikiArticle @relation(fields: [articleId], references: [id], onDelete: Cascade)
  title     String
  content   String      @db.Text
  authorId  String
  author    User        @relation(fields: [authorId], references: [id])
  createdAt DateTime    @default(now())

  @@index([articleId])
}

model WikiTag {
  id       String        @id @default(cuid())
  name     String        @unique
  slug     String        @unique
  articles WikiArticle[]
}

model WikiEmbedding {
  id         String                       @id @default(cuid())
  articleId  String
  article    WikiArticle                  @relation(fields: [articleId], references: [id], onDelete: Cascade)
  chunkIndex Int                          @default(0)
  chunkText  String                       @db.Text
  embedding  Unsupported("vector(1536)")?
  createdAt  DateTime                     @default(now())
  updatedAt  DateTime                     @updatedAt

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

### Step 3.6: Create Prisma Client Utility
Create `lib/prisma.ts`:
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Step 3.7: Run Initial Migration (Local)
```bash
npx prisma migrate dev --name init
npx prisma generate
```

---

## Phase 4: Supabase Auth Integration

### Step 4.1: Create Supabase Client Utilities

Create `lib/supabase/client.ts` (browser client):
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

Create `lib/supabase/server.ts` (server client):
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component
          }
        },
      },
    }
  )
}
```

Create `lib/supabase/middleware.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect routes
  const protectedPaths = ['/dashboard', '/wiki', '/settings']
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/signin'
    url.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  const authPaths = ['/signin', '/signup']
  const isAuthPath = authPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  if (isAuthPath && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}
```

### Step 4.2: Create Middleware
Create `middleware.ts` at project root:
```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Step 4.3: Create Auth Actions
Create `app/actions/auth.ts`:
```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  })

  if (error) {
    return { error: error.message }
  }

  // Create user in our database
  if (data.user) {
    await prisma.user.create({
      data: {
        email,
        name,
        supabaseId: data.user.id,
      },
    })
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signIn(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/signin')
}

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
  })

  return dbUser
}
```

### Step 4.4: Update Sign In Page
Update `app/(auth)/signin/page.tsx`:
```typescript
import { signIn } from '@/app/actions/auth'
import AuthImage from '../auth-image'
import AuthHeader from '../auth-header'

export const metadata = {
  title: 'Sign In - Living Wellness Dental',
}

export default function SignIn() {
  return (
    <main className="bg-white">
      <div className="relative md:flex">
        <div className="md:w-1/2">
          <div className="min-h-dvh h-full flex flex-col after:flex-1">
            <AuthHeader />
            <div className="max-w-sm mx-auto w-full px-4 py-8">
              <h1 className="text-3xl text-gray-800 font-bold mb-6">Welcome back!</h1>
              <form action={signIn}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="email">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      className="form-input w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="password">
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      className="form-input w-full"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-6">
                  <div className="mr-1">
                    <a className="text-sm underline hover:no-underline" href="/reset-password">
                      Forgot Password?
                    </a>
                  </div>
                  <button
                    type="submit"
                    className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 ml-3"
                  >
                    Sign In
                  </button>
                </div>
              </form>
              <div className="pt-5 mt-6 border-t border-gray-100">
                <div className="text-sm">
                  Don&apos;t have an account?{' '}
                  <a className="font-medium text-violet-500 hover:text-violet-600" href="/signup">
                    Sign Up
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        <AuthImage />
      </div>
    </main>
  )
}
```

---

## Phase 5: Vercel Deployment

### Step 5.1: Connect to Vercel
1. Go to https://vercel.com/new
2. Import your GitHub repository `lwd-app`
3. Framework Preset: Next.js (auto-detected)
4. Root Directory: `./` (default)

### Step 5.2: Configure Environment Variables
In Vercel Project Settings > Environment Variables, add:

| Variable | Value | Environments |
|----------|-------|--------------|
| `DATABASE_URL` | Supabase pooled connection string | Production, Preview |
| `DIRECT_URL` | Supabase direct connection string | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key | All |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key | Production, Preview |
| `OPENAI_API_KEY` | Your OpenAI key | Production, Preview |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Production |

### Step 5.3: Deploy
1. Click "Deploy"
2. Wait for build to complete
3. Note your deployment URL: `https://lwd-app-xxxxx.vercel.app`

### Step 5.4: Run Production Migration
After first deploy, run migration against Supabase:
```bash
# Set production database URL temporarily
export DATABASE_URL="your-supabase-pooled-url"
export DIRECT_URL="your-supabase-direct-url"

# Run migration
npx prisma migrate deploy
```

Or use Vercel CLI:
```bash
vercel env pull .env.production.local
npx prisma migrate deploy
```

### Step 5.5: Update Supabase Redirect URLs
In Supabase Dashboard > Authentication > URL Configuration:
1. Add to Redirect URLs: `https://your-app.vercel.app/**`
2. Update Site URL to production URL

---

## Phase 6: Seed Database

### Step 6.1: Create Seed Script
Create `prisma/seed.ts`:
```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create default admin user (link to Supabase user later)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@livingwellnessdental.com' },
    update: {},
    create: {
      email: 'admin@livingwellnessdental.com',
      name: 'Admin',
      role: 'ADMIN',
    },
  })

  // Create wiki categories
  const categories = [
    { name: 'Getting Started', slug: 'getting-started', description: 'Onboarding and orientation', order: 0 },
    { name: 'HR & Policies', slug: 'hr-policies', description: 'Human resources and company policies', order: 1 },
    { name: 'Clinical Procedures', slug: 'clinical', description: 'Dental procedures and protocols', order: 2 },
    { name: 'Front Office', slug: 'front-office', description: 'Reception and scheduling', order: 3 },
    { name: 'Safety & Compliance', slug: 'safety', description: 'OSHA, HIPAA, and safety', order: 4 },
    { name: 'Technology', slug: 'technology', description: 'Software and equipment guides', order: 5 },
  ]

  for (const cat of categories) {
    await prisma.wikiCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    })
  }

  console.log('Database seeded!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

### Step 6.2: Add Seed Script to Package.json
Add to `package.json`:
```json
{
  "prisma": {
    "seed": "npx tsx prisma/seed.ts"
  }
}
```

Install tsx:
```bash
npm install -D tsx
```

### Step 6.3: Run Seed
```bash
npx prisma db seed
```

---

## Phase 7: CI/CD Setup

### Step 7.1: Create GitHub Actions Workflow
Create `.github/workflows/ci.yml`:
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Generate Prisma Client
        run: npx prisma generate
      
      - name: Lint
        run: npm run lint
      
      - name: Build
        run: npm run build
        env:
          DATABASE_URL: "postgresql://fake:fake@localhost:5432/fake"
          NEXT_PUBLIC_SUPABASE_URL: "https://fake.supabase.co"
          NEXT_PUBLIC_SUPABASE_ANON_KEY: "fake-key"
```

---

## Quick Reference: Commands

### Local Development
```bash
# Start local database
docker start lwd-postgres

# Run dev server
npm run dev

# Create migration after schema change
npx prisma migrate dev --name description_of_change

# Reset local database
npx prisma migrate reset

# Open Prisma Studio (database GUI)
npx prisma studio
```

### Production
```bash
# Deploy migrations to Supabase
npx prisma migrate deploy

# Deploy to Vercel
git push origin main  # Auto-deploys via Vercel GitHub integration
```

### Docker Management
```bash
# Stop local database
docker stop lwd-postgres

# Start local database
docker start lwd-postgres

# Remove and recreate (data loss!)
docker rm lwd-postgres
docker run --name lwd-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=lwd -p 5432:5432 -d pgvector/pgvector:pg16
```

---

## Execution Checklist

### Initial Setup (Do Once)
- [ ] Create GitHub repository
- [ ] Push code to GitHub
- [ ] Create Supabase project
- [ ] Enable pgvector extension in Supabase
- [ ] Configure Supabase Auth providers
- [ ] Start local Docker PostgreSQL
- [ ] Install npm dependencies
- [ ] Create `.env.local` with credentials
- [ ] Initialize Prisma and run first migration
- [ ] Create Supabase client utilities
- [ ] Create middleware for auth
- [ ] Connect Vercel to GitHub repo
- [ ] Add environment variables in Vercel
- [ ] Deploy to Vercel
- [ ] Run migration against Supabase
- [ ] Update Supabase redirect URLs
- [ ] Seed database

### Daily Development
- [ ] `docker start lwd-postgres`
- [ ] `npm run dev`
- [ ] Make changes
- [ ] `git add . && git commit -m "message" && git push`
- [ ] Vercel auto-deploys

### Schema Changes
- [ ] Edit `prisma/schema.prisma`
- [ ] `npx prisma migrate dev --name change_description`
- [ ] Push to GitHub
- [ ] After Vercel deploys, run `npx prisma migrate deploy` against production

---

*This document provides the complete setup for the Living Wellness Dental app infrastructure.*
