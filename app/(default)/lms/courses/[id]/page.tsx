import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import ModuleList from '@/components/lms/ModuleList';
import { 
  ClockIcon, 
  AcademicCapIcon,
  UserGroupIcon,
  ChevronLeftIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

export const dynamic = 'force-dynamic';

async function getCourse(id: string) {
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      category: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      modules: {
        include: {
          lessons: {
            orderBy: { order: 'asc' }
          }
        },
        orderBy: { order: 'asc' }
      },
      _count: {
        select: {
          enrollments: true
        }
      }
    }
  });

  return course;
}

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = await getCourse(id);

  if (!course) {
    notFound();
  }

  const totalLessons = course.modules.reduce(
    (sum, module) => sum + module.lessons.length,
    0
  );

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getDifficultyLabel = (difficulty: string) => {
    return difficulty.charAt(0) + difficulty.slice(1).toLowerCase();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'BEGINNER': return 'bg-emerald-100 text-emerald-800';
      case 'INTERMEDIATE': return 'bg-yellow-100 text-yellow-800';
      case 'ADVANCED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
      <Link 
        href="/lms/catalog"
        className="inline-flex items-center text-sm text-gray-600 hover:text-indigo-600 mb-6"
      >
        <ChevronLeftIcon className="h-4 w-4 mr-1" />
        Back to Catalog
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div
              className="h-32 sm:h-40 md:h-48 flex items-center justify-center"
              style={{ backgroundColor: course.category?.color || '#6366F1' }}
            >
              <span className="text-4xl sm:text-5xl md:text-6xl font-bold text-white/50">
                {course.title.charAt(0)}
              </span>
            </div>

            <div className="p-6">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {course.category && (
                  <span 
                    className="px-3 py-1 text-sm font-medium rounded-full"
                    style={{ 
                      backgroundColor: `${course.category.color}20`, 
                      color: course.category.color 
                    }}
                  >
                    {course.category.name}
                  </span>
                )}
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getDifficultyColor(course.difficulty)}`}>
                  {getDifficultyLabel(course.difficulty)}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {course.title}
              </h1>

              {course.description && (
                <p className="text-gray-600 mb-6">
                  {course.description}
                </p>
              )}

              <div className="flex flex-wrap gap-6 text-sm text-gray-500 mb-6">
                <div className="flex items-center gap-1">
                  <ClockIcon className="h-5 w-5" />
                  {formatDuration(course.duration)}
                </div>
                <div className="flex items-center gap-1">
                  <AcademicCapIcon className="h-5 w-5" />
                  {course.modules.length} modules • {totalLessons} lessons
                </div>
                <div className="flex items-center gap-1">
                  <UserGroupIcon className="h-5 w-5" />
                  {course._count.enrollments} enrolled
                </div>
              </div>

              {course.learningObjectives.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    What you'll learn
                  </h2>
                  <ul className="space-y-2">
                    {course.learningObjectives.map((objective, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-600">
                        <span className="text-emerald-500 mt-1">✓</span>
                        {objective}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {course.prerequisites.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    Prerequisites
                  </h2>
                  <ul className="space-y-2">
                    {course.prerequisites.map((prereq, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-600">
                        <span className="text-gray-400">•</span>
                        {prereq}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Course Content</h2>
            <ModuleList 
              modules={course.modules}
              courseId={course.id}
              isStudent={false}
            />
          </div>
        </div>

        <div className="lg:col-span-1 order-first lg:order-last">
          <div className="bg-white rounded-xl border border-gray-200 p-6 lg:sticky lg:top-8">
            <Link
              href={`/lms/courses/${course.id}/take`}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors mb-4"
            >
              <PlayIcon className="h-5 w-5" />
              Start Learning
            </Link>

            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="font-medium text-gray-900 mb-3">This course includes:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-indigo-500">✓</span>
                  {course.modules.length} modules
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-indigo-500">✓</span>
                  {totalLessons} lessons
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-indigo-500">✓</span>
                  {formatDuration(course.duration)} of content
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-indigo-500">✓</span>
                  Progress tracking
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-indigo-500">✓</span>
                  Certificate on completion
                </li>
              </ul>
            </div>

            {course.createdBy && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="font-medium text-gray-900 mb-2">Instructor</h3>
                <p className="text-sm text-gray-600">{course.createdBy.name}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
