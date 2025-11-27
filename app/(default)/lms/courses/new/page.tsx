'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  color: string;
}

function CreateCourseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateType = searchParams.get('template');

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    shortDescription: '',
    categoryId: '',
    difficulty: 'BEGINNER',
    learningObjectives: [''],
    tags: [''],
    prerequisites: [''],
    enrollmentLimit: ''
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (templateType && categories.length > 0) {
      applyQuickTemplate(templateType);
    }
  }, [templateType, categories]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/lms/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const applyQuickTemplate = (template: string) => {
    switch (template) {
      case 'compliance':
        setFormData(prev => ({
          ...prev,
          title: 'Compliance Training Course',
          shortDescription: 'Essential compliance protocols and procedures',
          description: 'This comprehensive compliance training course covers all essential protocols and procedures required for workplace compliance. Topics include safety standards, regulatory requirements, and best practices.',
          categoryId: categories.find(cat => cat.name.toLowerCase().includes('compliance'))?.id || '',
          difficulty: 'BEGINNER',
          learningObjectives: [
            'Understand basic compliance principles',
            'Identify key regulatory requirements',
            'Apply compliance standards in daily work',
            'Document and report compliance activities'
          ],
          tags: ['compliance', 'training', 'certification']
        }));
        break;
      case 'onboarding':
        setFormData(prev => ({
          ...prev,
          title: 'Employee Onboarding',
          shortDescription: 'Welcome and orientation for new team members',
          description: 'A comprehensive onboarding program designed to welcome new employees and help them understand our organization, culture, and processes.',
          categoryId: categories.find(cat => cat.name.toLowerCase().includes('onboarding'))?.id || '',
          difficulty: 'BEGINNER',
          learningObjectives: [
            'Understand company culture and values',
            'Learn organizational structure',
            'Complete required administrative setup',
            'Connect with team members'
          ],
          tags: ['onboarding', 'orientation', 'new-hire']
        }));
        break;
      case 'skills':
        setFormData(prev => ({
          ...prev,
          title: 'Professional Skills Development',
          shortDescription: 'Build essential professional skills for career growth',
          description: 'Develop key professional skills that will help you excel in your role and advance your career. This course covers communication, time management, and leadership fundamentals.',
          categoryId: categories.find(cat => cat.name.toLowerCase().includes('skills') || cat.name.toLowerCase().includes('professional'))?.id || '',
          difficulty: 'INTERMEDIATE',
          learningObjectives: [
            'Improve professional communication',
            'Master time management techniques',
            'Develop leadership capabilities',
            'Build effective collaboration skills'
          ],
          tags: ['professional-development', 'skills', 'leadership']
        }));
        break;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleArrayInputChange = (field: 'learningObjectives' | 'tags' | 'prerequisites', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field: 'learningObjectives' | 'tags' | 'prerequisites') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field: 'learningObjectives' | 'tags' | 'prerequisites', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const cleanedData = {
        ...formData,
        learningObjectives: formData.learningObjectives.filter(obj => obj.trim() !== ''),
        tags: formData.tags.filter(tag => tag.trim() !== ''),
        prerequisites: formData.prerequisites.filter(prereq => prereq.trim() !== ''),
        enrollmentLimit: formData.enrollmentLimit ? parseInt(formData.enrollmentLimit) : null
      };

      const response = await fetch('/api/lms/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create course');
      }

      const { course } = await response.json();
      
      toast.success('Course created! Next: Add modules and lessons to build your content.');
      router.push(`/lms/courses/${course.id}/edit`);

    } catch (error: any) {
      console.error('Error creating course:', error);
      toast.error(error.message || 'Failed to create course');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-4xl mx-auto">
      <div className="mb-8">
        <Link
          href="/lms/catalog"
          className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-violet-600 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Courses
        </Link>
        
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <h1 className="text-2xl md:text-3xl text-gray-800 font-bold">
              Create New Course
            </h1>
            {templateType && (
              <div className="ml-4 flex items-center px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm">
                <SparklesIcon className="h-4 w-4 mr-1" />
                Template Applied
              </div>
            )}
          </div>
          <Link
            href="/lms/ai-builder"
            className="btn bg-violet-600 hover:bg-violet-700 text-white flex items-center gap-2"
          >
            <SparklesIcon className="h-4 w-4" />
            Use AI Builder
          </Link>
        </div>
        <p className="text-gray-600 mt-2">
          Set up the basic information for your new course. You can add modules and lessons after creating the course.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Basic Information
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Course Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="form-input w-full"
                placeholder="Enter course title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Short Description
              </label>
              <input
                type="text"
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleInputChange}
                className="form-input w-full"
                placeholder="Brief description for course cards (1-2 sentences)"
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">
                This appears on course cards and search results
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Full Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={5}
                className="form-textarea w-full"
                placeholder="Detailed course description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  className="form-select w-full"
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Difficulty Level</label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleInputChange}
                  className="form-select w-full"
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Enrollment Limit
                </label>
                <input
                  type="number"
                  name="enrollmentLimit"
                  value={formData.enrollmentLimit}
                  onChange={handleInputChange}
                  min="1"
                  className="form-input w-full"
                  placeholder="Leave blank for unlimited"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Learning Objectives
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            What will students learn from this course?
          </p>

          {formData.learningObjectives.map((objective, index) => (
            <div key={index} className="flex gap-2 mb-3">
              <input
                type="text"
                value={objective}
                onChange={(e) => handleArrayInputChange('learningObjectives', index, e.target.value)}
                className="form-input flex-1"
                placeholder={`Learning objective ${index + 1}`}
              />
              {formData.learningObjectives.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArrayItem('learningObjectives', index)}
                  className="btn border-red-200 hover:border-red-300 bg-white text-red-600"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          
          <button
            type="button"
            onClick={() => addArrayItem('learningObjectives')}
            className="btn border-gray-200 hover:border-gray-300 bg-white text-gray-600"
          >
            Add Learning Objective
          </button>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Tags
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Add tags to help students find your course
          </p>

          {formData.tags.map((tag, index) => (
            <div key={index} className="flex gap-2 mb-3">
              <input
                type="text"
                value={tag}
                onChange={(e) => handleArrayInputChange('tags', index, e.target.value)}
                className="form-input flex-1"
                placeholder={`Tag ${index + 1}`}
              />
              {formData.tags.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArrayItem('tags', index)}
                  className="btn border-red-200 hover:border-red-300 bg-white text-red-600"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          
          <button
            type="button"
            onClick={() => addArrayItem('tags')}
            className="btn border-gray-200 hover:border-gray-300 bg-white text-gray-600"
          >
            Add Tag
          </button>
        </div>

        <div className="flex justify-end gap-3">
          <Link
            href="/lms/catalog"
            className="btn border-gray-200 hover:border-gray-300 bg-white text-gray-600"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="btn bg-violet-500 hover:bg-violet-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating...' : 'Create Course'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CreateCoursePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    }>
      <CreateCourseContent />
    </Suspense>
  );
}
