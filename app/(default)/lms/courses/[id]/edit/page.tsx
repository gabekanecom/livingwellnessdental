'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeftIcon, EyeIcon, PlusIcon, BookOpenIcon, PlayIcon, Cog6ToothIcon, TagIcon, PhotoIcon, XMarkIcon, UserGroupIcon, TrashIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { CheckIcon as SaveIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface Course {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  coverImage?: string;
  categoryId?: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  duration?: number;
  isPublished: boolean;
  isFeatured: boolean;
  restrictByRole: boolean;
  learningObjectives: string[];
  tags: string[];
  prerequisites: string[];
  enrollmentLimit?: number;
  modules?: Module[];
  allowedRoles?: { roleId: string; role: Role }[];
}

interface Role {
  id: string;
  name: string;
  userType: {
    id: string;
    name: string;
    hierarchyLevel: number;
  };
}

interface Module {
  id: string;
  title: string;
  description: string;
  sortOrder: number;
  lessons?: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  type: string;
  sortOrder: number;
  duration?: number;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

export default function CourseEditPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('basics');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [calculatedDuration, setCalculatedDuration] = useState(0);

  useEffect(() => {
    if (courseId) {
      fetchCourse();
      fetchCategories();
      fetchRoles();
    }
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/lms/courses/${courseId}`);
      if (response.ok) {
        const data = await response.json();
        setCourse(data.course);
        if (data.course.allowedRoles) {
          setSelectedRoleIds(data.course.allowedRoles.map((ar: { roleId: string }) => ar.roleId));
        }
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

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/lms/roles');
      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles || []);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds(prev => 
      prev.includes(roleId) 
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const groupedRoles = roles.reduce((acc, role) => {
    const typeName = role.userType.name;
    if (!acc[typeName]) {
      acc[typeName] = [];
    }
    acc[typeName].push(role);
    return acc;
  }, {} as Record<string, Role[]>);

  const calculateDuration = (modules?: Module[]) => {
    if (!modules || modules.length === 0) return 0;
    
    return modules.reduce((courseTotal, module) => {
      if (!module.lessons || module.lessons.length === 0) return courseTotal;
      
      const moduleTotal = module.lessons.reduce((lessonTotal, lesson) => {
        return lessonTotal + (lesson.duration || 0);
      }, 0);
      
      return courseTotal + moduleTotal;
    }, 0);
  };

  useEffect(() => {
    if (course && course.modules) {
      const duration = calculateDuration(course.modules);
      setCalculatedDuration(duration);
      setCourse(prev => prev ? { ...prev, duration: duration } : null);
    }
  }, [course?.modules]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!course) return;
    
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    
    setCourse(prev => ({
      ...prev!,
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleArrayInputChange = (field: 'learningObjectives' | 'tags' | 'prerequisites', index: number, value: string) => {
    if (!course) return;
    
    setCourse(prev => ({
      ...prev!,
      [field]: prev![field].map((item, i) => i === index ? value : item)
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, WebP, or GIF)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploadingImage(true);
    
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);

      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      setCourse(prev => prev ? { ...prev, coverImage: dataUrl } : null);
      toast.success('Image uploaded successfully');
      
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeImage = () => {
    setCourse(prev => prev ? { ...prev, coverImage: '' } : null);
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addArrayItem = (field: 'learningObjectives' | 'tags' | 'prerequisites') => {
    if (!course) return;
    
    setCourse(prev => ({
      ...prev!,
      [field]: [...(prev![field] || []), '']
    }));
  };

  const removeArrayItem = (field: 'learningObjectives' | 'tags' | 'prerequisites', index: number) => {
    if (!course) return;
    
    setCourse(prev => ({
      ...prev!,
      [field]: prev![field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;
    
    setIsSaving(true);

    try {
      const cleanedData = {
        ...course,
        learningObjectives: (course.learningObjectives || []).filter(obj => obj.trim() !== ''),
        tags: (course.tags || []).filter(tag => tag.trim() !== ''),
        prerequisites: (course.prerequisites || []).filter(prereq => prereq.trim() !== ''),
        allowedRoleIds: course.restrictByRole ? selectedRoleIds : [],
      };

      const response = await fetch(`/api/lms/courses/${courseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update course');
      }

      toast.success('Course updated successfully!');
      
    } catch (error: any) {
      console.error('Error updating course:', error);
      toast.error(error.message || 'Failed to update course');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!course) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete "${course.title}"? This action cannot be undone and will remove all course content including modules and lessons.`
    );
    
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/lms/courses/${courseId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete course');
      }

      toast.success('Course deleted successfully');
      router.push('/lms/catalog');
      
    } catch (error: any) {
      console.error('Error deleting course:', error);
      toast.error(error.message || 'Failed to delete course');
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
          href="/lms/catalog"
          className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-violet-600 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Courses
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl text-gray-800 font-bold">
              Edit Course
            </h1>
            <p className="text-gray-600 mt-2">
              Update your course information and content
            </p>
          </div>
          
          <Link
            href={`/lms/courses/${courseId}`}
            className="btn border-gray-200 hover:border-gray-300 bg-white text-gray-600 inline-flex items-center"
          >
            <EyeIcon className="h-4 w-4 mr-2" />
            Preview
          </Link>
        </div>
      </div>

      {(!course.modules || course.modules.length === 0) && (
        <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <BookOpenIcon className="h-5 w-5 text-violet-600 mt-0.5" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-violet-900">
                Ready to add content?
              </h3>
              <div className="mt-2 text-sm text-violet-800">
                <p>Your course is set up! Now add modules and lessons to create your learning experience:</p>
                <ol className="mt-2 ml-4 list-decimal space-y-1">
                  <li>Save your course information below</li>
                  <li>Create modules to organize your content</li>
                  <li>Add lessons (videos, text, quizzes) to each module</li>
                  <li>Publish when ready for students</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'basics', name: 'Basic Info', icon: Cog6ToothIcon },
              { id: 'content', name: 'Content', icon: BookOpenIcon },
              { id: 'access', name: 'Role Access', icon: ShieldCheckIcon },
              { id: 'tags', name: 'Tags & Meta', icon: TagIcon },
              { id: 'enrollments', name: 'Students', icon: UserGroupIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm inline-flex items-center`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {activeTab === 'basics' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Course Information
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium mb-2">
                      Course Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={course.title}
                      onChange={handleInputChange}
                      required
                      className="form-input w-full"
                      placeholder="Enter a compelling course title"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium mb-2">
                      Course Thumbnail
                    </label>
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0">
                        {(course.coverImage || previewImage) ? (
                          <div className="relative">
                            <Image
                              src={previewImage || course.coverImage || ''}
                              alt="Course thumbnail"
                              width={200}
                              height={112}
                              className="rounded-lg object-cover"
                              style={{ aspectRatio: '16/9' }}
                            />
                            <button
                              type="button"
                              onClick={removeImage}
                              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                              title="Remove image"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-[200px] h-[112px] bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                            <PhotoIcon className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingImage}
                          className="btn border-gray-200 hover:border-gray-300 bg-white text-gray-600 inline-flex items-center"
                        >
                          <PhotoIcon className="h-4 w-4 mr-2" />
                          {isUploadingImage ? 'Uploading...' : 'Upload Image'}
                        </button>
                        <p className="text-xs text-gray-500 mt-2">
                          Recommended: 16:9 aspect ratio, max 5MB
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium mb-2">
                      Short Description
                    </label>
                    <input
                      type="text"
                      name="shortDescription"
                      value={course.shortDescription || ''}
                      onChange={handleInputChange}
                      className="form-input w-full"
                      placeholder="Brief description for course cards (1-2 sentences)"
                      maxLength={200}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <select
                      name="categoryId"
                      value={course.categoryId || ''}
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
                      value={course.difficulty}
                      onChange={handleInputChange}
                      className="form-select w-full"
                    >
                      <option value="BEGINNER">Beginner</option>
                      <option value="INTERMEDIATE">Intermediate</option>
                      <option value="ADVANCED">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Total Duration
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 flex-1">
                        {calculatedDuration > 0 ? (
                          calculatedDuration < 60 ? 
                            `${calculatedDuration} minutes` :
                            `${Math.floor(calculatedDuration / 60)}h ${calculatedDuration % 60}m`
                        ) : 'No lessons yet'}
                      </div>
                      <span className="text-xs text-gray-500">
                        Auto-calculated from lessons
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium mb-2">
                    Full Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={course.description}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="form-textarea w-full"
                    placeholder="Detailed course description..."
                  />
                </div>

                <div className="mt-6 bg-violet-50 border border-violet-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="isPublished"
                          checked={course.isPublished}
                          onChange={handleInputChange}
                          className="form-checkbox"
                        />
                        <label className="ml-2 text-sm font-medium">
                          Published (visible to students)
                        </label>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 ml-6">
                        {course.isPublished 
                          ? 'Students can enroll and access this course' 
                          : 'Course is in draft mode - only visible to instructors'
                        }
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      course.isPublished 
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {course.isPublished ? 'Live' : 'Draft'}
                    </div>
                  </div>

                  <div className="flex items-center mt-3">
                    <input
                      type="checkbox"
                      name="isFeatured"
                      checked={course.isFeatured}
                      onChange={handleInputChange}
                      className="form-checkbox"
                    />
                    <label className="ml-2 text-sm font-medium">
                      Featured course (appears in featured section)
                    </label>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Learning Objectives
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    What will students learn from this course?
                  </p>
                  
                  {(course.learningObjectives || []).map((objective, index) => (
                    <div key={index} className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={objective}
                        onChange={(e) => handleArrayInputChange('learningObjectives', index, e.target.value)}
                        className="form-input flex-1"
                        placeholder={`Learning objective ${index + 1}`}
                      />
                      {(course.learningObjectives || []).length > 1 && (
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
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Course Content
                  </h3>
                  <p className="text-sm text-gray-600">
                    Organize your course into modules and lessons.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Link
                    href={`/lms/courses/${courseId}/modules/new`}
                    className="btn bg-green-500 hover:bg-green-600 text-white inline-flex items-center"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Module
                  </Link>
                </div>
              </div>

              {course.modules && course.modules.length > 0 ? (
                <div className="space-y-4">
                  {course.modules.map((module, index) => (
                    <div key={module.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className="flex items-center justify-center w-8 h-8 bg-violet-100 text-violet-600 rounded-full text-sm font-semibold mr-3">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">
                              {module.title}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {module.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/lms/courses/${courseId}/modules/${module.id}/lessons/new`}
                            className="btn border-green-200 hover:border-green-300 bg-white text-green-600 text-sm inline-flex items-center"
                          >
                            <PlusIcon className="h-3 w-3 mr-1" />
                            Add Lesson
                          </Link>
                          <Link
                            href={`/lms/courses/${courseId}/modules/${module.id}/edit`}
                            className="btn border-gray-200 hover:border-gray-300 bg-white text-gray-600 text-sm"
                          >
                            Edit
                          </Link>
                        </div>
                      </div>
                      
                      {module.lessons && module.lessons.length > 0 ? (
                        <div className="ml-11 space-y-2">
                          {module.lessons.map((lesson, lessonIndex) => (
                            <div key={lesson.id} className="flex items-center justify-between py-2 px-3 bg-white rounded border border-gray-200">
                              <div className="flex items-center">
                                <div className="flex items-center justify-center w-6 h-6 bg-gray-100 text-gray-600 rounded text-xs mr-3">
                                  {lessonIndex + 1}
                                </div>
                                <div className="flex items-center">
                                  {lesson.type === 'VIDEO' && <PlayIcon className="h-4 w-4 text-red-500 mr-2" />}
                                  {lesson.type === 'TEXT' && <BookOpenIcon className="h-4 w-4 text-violet-500 mr-2" />}
                                  <span className="text-sm font-medium text-gray-900">
                                    {lesson.title}
                                  </span>
                                </div>
                              </div>
                              <Link
                                href={`/lms/courses/${courseId}/modules/${module.id}/lessons/${lesson.id}/edit`}
                                className="btn border-gray-200 hover:border-gray-300 bg-white text-gray-600 text-xs"
                              >
                                Edit
                              </Link>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="ml-11 py-4 text-center text-gray-500 text-sm border-2 border-dashed border-gray-300 rounded">
                          No lessons yet. Click "Add Lesson" to create your first lesson.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    No modules yet
                  </h4>
                  <p className="text-gray-600 mb-6">
                    Get started by creating your first module.
                  </p>
                  <Link
                    href={`/lms/courses/${courseId}/modules/new`}
                    className="btn bg-green-500 hover:bg-green-600 text-white inline-flex items-center"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create First Module
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'access' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Role-Based Access
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Control which user roles can see and enroll in this course. When enabled, only users with selected roles will see this course in the catalog.
                </p>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="restrictByRole"
                      checked={course.restrictByRole || false}
                      onChange={handleInputChange}
                      className="form-checkbox"
                    />
                    <label className="ml-2 text-sm font-medium">
                      Restrict this course to specific roles
                    </label>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 ml-6">
                    {course.restrictByRole 
                      ? 'Only selected roles below can view and enroll in this course' 
                      : 'All users can view and enroll in this course'
                    }
                  </p>
                </div>

                {course.restrictByRole && (
                  <div className="space-y-4">
                    {Object.entries(groupedRoles).map(([userType, typeRoles]) => (
                      <div key={userType} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">{userType}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {typeRoles.map(role => (
                            <label
                              key={role.id}
                              className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                                selectedRoleIds.includes(role.id)
                                  ? 'bg-violet-50 border-violet-300'
                                  : 'bg-white border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedRoleIds.includes(role.id)}
                                onChange={() => toggleRole(role.id)}
                                className="form-checkbox text-violet-600"
                              />
                              <span className="ml-2 text-sm">{role.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}

                    {selectedRoleIds.length === 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                        <strong>Warning:</strong> No roles selected. When role restriction is enabled, at least one role must be selected or no one will be able to access this course.
                      </div>
                    )}

                    {selectedRoleIds.length > 0 && (
                      <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-violet-900 mb-2">
                          Selected Roles ({selectedRoleIds.length})
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {selectedRoleIds.map(roleId => {
                            const role = roles.find(r => r.id === roleId);
                            return role ? (
                              <span
                                key={roleId}
                                className="inline-flex items-center px-3 py-1 bg-white border border-violet-200 rounded-full text-sm text-violet-700"
                              >
                                {role.name}
                                <button
                                  type="button"
                                  onClick={() => toggleRole(roleId)}
                                  className="ml-2 text-violet-400 hover:text-violet-600"
                                >
                                  <XMarkIcon className="h-4 w-4" />
                                </button>
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tags' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Tags & Keywords
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Add tags to help students find your course.
                </p>
                
                {(course.tags || []).map((tag, index) => (
                  <div key={index} className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={tag}
                      onChange={(e) => handleArrayInputChange('tags', index, e.target.value)}
                      className="form-input flex-1"
                      placeholder={`Tag ${index + 1}`}
                    />
                    {(course.tags || []).length > 1 && (
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
                  className="btn border-gray-200 hover:border-gray-300 bg-white text-gray-600 mb-8"
                >
                  Add Tag
                </button>
              </div>

              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-4">
                  Prerequisites (Optional)
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  What should students know before taking this course?
                </p>
                
                {(course.prerequisites || []).map((prereq, index) => (
                  <div key={index} className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={prereq}
                      onChange={(e) => handleArrayInputChange('prerequisites', index, e.target.value)}
                      className="form-input flex-1"
                      placeholder={`Prerequisite ${index + 1}`}
                    />
                    {(course.prerequisites || []).length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('prerequisites', index)}
                        className="btn border-red-200 hover:border-red-300 bg-white text-red-600"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={() => addArrayItem('prerequisites')}
                  className="btn border-gray-200 hover:border-gray-300 bg-white text-gray-600"
                >
                  Add Prerequisite
                </button>
              </div>
            </div>
          )}

          {activeTab === 'enrollments' && (
            <div className="space-y-6">
              <div className="text-center py-12">
                <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Manage Student Enrollments
                </h3>
                <p className="text-gray-600 mb-6">
                  View enrolled students and their progress.
                </p>
                <Link
                  href={`/lms/courses/${courseId}/enrollments`}
                  className="btn bg-violet-500 hover:bg-violet-600 text-white inline-flex items-center"
                >
                  <UserGroupIcon className="h-4 w-4 mr-2" />
                  Manage Enrollments
                </Link>
              </div>
            </div>
          )}

          <div className="flex justify-between gap-3 pt-6 border-t border-gray-200 mt-8">
            <button
              type="button"
              onClick={handleDeleteCourse}
              disabled={isDeleting || isSaving}
              className="btn border-gray-200 hover:border-red-300 bg-white text-red-600 inline-flex items-center"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              {isDeleting ? 'Deleting...' : 'Delete Course'}
            </button>
            
            <div className="flex gap-3">
              <Link
                href="/lms/catalog"
                className="btn border-gray-200 hover:border-gray-300 bg-white text-gray-600"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSaving || isDeleting}
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
