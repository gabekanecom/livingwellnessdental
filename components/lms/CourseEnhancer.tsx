'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  PlusCircleIcon, 
  BookOpenIcon, 
  DocumentPlusIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XMarkIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface Course {
  id: string;
  title: string;
  description: string | null;
  _count?: {
    modules: number;
  };
  isPublished: boolean;
}

interface UploadedDocument {
  id: string;
  name: string;
  content: string;
  type: 'docx' | 'txt';
  size: number;
  moduleTitle?: string;
}

interface CourseEnhancerProps {
  onSuccess?: (courseId: string) => void;
}

export default function CourseEnhancer({ onSuccess }: CourseEnhancerProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [enhancementMode, setEnhancementMode] = useState<'add_modules' | 'enhance_existing'>('add_modules');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<any>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const response = await fetch('/api/lms/courses');
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoadingCourses(false);
    }
  };

  const readFileContent = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          const decoder = new TextDecoder('utf-8');
          resolve(decoder.decode(reader.result as ArrayBuffer));
        }
      };
      reader.onerror = () => reject(reader.error);
      
      if (file.type === 'text/plain') {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const maxDocs = enhancementMode === 'add_modules' ? 10 : 5;
    
    for (const file of acceptedFiles) {
      if (documents.length >= maxDocs) {
        setError(`Maximum ${maxDocs} documents allowed.`);
        return;
      }

      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !['docx', 'txt'].includes(extension)) {
        setError('Unsupported file type. Please upload DOCX or TXT files only.');
        continue;
      }

      try {
        const content = await readFileContent(file);
        const newDocument: UploadedDocument = {
          id: crypto.randomUUID(),
          name: file.name,
          content,
          type: extension as 'docx' | 'txt',
          size: file.size,
          moduleTitle: file.name.replace(/\.[^/.]+$/, '')
        };
        setDocuments(prev => [...prev, newDocument]);
        setError(null);
      } catch (err) {
        setError(`Failed to read file: ${file.name}`);
      }
    }
  }, [documents.length, enhancementMode]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 50 * 1024 * 1024
  });

  const removeDocument = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  const updateModuleTitle = (documentId: string, title: string) => {
    setDocuments(prev => 
      prev.map(doc => doc.id === documentId ? { ...doc, moduleTitle: title } : doc)
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleEnhanceCourse = async () => {
    if (!selectedCourse) {
      setError('Please select a course to enhance');
      return;
    }

    if (documents.length === 0) {
      setError('Please upload at least one document');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/lms/course-enhancer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourse,
          enhancementMode,
          documents: documents.map(doc => ({
            content: doc.content,
            type: doc.type,
            moduleTitle: doc.moduleTitle,
            fileName: doc.name
          }))
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to enhance course');
      }

      setSuccess(data.data);
      if (onSuccess) {
        onSuccess(selectedCourse);
      }

      setDocuments([]);
      setSelectedCourse('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCourseDetails = courses.find(c => c.id === selectedCourse);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpenIcon className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Enhance Existing Course
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Course to Enhance
            </label>
            {loadingCourses ? (
              <div className="flex items-center gap-2 text-gray-500">
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                Loading courses...
              </div>
            ) : (
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a course...</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title} ({course._count?.modules || 0} modules)
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedCourseDetails && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-1">
                {selectedCourseDetails.title}
              </h3>
              <p className="text-sm text-blue-700 mb-2">
                {selectedCourseDetails.description}
              </p>
              <div className="flex gap-4 text-xs text-blue-600">
                <span>{selectedCourseDetails._count?.modules || 0} modules</span>
                <span className={`px-2 py-1 rounded ${
                  selectedCourseDetails.isPublished 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {selectedCourseDetails.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enhancement Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setEnhancementMode('add_modules')}
                className={`p-3 border-2 rounded-lg transition-all text-left ${
                  enhancementMode === 'add_modules'
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <PlusCircleIcon className={`h-5 w-5 mb-1 ${enhancementMode === 'add_modules' ? 'text-blue-600' : 'text-gray-500'}`} />
                <div className={`font-medium text-sm ${enhancementMode === 'add_modules' ? 'text-blue-900' : 'text-gray-700'}`}>
                  Add New Modules
                </div>
                <p className="text-xs text-gray-600">
                  Add new modules from documents
                </p>
              </button>

              <button
                type="button"
                onClick={() => setEnhancementMode('enhance_existing')}
                className={`p-3 border-2 rounded-lg transition-all text-left ${
                  enhancementMode === 'enhance_existing'
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <DocumentPlusIcon className={`h-5 w-5 mb-1 ${enhancementMode === 'enhance_existing' ? 'text-blue-600' : 'text-gray-500'}`} />
                <div className={`font-medium text-sm ${enhancementMode === 'enhance_existing' ? 'text-blue-900' : 'text-gray-700'}`}>
                  Enhance Content
                </div>
                <p className="text-xs text-gray-600">
                  Improve existing lessons
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedCourse && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {enhancementMode === 'add_modules' ? 'Upload New Module Content' : 'Upload Enhancement Materials'}
          </h3>
          
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 mb-4 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-blue-300'
            }`}
          >
            <input {...getInputProps()} />
            <DocumentTextIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            {isDragActive ? (
              <p className="text-sm text-blue-600">Drop the files here...</p>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-2">
                  Drag & drop documents here, or click to select files
                </p>
                <p className="text-xs text-gray-500">
                  DOCX, TXT only • Max 50MB each
                </p>
              </>
            )}
          </div>

          {documents.length > 0 && (
            <div className="space-y-3 mb-4">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-xs font-medium uppercase text-blue-700">
                        {doc.type}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {doc.name}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeDocument(doc.id)}
                        className="flex-shrink-0 text-gray-400 hover:text-red-500"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <p className="text-xs text-gray-500 mb-2">
                      {formatFileSize(doc.size)}
                    </p>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Module Title
                      </label>
                      <input
                        type="text"
                        value={doc.moduleTitle || ''}
                        onChange={(e) => updateModuleTitle(doc.id, e.target.value)}
                        placeholder={doc.name.replace(/\.[^/.]+$/, '')}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="p-3 bg-amber-50 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>
                {enhancementMode === 'add_modules' ? 'Add Modules:' : 'Enhance Content:'}
              </strong>{' '}
              {enhancementMode === 'add_modules' 
                ? 'Each document will become a new module in the course'
                : 'Documents will be used to improve and expand existing course content'
              }
            </p>
          </div>
        </div>
      )}

      {selectedCourse && documents.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                <h3 className="text-sm font-medium text-green-800">
                  Course Enhanced Successfully!
                </h3>
              </div>
              <p className="text-sm text-green-700 mt-1">
                {success.message}
              </p>
            </div>
          )}

          <button
            onClick={handleEnhanceCourse}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                {enhancementMode === 'add_modules' ? 'Adding Modules...' : 'Enhancing Course...'}
              </>
            ) : (
              <>
                <PlusCircleIcon className="h-4 w-4" />
                {enhancementMode === 'add_modules' ? 'Add New Modules' : 'Enhance Course Content'}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
