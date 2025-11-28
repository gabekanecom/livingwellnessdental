import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CHUNK_SIZE = 1000; // characters
const CHUNK_OVERLAP = 200; // characters overlap

export interface EmbeddingChunk {
  articleId: string;
  chunkIndex: number;
  chunkText: string;
  embedding: number[];
  metadata: {
    title: string;
    category: string;
    headingPath: string[];
  };
}

/**
 * Generate embeddings for article content
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Split article content into chunks for embedding
 */
export function chunkArticleContent(
  content: string,
  maxChunkSize: number = CHUNK_SIZE
): string[] {
  const words = content.split(/\s+/);
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentSize = 0;

  for (const word of words) {
    const wordSize = word.length / 4; // Rough token estimate

    if (currentSize + wordSize > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
      // Keep overlap
      const overlapWords = Math.floor(CHUNK_OVERLAP / 4);
      currentChunk = currentChunk.slice(-overlapWords);
      currentSize = currentChunk.reduce((sum, w) => sum + w.length / 4, 0);
    }

    currentChunk.push(word);
    currentSize += wordSize;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  return chunks;
}

/**
 * Generate embeddings for an article
 */
export async function generateArticleEmbeddings(
  articleId: string,
  title: string,
  content: string,
  categoryName: string
): Promise<EmbeddingChunk[]> {
  const chunks = chunkArticleContent(content);
  const embeddingChunks: EmbeddingChunk[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunkText = chunks[i];
    const embedding = await generateEmbedding(chunkText);

    embeddingChunks.push({
      articleId,
      chunkIndex: i,
      chunkText,
      embedding,
      metadata: {
        title,
        category: categoryName,
        headingPath: [], // TODO: Extract heading hierarchy
      },
    });
  }

  return embeddingChunks;
}

/**
 * Improved chunking by sentences for better context
 */
export function chunkText(text: string): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > CHUNK_SIZE && currentChunk) {
      chunks.push(currentChunk.trim());
      // Keep overlap
      const words = currentChunk.split(' ');
      currentChunk = words.slice(-Math.floor(CHUNK_OVERLAP / 5)).join(' ') + ' ';
    }
    currentChunk += sentence + ' ';
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Index an article for vector search
 * Note: Requires pgvector extension enabled in production
 */
export async function indexArticle(articleId: string): Promise<number> {
  const article = await prisma.wikiArticle.findUnique({
    where: { id: articleId },
    include: {
      categories: {
        include: { category: true },
        orderBy: { isPrimary: 'desc' },
      },
    },
  });

  if (!article) throw new Error('Article not found');

  // Delete existing embeddings (when pgvector is enabled, uncomment this)
  // await prisma.wikiEmbedding.deleteMany({
  //   where: { articleId },
  // });

  // Create chunks with context
  const primaryCategoryName = article.categories[0]?.category.name || 'Uncategorized';
  const contextPrefix = `Title: ${article.title}\nCategory: ${primaryCategoryName}\n\n`;
  const chunks = chunkText(article.contentPlain);

  for (let i = 0; i < chunks.length; i++) {
    const chunkWithContext = contextPrefix + chunks[i];
    const embedding = await generateEmbedding(chunkWithContext);

    // When pgvector is enabled in production, uncomment this:
    // await prisma.$executeRaw`
    //   INSERT INTO "WikiEmbedding" ("id", "articleId", "chunkIndex", "chunkText", "embedding", "createdAt", "updatedAt")
    //   VALUES (
    //     gen_random_uuid(),
    //     ${articleId},
    //     ${i},
    //     ${chunks[i]},
    //     ${embedding}::vector,
    //     NOW(),
    //     NOW()
    //   )
    // `;
  }

  return chunks.length;
}

/**
 * Search for similar content using vector similarity
 * Note: Requires pgvector extension enabled in production
 */
export async function searchSimilar(query: string, limit = 5) {
  const queryEmbedding = await generateEmbedding(query);

  // When pgvector is enabled in production, uncomment this:
  // const results = await prisma.$queryRaw<Array<{
  //   articleId: string;
  //   title: string;
  //   slug: string;
  //   categoryName: string;
  //   chunkText: string;
  //   similarity: number;
  // }>>`
  //   SELECT
  //     we."articleId",
  //     wa.title,
  //     wa.slug,
  //     wc.name as "categoryName",
  //     we."chunkText",
  //     1 - (we.embedding <=> ${queryEmbedding}::vector) as similarity
  //   FROM "WikiEmbedding" we
  //   JOIN "WikiArticle" wa ON wa.id = we."articleId"
  //   JOIN "WikiCategory" wc ON wc.id = wa."categoryId"
  //   WHERE wa.status = 'PUBLISHED'
  //   ORDER BY we.embedding <=> ${queryEmbedding}::vector
  //   LIMIT ${limit}
  // `;
  // return results;

  // Fallback: Use full-text search instead
  const articles = await prisma.wikiArticle.findMany({
    where: {
      status: 'PUBLISHED',
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { contentPlain: { contains: query, mode: 'insensitive' } },
      ],
    },
    include: {
      categories: {
        include: { category: true },
        orderBy: { isPrimary: 'desc' },
      },
    },
    take: limit,
  });

  return articles.map(article => ({
    articleId: article.id,
    title: article.title,
    slug: article.slug,
    categoryName: article.categories[0]?.category.name || 'Uncategorized',
    chunkText: article.excerpt || article.contentPlain.substring(0, 500),
    similarity: 0.5,
  }));
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}
