'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { CheckIcon as SaveIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface Course {
  id: string;
  title: string;
}

export default function CreateModulePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isPublished: false
  });

  useEffect(() => {
    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/lms/courses/${courseId}`);
      if (response.ok) {
        const data = await response.json();
        setCourse({
          id: data.course.id,
          title: data.course.title
        });
      } else {
        toast.error('Failed to load course');
        router.push('/lms/catalog');
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      toast.error('Error loading course');
      router.push('/lms/catalog');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`/api/lms/courses/${courseId}/modules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create module');
      }

      toast.success('Module created successfully! You can now add lessons.');
      router.push(`/lms/courses/${courseId}/edit?tab=content`);

    } catch (error: any) {
      console.error('Error creating module:', error);
      toast.error(error.message || 'Failed to create module');
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

  if (!course) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-4xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h1>
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
          Back to Course Edit
        </Link>
        
        <div>
          <h1 className="text-2xl md:text-3xl text-gray-800 font-bold">
            Create New Module
          </h1>
          <p className="text-gray-600 mt-2">
            Add a new module to "{course.title}"
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Module Information
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Module Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="form-input w-full"
                placeholder="Enter module title (e.g., 'Introduction to the Topic')"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="form-textarea w-full"
                placeholder="Describe what students will learn in this module"
              />
            </div>

            <div className="space-y-4">
              <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
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
                    <p className="text-xs text-gray-600 mt-1 ml-6">
                      {formData.isPublished 
                        ? 'Students can access this module if the course is published' 
                        : 'Module is in draft mode - only visible to instructors'
                      }
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    formData.isPublished 
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {formData.isPublished ? 'Live' : 'Draft'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link
            href={`/lms/courses/${courseId}/edit?tab=content`}
            className="btn border-gray-200 hover:border-gray-300 bg-white text-gray-600"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="btn bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
          >
            {isSaving && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <SaveIcon className="h-4 w-4 mr-2" />
            {isSaving ? 'Creating...' : 'Create Module'}
          </button>
        </div>
      </form>
    </div>
  );
}
