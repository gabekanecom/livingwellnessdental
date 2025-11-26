import prisma from '@/lib/prisma';
import { BaseAIAgent, GPTModel } from '../base/BaseAIAgent';

interface ContentGenerationRequest {
  mode: 'topic' | 'outline' | 'enhancement';
  topic?: string;
  outline?: CourseOutline;
  existingCourseId?: string;
  config: {
    targetAudience: string;
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
    industryContext?: string;
    learningStyle?: 'visual' | 'practical' | 'theoretical' | 'mixed';
    contentDepth?: 'overview' | 'detailed' | 'comprehensive';
    includeExamples?: boolean;
    includeExercises?: boolean;
    includeQuizzes?: boolean;
    includeResources?: boolean;
    estimatedDuration?: number;
  };
  modelConfig?: {
    contentGeneration?: GPTModel;
    videoScript?: GPTModel;
    interactive?: GPTModel;
  };
}

interface CourseOutline {
  title: string;
  description?: string;
  modules: Array<{
    title: string;
    lessons: Array<{
      title: string;
      type?: 'text' | 'video_script' | 'interactive' | 'quiz';
    }>;
  }>;
}

interface GeneratedContent {
  course: {
    title: string;
    description: string;
    shortDescription: string;
    learningObjectives: string[];
    prerequisites: string[];
    tags: string[];
    estimatedDuration: number;
  };
  modules: Array<{
    title: string;
    description: string;
    lessons: Array<{
      title: string;
      description: string;
      content: string;
      type: 'text' | 'video_script' | 'interactive' | 'quiz' | 'assignment';
      estimatedDuration: number;
      exercises?: Exercise[];
      quiz?: QuizData;
      resources?: Resource[];
    }>;
  }>;
}

interface Exercise {
  title: string;
  instructions: string;
  solutionHint?: string;
  estimatedTime: number;
}

interface QuizData {
  questions: Array<{
    question: string;
    type: 'multiple_choice' | 'true_false' | 'short_answer';
    options?: string[];
    correctAnswer: string | number;
    explanation: string;
    points: number;
  }>;
  passingScore: number;
}

interface Resource {
  title: string;
  type: 'link' | 'document' | 'video' | 'tool';
  url?: string;
  description: string;
}

export class LMSContentGeneratorAgent extends BaseAIAgent {
  private operationModels: {
    contentGeneration: GPTModel;
    videoScript: GPTModel;
    interactive: GPTModel;
  };

  constructor() {
    super('LMSContentGenerator', {
      primary: 'gpt-4o-mini',
      secondary: 'gpt-4o-mini',
      fallback: 'gpt-3.5-turbo'
    });

    this.operationModels = {
      contentGeneration: 'gpt-4o-mini',
      videoScript: 'gpt-4o-mini',
      interactive: 'gpt-4o-mini'
    };
  }

  async generateCourseContent(request: ContentGenerationRequest): Promise<GeneratedContent> {
    switch (request.mode) {
      case 'topic':
        return this.generateFromTopic(request);
      case 'outline':
        return this.generateFromOutline(request);
      case 'enhancement':
        return this.enhanceExistingCourse(request);
      default:
        throw new Error('Invalid generation mode');
    }
  }

