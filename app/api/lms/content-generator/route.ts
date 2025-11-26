import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { LMSContentGeneratorAgent } from '@/ai-agents/agents/lms-content-generator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mode, topic, outline, config } = body;

    if (!mode || !['topic', 'outline', 'enhancement'].includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid mode. Must be "topic", "outline", or "enhancement"' },
        { status: 400 }
      );
    }

    if (mode === 'topic' && !topic) {
      return NextResponse.json(
        { error: 'Topic is required for topic mode' },
        { status: 400 }
      );
    }

    if (mode === 'outline' && !outline) {
      return NextResponse.json(
        { error: 'Outline is required for outline mode' },
        { status: 400 }
      );
    }

    if (!config?.targetAudience) {
      return NextResponse.json(
        { error: 'Target audience is required' },
        { status: 400 }
      );
    }

    const agent = new LMSContentGeneratorAgent();
    const generatedContent = await agent.generateCourseContent({
      mode,
      topic,
      outline,
      config: {
        targetAudience: config.targetAudience,
        difficultyLevel: config.difficultyLevel || 'beginner',
        industryContext: config.industryContext,
        learningStyle: config.learningStyle || 'mixed',
        contentDepth: config.contentDepth || 'detailed',
        includeExamples: config.includeExamples ?? true,
        includeExercises: config.includeExercises ?? true,
        includeQuizzes: config.includeQuizzes ?? true,
        includeResources: config.includeResources ?? true,
        estimatedDuration: config.estimatedDuration
      }
    });

    const difficultyMap: Record<string, 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'> = {
      'beginner': 'BEGINNER',
      'intermediate': 'INTERMEDIATE',
      'advanced': 'ADVANCED'
    };

    const slug = generatedContent.course.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();

    const course = await prisma.course.create({
      data: {
        title: generatedContent.course.title,
        slug,
        description: generatedContent.course.description,
        shortDescription: generatedContent.course.shortDescription,
        difficulty: difficultyMap[config.difficultyLevel || 'beginner'] || 'BEGINNER',
        duration: generatedContent.course.estimatedDuration,
        learningObjectives: generatedContent.course.learningObjectives,
        prerequisites: generatedContent.course.prerequisites,
        tags: generatedContent.course.tags,
        categoryId: config.categoryId || null,
        isPublished: config.autoPublish || false
      }
    });

    let totalLessons = 0;

    for (let i = 0; i < generatedContent.modules.length; i++) {
      const moduleData = generatedContent.modules[i];
      
      const createdModule = await prisma.courseModule.create({
        data: {
          courseId: course.id,
          title: moduleData.title,
          description: moduleData.description,
          order: i + 1
        }
      });

      for (let j = 0; j < moduleData.lessons.length; j++) {
        const lessonData = moduleData.lessons[j];
        const lessonTypeMap: Record<string, 'TEXT' | 'VIDEO' | 'INTERACTIVE' | 'QUIZ' | 'ASSIGNMENT' | 'DOCUMENT'> = {
          'text': 'TEXT',
          'video_script': 'VIDEO',
          'interactive': 'INTERACTIVE',
          'quiz': 'QUIZ',
          'assignment': 'ASSIGNMENT'
        };

        const createdLesson = await prisma.lesson.create({
          data: {
            moduleId: createdModule.id,
            title: lessonData.title,
            content: lessonData.content,
            lessonType: lessonTypeMap[lessonData.type] || 'TEXT',
            duration: lessonData.estimatedDuration,
            order: j + 1
          }
        });

        if (lessonData.quiz && lessonData.quiz.questions.length > 0) {
          const quiz = await prisma.quiz.create({
            data: {
              lessonId: createdLesson.id,
              title: `Quiz: ${lessonData.title}`,
              passingScore: lessonData.quiz.passingScore
            }
          });

          for (let k = 0; k < lessonData.quiz.questions.length; k++) {
            const questionData = lessonData.quiz.questions[k];
            const questionTypeMap: Record<string, 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY'> = {
              'multiple_choice': 'MULTIPLE_CHOICE',
              'true_false': 'TRUE_FALSE',
              'short_answer': 'SHORT_ANSWER'
            };

            const createdQuestion = await prisma.quizQuestion.create({
              data: {
                quizId: quiz.id,
                question: questionData.question,
                questionType: questionTypeMap[questionData.type] || 'MULTIPLE_CHOICE',
                points: questionData.points,
                explanation: questionData.explanation,
                order: k + 1
              }
            });

            if (questionData.options) {
              for (let l = 0; l < questionData.options.length; l++) {
                await prisma.quizAnswer.create({
                  data: {
                    questionId: createdQuestion.id,
                    text: questionData.options[l],
                    isCorrect: l === questionData.correctAnswer,
                    order: l + 1
                  }
                });
              }
            }
          }
        }

        totalLessons++;
      }
    }

    return NextResponse.json({
      data: {
        courseId: course.id,
        courseTitle: course.title,
        moduleCount: generatedContent.modules.length,
        lessonCount: totalLessons
      },
      message: 'Course generated successfully'
    });
  } catch (error) {
    console.error('Error in content generator:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}
