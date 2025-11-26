import { SparklesIcon } from '@heroicons/react/24/outline';
import AICourseBuildWizard from '@/components/lms/AICourseBuildWizard';

export const metadata = {
  title: 'AI Course Builder',
  description: 'Create courses using AI assistance'
};

export default function AIBuilderPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <SparklesIcon className="h-8 w-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">AI Course Builder</h1>
        </div>
        <p className="text-gray-600">
          Create professional courses in minutes using AI-powered content generation
        </p>
      </div>

      <AICourseBuildWizard />
    </div>
  );
}
