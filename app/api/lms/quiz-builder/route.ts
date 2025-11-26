import { NextRequest, NextResponse } from 'next/server';
import { LMSQuizBuilderAgent } from '@/ai-agents/agents/lms-quiz-builder';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documents, config, mode } = body;

    if (!documents || documents.length === 0) {
      return NextResponse.json(
        { error: 'At least one document is required' },
        { status: 400 }
      );
    }

    const agent = new LMSQuizBuilderAgent();

    if (mode === 'single' || documents.length === 1) {
      const doc = documents[0];
      const result = await agent.analyzeDocumentAndCreateQuiz({
        documentContent: doc.content || doc.url,
        documentType: doc.type,
        quizConfig: {
          moduleTitle: doc.moduleTitle || doc.fileName,
          lessonId: config?.lessonId,
          difficultyLevel: config?.difficultyLevel,
          maxQuestions: config?.maxQuestionsPerQuiz,
          timeLimitMinutes: config?.timeLimitMinutes,
          autoAttachToLesson: config?.autoAttachToLessons
        }
      });

      return NextResponse.json({ data: result });
    } else {
      const results = await agent.createQuizzesFromDocuments(
        documents.map((doc: any) => ({
          content: doc.content || doc.url,
          type: doc.type,
          fileName: doc.fileName,
          moduleTitle: doc.moduleTitle,
          lessonId: doc.lessonId
        })),
        {
          difficultyLevel: config?.difficultyLevel,
          maxQuestionsPerQuiz: config?.maxQuestionsPerQuiz,
          timeLimitMinutes: config?.timeLimitMinutes,
          autoAttachToLessons: config?.autoAttachToLessons
        }
      );

      const successfulQuizzes = results.filter((r: any) => r.success).length;
      const totalQuestions = results.reduce((sum: number, r: any) => sum + (r.questionCount || 0), 0);

      return NextResponse.json({
        data: {
          results,
          successfulQuizzes,
          totalQuestions
        }
      });
    }
  } catch (error) {
    console.error('Error in quiz builder:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}
