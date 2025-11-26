import Link from 'next/link';
import { 
  AcademicCapIcon, 
  BookOpenIcon, 
  SparklesIcon, 
  ChartBarIcon 
} from '@heroicons/react/24/outline';

export const metadata = {
  title: 'Learning Management System',
  description: 'Explore courses and expand your knowledge'
};

export default function LMSPage() {
  const quickActions = [
    {
      title: 'Browse Courses',
      description: 'Explore our catalog of available courses',
      href: '/lms/catalog',
      icon: BookOpenIcon,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      title: 'My Learning',
      description: 'Track your progress and continue learning',
      href: '/lms/dashboard',
      icon: ChartBarIcon,
      bgColor: 'bg-emerald-100',
      iconColor: 'text-emerald-600'
    },
    {
      title: 'AI Course Builder',
      description: 'Create courses using AI assistance',
      href: '/lms/ai-builder',
      icon: SparklesIcon,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600'
    }
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <AcademicCapIcon className="h-8 w-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Learning Management System
          </h1>
        </div>
        <p className="text-gray-600">
          Expand your knowledge with our comprehensive courses and learning tools
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group bg-white rounded-xl p-6 border border-gray-200 hover:border-indigo-500 hover:shadow-lg transition-all"
          >
            <div className={`inline-flex p-3 rounded-lg ${action.bgColor} mb-4`}>
              <action.icon className={`h-6 w-6 ${action.iconColor}`} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
              {action.title}
            </h3>
            <p className="text-sm text-gray-600">
              {action.description}
            </p>
          </Link>
        ))}
      </div>

      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold mb-4">
            Start Your Learning Journey Today
          </h2>
          <p className="text-indigo-100 mb-6">
            Whether you're looking to learn new skills, enhance your knowledge, or earn certifications, 
            our LMS provides everything you need to succeed.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/lms/catalog"
              className="px-6 py-3 bg-white text-indigo-600 font-medium rounded-lg hover:bg-indigo-50 transition-colors"
            >
              Browse Courses
            </Link>
            <Link
              href="/lms/ai-builder"
              className="px-6 py-3 bg-indigo-500 text-white font-medium rounded-lg hover:bg-indigo-400 transition-colors"
            >
              Create a Course
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
