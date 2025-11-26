'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { DocumentTextIcon, XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface UploadedDocument {
  id: string;
  name: string;
  content: string;
  type: 'docx' | 'txt' | 'pdf';
  size: number;
  moduleTitle?: string;
  lessonId?: string;
}

interface QuizConfig {
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  maxQuestionsPerQuiz: number;
  timeLimitMinutes: number;
  autoAttachToLessons: boolean;
}

interface QuizBuilderUploadProps {
  onQuizzesGenerated?: (results: any) => void;
  lessonId?: string;
  courseId?: string;
}

export default function QuizBuilderUpload({
  onQuizzesGenerated,
  lessonId,
  courseId
}: QuizBuilderUploadProps) {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<QuizConfig>({
    difficultyLevel: 'intermediate',
    maxQuestionsPerQuiz: 10,
    timeLimitMinutes: 15,
    autoAttachToLessons: !!lessonId
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

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    const newDocuments: UploadedDocument[] = [...documents];
    
    for (const file of acceptedFiles) {
      if (newDocuments.length >= 10) break;

      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !['docx', 'txt', 'pdf'].includes(extension)) continue;

      try {
        const content = await readFileContent(file);
        newDocuments.push({
          id: crypto.randomUUID(),
          name: file.name,
          content,
          type: extension as 'docx' | 'txt' | 'pdf',
          size: file.size,
          moduleTitle: file.name.replace(/\.[^/.]+$/, ''),
          lessonId
        });
      } catch (err) {
        console.error(`Failed to read file: ${file.name}`, err);
      }
    }

    setDocuments(newDocuments);
  }, [documents, lessonId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/pdf': ['.pdf']
    },
    maxSize: 50 * 1024 * 1024
  });

  const removeDocument = (documentId: string) => {
    setDocuments(documents.filter(doc => doc.id !== documentId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleGenerateQuizzes = async () => {
    if (documents.length === 0) {
      setError('Please upload at least one document');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/lms/quiz-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documents: documents.map(doc => ({
            content: doc.content,
            type: doc.type,
            fileName: doc.name,
            moduleTitle: doc.moduleTitle,
            lessonId: doc.lessonId
          })),
          config: {
            ...config,
            courseId
          },
          mode: documents.length === 1 ? 'single' : 'multi'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate quizzes');
      }

      onQuizzesGenerated?.(result.data);
      setDocuments([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive 
            ? 'border-indigo-500 bg-indigo-50' 
            : 'border-gray-300 hover:border-indigo-300'
        }`}
      >
        <input {...getInputProps()} />
        <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        {isDragActive ? (
          <p className="text-sm text-indigo-600">Drop the files here...</p>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-2">
              Drag & drop documents to generate quizzes, or click to select
            </p>
            <p className="text-xs text-gray-500">
              DOCX, TXT, PDF • Max 10 documents • 50MB each
            </p>
          </>
        )}
      </div>

      {documents.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">
            Documents ({documents.length})
          </h4>
          
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <span className="text-xs font-medium uppercase text-indigo-700">
                  {doc.type}
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {doc.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(doc.size)}
                </p>
              </div>
              
              <button
                type="button"
                onClick={() => removeDocument(doc.id)}
                className="flex-shrink-0 text-gray-400 hover:text-red-500"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        <h4 className="text-sm font-medium text-gray-900">Quiz Settings</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Difficulty Level
            </label>
            <select
              value={config.difficultyLevel}
              onChange={(e) => setConfig({ ...config, difficultyLevel: e.target.value as any })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Questions per Quiz
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={config.maxQuestionsPerQuiz}
              onChange={(e) => setConfig({ ...config, maxQuestionsPerQuiz: parseInt(e.target.value) || 10 })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Time Limit (minutes)
            </label>
            <input
              type="number"
              min={1}
              max={180}
              value={config.timeLimitMinutes}
              onChange={(e) => setConfig({ ...config, timeLimitMinutes: parseInt(e.target.value) || 15 })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoAttachToLessons}
                onChange={(e) => setConfig({ ...config, autoAttachToLessons: e.target.checked })}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Auto-attach to lessons</span>
            </label>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        type="button"
        onClick={handleGenerateQuizzes}
        disabled={documents.length === 0 || isGenerating}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        <SparklesIcon className="h-5 w-5" />
        {isGenerating ? 'Generating Quizzes...' : 'Generate Quizzes with AI'}
      </button>
    </div>
  );
}
