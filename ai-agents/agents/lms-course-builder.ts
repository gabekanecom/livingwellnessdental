import prisma from '@/lib/prisma';
import { BaseAIAgent, GPTModel } from '../base/BaseAIAgent';

interface CourseContent {
  title: string;
  description: string;
  modules: ModuleContent[];
  learningObjectives: string[];
  prerequisites?: string[];
  tags?: string[];
  estimatedDuration?: number;
  targetAudience?: string;
  skillLevel?: 'beginner' | 'intermediate' | 'advanced';
}

interface ModuleContent {
  title: string;
  description: string;
  lessons: LessonContent[];
  sortOrder: number;
}

interface LessonContent {
  title: string;
  description: string;
  content: string;
  lessonType: 'text' | 'video' | 'interactive' | 'quiz' | 'assignment' | 'document';
  estimatedDuration: number;
  sortOrder: number;
  requiresQuiz?: boolean;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface QuizData {
  questions: QuizQuestion[];
}

interface DocumentAnalysisRequest {
  documentContent: string;
  documentType: 'docx' | 'txt';
  courseConfig?: {
    categoryId?: string;
    createdById?: string;
    difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
    targetAudience?: string;
    autoPublish?: boolean;
  };
  modelConfig?: {
    courseGeneration?: GPTModel;
    quizGeneration?: GPTModel;
  };
}

export class LMSCourseBuilderAgent extends BaseAIAgent {
  private operationModels: {
    courseGeneration: GPTModel;
    quizGeneration: GPTModel;
  };

  constructor() {
    super('LMSCourseBuilder', {
      primary: 'gpt-4o-mini',
      secondary: 'gpt-4o-mini',
      fallback: 'gpt-3.5-turbo'
    });
    
    this.operationModels = {
      courseGeneration: 'gpt-4o-mini',
      quizGeneration: 'gpt-4o-mini'
    };
  }

  setOperationModels(models: Partial<typeof this.operationModels>) {
    this.operationModels = { ...this.operationModels, ...models };
  }

  getOperationModels() {
    return { ...this.operationModels };
  }

