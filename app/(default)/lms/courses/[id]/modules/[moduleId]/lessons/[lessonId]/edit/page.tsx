'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, TrashIcon, PlayIcon, DocumentTextIcon, QuestionMarkCircleIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';
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
}

export default function EditLessonPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const moduleId = params.moduleId as string;
  const lessonId = params.lessonId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [module, setModule] = useState<Module | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
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

  useEffect(() => {
    if (courseId && moduleId && lessonId) {
      fetchData();
    }
  }, [courseId, moduleId, lessonId]);

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
        setModule({
          id: moduleData.module.id,
          title: moduleData.module.title
        });

        const lesson = moduleData.module.lessons?.find((l: any) => l.id === lessonId);
        if (lesson) {
          setFormData({
            title: lesson.title || '',
            description: lesson.description || '',
            content: lesson.content || '',
            type: lesson.type || 'TEXT',
            videoUrl: lesson.videoUrl || '',
            duration: lesson.duration || 30,
            sortOrder: lesson.sortOrder || 1,
            isPublished: lesson.isPublished || false,
            isRequired: lesson.isRequired !== false
          });
        } else {
          toast.error('Lesson not found');
          router.push(`/lms/courses/${courseId}/edit?tab=content`);
        }
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
      const response = await fetch(`/api/lms/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update lesson');
      }

      toast.success('Lesson updated successfully!');
      router.push(`/lms/courses/${courseId}/edit?tab=content`);

    } catch (error: any) {
      console.error('Error updating lesson:', error);
      toast.error(error.message || 'Failed to update lesson');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this lesson? This action cannot be undone.'
    );
    
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/lms/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete lesson');
      }

      toast.success('Lesson deleted successfully');
      router.push(`/lms/courses/${courseId}/edit?tab=content`);
      
    } catch (error: any) {
      console.error('Error deleting lesson:', error);
      toast.error(error.message || 'Failed to delete lesson');
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
          Back to Course Content
        </Link>
        
        <div>
          <h1 className="text-2xl md:text-3xl text-gray-800 font-bold">
            Edit Lesson
          </h1>
          {course && module && (
            <p className="text-gray-600 mt-2">
              Editing lesson in <strong>{module.title}</strong> - "{course.title}"
            </p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-4">
              Lesson Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: 'TEXT', label: 'Text Content', icon: DocumentTextIcon },
                { value: 'VIDEO', label: 'Video', icon: PlayIcon },
                { value: 'QUIZ', label: 'Quiz', icon: QuestionMarkCircleIcon },
                { value: 'FILE', label: 'File/Resource', icon: DocumentArrowUpIcon }
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
                      <div className="text-sm font-medium text-center">{type.label}</div>
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
              placeholder="Brief description of what students will learn"
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

          <div className="flex justify-between gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || isSaving}
              className="btn border-gray-200 hover:border-red-300 bg-white text-red-600 inline-flex items-center"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              {isDeleting ? 'Deleting...' : 'Delete Lesson'}
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
                className="btn bg-violet-500 hover:bg-violet-600 text-white inline-flex items-center disabled:opacity-50"
              >
                <SaveIcon className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
