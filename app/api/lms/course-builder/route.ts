import { NextRequest, NextResponse } from 'next/server';
import { LMSCourseBuilderAgent } from '@/ai-agents/agents/lms-course-builder';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentContent, documentType, courseConfig } = body;

    if (!documentContent) {
      return NextResponse.json(
        { error: 'Document content is required' },
        { status: 400 }
      );
    }

    const agent = new LMSCourseBuilderAgent();
    const result = await agent.analyzeDocumentAndCreateCourse({
      documentContent,
      documentType: documentType || 'txt',
      courseConfig: {
        categoryId: courseConfig?.categoryId,
        createdById: courseConfig?.createdById,
        difficultyLevel: courseConfig?.difficultyLevel || 'beginner',
        targetAudience: courseConfig?.targetAudience,
        autoPublish: courseConfig?.autoPublish || false
      }
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create course' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        courseId: result.courseId,
        courseTitle: result.courseTitle,
        moduleCount: result.moduleCount,
        lessonCount: result.lessonCount
      },
      message: result.message
    });
  } catch (error) {
    console.error('Error in course builder:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}
