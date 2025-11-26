import { NextRequest, NextResponse } from 'next/server';

// Note: This endpoint requires the WikiEmbedding model and pgvector extension.
// Enable the model in prisma/schema.prisma when using a production database with pgvector support.

export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      error: 'Embeddings feature is not yet enabled. Please enable pgvector and the WikiEmbedding model in the database schema.',
      message: 'This feature requires the WikiEmbedding model in Prisma schema and pgvector PostgreSQL extension.'
    },
    { status: 501 }
  );
}
