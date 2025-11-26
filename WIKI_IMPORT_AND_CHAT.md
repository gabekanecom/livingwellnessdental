# Wiki Markdown Import & AI Chat Widget

## ✅ IMPLEMENTATION COMPLETE

**Status:** All features implemented and ready to use
**Date Completed:** November 25, 2025
**Documentation:** See WIKI_IMPORT_CHAT_README.md for usage guide

### What's Been Implemented:
- ✅ Bulk markdown import script (`npm run wiki:import`)
- ✅ Web upload import API and UI component
- ✅ AI chat widget with OpenAI integration
- ✅ Context-aware search and retrieval
- ✅ Article indexing script (`npm run wiki:index`)
- ✅ Full-text search fallback (vector search ready for production)

---

## Part 1: Markdown Content Import

### Option A: Bulk Import Script (Recommended for Initial Migration)

#### Step 1: Install markdown parser
```bash
npm install marked gray-matter
npm install -D @types/marked
```

- `marked` - Converts markdown to HTML
- `gray-matter` - Parses frontmatter (title, category, tags metadata)

#### Step 2: Organize Your Markdown Files
Structure your existing content like this:
```
import-data/
├── getting-started/
│   ├── welcome.md
│   ├── first-day-checklist.md
│   └── office-tour.md
├── hr-policies/
│   ├── time-off.md
│   ├── dress-code.md
│   └── benefits.md
├── clinical/
│   ├── sterilization.md
│   └── patient-intake.md
└── _metadata.json  (optional category mappings)
```

Each markdown file should have frontmatter:
```markdown
---
title: Welcome to Living Wellness Dental
tags: [onboarding, new-hire]
order: 1
---

# Welcome to Living Wellness Dental

Your content here...
```

#### Step 3: Create Import Script
Create `scripts/import-wiki.ts`:
```typescript
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { marked } from 'marked'
import { PrismaClient } from '@prisma/client'
import slugify from 'slugify'

const prisma = new PrismaClient()

const IMPORT_DIR = './import-data'

interface FrontMatter {
  title?: string
  tags?: string[]
  order?: number
  status?: 'DRAFT' | 'PUBLISHED'
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

function generateExcerpt(text: string, length = 200): string {
  if (text.length <= length) return text
  return text.substring(0, length).trim() + '...'
}

async function importMarkdownFiles() {
  const categories = fs.readdirSync(IMPORT_DIR).filter(f => {
    const stat = fs.statSync(path.join(IMPORT_DIR, f))
    return stat.isDirectory()
  })

  console.log(`Found ${categories.length} category folders`)

  // Get or create default author
  let author = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
  if (!author) {
    author = await prisma.user.create({
      data: {
        email: 'import@system.local',
        name: 'Wiki Import',
        role: 'ADMIN',
      },
    })
  }

  for (const categoryFolder of categories) {
    const categoryPath = path.join(IMPORT_DIR, categoryFolder)
    const categorySlug = slugify(categoryFolder, { lower: true, strict: true })
    
    // Get or create category
    let category = await prisma.wikiCategory.findUnique({
      where: { slug: categorySlug },
    })
    
    if (!category) {
      category = await prisma.wikiCategory.create({
        data: {
          name: categoryFolder.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          slug: categorySlug,
        },
      })
      console.log(`Created category: ${category.name}`)
    }

    // Process markdown files
    const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.md'))
    
    for (const file of files) {
      const filePath = path.join(categoryPath, file)
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      
      // Parse frontmatter and content
      const { data, content } = matter(fileContent)
      const frontmatter = data as FrontMatter
      
      // Convert markdown to HTML
      const htmlContent = await marked(content)
      const plainText = stripHtml(htmlContent)
      
      // Generate title from frontmatter or filename
      const title = frontmatter.title || file.replace('.md', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      const slug = slugify(title, { lower: true, strict: true })
      
      // Check if article already exists
      const existing = await prisma.wikiArticle.findUnique({
        where: { slug },
      })
      
      if (existing) {
        console.log(`Skipping existing article: ${title}`)
        continue
      }
      
      // Create article
      const article = await prisma.wikiArticle.create({
        data: {
          title,
          slug,
          content: htmlContent,
          contentPlain: plainText,
          excerpt: generateExcerpt(plainText),
          status: frontmatter.status || 'PUBLISHED',
          order: frontmatter.order || 0,
          categoryId: category.id,
          authorId: author.id,
          publishedAt: new Date(),
          tags: frontmatter.tags?.length ? {
            connectOrCreate: frontmatter.tags.map(tag => ({
              where: { slug: slugify(tag, { lower: true, strict: true }) },
              create: { 
                name: tag, 
                slug: slugify(tag, { lower: true, strict: true }) 
              },
            })),
          } : undefined,
        },
      })
      
      console.log(`Imported: ${article.title}`)
    }
  }

  console.log('\nImport complete!')
}

importMarkdownFiles()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

#### Step 4: Add Script to package.json
```json
{
  "scripts": {
    "wiki:import": "tsx scripts/import-wiki.ts"
  }
}
```

#### Step 5: Run Import
```bash
# Place your markdown files in ./import-data/
npm run wiki:import
```

---

### Option B: Web Upload Interface (For Ongoing Imports)

#### Step 1: Create Upload API Route
Create `app/api/wiki/import/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import matter from 'gray-matter'
import { marked } from 'marked'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import slugify from 'slugify'

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

