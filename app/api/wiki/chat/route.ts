import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { searchSimilar } from '@/lib/wiki/embeddings';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a helpful assistant for Living Wellness Dental staff.
Your role is to answer questions about company procedures, policies, and training materials.

Guidelines:
- Only answer based on the provided context from the wiki
- If the context doesn't contain relevant information, say so politely
- Be concise and professional
- When referencing articles, mention them by title
- If asked about something outside your knowledge, suggest contacting a manager
- Use a friendly but professional tone

Context from wiki articles will be provided with each question.`;

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    // Search for relevant wiki content
    const relevantChunks = await searchSimilar(message, 5);

    // Build context from search results
    const context =
      relevantChunks.length > 0
        ? relevantChunks
            .map((chunk, i) => `[${i + 1}] From "${chunk.title}" (${chunk.categoryName}):\n${chunk.chunkText}`)
            .join('\n\n---\n\n')
        : 'No relevant wiki content found.';

    // Build messages array
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      {
        role: 'user',
        content: `Context from wiki:\n${context}\n\n---\n\nUser question: ${message}`,
      },
    ];

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.3,
      max_tokens: 500,
    });

    const reply = completion.choices[0].message.content;

    // Return response with sources
    const sourcesMap = new Map(
      relevantChunks.map(c => [
        c.articleId,
        {
          title: c.title,
          slug: c.slug,
          category: c.categoryName,
        },
      ])
    );
    const sources = Array.from(sourcesMap.values());

    return NextResponse.json({
      reply,
      sources,
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 });
  }
}