  async analyzeDocumentAndCreateCourse(request: DocumentAnalysisRequest) {
    try {
      const courseContent = await this.extractCourseContent(request);
      const course = await this.createCourse(courseContent, request.courseConfig);
      await this.createModulesAndLessons(course.id, courseContent.modules);

      return {
        success: true,
        courseId: course.id,
        courseTitle: course.title,
        moduleCount: courseContent.modules.length,
        lessonCount: courseContent.modules.reduce((total, m) => total + m.lessons.length, 0),
        message: 'Course created successfully from document'
      };
    } catch (error) {
      console.error('Error creating course from document:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async extractDocumentContent(request: DocumentAnalysisRequest): Promise<CourseContent> {
    try {
      return await this.extractCourseContent(request);
    } catch (error) {
      console.error('Error extracting document content:', error);
      throw error;
    }
  }

  private async extractCourseContent(request: DocumentAnalysisRequest): Promise<CourseContent> {
    const extractedText = request.documentContent;
    const estimatedTokens = Math.ceil(extractedText.length / 4);
    const maxContextTokens = 120000;
    
    if (estimatedTokens > maxContextTokens) {
      console.log(`Document too large (${estimatedTokens} tokens), using chunking approach`);
      return this.extractCourseContentFromLargeDocument(request, extractedText);
    }

    return this.extractCourseContentFromText(request, extractedText);
  }

  private async extractCourseContentFromLargeDocument(request: DocumentAnalysisRequest, extractedText: string): Promise<CourseContent> {
    const chunkSize = 80000;
    const chunks = this.chunkText(extractedText, chunkSize);
    
    console.log(`Processing large document in ${chunks.length} chunks`);
    
    const outlinePrompt = `You are an expert instructional designer. Create a high-level course outline from this large document content.

TASK: Create a course structure with modules and lesson titles only (no detailed content).

OUTPUT FORMAT (JSON):
{
  "title": "Course title",
  "description": "Course description",
  "learningObjectives": ["Objective 1", "Objective 2"],
  "modules": [
    {
      "title": "Module Title",
      "description": "Module description",
      "lessons": [
        {"title": "Lesson Title", "estimatedDuration": 15}
      ]
    }
  ]
}`;

    const outlineChunks = chunks.slice(0, 3).join('\n\n[SECTION BREAK]\n\n');
    const modelToUse = request.modelConfig?.courseGeneration || this.operationModels.courseGeneration;
    const outlineResponse = await this.makeOpenAIRequest({
      model: modelToUse,
      systemPrompt: outlinePrompt,
      userPrompt: `Create a course outline from this document:\n\n${outlineChunks}`,
      temperature: 0.7,
      maxTokens: 4096,
      responseFormat: 'json_object'
    });

    const outline = this.parseJSONResponse<any>(outlineResponse.content);
    
    const modules = [];
    for (const moduleOutline of outline.modules) {
      const lessons = [];
      for (const lessonOutline of moduleOutline.lessons) {
        const relevantChunk = this.findMostRelevantChunk(chunks, lessonOutline.title);
        const lessonContent = await this.generateLessonContent(lessonOutline, relevantChunk);
        lessons.push(lessonContent);
      }
      
      modules.push({
        ...moduleOutline,
        lessons,
        sortOrder: modules.length + 1
      });
    }

    return {
      title: outline.title,
      description: outline.description,
      learningObjectives: outline.learningObjectives || [],
      prerequisites: [],
      tags: ['ai-generated', 'large-document'],
      estimatedDuration: modules.reduce((sum, m) => sum + m.lessons.reduce((lessonSum: number, l: any) => lessonSum + (l.estimatedDuration || 15), 0), 0),
      modules
    };
  }

  private chunkText(text: string, chunkSize: number): string[] {
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private findMostRelevantChunk(chunks: string[], lessonTitle: string): string {
    let bestChunk = chunks[0];
    let bestScore = 0;
    
    const lessonKeywords = lessonTitle.toLowerCase().split(/\s+/);
    
    for (const chunk of chunks) {
      const chunkLower = chunk.toLowerCase();
      const score = lessonKeywords.reduce((score, keyword) => {
        const matches = (chunkLower.match(new RegExp(keyword, 'g')) || []).length;
        return score + matches;
      }, 0);
      
      if (score > bestScore) {
        bestScore = score;
        bestChunk = chunk;
      }
    }
    
    return bestChunk;
  }

  private async generateLessonContent(lessonOutline: any, relevantText: string) {
    const lessonPrompt = `Create detailed lesson content for: "${lessonOutline.title}"

Use this source material: ${relevantText.slice(0, 40000)}

Return JSON with:
{
  "title": "lesson title",
  "description": "lesson description", 
  "content": "detailed markdown content",
  "lessonType": "text",
  "estimatedDuration": minutes,
  "sortOrder": 1
}`;

    const response = await this.makeOpenAIRequest({
      model: 'gpt-4o-mini',
      systemPrompt: 'You are an expert content creator. Create engaging lesson content.',
      userPrompt: lessonPrompt,
      temperature: 0.7,
      maxTokens: 4096,
      responseFormat: 'json_object'
    });

    return this.parseJSONResponse(response.content);
  }

  private async extractCourseContentFromText(request: DocumentAnalysisRequest, extractedText: string): Promise<CourseContent> {
    const systemPrompt = `You are an expert instructional designer and course creator. Analyze the provided document and structure it into a comprehensive online course.

CRITICAL DOCUMENT STRUCTURE RULES:
1. **ONE DOCUMENT = ONE MODULE**: This entire document represents a SINGLE MODULE in the course
2. **PRESERVE EXACT LESSON COUNT**: Count and preserve ALL lessons exactly as they appear in the document
3. **DO NOT CREATE OR MERGE LESSONS**: Every lesson/section in the document must become a separate lesson

OUTPUT FORMAT (JSON):
{
  "title": "Descriptive course title that captures the main topic",
  "description": "Comprehensive 2-3 paragraph description",
  "learningObjectives": ["At least 3-5 specific, measurable learning objectives"],
  "prerequisites": ["Any required knowledge or skills"],
  "tags": ["relevant", "searchable", "topic", "keywords"],
  "estimatedDuration": total minutes for entire course,
  "targetAudience": "Specific description of who should take this course",
  "skillLevel": "beginner|intermediate|advanced",
  "modules": [
    {
      "title": "Module Title",
      "description": "Module description",
      "sortOrder": 1,
      "lessons": [
        {
          "title": "EXACT lesson title as it appears in document",
          "description": "Brief lesson description",
          "content": "Full lesson content in markdown format",
          "lessonType": "text",
          "estimatedDuration": minutes,
          "sortOrder": 1,
          "requiresQuiz": true
        }
      ]
    }
  ]
}

CONTENT EXTRACTION RULES:
- **FULL CONTENT**: Include every paragraph, example, and detail
- **PRESERVE FORMATTING**: Keep lists, tables, code blocks intact
- **NO SUMMARIZATION**: Copy content verbatim (just format as markdown)`;

    const userPrompt = `Analyze this document and create a structured online course:

Document Type: ${request.documentType}
${request.courseConfig?.targetAudience ? `Target Audience: ${request.courseConfig.targetAudience}` : ''}
${request.courseConfig?.difficultyLevel ? `Difficulty Level: ${request.courseConfig.difficultyLevel}` : ''}

Focus on creating engaging, educational content that facilitates learning and retention.

Document Content:
${extractedText}`;

    const modelToUse = request.modelConfig?.courseGeneration || this.operationModels.courseGeneration;

    const response = await this.makeOpenAIRequest({
      model: modelToUse,
      systemPrompt,
      userPrompt,
      temperature: 0.7,
      maxTokens: 8192,
      responseFormat: 'json_object'
    });

    this.logUsage('extractCourseContent', response.model, response.usage);

    return this.parseJSONResponse<CourseContent>(response.content);
  }

  private async createCourse(courseContent: CourseContent, config?: DocumentAnalysisRequest['courseConfig']) {
    const shortDescription = courseContent.description.split('\n\n')[0].substring(0, 200);
    const slug = courseContent.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const difficultyMap: Record<string, 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'> = {
      'beginner': 'BEGINNER',
      'intermediate': 'INTERMEDIATE',
      'advanced': 'ADVANCED'
    };

    const course = await prisma.course.create({
      data: {
        title: courseContent.title,
        slug: `${slug}-${Date.now()}`,
        description: courseContent.description,
        shortDescription: shortDescription.length < 200 ? shortDescription : shortDescription + '...',
        difficulty: difficultyMap[courseContent.skillLevel || config?.difficultyLevel || 'beginner'] || 'BEGINNER',
        duration: courseContent.estimatedDuration || 0,
        isPublished: config?.autoPublish || false,
        learningObjectives: courseContent.learningObjectives,
        prerequisites: courseContent.prerequisites || [],
        tags: courseContent.tags || [],
        categoryId: config?.categoryId || null,
        createdById: config?.createdById || null
      }
    });

    return course;
  }

  private async createModulesAndLessons(courseId: string, modules: ModuleContent[]) {
    for (const module of modules) {
      const createdModule = await prisma.courseModule.create({
        data: {
          courseId,
          title: module.title,
          description: module.description,
          order: module.sortOrder
        }
      });

      for (const lesson of module.lessons) {
        const lessonTypeMap: Record<string, 'TEXT' | 'VIDEO' | 'INTERACTIVE' | 'QUIZ' | 'ASSIGNMENT' | 'DOCUMENT'> = {
          'text': 'TEXT',
          'video': 'VIDEO',
          'interactive': 'INTERACTIVE',
          'quiz': 'QUIZ',
          'assignment': 'ASSIGNMENT',
          'document': 'DOCUMENT'
        };

        const createdLesson = await prisma.lesson.create({
          data: {
            moduleId: createdModule.id,
            title: lesson.title,
            content: lesson.content,
            lessonType: lessonTypeMap[lesson.lessonType] || 'TEXT',
            duration: lesson.estimatedDuration,
            order: lesson.sortOrder
          }
        });

        if (lesson.content && lesson.content.length > 500 && lesson.requiresQuiz) {
          try {
            console.log(`Generating quiz for lesson: ${lesson.title}`);
            await this.generateAndSaveQuizForLesson(createdLesson.id, lesson.content);
          } catch (error) {
            console.error(`Failed to generate quiz for lesson ${lesson.title}:`, error);
          }
        }
      }
    }
  }

  private async generateAndSaveQuizForLesson(lessonId: string, lessonContent: string) {
    const quizData = await this.generateQuizForLesson(lessonId, lessonContent) as QuizData;
    
    if (!quizData.questions || quizData.questions.length === 0) {
      console.log('No questions generated for lesson');
      return;
    }

    const quiz = await prisma.quiz.create({
      data: {
        lessonId,
        title: 'Lesson Quiz',
        description: 'Test your understanding of this lesson',
        passingScore: 70,
        timeLimit: 15
      }
    });

    for (let i = 0; i < quizData.questions.length; i++) {
      const q = quizData.questions[i];
      
      const question = await prisma.quizQuestion.create({
        data: {
          quizId: quiz.id,
          question: q.question,
          questionType: 'MULTIPLE_CHOICE',
          points: 10,
          order: i + 1,
          explanation: q.explanation
        }
      });

      for (let j = 0; j < q.options.length; j++) {
        await prisma.quizAnswer.create({
          data: {
            questionId: question.id,
            text: q.options[j],
            isCorrect: j === q.correctAnswer,
            order: j + 1
          }
        });
      }
    }
  }

  async generateQuizForLesson(_lessonId: string, lessonContent: string, modelOverride?: GPTModel) {
    const systemPrompt = `You are an expert quiz creator. Generate a comprehensive quiz based on the lesson content provided.

IMPORTANT RULES:
1. Create 5-10 multiple choice questions that test understanding of key concepts
2. Questions should cover different parts of the lesson content
3. Make questions clear and unambiguous
4. Ensure all answer options are plausible but only one is correct
5. Provide detailed explanations for why the correct answer is right

OUTPUT FORMAT (JSON):
{
  "questions": [
    {
      "question": "Clear, specific question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Detailed explanation of why this answer is correct",
      "difficulty": "easy|medium|hard"
    }
  ]
}`;

    const modelToUse = modelOverride || this.operationModels.quizGeneration;
    const userPrompt = `Create a quiz for this lesson content:\n\n${lessonContent}`;

    const response = await this.makeOpenAIRequest({
      model: modelToUse,
      systemPrompt,
      userPrompt,
      temperature: 0.5,
      maxTokens: 4096,
      responseFormat: 'json_object'
    });

    this.logUsage('generateQuizForLesson', response.model, response.usage);

    return this.parseJSONResponse(response.content);
  }
}

export default LMSCourseBuilderAgent;