function generateExcerpt(text: string, length = 200): string {
  if (text.length <= length) return text
  return text.substring(0, length).trim() + '...'
}

export async function POST(request: NextRequest) {
  try {
    // Check auth
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    })
    if (!dbUser || !['ADMIN', 'MANAGER'].includes(dbUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const categoryId = formData.get('categoryId') as string

    if (!files.length || !categoryId) {
      return NextResponse.json({ error: 'Files and categoryId required' }, { status: 400 })
    }

    const results = { imported: 0, skipped: 0, errors: [] as string[] }

    for (const file of files) {
      try {
        const content = await file.text()
        const { data, content: markdown } = matter(content)
        
        const htmlContent = await marked(markdown)
        const plainText = stripHtml(htmlContent)
        
        const title = data.title || file.name.replace('.md', '').replace(/-/g, ' ')
        const slug = slugify(title, { lower: true, strict: true })
        
        // Check for existing
        const existing = await prisma.wikiArticle.findUnique({ where: { slug } })
        if (existing) {
          results.skipped++
          continue
        }

        await prisma.wikiArticle.create({
          data: {
            title,
            slug,
            content: htmlContent,
            contentPlain: plainText,
            excerpt: generateExcerpt(plainText),
            status: 'DRAFT',
            categoryId,
            authorId: dbUser.id,
            tags: data.tags?.length ? {
              connectOrCreate: data.tags.map((tag: string) => ({
                where: { slug: slugify(tag, { lower: true, strict: true }) },
                create: { name: tag, slug: slugify(tag, { lower: true, strict: true }) },
              })),
            } : undefined,
          },
        })
        
        results.imported++
      } catch (err) {
        results.errors.push(`${file.name}: ${err}`)
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Import failed:', error)
    return NextResponse.json({ error: 'Import failed' }, { status: 500 })
  }
}
```

#### Step 2: Create Import UI Component
Create `components/wiki/ImportUploader.tsx`:
```typescript
'use client'

import { useState, useRef } from 'react'
import { WikiCategory } from '@/lib/wiki/types'

interface ImportUploaderProps {
  categories: WikiCategory[]
}

export default function ImportUploader({ categories }: ImportUploaderProps) {
  const [categoryId, setCategoryId] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async () => {
    if (!files.length || !categoryId) return
    
    setIsUploading(true)
    setResult(null)
    
    const formData = new FormData()
    formData.append('categoryId', categoryId)
    files.forEach(file => formData.append('files', file))
    
    try {
      const res = await fetch('/api/wiki/import', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      setResult(data)
      setFiles([])
      if (inputRef.current) inputRef.current.value = ''
    } catch (error) {
      setResult({ imported: 0, skipped: 0, errors: ['Upload failed'] })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Markdown Files</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Target Category
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-lg border-gray-300"
          >
            <option value="">Select category...</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Markdown Files
          </label>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".md,.markdown"
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
            className="w-full"
          />
          {files.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">{files.length} file(s) selected</p>
          )}
        </div>
        
        <button
          onClick={handleUpload}
          disabled={!files.length || !categoryId || isUploading}
          className="w-full py-2 px-4 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 disabled:opacity-50"
        >
          {isUploading ? 'Importing...' : 'Import Files'}
        </button>
        
        {result && (
          <div className={`p-4 rounded-lg ${result.errors.length ? 'bg-yellow-50' : 'bg-green-50'}`}>
            <p className="font-medium">
              Imported: {result.imported} | Skipped: {result.skipped}
            </p>
            {result.errors.length > 0 && (
              <ul className="mt-2 text-sm text-red-600">
                {result.errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## Part 2: AI Chat Widget

### Architecture Overview
```
User Question
     │
     ▼
┌─────────────────┐
│  Chat Widget    │
│  (React)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  /api/wiki/chat │────▶│  Vector Search  │
│                 │     │  (pgvector)     │
└────────┬────────┘     └─────────────────┘
         │                      │
         │◀─────────────────────┘
         │  Relevant chunks
         ▼
┌─────────────────┐
│   OpenAI API    │
│   (GPT-4o-mini) │
└────────┬────────┘
         │
         ▼
    AI Response
```

### Step 1: Update Prisma Schema (if not done)
Ensure `WikiEmbedding` model exists in `prisma/schema.prisma` (already in your plan).

### Step 2: Create Embedding Generation Utility
Create `lib/wiki/embeddings.ts`:
```typescript
import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const CHUNK_SIZE = 1000
const CHUNK_OVERLAP = 200

export function chunkText(text: string): string[] {
  const chunks: string[] = []
  const sentences = text.split(/(?<=[.!?])\s+/)
  let currentChunk = ''

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > CHUNK_SIZE && currentChunk) {
      chunks.push(currentChunk.trim())
      // Keep overlap
      const words = currentChunk.split(' ')
      currentChunk = words.slice(-Math.floor(CHUNK_OVERLAP / 5)).join(' ') + ' '
    }
    currentChunk += sentence + ' '
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }

  return chunks
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })
  return response.data[0].embedding
}

export async function indexArticle(articleId: string) {
  const article = await prisma.wikiArticle.findUnique({
    where: { id: articleId },
    include: { category: true },
  })

  if (!article) throw new Error('Article not found')

  // Delete existing embeddings
  await prisma.wikiEmbedding.deleteMany({
    where: { articleId },
  })

  // Create chunks with context
  const contextPrefix = `Title: ${article.title}\nCategory: ${article.category.name}\n\n`
  const chunks = chunkText(article.contentPlain)

  for (let i = 0; i < chunks.length; i++) {
    const chunkWithContext = contextPrefix + chunks[i]
    const embedding = await generateEmbedding(chunkWithContext)

    await prisma.$executeRaw`
      INSERT INTO "WikiEmbedding" ("id", "articleId", "chunkIndex", "chunkText", "embedding", "createdAt", "updatedAt")
      VALUES (
        gen_random_uuid(),
        ${articleId},
        ${i},
        ${chunks[i]},
        ${embedding}::vector,
        NOW(),
        NOW()
      )
    `
  }

  return chunks.length
}

export async function searchSimilar(query: string, limit = 5) {
  const queryEmbedding = await generateEmbedding(query)

  const results = await prisma.$queryRaw<Array<{
    articleId: string
    title: string
    slug: string
    categoryName: string
    chunkText: string
    similarity: number
  }>>`
    SELECT 
      we."articleId",
      wa.title,
      wa.slug,
      wc.name as "categoryName",
      we."chunkText",
      1 - (we.embedding <=> ${queryEmbedding}::vector) as similarity
    FROM "WikiEmbedding" we
    JOIN "WikiArticle" wa ON wa.id = we."articleId"
    JOIN "WikiCategory" wc ON wc.id = wa."categoryId"
    WHERE wa.status = 'PUBLISHED'
    ORDER BY we.embedding <=> ${queryEmbedding}::vector
    LIMIT ${limit}
  `

  return results
}
```

### Step 3: Create Chat API Route
Create `app/api/wiki/chat/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { searchSimilar } from '@/lib/wiki/embeddings'
import { prisma } from '@/lib/prisma'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const SYSTEM_PROMPT = `You are a helpful assistant for Living Wellness Dental staff. 
Your role is to answer questions about company procedures, policies, and training materials.

Guidelines:
- Only answer based on the provided context from the wiki
- If the context doesn't contain relevant information, say so
- Be concise and professional
- When referencing articles, mention them by title
- If asked about something outside your knowledge, suggest contacting a manager

Context from wiki articles will be provided with each question.`

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    // Search for relevant wiki content
    const relevantChunks = await searchSimilar(message, 5)

    // Build context from search results
    const context = relevantChunks
      .map((chunk, i) => `[${i + 1}] From "${chunk.title}" (${chunk.categoryName}):\n${chunk.chunkText}`)
      .join('\n\n---\n\n')

    // Build messages array
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      {
        role: 'user',
        content: `Context from wiki:\n${context}\n\n---\n\nUser question: ${message}`,
      },
    ]

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.3,
      max_tokens: 500,
    })

    const reply = completion.choices[0].message.content

    // Return response with sources
    const sources = [...new Map(relevantChunks.map(c => [c.articleId, {
      title: c.title,
      slug: c.slug,
      category: c.categoryName,
    }])).values()]

    return NextResponse.json({
      reply,
      sources,
    })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 })
  }
}
```

### Step 4: Create Chat Widget Component
Create `components/wiki/WikiChatWidget.tsx`:
```typescript
'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: { title: string; slug: string; category: string }[]
}

export default function WikiChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const res = await fetch('/api/wiki/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      const data = await res.json()
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply,
        sources: data.sources,
      }])
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-violet-600 text-white rounded-full shadow-lg hover:bg-violet-700 transition-all flex items-center justify-center z-50"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-violet-600 rounded-t-2xl">
            <h3 className="font-semibold text-white">Wiki Assistant</h3>
            <p className="text-sm text-violet-200">Ask about procedures & policies</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <p className="text-sm">Hi! Ask me anything about our</p>
                <p className="text-sm">procedures, policies, or training.</p>
              </div>
            )}
            
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  msg.role === 'user' 
                    ? 'bg-violet-600 text-white' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Sources:</p>
                      <div className="flex flex-wrap gap-1">
                        {msg.sources.map((source, j) => (
                          <Link
                            key={j}
                            href={`/wiki/article/${source.slug}`}
                            className="text-xs text-violet-600 hover:underline"
                            onClick={() => setIsOpen(false)}
                          >
                            {source.title}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask a question..."
                className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:border-violet-500"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 bg-violet-600 text-white rounded-full flex items-center justify-center hover:bg-violet-700 disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

### Step 5: Add Chat Widget to Layout
Update `app/(default)/wiki/layout.tsx`:
```typescript
import { WikiProvider } from '@/contexts/WikiContext'
import WikiSidebar from '@/components/wiki/WikiSidebar'
import WikiChatWidget from '@/components/wiki/WikiChatWidget'

export const metadata = {
  title: 'Wiki - Living Wellness Dental',
}

export default function WikiLayout({ children }: { children: React.ReactNode }) {
  return (
    <WikiProvider>
      <div className="flex h-full">
        <WikiSidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
      <WikiChatWidget />
    </WikiProvider>
  )
}
```

### Step 6: Auto-Index Articles on Publish
Update `app/api/wiki/articles/[id]/route.ts` to trigger indexing:
```typescript
import { indexArticle } from '@/lib/wiki/embeddings'

// In the PUT handler, after updating:
if (status === 'PUBLISHED') {
  // Index asynchronously (don't await to avoid blocking)
  indexArticle(article.id).catch(console.error)
}
```

### Step 7: Create Batch Indexing Script
Create `scripts/index-wiki.ts`:
```typescript
import { PrismaClient } from '@prisma/client'
import { indexArticle } from '../lib/wiki/embeddings'

const prisma = new PrismaClient()

async function indexAllArticles() {
  const articles = await prisma.wikiArticle.findMany({
    where: { status: 'PUBLISHED' },
    select: { id: true, title: true },
  })

  console.log(`Indexing ${articles.length} articles...`)

  for (const article of articles) {
    try {
      const chunks = await indexArticle(article.id)
      console.log(`✓ ${article.title} (${chunks} chunks)`)
    } catch (error) {
      console.error(`✗ ${article.title}:`, error)
    }
  }

  console.log('Indexing complete!')
}

indexAllArticles()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

Add to `package.json`:
```json
{
  "scripts": {
    "wiki:index": "tsx scripts/index-wiki.ts"
  }
}
```

---

## Execution Order

### For Markdown Import:
1. `npm install marked gray-matter && npm install -D @types/marked`
2. Create `scripts/import-wiki.ts`
3. Organize markdown files in `import-data/` folder
4. Run `npm run wiki:import`

### For AI Chat:
1. Ensure OpenAI API key in `.env.local`
2. Create `lib/wiki/embeddings.ts`
3. Create `app/api/wiki/chat/route.ts`
4. Create `components/wiki/WikiChatWidget.tsx`
5. Update wiki layout to include widget
6. Run `npm run wiki:index` to index existing articles

---

## Cost Estimates (OpenAI)

| Operation | Model | Cost per 1M tokens |
|-----------|-------|-------------------|
| Embeddings | text-embedding-3-small | $0.02 |
| Chat | gpt-4o-mini | $0.15 input / $0.60 output |

Typical usage:
- Indexing 100 articles (~50k words): ~$0.01
- 1000 chat queries/month: ~$1-2
