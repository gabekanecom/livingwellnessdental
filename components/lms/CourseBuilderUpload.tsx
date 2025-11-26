'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { ArrowUpTrayIcon, DocumentTextIcon, ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface UploadedDocument {
  id: string;
  name: string;
  content: string;
  type: 'docx' | 'txt';
  size: number;
  moduleTitle?: string;
}

interface CourseBuilderUploadProps {
  onSuccess?: (courseId: string) => void;
  categoryId?: string;
}

export default function CourseBuilderUpload({ onSuccess, categoryId }: CourseBuilderUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<any>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [difficultyLevel, setDifficultyLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [targetAudience, setTargetAudience] = useState('');
  const [autoPublish, setAutoPublish] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');
  
  const MAX_DOCUMENTS = 10;

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      if (uploadedDocuments.length >= MAX_DOCUMENTS) {
        setError(`Maximum ${MAX_DOCUMENTS} documents allowed per course.`);
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
          moduleTitle: uploadedDocuments.length > 0 ? file.name.replace(/\.[^/.]+$/, '') : undefined
        };
        setUploadedDocuments(prev => [...prev, newDocument]);
        setError(null);
      } catch (err) {
        setError(`Failed to read file: ${file.name}`);
      }
    }
  }, [uploadedDocuments.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 50 * 1024 * 1024
  });

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

  const removeDocument = (documentId: string) => {
    setUploadedDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  const updateModuleTitle = (documentId: string, title: string) => {
    setUploadedDocuments(prev => 
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (uploadedDocuments.length === 0) {
        throw new Error('At least one document is required to create a course.');
      }

      const isMultiDocument = uploadedDocuments.length > 1;
      
      const payload = isMultiDocument 
        ? {
            documents: uploadedDocuments.map(doc => ({
              content: doc.content,
              type: doc.type,
              fileName: doc.name,
              moduleTitle: doc.moduleTitle
            })),
            config: {
              categoryId,
              difficultyLevel,
              targetAudience: targetAudience || undefined,
              autoPublish,
              courseTitle: courseTitle || `Course from ${uploadedDocuments.length} Documents`
            }
          }
        : {
            documentContent: uploadedDocuments[0].content,
            documentType: uploadedDocuments[0].type,
            courseConfig: {
              categoryId,
              difficultyLevel,
              targetAudience: targetAudience || undefined,
              autoPublish
            }
          };

      const endpoint = isMultiDocument 
        ? '/api/lms/multi-document-builder' 
        : '/api/lms/course-builder';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create course');
      }

      setSuccess(data.data);
      if (onSuccess && data.data.courseId) {
        onSuccess(data.data.courseId);
      }

      setUploadedDocuments([]);
      setTargetAudience('');
      setCourseTitle('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <DocumentTextIcon className="h-6 w-6 text-indigo-600" />
        <h2 className="text-xl font-semibold text-gray-900">
          Create Course from Document
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Document{uploadedDocuments.length !== 1 ? 's' : ''}
          </label>
          
          {uploadedDocuments.length < MAX_DOCUMENTS && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 mb-4 text-center cursor-pointer transition-colors ${
                isDragActive 
                  ? 'border-indigo-500 bg-indigo-50' 
                  : 'border-gray-300 hover:border-indigo-300'
              }`}
            >
              <input {...getInputProps()} />
              <DocumentTextIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              {isDragActive ? (
                <p className="text-sm text-indigo-600">Drop the files here...</p>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-2">
                    Drag & drop documents here, or click to select files
                  </p>
                  <p className="text-xs text-gray-500">
                    {uploadedDocuments.length}/{MAX_DOCUMENTS} documents • DOCX, TXT only • Max 50MB each
                  </p>
                </>
              )}
            </div>
          )}

          {uploadedDocuments.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">
                Uploaded Documents ({uploadedDocuments.length})
              </h4>
              
              {uploadedDocuments.map((doc, index) => (
                <div key={doc.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <span className="text-xs font-medium uppercase text-indigo-700">
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
                      {uploadedDocuments.length > 1 && ` • Module ${index + 1}`}
                    </p>
                    
                    {uploadedDocuments.length > 1 && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Module Title (Optional)
                        </label>
                        <input
                          type="text"
                          value={doc.moduleTitle || ''}
                          onChange={(e) => updateModuleTitle(doc.id, e.target.value)}
                          placeholder={`Module: ${doc.name.replace(/\.[^/.]+$/, '')}`}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {uploadedDocuments.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Title
            </label>
            <input
              type="text"
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              placeholder={`Course from ${uploadedDocuments.length} Documents`}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty Level
            </label>
            <select
              value={difficultyLevel}
              onChange={(e) => setDifficultyLevel(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Audience (Optional)
            </label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g., Health professionals"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="autoPublish"
            checked={autoPublish}
            onChange={(e) => setAutoPublish(e.target.checked)}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="autoPublish" className="text-sm text-gray-700">
            Automatically publish course after creation
          </label>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <h3 className="text-sm font-medium text-green-800 mb-1">
              Course Created Successfully!
            </h3>
            <p className="text-sm text-green-700">
              {success.courseTitle}
            </p>
            <div className="text-xs text-green-600 mt-1">
              {success.moduleCount} modules • {success.lessonCount} lessons
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || uploadedDocuments.length === 0 || (uploadedDocuments.length > 1 && !courseTitle)}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              Creating Course...
            </>
          ) : (
            <>
              <ArrowUpTrayIcon className="h-4 w-4" />
              Create Course from Document
            </>
          )}
        </button>
      </form>

      <div className="mt-6 border-t pt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          How it works:
        </h3>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• <strong>Single document:</strong> Creates one course with lessons</li>
          <li>• <strong>Multiple documents:</strong> Each document becomes a separate module</li>
          <li>• AI analyzes content and structures into modules and lessons</li>
          <li>• Automatically generates learning objectives and estimates duration</li>
        </ul>
      </div>
    </div>
  );
}
