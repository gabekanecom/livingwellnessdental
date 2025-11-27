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

async function getUserRoleIds(): Promise<string[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      userRoles: {
        where: { isActive: true },
        select: { roleId: true }
      }
    }
  });
  
  return dbUser?.userRoles.map(ur => ur.roleId) || [];
}

async function getCourses(searchParams: SearchParams, userRoleIds: string[]) {
  const { category, difficulty, duration, sort, q } = searchParams;

  const where: Record<string, unknown> = {
    isPublished: true,
    OR: [
      { restrictByRole: false },
      { 
        restrictByRole: true,
        allowedRoles: {
          some: {
            roleId: { in: userRoleIds.length > 0 ? userRoleIds : ['__none__'] }
          }
        }
      }
    ]
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
    where.AND = [
      {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { shortDescription: { contains: q, mode: 'insensitive' } }
        ]
      }
    ];
  }

  let orderBy: Record<string, unknown>[] = [];
  
  switch (sort) {
    case 'popular':
      orderBy = [{ enrollments: { _count: 'desc' } }, { createdAt: 'desc' }];
      break;
    case 'title':
      orderBy = [{ title: 'asc' }];
      break;
    case 'newest':
      orderBy = [{ createdAt: 'desc' }];
      break;
    case 'featured':
    default:
      orderBy = [{ isFeatured: 'desc' }, { createdAt: 'desc' }];
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

export default async function CatalogPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams;
  const hasFilters = params.category || params.difficulty || params.duration || params.q;

  const userRoleIds = await getUserRoleIds();
  
  const [courses, categories, canManageCourses] = await Promise.all([
    getCourses(params, userRoleIds),
    getCategories(),
    getCanManageCourses()
  ]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <AcademicCapIcon className="h-8 w-8 text-violet-600" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Course Catalog</h1>
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

      <div>
        {hasFilters && (
          <p className="text-sm text-gray-600 mb-4">
            {courses.length} {courses.length === 1 ? 'course' : 'courses'} found
          </p>
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