  private async generateFromTopic(request: ContentGenerationRequest): Promise<GeneratedContent> {
    const systemPrompt = `You are an expert instructional designer and course creator specializing in creating engaging, practical training content.

TASK: Create a complete course curriculum based on the given topic.

TARGET AUDIENCE: ${request.config.targetAudience}
DIFFICULTY LEVEL: ${request.config.difficultyLevel}
${request.config.industryContext ? `INDUSTRY CONTEXT: ${request.config.industryContext}` : ''}
LEARNING STYLE: ${request.config.learningStyle || 'mixed'}
CONTENT DEPTH: ${request.config.contentDepth || 'detailed'}

OUTPUT FORMAT (JSON):
{
  "course": {
    "title": "Engaging course title",
    "description": "Comprehensive course description (200-300 words)",
    "shortDescription": "Brief description (50 words)",
    "learningObjectives": ["Clear, measurable objective 1", ...],
    "prerequisites": ["Prerequisite 1", ...],
    "tags": ["relevant", "searchable", "tags"],
    "estimatedDuration": totalMinutes
  },
  "modules": [
    {
      "title": "Module Title",
      "description": "Module overview",
      "lessons": [
        {
          "title": "Lesson Title",
          "description": "What this lesson covers",
          "content": "Full lesson content in markdown format with headers, lists, examples, etc.",
          "type": "text|video_script|interactive|quiz|assignment",
          "estimatedDuration": minutes,
          "exercises": [
            {
              "title": "Exercise name",
              "instructions": "Step-by-step instructions",
              "solutionHint": "Helpful hint",
              "estimatedTime": minutes
            }
          ],
          "quiz": {
            "questions": [
              {
                "question": "Question text",
                "type": "multiple_choice",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correctAnswer": 0,
                "explanation": "Why this answer is correct",
                "points": 10
              }
            ],
            "passingScore": 70
          },
          "resources": [
            {
              "title": "Resource name",
              "type": "link|document|video|tool",
              "url": "https://...",
              "description": "What this resource provides"
            }
          ]
        }
      ]
    }
  ]
}

CONTENT GUIDELINES:
1. Create 3-5 modules with 3-6 lessons each
2. Each lesson should be focused on a single concept or skill
3. Include practical examples relevant to ${request.config.targetAudience}
4. ${request.config.includeExamples ? 'Include real-world examples in each lesson' : 'Focus on concepts'}
5. ${request.config.includeExercises ? 'Add 1-2 hands-on exercises per lesson' : 'Skip exercises'}
6. ${request.config.includeQuizzes ? 'Include a quiz every 2-3 lessons' : 'Skip quizzes'}
7. ${request.config.includeResources ? 'Add 2-3 helpful resources per module' : 'Skip external resources'}
8. Use markdown formatting for content with proper headers, lists, code blocks
9. Make content engaging with stories, analogies, and practical applications
10. Ensure progressive difficulty within the ${request.config.difficultyLevel} level`;

    const userPrompt = `Create a comprehensive course on: "${request.topic}"

Target Duration: ${request.config.estimatedDuration || 'appropriate for topic'} minutes total

Make the content practical, engaging, and immediately applicable for ${request.config.targetAudience}.`;

    const modelToUse = request.modelConfig?.contentGeneration || this.operationModels.contentGeneration;

    const response = await this.makeOpenAIRequest({
      model: modelToUse,
      systemPrompt,
      userPrompt,
      temperature: 0.7,
      maxTokens: 16384,
      responseFormat: 'json_object'
    });

    this.logUsage('generateFromTopic', response.model, response.usage);

    return this.parseJSONResponse<GeneratedContent>(response.content);
  }

  private async generateFromOutline(request: ContentGenerationRequest): Promise<GeneratedContent> {
    if (!request.outline) {
      throw new Error('Outline is required for outline mode');
    }

    const systemPrompt = `You are an expert content creator who transforms course outlines into full, engaging course content.

TASK: Generate complete course content based on the provided outline.

TARGET AUDIENCE: ${request.config.targetAudience}
DIFFICULTY LEVEL: ${request.config.difficultyLevel}
LEARNING STYLE: ${request.config.learningStyle || 'mixed'}

For each lesson in the outline, create:
1. Comprehensive written content (500-1000 words)
2. Clear learning objectives
3. Practical examples and scenarios
4. Exercises and activities (if requested)
5. Assessment questions (if requested)
6. Additional resources (if requested)

Make the content engaging, practical, and immediately applicable.
Use markdown formatting with clear structure and visual hierarchy.`;

    const userPrompt = `Generate full content for this course outline:

Title: ${request.outline.title}
${request.outline.description ? `Description: ${request.outline.description}` : ''}

Modules:
${request.outline.modules.map((m, i) => `
${i + 1}. ${m.title}
   Lessons:
${m.lessons.map((l) => `   - ${l.title}${l.type ? ` (${l.type})` : ''}`).join('\n')}
`).join('\n')}

Create comprehensive content for each lesson, ensuring consistency and progressive learning throughout the course.`;

    const modelToUse = request.modelConfig?.contentGeneration || this.operationModels.contentGeneration;

    const response = await this.makeOpenAIRequest({
      model: modelToUse,
      systemPrompt,
      userPrompt,
      temperature: 0.7,
      maxTokens: 16384,
      responseFormat: 'json_object'
    });

    this.logUsage('generateFromOutline', response.model, response.usage);

    return this.parseJSONResponse<GeneratedContent>(response.content);
  }

