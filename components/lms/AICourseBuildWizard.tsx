'use client';

import { useState } from 'react';
import { 
  SparklesIcon, 
  DocumentTextIcon, 
  PencilSquareIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import CourseBuilderUpload from './CourseBuilderUpload';
import CourseEnhancer from './CourseEnhancer';

type BuildMode = 'document' | 'topic' | 'outline' | 'enhance';
type Step = 'mode' | 'input' | 'config' | 'review' | 'generate';

interface CourseConfig {
  categoryId?: string;
  targetAudience: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  industryContext?: string;
  learningStyle: 'visual' | 'practical' | 'theoretical' | 'mixed';
  contentDepth: 'overview' | 'detailed' | 'comprehensive';
  includeExamples: boolean;
  includeExercises: boolean;
  includeQuizzes: boolean;
  includeResources: boolean;
  estimatedDuration?: number;
  autoPublish: boolean;
}

export default function AICourseBuildWizard() {
  const [currentStep, setCurrentStep] = useState<Step>('mode');
  const [buildMode, setBuildMode] = useState<BuildMode | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [topic, setTopic] = useState('');
  const [outline, setOutline] = useState({
    title: '',
    description: '',
    modules: [{ title: '', lessons: [{ title: '', type: 'text' }] }]
  });
  const [config, setConfig] = useState<CourseConfig>({
    categoryId: '',
    targetAudience: '',
    difficultyLevel: 'beginner',
    industryContext: '',
    learningStyle: 'mixed',
    contentDepth: 'detailed',
    includeExamples: true,
    includeExercises: true,
    includeQuizzes: true,
    includeResources: true,
    estimatedDuration: 0,
    autoPublish: false
  });

  const buildModes = [
    {
      id: 'document' as BuildMode,
      title: 'From Documents',
      description: 'Upload one or multiple documents to create your course',
      icon: DocumentTextIcon,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      id: 'topic' as BuildMode,
      title: 'From Topic',
      description: 'Enter a topic and let AI create complete course content',
      icon: SparklesIcon,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      id: 'outline' as BuildMode,
      title: 'From Outline',
      description: 'Provide a course structure and AI will fill in the content',
      icon: PencilSquareIcon,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      id: 'enhance' as BuildMode,
      title: 'Enhance Existing Course',
      description: 'Add content or improve an existing course with new documents',
      icon: ArrowPathIcon,
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600'
    }
  ];

  const handleModeSelect = (mode: BuildMode) => {
    setBuildMode(mode);
    setCurrentStep('input');
  };

  const handleGenerateCourse = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      let endpoint = '';
      let payload: any = {};

      switch (buildMode) {
        case 'topic':
          endpoint = '/api/lms/content-generator';
          payload = {
            mode: 'topic',
            topic,
            config
          };
          break;
        
        case 'outline':
          endpoint = '/api/lms/content-generator';
          payload = {
            mode: 'outline',
            outline,
            config
          };
          break;

        case 'enhance':
          break;
      }

      if (endpoint) {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to generate course');
        }

        setGenerationResult(result);
        setCurrentStep('review');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'mode':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                How would you like to create your course?
              </h2>
              <p className="text-gray-600">
                Choose the method that best fits your content source
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {buildModes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => handleModeSelect(mode.id)}
                  className="group relative bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-blue-500 transition-all hover:shadow-lg text-left"
                >
                  <div className={`inline-flex p-3 rounded-lg ${mode.bgColor} mb-4`}>
                    <mode.icon className={`h-6 w-6 ${mode.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {mode.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {mode.description}
                  </p>
                  <ChevronRightIcon className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        );

      case 'input':
        return (
          <div className="space-y-6">
            <button
              onClick={() => setCurrentStep('mode')}
              className="flex items-center text-sm text-gray-600 hover:text-blue-600"
            >
              <ChevronLeftIcon className="h-4 w-4 mr-1" />
              Back to mode selection
            </button>

            {buildMode === 'document' && (
              <CourseBuilderUpload 
                categoryId={config.categoryId}
                onSuccess={(courseId) => {
                  setGenerationResult({ courseId });
                  setCurrentStep('review');
                }}
              />
            )}

            {buildMode === 'enhance' && (
              <CourseEnhancer
                onSuccess={(courseId) => {
                  setGenerationResult({ courseId });
                  setCurrentStep('review');
                }}
              />
            )}

            {buildMode === 'topic' && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  What topic would you like to teach?
                </h2>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Mindfulness for Beginners, Stress Management Techniques, Nutrition Fundamentals..."
                  className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-sm text-gray-500 mt-2">
                  Be specific about the topic. The AI will create a complete course with modules, lessons, and activities.
                </p>
              </div>
            )}

            {buildMode === 'outline' && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Course Outline
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Course Title</label>
                    <input
                      type="text"
                      value={outline.title}
                      onChange={(e) => setOutline({ ...outline, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter course title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Course Description</label>
                    <textarea
                      value={outline.description}
                      onChange={(e) => setOutline({ ...outline, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Brief description of the course"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Modules and Lessons</label>
                    <p className="text-xs text-gray-500 mb-2">Add your course structure below. AI will generate content for each lesson.</p>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-500">Module and lesson builder coming soon...</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!['document', 'enhance'].includes(buildMode || '') && (
              <div className="flex justify-end">
                <button
                  onClick={() => setCurrentStep('config')}
                  disabled={
                    (buildMode === 'topic' && !topic) ||
                    (buildMode === 'outline' && !outline.title)
                  }
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50 flex items-center"
                >
                  Next: Configure
                  <ChevronRightIcon className="h-4 w-4 ml-2" />
                </button>
              </div>
            )}
          </div>
        );

      case 'config':
        return (
          <div className="space-y-6">
            <button
              onClick={() => setCurrentStep('input')}
              className="flex items-center text-sm text-gray-600 hover:text-blue-600"
            >
              <ChevronLeftIcon className="h-4 w-4 mr-1" />
              Back
            </button>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Configure Your Course
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Target Audience <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={config.targetAudience}
                    onChange={(e) => setConfig({ ...config, targetAudience: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Health professionals, Wellness coaches, General public"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Difficulty Level</label>
                    <select
                      value={config.difficultyLevel}
                      onChange={(e) => setConfig({ ...config, difficultyLevel: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Learning Style</label>
                    <select
                      value={config.learningStyle}
                      onChange={(e) => setConfig({ ...config, learningStyle: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="mixed">Mixed</option>
                      <option value="visual">Visual</option>
                      <option value="practical">Practical</option>
                      <option value="theoretical">Theoretical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Content Depth</label>
                  <select
                    value={config.contentDepth}
                    onChange={(e) => setConfig({ ...config, contentDepth: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="overview">Overview</option>
                    <option value="detailed">Detailed</option>
                    <option value="comprehensive">Comprehensive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Industry Context (Optional)</label>
                  <input
                    type="text"
                    value={config.industryContext}
                    onChange={(e) => setConfig({ ...config, industryContext: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Healthcare, Corporate wellness, Fitness"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium">Include in Course:</label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.includeExamples}
                      onChange={(e) => setConfig({ ...config, includeExamples: e.target.checked })}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">Real-world examples and case studies</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.includeExercises}
                      onChange={(e) => setConfig({ ...config, includeExercises: e.target.checked })}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">Hands-on exercises and activities</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.includeQuizzes}
                      onChange={(e) => setConfig({ ...config, includeQuizzes: e.target.checked })}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">Quizzes and assessments</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.includeResources}
                      onChange={(e) => setConfig({ ...config, includeResources: e.target.checked })}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">Additional resources and links</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Estimated Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={config.estimatedDuration}
                    onChange={(e) => setConfig({ ...config, estimatedDuration: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Leave blank for AI to estimate"
                    min="30"
                    step="30"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setCurrentStep('input')}
                  className="px-6 py-2 border border-gray-200 bg-white text-gray-600 rounded-lg hover:bg-gray-50"
                >
                  <ChevronLeftIcon className="h-4 w-4 mr-2 inline" />
                  Back
                </button>
                <button
                  onClick={handleGenerateCourse}
                  disabled={!config.targetAudience || isGenerating}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50 flex items-center"
                >
                  {isGenerating ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-4 w-4 mr-2" />
                      Generate Course
                    </>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <CheckCircleIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-green-800 mb-2">
                Course Generated Successfully!
              </h2>
              <p className="text-green-700">
                Your course has been created and is ready for review
              </p>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  window.location.href = `/lms/courses/${generationResult?.courseId}/edit`;
                }}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
              >
                Edit Course
              </button>
              <button
                onClick={() => {
                  setCurrentStep('mode');
                  setBuildMode(null);
                  setGenerationResult(null);
                }}
                className="px-6 py-2 border border-gray-200 bg-white text-gray-600 rounded-lg hover:bg-gray-50"
              >
                Create Another
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {currentStep !== 'mode' && (
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {['mode', 'input', 'config', 'generate', 'review'].map((step, index) => {
              const isActive = currentStep === step;
              const isPast = ['mode', 'input', 'config', 'generate', 'review'].indexOf(currentStep) > index;
              
              return (
                <div key={step} className="flex items-center flex-1">
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                    ${isActive ? 'bg-blue-600 text-white' : isPast ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'}
                  `}>
                    {isPast ? '✓' : index + 1}
                  </div>
                  {index < 4 && (
                    <div className={`flex-1 h-1 mx-2 ${isPast ? 'bg-green-600' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {renderStepContent()}
    </div>
  );
}
