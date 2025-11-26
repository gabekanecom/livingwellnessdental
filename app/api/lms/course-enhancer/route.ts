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
    const { courseId, enhancementMode, documents } = body as {
      courseId: string;
      enhancementMode: 'add_modules' | 'enhance_existing';
      documents: DocumentInput[];
    };

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    if (!documents || documents.length === 0) {
      return NextResponse.json(
        { error: 'At least one document is required' },
        { status: 400 }
      );
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: {
            lessons: true
          },
          orderBy: {
            order: 'desc'
          },
          take: 1
        }
      }
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const agent = new LMSCourseBuilderAgent();
    const results = [];
    let totalNewLessons = 0;
    const lastModuleOrder = course.modules[0]?.order || 0;

    if (enhancementMode === 'add_modules') {
      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        const moduleTitle = doc.moduleTitle || doc.fileName.replace(/\.[^/.]+$/, '');

        try {
          const content = await agent.extractDocumentContent({
            documentContent: doc.content,
            documentType: doc.type
          });

          const newModule = await prisma.courseModule.create({
            data: {
              courseId: course.id,
              title: moduleTitle,
              description: content.description || `New module: ${moduleTitle}`,
              order: lastModuleOrder + i + 1
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
                  moduleId: newModule.id,
                  title: lesson.title,
                  content: lesson.content,
                  lessonType: lessonTypeMap[lesson.lessonType] || 'TEXT',
                  duration: lesson.estimatedDuration,
                  order: j + 1
                }
              });
              totalNewLessons++;
            }
          }

          results.push({
            moduleTitle,
            success: true,
            lessonCount: content.modules?.[0]?.lessons?.length || 0
          });
        } catch (docError) {
          console.error(`Error processing document ${doc.fileName}:`, docError);
          results.push({
            moduleTitle,
            success: false,
            error: docError instanceof Error ? docError.message : 'Unknown error'
          });
        }
      }
    } else {
      results.push({
        success: true,
        message: 'Content enhancement mode is not yet fully implemented'
      });
    }

    return NextResponse.json({
      data: {
        courseId: course.id,
        courseTitle: course.title,
        enhancementMode,
        newModules: results.filter(r => r.success).length,
        newLessons: totalNewLessons,
        results,
        message: `Successfully added ${results.filter(r => r.success).length} new modules with ${totalNewLessons} lessons`
      }
    });
  } catch (error) {
    console.error('Error in course enhancer:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}
