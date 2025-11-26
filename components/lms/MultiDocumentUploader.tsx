'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface UploadedDocument {
  id: string;
  name: string;
  content: string;
  type: 'docx' | 'txt';
  size: number;
  moduleTitle?: string;
}

interface MultiDocumentUploaderProps {
  onDocumentsChange: (documents: UploadedDocument[]) => void;
  existingDocuments?: UploadedDocument[];
  maxDocuments?: number;
}

export default function MultiDocumentUploader({
  onDocumentsChange,
  existingDocuments = [],
  maxDocuments = 10
}: MultiDocumentUploaderProps) {
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
    const newDocuments: UploadedDocument[] = [...existingDocuments];
    
    for (const file of acceptedFiles) {
      if (newDocuments.length >= maxDocuments) break;

      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !['docx', 'txt'].includes(extension)) continue;

      try {
        const content = await readFileContent(file);
        newDocuments.push({
          id: crypto.randomUUID(),
          name: file.name,
          content,
          type: extension as 'docx' | 'txt',
          size: file.size,
          moduleTitle: file.name.replace(/\.[^/.]+$/, '')
        });
      } catch (err) {
        console.error(`Failed to read file: ${file.name}`, err);
      }
    }

    onDocumentsChange(newDocuments);
  }, [existingDocuments, maxDocuments, onDocumentsChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 50 * 1024 * 1024
  });

  const removeDocument = (documentId: string) => {
    onDocumentsChange(existingDocuments.filter(doc => doc.id !== documentId));
  };

  const updateModuleTitle = (documentId: string, title: string) => {
    onDocumentsChange(
      existingDocuments.map(doc => 
        doc.id === documentId ? { ...doc, moduleTitle: title } : doc
      )
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div>
      {existingDocuments.length < maxDocuments && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
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
                {existingDocuments.length}/{maxDocuments} documents • DOCX, TXT only • Max 50MB each
              </p>
            </>
          )}
        </div>
      )}

      {existingDocuments.length > 0 && (
        <div className="mt-4 space-y-3">
          <h4 className="text-sm font-medium text-gray-900">
            Uploaded Documents ({existingDocuments.length})
          </h4>
          
          {existingDocuments.map((doc, index) => (
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
                  {formatFileSize(doc.size)} • Document {index + 1}
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
    </div>
  );
}
