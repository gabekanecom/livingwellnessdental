import prisma from '@/lib/prisma';
import { BaseAIAgent, GPTModel } from '../base/BaseAIAgent';

interface QuizContent {
  title: string;
  description?: string;
  instructions?: string;
  questions: QuestionContent[];
  timeLimitMinutes?: number | null;
  maxAttempts?: number;
  passScorePercentage?: number;
  shuffleQuestions?: boolean;
  showResultsImmediately?: boolean;
}

interface QuestionContent {
  questionText: string;
  questionType: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  points: number;
  sortOrder: number;
  explanation?: string;
  choices?: ChoiceContent[];
}

interface ChoiceContent {
  choiceText: string;
  isCorrect: boolean;
  sortOrder: number;
}

interface QuizDocumentAnalysisRequest {
  documentContent: string;
  documentType: 'docx' | 'txt';
  quizConfig?: {
    moduleTitle?: string;
    lessonId?: string;
    difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
    maxQuestions?: number;
    timeLimitMinutes?: number;
    autoAttachToLesson?: boolean;
  };
  modelConfig?: {
    quizGeneration?: GPTModel;
  };
}

export class LMSQuizBuilderAgent extends BaseAIAgent {
  private operationModels: {
    quizGeneration: GPTModel;
  };

  constructor() {
    super('LMSQuizBuilder', {
      primary: 'gpt-4o-mini',
      secondary: 'gpt-4o-mini',
      fallback: 'gpt-3.5-turbo'
    });
    
    this.operationModels = {
      quizGeneration: 'gpt-4o-mini'
    };
  }

  setOperationModels(models: Partial<typeof this.operationModels>) {
    this.operationModels = { ...this.operationModels, ...models };
  }

  getOperationModels() {
    return { ...this.operationModels };
  }

