'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, TrashIcon } from '@heroicons/react/24/outline';
import { CheckIcon as SaveIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface Course {
  id: string;
  title: string;
}

interface Module {
  id: string;
  title: string;
  description: string;
  sortOrder: number;
  isPublished: boolean;
}

export default function EditModulePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const moduleId = params.moduleId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sortOrder: 1,
    isPublished: false
  });

  useEffect(() => {
    if (courseId && moduleId) {
      fetchData();
    }
  }, [courseId, moduleId]);

  const fetchData = async () => {
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
        setFormData({
          title: moduleData.module.title,
          description: moduleData.module.description || '',
          sortOrder: moduleData.module.sortOrder || 1,
          isPublished: moduleData.module.isPublished || false
        });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`/api/lms/courses/${courseId}/modules/${moduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update module');
      }

      toast.success('Module updated successfully!');
      router.push(`/lms/courses/${courseId}/edit?tab=content`);

    } catch (error: any) {
      console.error('Error updating module:', error);
      toast.error(error.message || 'Failed to update module');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this module? This will also delete all lessons within this module.'
    );
    
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/lms/courses/${courseId}/modules/${moduleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete module');
      }

      toast.success('Module deleted successfully');
      router.push(`/lms/courses/${courseId}/edit?tab=content`);
      
    } catch (error: any) {
      console.error('Error deleting module:', error);
      toast.error(error.message || 'Failed to delete module');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
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
            Edit Module
          </h1>
          {course && (
            <p className="text-gray-600 mt-2">
              Editing module in "{course.title}"
            </p>
          )}
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
                placeholder="Enter module title"
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

            <div>
              <label className="block text-sm font-medium mb-2">
                Sort Order
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
                Position of this module in the course
              </p>
            </div>

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

        <div className="flex justify-between gap-3">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting || isSaving}
            className="btn border-gray-200 hover:border-red-300 bg-white text-red-600 inline-flex items-center"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            {isDeleting ? 'Deleting...' : 'Delete Module'}
          </button>

          <div className="flex gap-3">
            <Link
              href={`/lms/courses/${courseId}/edit?tab=content`}
              className="btn border-gray-200 hover:border-gray-300 bg-white text-gray-600"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="btn bg-violet-500 hover:bg-violet-600 text-white disabled:opacity-50 inline-flex items-center"
            >
              <SaveIcon className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
