import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Allowed domains for embedding (add your public site)
const ALLOWED_ORIGINS = [
  'https://livingwellnessdental.com',
  'https://www.livingwellnessdental.com',
  'http://localhost:3000', // For testing
  'http://localhost:5500', // VS Code Live Server
  'http://localhost:8000', // Python http.server
  'http://127.0.0.1:5500',
  'http://127.0.0.1:8000',
];

// Rate limiting (simple in-memory, use Redis in production)
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimits.get(ip);

  if (!limit || now > limit.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (limit.count >= RATE_LIMIT) {
    return false;
  }

  limit.count++;
  return true;
}

const SYSTEM_PROMPT = `You are a helpful assistant for Living Wellness Dental, answering questions from potential and current patients.

Guidelines:
- Be friendly, professional, and welcoming
- Answer based on the provided wiki context
- For appointment scheduling, direct them to call or use the website booking
- Don't provide specific medical advice - suggest consulting with the dentist
- Keep responses concise (2-3 sentences when possible)
- If you don't know something, say so and suggest contacting the office

Contact info:
- Phone: Contact us through our website
- Website: livingwellnessdental.com`;

// Simple text search fallback (use vector search in production)
async function searchWikiContent(query: string) {
  const articles = await prisma.wikiArticle.findMany({
    where: {
      status: 'PUBLISHED',
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { contentPlain: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: {
      title: true,
      contentPlain: true,
      category: { select: { name: true } },
    },
    take: 3,
  });

  return articles.map(a => ({
    title: a.title,
    category: a.category.name,
    content: a.contentPlain.substring(0, 500),
  }));
}

export async function POST(request: NextRequest) {
  // CORS check
  const origin = request.headers.get('origin');
  const isAllowedOrigin = origin && ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed));

  const headers = {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Rate limiting
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment.' },
      { status: 429, headers }
    );
  }

  try {
    const { message, conversationHistory = [] } = await request.json();

    if (!message || message.length > 500) {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400, headers });
    }

    // Search wiki for relevant content
    const relevantContent = await searchWikiContent(message);

    const context =
      relevantContent.length > 0
        ? relevantContent.map(c => `[${c.category}] ${c.title}:\n${c.content}`).join('\n\n---\n\n')
        : 'No specific wiki content found for this query.';

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory.slice(-6).map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      {
        role: 'user',
        content: `Wiki context:\n${context}\n\n---\n\nPatient question: ${message}`,
      },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.4,
      max_tokens: 300,
    });

    return NextResponse.json(
      {
        reply: completion.choices[0].message.content,
      },
      { headers }
    );
  } catch (error) {
    console.error('Widget chat error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500, headers });
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const isAllowedOrigin = origin && ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed));

  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': isAllowedOrigin ? origin : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