  async analyzeDocumentAndCreateQuiz(request: QuizDocumentAnalysisRequest) {
    try {
      const quizContent = await this.extractQuizContent(request);

      if (request.quizConfig?.autoAttachToLesson && request.quizConfig?.lessonId) {
        const quiz = await this.createQuizInDatabase(request.quizConfig.lessonId, quizContent);
        
        return {
          success: true,
          quizId: quiz.id,
          quizTitle: quiz.title,
          questionCount: quizContent.questions.length,
          message: 'Quiz created successfully and attached to lesson'
        };
      } else {
        return {
          success: true,
          quizContent,
          questionCount: quizContent.questions.length,
          message: 'Quiz content extracted successfully'
        };
      }
    } catch (error) {
      console.error('Error creating quiz from document:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async extractDocumentQuizContent(request: QuizDocumentAnalysisRequest): Promise<QuizContent> {
    try {
      return await this.extractQuizContent(request);
    } catch (error) {
      console.error('Error extracting quiz content:', error);
      throw error;
    }
  }

  private async extractQuizContent(request: QuizDocumentAnalysisRequest): Promise<QuizContent> {
    const extractedText = request.documentContent;
    const estimatedTokens = Math.ceil(extractedText.length / 4);
    const maxContextTokens = 120000;
    
    if (estimatedTokens > maxContextTokens) {
      console.log(`Quiz document too large (${estimatedTokens} tokens), using chunking approach`);
      return this.extractQuizContentFromLargeDocument(request, extractedText);
    }

    return this.extractQuizContentFromText(request, extractedText);
  }

  private async extractQuizContentFromLargeDocument(request: QuizDocumentAnalysisRequest, extractedText: string): Promise<QuizContent> {
    const chunkSize = 80000;
    const chunks = this.chunkText(extractedText, chunkSize);
    
    console.log(`Processing large quiz document in ${chunks.length} chunks`);
    
    let allQuestions: QuestionContent[] = [];
    let questionCounter = 1;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkQuizContent = await this.extractQuestionsFromChunk(chunk, questionCounter, request);
      
      if (chunkQuizContent.questions.length > 0) {
        allQuestions.push(...chunkQuizContent.questions);
        questionCounter += chunkQuizContent.questions.length;
      }
    }

    const maxQuestions = request.quizConfig?.maxQuestions || 50;
    if (allQuestions.length > maxQuestions) {
      allQuestions = allQuestions.slice(0, maxQuestions);
    }

    const title = request.quizConfig?.moduleTitle 
      ? `Quiz: ${request.quizConfig.moduleTitle}`
      : `Quiz from Document`;

    return {
      title,
      description: `Quiz generated from document content with ${allQuestions.length} questions`,
      instructions: 'Answer all questions to the best of your ability.',
      questions: allQuestions,
      timeLimitMinutes: request.quizConfig?.timeLimitMinutes || null,
      maxAttempts: 3,
      passScorePercentage: 70,
      shuffleQuestions: true,
      showResultsImmediately: true
    };
  }

  private async extractQuestionsFromChunk(
    chunk: string, 
    startingQuestionNumber: number, 
    request: QuizDocumentAnalysisRequest
  ): Promise<QuizContent> {
    const systemPrompt = `You are an expert quiz creator. Extract quiz questions from the provided document content.

TASK: Identify and extract all quiz questions from the document. Look for:
- Multiple choice questions with options (A, B, C, D or 1, 2, 3, 4)
- True/False questions
- Short answer questions
- Essay questions
- Questions with answer keys or correct answers marked

OUTPUT FORMAT (JSON):
{
  "questions": [
    {
      "questionText": "The complete question text",
      "questionType": "multiple_choice|true_false|short_answer|essay",
      "points": 1,
      "sortOrder": ${startingQuestionNumber},
      "explanation": "Explanation of the correct answer (if provided in document)",
      "choices": [
        {
          "choiceText": "Option text",
          "isCorrect": true,
          "sortOrder": 1
        }
      ]
    }
  ]
}

CRITICAL INSTRUCTIONS:
1. **PRESERVE ORIGINAL QUESTIONS**: Use the exact question text from the document
2. **EXTRACT ALL QUESTIONS**: Don't skip any questions found in the content
3. **IDENTIFY CORRECT ANSWERS**: Look for answer keys, marked answers, or explanations
4. **MAINTAIN ORDER**: Preserve the order questions appear in the document`;

    const userPrompt = `Extract quiz questions from this document content:\n\n${chunk}`;

    const modelToUse = request.modelConfig?.quizGeneration || this.operationModels.quizGeneration;

    const response = await this.makeOpenAIRequest({
      model: modelToUse,
      systemPrompt,
      userPrompt,
      temperature: 0.3,
      maxTokens: 8192,
      responseFormat: 'json_object'
    });

    this.logUsage('extractQuestionsFromChunk', response.model, response.usage);

    const parsedResponse = this.parseJSONResponse<{ questions: QuestionContent[] }>(response.content);
    
    return {
      title: 'Quiz Questions',
      questions: parsedResponse.questions || []
    };
  }

  private chunkText(text: string, chunkSize: number): string[] {
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private async extractQuizContentFromText(request: QuizDocumentAnalysisRequest, extractedText: string): Promise<QuizContent> {
    const systemPrompt = `You are an expert quiz creator and educational content analyzer. Analyze the provided quiz document and structure it into a comprehensive quiz format.

CRITICAL: This document contains quiz questions that already exist. Your job is to IDENTIFY and PRESERVE the existing questions and answers, not create new ones.

OUTPUT FORMAT (JSON):
{
  "title": "Quiz title (extract from document or generate based on content)",
  "description": "Quiz description",
  "instructions": "Instructions for taking the quiz",
  "questions": [
    {
      "questionText": "Complete question text exactly as written",
      "questionType": "multiple_choice|true_false|short_answer|essay",
      "points": 1,
      "sortOrder": 1,
      "explanation": "Explanation or rationale for correct answer (if provided)",
      "choices": [
        {
          "choiceText": "Option text",
          "isCorrect": true,
          "sortOrder": 1
        }
      ]
    }
  ],
  "timeLimitMinutes": null,
  "maxAttempts": 3,
  "passScorePercentage": 70,
  "shuffleQuestions": true,
  "showResultsImmediately": true
}

CRITICAL INSTRUCTIONS:
1. **COUNT QUESTIONS CAREFULLY**: Extract exactly the number of questions in the document
2. **USE ORIGINAL TEXT**: Preserve the exact question and answer text from the document
3. **IDENTIFY ANSWER KEYS**: Look for marked correct answers
4. **QUESTION TYPE DETECTION**: Determine appropriate type for each question
5. **PRESERVE ALL CONTENT**: Include all questions found in the document`;

    const userPrompt = `Analyze this quiz document and extract all questions:

Document Type: ${request.documentType}
${request.quizConfig?.moduleTitle ? `Module: ${request.quizConfig.moduleTitle}` : ''}
${request.quizConfig?.difficultyLevel ? `Difficulty: ${request.quizConfig.difficultyLevel}` : ''}

Document Content:
${extractedText}`;

    const modelToUse = request.modelConfig?.quizGeneration || this.operationModels.quizGeneration;

    const response = await this.makeOpenAIRequest({
      model: modelToUse,
      systemPrompt,
      userPrompt,
      temperature: 0.3,
      maxTokens: 8192,
      responseFormat: 'json_object'
    });

    this.logUsage('extractQuizContent', response.model, response.usage);

    return this.parseJSONResponse<QuizContent>(response.content);
  }

  private async createQuizInDatabase(lessonId: string, quizContent: QuizContent) {
    const quiz = await prisma.quiz.create({
      data: {
        lessonId,
        title: quizContent.title,
        description: quizContent.description || null,
        passingScore: quizContent.passScorePercentage || 70,
        timeLimit: quizContent.timeLimitMinutes || null
      }
    });

    await this.createQuizQuestionsAndAnswers(quiz.id, quizContent.questions);
    return quiz;
  }

  private async createQuizQuestionsAndAnswers(quizId: string, questions: QuestionContent[]) {
    const questionTypeMap: Record<string, 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY'> = {
      'multiple_choice': 'MULTIPLE_CHOICE',
      'true_false': 'TRUE_FALSE',
      'short_answer': 'SHORT_ANSWER',
      'essay': 'ESSAY'
    };

    for (const question of questions) {
      const createdQuestion = await prisma.quizQuestion.create({
        data: {
          quizId,
          question: question.questionText,
          questionType: questionTypeMap[question.questionType] || 'MULTIPLE_CHOICE',
          points: question.points,
          order: question.sortOrder,
          explanation: question.explanation || null
        }
      });

      if (question.choices && question.choices.length > 0) {
        for (const choice of question.choices) {
          await prisma.quizAnswer.create({
            data: {
              questionId: createdQuestion.id,
              text: choice.choiceText,
              isCorrect: choice.isCorrect,
              order: choice.sortOrder
            }
          });
        }
      }
    }
  }

  async createQuizzesFromDocuments(
    documents: Array<{
      content: string;
      type: 'docx' | 'txt';
      fileName: string;
      moduleTitle?: string;
      lessonId?: string;
    }>,
    config?: {
      difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
      maxQuestionsPerQuiz?: number;
      timeLimitMinutes?: number;
      autoAttachToLessons?: boolean;
    }
  ) {
    const results = [];

    for (const doc of documents) {
      try {
        console.log(`Processing quiz document: ${doc.fileName}`);

        const result = await this.analyzeDocumentAndCreateQuiz({
          documentContent: doc.content,
          documentType: doc.type,
          quizConfig: {
            moduleTitle: doc.moduleTitle || doc.fileName.replace(/\.[^/.]+$/, ''),
            lessonId: doc.lessonId,
            difficultyLevel: config?.difficultyLevel,
            maxQuestions: config?.maxQuestionsPerQuiz,
            timeLimitMinutes: config?.timeLimitMinutes,
            autoAttachToLesson: config?.autoAttachToLessons
          }
        });

        results.push({
          fileName: doc.fileName,
          moduleTitle: doc.moduleTitle,
          ...result
        });
      } catch (error) {
        console.error(`Error processing quiz document ${doc.fileName}:`, error);
        
        results.push({
          fileName: doc.fileName,
          moduleTitle: doc.moduleTitle,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }
}

export default LMSQuizBuilderAgent;
