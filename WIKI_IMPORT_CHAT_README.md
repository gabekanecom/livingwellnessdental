# Wiki Import & Chat - Implementation Summary

## ✅ Implementation Complete

Both markdown import and AI chat features have been fully implemented for the Living Wellness Dental wiki module.

---

## 📥 Markdown Import Features

### Option A: Bulk Import Script

**Script Location:** `scripts/import-wiki.ts`

**How to Use:**
1. Create an `import-data/` directory in the project root
2. Organize markdown files into category folders:
   ```
   import-data/
   ├── getting-started/
   │   ├── welcome.md
   │   └── first-day.md
   ├── hr-policies/
   │   └── time-off.md
   └── clinical/
       └── procedures.md
   ```
3. Add frontmatter to markdown files:
   ```markdown
   ---
   title: Welcome Guide
   tags: [onboarding, new-hire]
   status: PUBLISHED
   order: 1
   ---

   # Your content here
   ```
4. Run the import:
   ```bash
   npm run wiki:import
   ```

**Features:**
- Auto-creates categories from folder names
- Parses frontmatter for metadata
- Converts markdown to HTML
- Skips existing articles
- Creates article versions
- Supports tags

### Option B: Web Upload Interface

**Component:** `components/wiki/ImportUploader.tsx`
**API Route:** `app/api/wiki/import/route.ts`

**How to Use:**
1. Add the `ImportUploader` component to an admin page
2. Select a target category
3. Choose one or more `.md` files
4. Click "Import Files"

**Features:**
- Drag-and-drop file upload
- Multi-file selection
- Real-time import feedback
- Error reporting
- Duplicate detection

---

## 💬 AI Chat Widget Features

### Components Created

1. **WikiChatWidget** (`components/wiki/WikiChatWidget.tsx`)
   - Floating chat button (bottom-right)
   - Expandable chat window
   - Message history
   - Source citations with links
   - Loading indicators

2. **Chat API** (`app/api/wiki/chat/route.ts`)
   - OpenAI GPT-4o-mini integration
   - Context retrieval from wiki articles
   - Conversation history support
   - Source attribution

3. **Search Utilities** (`lib/wiki/embeddings.ts`)
   - Text chunking for embeddings
   - Embedding generation (OpenAI)
   - Vector search (fallback to full-text for now)
   - Article indexing functions

### How It Works

1. **User asks a question** in the chat widget
2. **System searches** for relevant wiki articles
3. **Context is built** from top matching articles
4. **OpenAI generates** a response based on context
5. **Response includes** source article links

### Current Implementation Notes

**Without pgvector (Current State):**
- Uses fallback full-text search
- Searches article titles and content
- Returns relevant articles as context
- Chat works but without true semantic search

**With pgvector (Production):**
- Uncomment the pgvector code in `lib/wiki/embeddings.ts`
- Uncomment `WikiEmbedding` model in `prisma/schema.prisma`
- Enable pgvector extension in production database
- Run migrations
- Run `npm run wiki:index` to index existing articles

---

## 📜 Scripts Available

```json
{
  "wiki:import": "Import markdown files from import-data/",
  "wiki:index": "Generate embeddings for published articles"
}
```

---

## 🔧 Configuration

### Environment Variables Required

```env
# Required for AI chat
OPENAI_API_KEY=your_openai_api_key_here

# Database already configured
DATABASE_URL=your_database_url
```

### Cost Estimates (OpenAI)

| Operation | Model | Estimated Cost |
|-----------|-------|----------------|
| Embeddings | text-embedding-3-small | ~$0.01 per 100 articles |
| Chat | gpt-4o-mini | ~$1-2 per 1000 queries |

---

## 🚀 Usage Examples

### Importing Markdown Files

```bash
# Create directory structure
mkdir -p import-data/getting-started
mkdir -p import-data/hr-policies

# Add markdown files
echo "---
title: Welcome to the Team
tags: [onboarding]
status: PUBLISHED
---

# Welcome!

Your content here..." > import-data/getting-started/welcome.md

# Run import
npm run wiki:import
```

### Using the Chat Widget

1. Navigate to any wiki page
2. Click the blue chat button (bottom-right)
3. Ask questions like:
   - "What is the dress code policy?"
   - "How do I request time off?"
   - "What are the sterilization procedures?"
4. Receive AI-generated answers with source links

### Indexing Articles

```bash
# Generate embeddings for all published articles
npm run wiki:index
```

---

## 📁 File Structure

```
├── app/
│   └── api/
│       └── wiki/
│           ├── chat/
│           │   └── route.ts          # AI chat endpoint
│           └── import/
│               └── route.ts          # Web upload endpoint
├── components/
│   └── wiki/
│       ├── WikiChatWidget.tsx        # Chat UI component
│       └── ImportUploader.tsx        # Upload UI component
├── lib/
│   └── wiki/
│       └── embeddings.ts             # AI/search utilities
├── scripts/
│   ├── import-wiki.ts                # Bulk import script
│   └── index-wiki.ts                 # Indexing script
└── import-data/                      # Place markdown files here
    └── [category-folders]/
        └── *.md
```

---

## ✨ Features Summary

### Markdown Import ✅
- [x] Bulk import from filesystem
- [x] Web upload interface
- [x] Frontmatter parsing
- [x] Category auto-creation
- [x] Tag support
- [x] Duplicate detection
- [x] Version tracking

### AI Chat ✅
- [x] Floating chat widget
- [x] Context-aware responses
- [x] Source citations
- [x] Conversation history
- [x] Full-text search fallback
- [x] OpenAI integration
- [x] Mobile-responsive UI

### Ready for Production
- [ ] Enable pgvector extension
- [ ] Uncomment vector search code
- [ ] Run article indexing
- [ ] Set up OpenAI API key
- [ ] Test with real data

---

## 🎯 Next Steps

1. **Add OpenAI API key** to your environment variables
2. **Test markdown import** with sample files
3. **Try the chat widget** with imported content
4. **For production:** Enable pgvector for true semantic search
5. **Monitor usage** and adjust OpenAI rate limits as needed

---

## 📞 Support

- **Import Issues:** Check file format and frontmatter syntax
- **Chat Not Working:** Verify OPENAI_API_KEY is set
- **No Search Results:** Ensure articles are published
- **Vector Search:** Enable pgvector in production database

All features are now ready to use! 🎉
