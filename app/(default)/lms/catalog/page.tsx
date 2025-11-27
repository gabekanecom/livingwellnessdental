import prisma from '@/lib/prisma';
import CourseGrid from '@/components/lms/CourseGrid';
import CourseFilters from '@/components/lms/CourseFilters';
import Link from 'next/link';
import { AcademicCapIcon, PlusIcon, SparklesIcon } from '@heroicons/react/24/outline';
import type { Course, CourseCategory, User } from '@prisma/client';
import { createClient } from '@/lib/supabase/server';
import { hasPermission } from '@/lib/permissions';

type CourseWithDetails = Course & {
  category: CourseCategory | null;
  createdBy: Pick<User, 'id' | 'name' | 'email'> | null;
  _count: { enrollments: number };
};

export const metadata = {
  title: 'Course Catalog',
  description: 'Browse our available courses'
};

export const dynamic = 'force-dynamic';

interface SearchParams {
  category?: string;
  difficulty?: string;
  duration?: string;
  sort?: string;
  q?: string;
}

async function getCourses(searchParams: SearchParams) {
  const { category, difficulty, duration, sort, q } = searchParams;

  const where: Record<string, unknown> = {
    isPublished: true
  };

  if (category) {
    where.categoryId = category;
  }

  if (difficulty) {
    where.difficulty = difficulty;
  }

  if (duration) {
    const [min, max] = duration.split('-').map(Number);
    if (max) {
      where.duration = { gte: min, lte: max };
    } else {
      where.duration = { gte: min };
    }
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { shortDescription: { contains: q, mode: 'insensitive' } }
    ];
  }

  let orderBy: Record<string, unknown>[] = [{ isFeatured: 'desc' }];
  
  switch (sort) {
    case 'popular':
      orderBy.push({ enrollments: { _count: 'desc' } });
      break;
    case 'rating':
      orderBy.push({ rating: 'desc' });
      break;
    case 'title':
      orderBy.push({ title: 'asc' });
      break;
    case 'newest':
    default:
      orderBy.push({ createdAt: 'desc' });
  }

  const courses = await prisma.course.findMany({
    where,
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
    orderBy
  });

  return courses;
}

async function getCategories() {
  const categories = await prisma.courseCategory.findMany({
    orderBy: { name: 'asc' }
  });
  return categories;
}

async function getCanManageCourses(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      userRoles: {
        where: { isActive: true },
        include: {
          role: {
            include: {
              userType: true
            }
          }
        }
      }
    }
  });
  
  if (!dbUser) return false;
  
  if (dbUser.userRoles.length > 0) {
    const lowestHierarchy = Math.min(
      ...dbUser.userRoles.map(ur => ur.role.userType.hierarchyLevel)
    );
    if (lowestHierarchy <= 1) return true;
  }
  
  return hasPermission(user.id, 'lms.manage_courses');
}

async function getFeaturedCourses() {
  return prisma.course.findMany({
    where: {
      isPublished: true,
      isFeatured: true
    },
    include: {
      category: true,
      createdBy: {
        select: { id: true, name: true, email: true }
      },
      _count: { select: { enrollments: true } }
    },
    take: 3,
    orderBy: { createdAt: 'desc' }
  });
}

async function getPopularCourses() {
  return prisma.course.findMany({
    where: { isPublished: true },
    include: {
      category: true,
      createdBy: {
        select: { id: true, name: true, email: true }
      },
      _count: { select: { enrollments: true } }
    },
    orderBy: { enrollments: { _count: 'desc' } },
    take: 3
  });
}

export default async function CatalogPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams;
  const hasFilters = params.category || params.difficulty || params.duration || params.q;

  const [courses, categories, canManageCourses, featuredCourses, popularCourses] = await Promise.all([
    getCourses(params),
    getCategories(),
    getCanManageCourses(),
    !hasFilters ? getFeaturedCourses() : Promise.resolve([]),
    !hasFilters ? getPopularCourses() : Promise.resolve([])
  ]);

  const showFeatured = !hasFilters && featuredCourses.length > 0;
  const showPopular = !hasFilters && popularCourses.length > 0;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <AcademicCapIcon className="h-8 w-8 text-violet-600" />
              <h1 className="text-3xl font-bold text-gray-900">Course Catalog</h1>
            </div>
            <p className="text-gray-600">
              Explore our collection of courses and start learning today
            </p>
          </div>
          {canManageCourses && (
            <div className="flex gap-3">
              <Link
                href="/lms/ai-builder"
                className="btn border-violet-200 hover:border-violet-300 bg-white text-violet-600 inline-flex items-center"
              >
                <SparklesIcon className="h-4 w-4 mr-2" />
                AI Builder
              </Link>
              <Link
                href="/lms/courses/new"
                className="btn bg-violet-500 hover:bg-violet-600 text-white inline-flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Course
              </Link>
            </div>
          )}
        </div>
      </div>

      {categories.length > 0 && (
        <div className="mb-8">
          <CourseFilters categories={categories} />
        </div>
      )}

      {showFeatured && (
        <div className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-yellow-500" />
            Featured Courses
          </h2>
          <CourseGrid
            courses={featuredCourses}
            showEnrollButton={true}
            showManagementActions={canManageCourses}
          />
        </div>
      )}

      {showPopular && (
        <div className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AcademicCapIcon className="h-5 w-5 text-violet-500" />
            Popular Courses
          </h2>
          <CourseGrid
            courses={popularCourses}
            showEnrollButton={true}
            showManagementActions={canManageCourses}
          />
        </div>
      )}

      <div>
        {hasFilters && (
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {courses.length} {courses.length === 1 ? 'Course' : 'Courses'} Found
          </h2>
        )}
        {!hasFilters && (showFeatured || showPopular) && (
          <h2 className="text-xl font-bold text-gray-900 mb-4">All Courses</h2>
        )}

        {courses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-500">
              {hasFilters
                ? 'Try adjusting your filters to find more courses'
                : 'Check back later for new courses or create one using the AI Course Builder'}
            </p>
          </div>
        ) : (
          <CourseGrid
            courses={courses}
            showEnrollButton={true}
            showManagementActions={canManageCourses}
          />
        )}
      </div>
    </div>
  );
}
