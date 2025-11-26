import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { LMSCourseBuilderAgent } from '@/ai-agents/agents/lms-course-builder';

interface DocumentInput {
  content: string;
  type: 'docx' | 'txt';
  fileName: string;
  moduleTitle?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documents, config } = body as {
      documents: DocumentInput[];
      config: {
        categoryId?: string;
        difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
        targetAudience?: string;
        autoPublish?: boolean;
        courseTitle?: string;
        createdById?: string;
      };
    };

    if (!documents || documents.length === 0) {
      return NextResponse.json(
        { error: 'At least one document is required' },
        { status: 400 }
      );
    }

    const agent = new LMSCourseBuilderAgent();
    const difficultyMap: Record<string, 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'> = {
      'beginner': 'BEGINNER',
      'intermediate': 'INTERMEDIATE',
      'advanced': 'ADVANCED'
    };

    const courseTitle = config.courseTitle || `Course from ${documents.length} Documents`;
    const slug = courseTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();

    const course = await prisma.course.create({
      data: {
        title: courseTitle,
        slug,
        description: `Course generated from ${documents.length} document${documents.length > 1 ? 's' : ''}.`,
        difficulty: difficultyMap[config.difficultyLevel || 'beginner'] || 'BEGINNER',
        isPublished: config.autoPublish || false,
        categoryId: config.categoryId || null,
        createdById: config.createdById || null,
        learningObjectives: [],
        prerequisites: [],
        tags: ['ai-generated', 'multi-document']
      }
    });

    let totalLessons = 0;
    const moduleResults = [];

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      const moduleTitle = doc.moduleTitle || doc.fileName.replace(/\.[^/.]+$/, '');

      try {
        const content = await agent.extractDocumentContent({
          documentContent: doc.content,
          documentType: doc.type,
          courseConfig: {
            difficultyLevel: config.difficultyLevel,
            targetAudience: config.targetAudience
          }
        });

        const createdModule = await prisma.courseModule.create({
          data: {
            courseId: course.id,
            title: moduleTitle,
            description: content.description || `Module ${i + 1}`,
            order: i + 1
          }
        });

        if (content.modules && content.modules.length > 0) {
          const firstModule = content.modules[0];
          for (let j = 0; j < firstModule.lessons.length; j++) {
            const lesson = firstModule.lessons[j];
            const lessonTypeMap: Record<string, 'TEXT' | 'VIDEO' | 'INTERACTIVE' | 'QUIZ' | 'ASSIGNMENT' | 'DOCUMENT'> = {
              'text': 'TEXT',
              'video': 'VIDEO',
              'interactive': 'INTERACTIVE',
              'quiz': 'QUIZ',
              'assignment': 'ASSIGNMENT',
              'document': 'DOCUMENT'
            };

            await prisma.lesson.create({
              data: {
                moduleId: createdModule.id,
                title: lesson.title,
                content: lesson.content,
                lessonType: lessonTypeMap[lesson.lessonType] || 'TEXT',
                duration: lesson.estimatedDuration,
                order: j + 1
              }
            });
            totalLessons++;
          }
        }

        moduleResults.push({
          moduleTitle,
          success: true,
          lessonCount: content.modules?.[0]?.lessons?.length || 0
        });
      } catch (docError) {
        console.error(`Error processing document ${doc.fileName}:`, docError);
        moduleResults.push({
          moduleTitle,
          success: false,
          error: docError instanceof Error ? docError.message : 'Unknown error'
        });
      }
    }

    if (moduleResults.some(r => r.success)) {
      const learningObjectives = documents.slice(0, 5).map((_, i) => 
        `Complete Module ${i + 1} and understand its key concepts`
      );
      
      await prisma.course.update({
        where: { id: course.id },
        data: {
          learningObjectives,
          duration: totalLessons * 15
        }
      });
    }

    return NextResponse.json({
      data: {
        courseId: course.id,
        courseTitle: course.title,
        moduleCount: moduleResults.filter(r => r.success).length,
        lessonCount: totalLessons,
        moduleResults
      },
      message: 'Course created from multiple documents'
    });
  } catch (error) {
    console.error('Error in multi-document builder:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}
