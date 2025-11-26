import prisma from '@/lib/prisma';
import CourseCard from '@/components/lms/CourseCard';
import { AcademicCapIcon } from '@heroicons/react/24/outline';

export const metadata = {
  title: 'Course Catalog',
  description: 'Browse our available courses'
};

export const dynamic = 'force-dynamic';

async function getCourses() {
  const courses = await prisma.course.findMany({
    where: {
      isPublished: true
    },
    include: {
      category: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      _count: {
        select: {
          enrollments: true
        }
      }
    },
    orderBy: [
      { isFeatured: 'desc' },
      { createdAt: 'desc' }
    ]
  });

  return courses;
}

async function getCategories() {
  const categories = await prisma.courseCategory.findMany({
    orderBy: { name: 'asc' }
  });
  return categories;
}

export default async function CatalogPage() {
  const [courses, categories] = await Promise.all([
    getCourses(),
    getCategories()
  ]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <AcademicCapIcon className="h-8 w-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-900">Course Catalog</h1>
        </div>
        <p className="text-gray-600">
          Explore our collection of courses and start learning today
        </p>
      </div>

      {categories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <span className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-full">
            All Courses
          </span>
          {categories.map((category) => (
            <span
              key={category.id}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-200 cursor-pointer transition-colors"
              style={{ borderColor: category.color }}
            >
              {category.name}
            </span>
          ))}
        </div>
      )}

      {courses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No courses available</h3>
          <p className="text-gray-500">
            Check back later for new courses or create one using the AI Course Builder
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              showEnrollButton={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