  private async enhanceExistingCourse(request: ContentGenerationRequest): Promise<GeneratedContent> {
    if (!request.existingCourseId) {
      throw new Error('Existing course ID is required for enhancement mode');
    }

    const course = await prisma.course.findUnique({
      where: { id: request.existingCourseId },
      include: {
        modules: {
          include: {
            lessons: true
          }
        }
      }
    });

    if (!course) {
      throw new Error('Course not found');
    }

    const systemPrompt = `You are an expert course enhancer who improves existing course content.

TASK: Enhance and expand the existing course content.

Enhancements to make:
1. Add missing examples and real-world applications
2. Create exercises and hands-on activities
3. Generate quiz questions for assessment
4. Add supplementary resources
5. Improve clarity and engagement
6. Fill content gaps
7. Update for current best practices

Maintain the existing structure and style while making improvements.`;

    const userPrompt = `Enhance this existing course:

${JSON.stringify(course, null, 2)}

Target Audience: ${request.config.targetAudience}
Focus on making the content more ${request.config.contentDepth} and ${request.config.learningStyle}-oriented.`;

    const modelToUse = request.modelConfig?.contentGeneration || this.operationModels.contentGeneration;

    const response = await this.makeOpenAIRequest({
      model: modelToUse,
      systemPrompt,
      userPrompt,
      temperature: 0.7,
      maxTokens: 16384,
      responseFormat: 'json_object'
    });

    this.logUsage('enhanceExistingCourse', response.model, response.usage);

    return this.parseJSONResponse<GeneratedContent>(response.content);
  }

  async generateVideoScript(lessonContent: string, duration: number = 5, modelOverride?: GPTModel): Promise<string> {
    const systemPrompt = `You are a video script writer for educational content. Create engaging, conversational scripts that work well for video lessons.

Format the script with:
- [INTRO] - Hook and introduction
- [MAIN] - Main content with visual cues
- [DEMO] - Demonstration sections
- [OUTRO] - Summary and next steps
- (Visual: description) - Visual elements to show
- <pause> - Natural pause points

Target duration: ${duration} minutes (approximately ${duration * 150} words)`;

    const userPrompt = `Convert this lesson content into a video script:\n\n${lessonContent}`;

    const modelToUse = modelOverride || this.operationModels.videoScript;

    const response = await this.makeOpenAIRequest({
      model: modelToUse,
      systemPrompt,
      userPrompt,
      temperature: 0.7,
      maxTokens: 2048,
      responseFormat: 'text'
    });

    this.logUsage('generateVideoScript', response.model, response.usage);

    return response.content;
  }

  async generateInteractiveContent(topic: string, type: 'simulation' | 'scenario' | 'branching', modelOverride?: GPTModel): Promise<any> {
    const systemPrompt = `Create an interactive ${type} learning experience. Return a JSON structure that defines the interactive content.`;
    const userPrompt = `Create an interactive ${type} about: ${topic}`;

    const modelToUse = modelOverride || this.operationModels.interactive;

    const response = await this.makeOpenAIRequest({
      model: modelToUse,
      systemPrompt,
      userPrompt,
      temperature: 0.8,
      maxTokens: 4096,
      responseFormat: 'json_object'
    });

    this.logUsage('generateInteractiveContent', response.model, response.usage);

    return this.parseJSONResponse(response.content);
  }

  setOperationModels(models: Partial<typeof this.operationModels>) {
    this.operationModels = { ...this.operationModels, ...models };
  }

  getOperationModels() {
    return { ...this.operationModels };
  }
}

export default LMSContentGeneratorAgent;
