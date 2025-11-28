'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, PlayIcon, DocumentTextIcon, QuestionMarkCircleIcon, DocumentArrowUpIcon, PlusIcon, TrashIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { CheckIcon as SaveIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import LessonEditor from '@/components/lms/LessonEditor';

interface Course {
  id: string;
  title: string;
}

interface Module {
  id: string;
  title: string;
  courseId: string;
}

export default function CreateLessonPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const moduleId = params.moduleId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [module, setModule] = useState<Module | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    type: 'TEXT',
    videoUrl: '',
    duration: 30,
    sortOrder: 1,
    isPublished: false,
    isRequired: true
  });

  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    instructions: 'Read each question carefully and select the best answer.',
    timeLimit: null as number | null,
    maxAttempts: 3,
    passingScore: 70,
    shuffleQuestions: false,
    showResultsImmediately: true,
    questions: [] as Array<{
      questionText: string;
      questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
      points: number;
      sortOrder: number;
      explanation: string;
      choices: Array<{
        choiceText: string;
        isCorrect: boolean;
        sortOrder: number;
      }>;
    }>
  });

  useEffect(() => {
    if (courseId && moduleId) {
      fetchCourseAndModule();
    }
  }, [courseId, moduleId]);

  const fetchCourseAndModule = async () => {
    try {
      const courseResponse = await fetch(`/api/lms/courses/${courseId}`);
      if (courseResponse.ok) {
        const courseData = await courseResponse.json();
        setCourse({
          id: courseData.course.id,
          title: courseData.course.title
        });
      }

      const moduleResponse = await fetch(`/api/lms/courses/${courseId}/modules/${moduleId}`);
      if (moduleResponse.ok) {
        const moduleData = await moduleResponse.json();
        setModule(moduleData.module);
        
        const existingLessons = moduleData.module.lessons || [];
        const nextSortOrder = existingLessons.length > 0 
          ? Math.max(...existingLessons.map((l: any) => l.sortOrder || 0)) + 1 
          : 1;
        
        setFormData(prev => ({
          ...prev,
          sortOrder: nextSortOrder
        }));
      } else {
        toast.error('Failed to load module');
        router.push(`/lms/courses/${courseId}/edit?tab=content`);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error loading data');
      router.push(`/lms/courses/${courseId}/edit?tab=content`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    
    setFormData(prev => ({
      ...prev,
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const addQuestion = () => {
    const newQuestion = {
      questionText: '',
      questionType: 'MULTIPLE_CHOICE' as const,
      points: 1,
      sortOrder: quizData.questions.length + 1,
      explanation: '',
      choices: [
        { choiceText: '', isCorrect: true, sortOrder: 1 },
        { choiceText: '', isCorrect: false, sortOrder: 2 },
        { choiceText: '', isCorrect: false, sortOrder: 3 },
        { choiceText: '', isCorrect: false, sortOrder: 4 }
      ]
    };
    
    setQuizData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const removeQuestion = (index: number) => {
    if (confirm('Are you sure you want to remove this question?')) {
      setQuizData(prev => ({
        ...prev,
        questions: prev.questions.filter((_, i) => i !== index)
      }));
    }
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }));
  };

  const updateQuestionType = (index: number, type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER') => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => {
        if (i !== index) return q;
        
        let choices = q.choices;
        if (type === 'TRUE_FALSE') {
          choices = [
            { choiceText: 'True', isCorrect: true, sortOrder: 1 },
            { choiceText: 'False', isCorrect: false, sortOrder: 2 }
          ];
        } else if (type === 'SHORT_ANSWER') {
          choices = [];
        }
        
        return { ...q, questionType: type, choices };
      })
    }));
  };

  const updateChoice = (questionIndex: number, choiceIndex: number, field: string, value: any) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex 
          ? {
              ...q,
              choices: q.choices.map((c, ci) => 
                ci === choiceIndex ? { ...c, [field]: value } : c
              )
            }
          : q
      )
    }));
  };

  const setCorrectChoice = (questionIndex: number, choiceIndex: number) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex 
          ? {
              ...q,
              choices: q.choices.map((c, ci) => ({
                ...c,
                isCorrect: ci === choiceIndex
              }))
            }
          : q
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (formData.type === 'QUIZ') {
        if (!quizData.title.trim() && !formData.title.trim()) {
          toast.error('Quiz title is required');
          setIsSaving(false);
          return;
        }

        if (quizData.questions.length === 0) {
          toast.error('Quiz must have at least one question');
          setIsSaving(false);
          return;
        }

        for (let i = 0; i < quizData.questions.length; i++) {
          const q = quizData.questions[i];
          if (!q.questionText.trim()) {
            toast.error(`Question ${i + 1} text is required`);
            setIsSaving(false);
            return;
          }

          if (q.questionType === 'MULTIPLE_CHOICE' || q.questionType === 'TRUE_FALSE') {
            if (q.choices.length < 2) {
              toast.error(`Question ${i + 1} must have at least 2 choices`);
              setIsSaving(false);
              return;
            }

            if (!q.choices.some(c => c.isCorrect)) {
              toast.error(`Question ${i + 1} must have at least one correct answer`);
              setIsSaving(false);
              return;
            }

            if (q.choices.some(c => !c.choiceText.trim())) {
              toast.error(`All choices for question ${i + 1} must have text`);
              setIsSaving(false);
              return;
            }
          }
        }
      }

      const lessonData = {
        ...formData,
        moduleId: moduleId
      };

      const response = await fetch(`/api/lms/courses/${courseId}/modules/${moduleId}/lessons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lessonData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create lesson');
      }

      const { lesson } = await response.json();

      if (formData.type === 'QUIZ') {
        const quizDataWithDefaults = {
          ...quizData,
          title: quizData.title || formData.title,
          lessonId: lesson.id
        };

        const quizResponse = await fetch(`/api/lms/quizzes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(quizDataWithDefaults),
        });

        if (!quizResponse.ok) {
          const errorData = await quizResponse.json();
          throw new Error(errorData.error || 'Failed to create quiz');
        }

        toast.success('Quiz lesson created successfully!');
      } else {
        toast.success('Lesson created successfully!');
      }
      
      router.push(`/lms/courses/${courseId}/edit?tab=content`);

    } catch (error: any) {
      console.error('Error creating lesson:', error);
      toast.error(error.message || 'Failed to create lesson');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  if (!course || !module) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-4xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Course or Module Not Found</h1>
        <Link href="/lms/catalog" className="btn bg-violet-500 hover:bg-violet-600 text-white">
          Back to Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-4xl mx-auto">
      <div className="mb-8">
        <Link
          href={`/lms/courses/${courseId}/edit?tab=content`}
          className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-violet-600 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Course Content
        </Link>
        
        <div>
          <h1 className="text-2xl md:text-3xl text-gray-800 font-bold">
            Create New Lesson
          </h1>
          <p className="text-gray-600 mt-2">
            Add a new lesson to <strong>{module.title}</strong> in "{course.title}"
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-4">
              Lesson Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: 'TEXT', label: 'Text Content', icon: DocumentTextIcon, description: 'Written content, articles' },
                { value: 'VIDEO', label: 'Video', icon: PlayIcon, description: 'Video lessons, tutorials' },
                { value: 'QUIZ', label: 'Quiz', icon: QuestionMarkCircleIcon, description: 'Knowledge assessment' },
                { value: 'FILE', label: 'File/Resource', icon: DocumentArrowUpIcon, description: 'Documents, PDFs' }
              ].map((type) => {
                const IconComponent = type.icon;
                return (
                  <label key={type.value} className="relative">
                    <input
                      type="radio"
                      name="type"
                      value={type.value}
                      checked={formData.type === type.value}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      formData.type === type.value
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <IconComponent className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                      <div className="text-sm font-medium text-center mb-1">{type.label}</div>
                      <div className="text-xs text-gray-500 text-center">{type.description}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium mb-2">
                Lesson Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="form-input w-full"
                placeholder="Enter lesson title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                min="1"
                className="form-input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Order Position
              </label>
              <input
                type="number"
                name="sortOrder"
                value={formData.sortOrder}
                onChange={handleInputChange}
                min="1"
                className="form-input w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Position of this lesson within the module
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="form-textarea w-full"
              placeholder="Brief description of what students will learn in this lesson"
            />
          </div>

          {formData.type === 'VIDEO' && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Video URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                name="videoUrl"
                value={formData.videoUrl}
                onChange={handleInputChange}
                required={formData.type === 'VIDEO'}
                className="form-input w-full"
                placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Supports YouTube, Vimeo, or direct video URLs
              </p>
            </div>
          )}

          {formData.type === 'TEXT' && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Lesson Content <span className="text-red-500">*</span>
              </label>
              <LessonEditor
                content={formData.content}
                onChange={(html) => setFormData(prev => ({ ...prev, content: html }))}
                placeholder="Write your lesson content here..."
              />
            </div>
          )}

          {formData.type === 'QUIZ' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quiz Settings</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium mb-2">
                      Quiz Title (optional)
                    </label>
                    <input
                      type="text"
                      value={quizData.title}
                      onChange={(e) => setQuizData(prev => ({ ...prev, title: e.target.value }))}
                      className="form-input w-full"
                      placeholder="Enter quiz title or leave empty to use lesson title"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium mb-2">Instructions for Students</label>
                    <textarea
                      value={quizData.instructions}
                      onChange={(e) => setQuizData(prev => ({ ...prev, instructions: e.target.value }))}
                      className="form-textarea w-full"
                      rows={2}
                      placeholder="Instructions that students will see before taking the quiz"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Time Limit (minutes)</label>
                    <input
                      type="number"
                      value={quizData.timeLimit || ''}
                      onChange={(e) => setQuizData(prev => ({ ...prev, timeLimit: e.target.value ? parseInt(e.target.value) : null }))}
                      className="form-input w-full"
                      placeholder="No time limit"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Passing Score (%)</label>
                    <input
                      type="number"
                      value={quizData.passingScore}
                      onChange={(e) => setQuizData(prev => ({ ...prev, passingScore: parseInt(e.target.value) || 70 }))}
                      className="form-input w-full"
                      min="0"
                      max="100"
                    />
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={quizData.shuffleQuestions}
                        onChange={(e) => setQuizData(prev => ({ ...prev, shuffleQuestions: e.target.checked }))}
                        className="form-checkbox"
                      />
                      <span className="ml-2 text-sm font-medium">Shuffle Questions</span>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={quizData.showResultsImmediately}
                        onChange={(e) => setQuizData(prev => ({ ...prev, showResultsImmediately: e.target.checked }))}
                        className="form-checkbox"
                      />
                      <span className="ml-2 text-sm font-medium">Show Results Immediately</span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Questions</h3>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="btn bg-violet-500 hover:bg-violet-600 text-white inline-flex items-center"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Question
                  </button>
                </div>

                {quizData.questions.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-gray-500">
                      <p className="mb-2">No questions yet</p>
                      <p className="text-sm">Click "Add Question" to create your first question</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {quizData.questions.map((question, questionIndex) => (
                      <div key={questionIndex} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-4">
                          <h4 className="text-sm font-medium text-gray-900">
                            Question {questionIndex + 1}
                          </h4>
                          <button
                            type="button"
                            onClick={() => removeQuestion(questionIndex)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Question Text <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              value={question.questionText}
                              onChange={(e) => updateQuestion(questionIndex, 'questionText', e.target.value)}
                              className="form-textarea w-full"
                              rows={2}
                              placeholder="Enter your question here..."
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">Question Type</label>
                              <select
                                value={question.questionType}
                                onChange={(e) => updateQuestionType(questionIndex, e.target.value as any)}
                                className="form-select w-full"
                              >
                                <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                                <option value="TRUE_FALSE">True/False</option>
                                <option value="SHORT_ANSWER">Short Answer</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-2">Points</label>
                              <input
                                type="number"
                                value={question.points}
                                onChange={(e) => updateQuestion(questionIndex, 'points', parseInt(e.target.value) || 1)}
                                className="form-input w-full"
                                min="1"
                              />
                            </div>
                          </div>

                          {(question.questionType === 'MULTIPLE_CHOICE' || question.questionType === 'TRUE_FALSE') && (
                            <div>
                              <label className="block text-sm font-medium mb-3">Answer Choices</label>
                              <div className="space-y-2">
                                {question.choices.map((choice, choiceIndex) => (
                                  <div key={choiceIndex} className="flex items-center gap-3">
                                    <button
                                      type="button"
                                      onClick={() => setCorrectChoice(questionIndex, choiceIndex)}
                                      className={`flex-shrink-0 ${
                                        choice.isCorrect 
                                          ? 'text-green-600 hover:text-green-700' 
                                          : 'text-gray-400 hover:text-green-600'
                                      }`}
                                      title={choice.isCorrect ? 'Correct answer' : 'Mark as correct'}
                                    >
                                      {choice.isCorrect ? (
                                        <CheckCircleIcon className="h-5 w-5" />
                                      ) : (
                                        <XCircleIcon className="h-5 w-5" />
                                      )}
                                    </button>

                                    <input
                                      type="text"
                                      value={choice.choiceText}
                                      onChange={(e) => updateChoice(questionIndex, choiceIndex, 'choiceText', e.target.value)}
                                      className="form-input flex-1"
                                      placeholder={`Choice ${choiceIndex + 1}`}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Explanation (Optional)
                            </label>
                            <textarea
                              value={question.explanation}
                              onChange={(e) => updateQuestion(questionIndex, 'explanation', e.target.value)}
                              className="form-textarea w-full"
                              rows={2}
                              placeholder="Explain why this is the correct answer"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isPublished"
                checked={formData.isPublished}
                onChange={handleInputChange}
                className="form-checkbox"
              />
              <label className="ml-2 text-sm font-medium">
                Published (visible to students)
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isRequired"
                checked={formData.isRequired}
                onChange={handleInputChange}
                className="form-checkbox"
              />
              <label className="ml-2 text-sm font-medium">
                Required lesson
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <Link
              href={`/lms/courses/${courseId}/edit?tab=content`}
              className="btn border-gray-200 hover:border-gray-300 bg-white text-gray-600"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="btn bg-green-500 hover:bg-green-600 text-white inline-flex items-center disabled:opacity-50"
            >
              <SaveIcon className="h-4 w-4 mr-2" />
              {isSaving ? 'Creating...' : 'Create Lesson'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
