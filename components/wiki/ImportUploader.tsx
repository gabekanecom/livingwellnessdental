'use client';

import { useState, useRef } from 'react';
import { WikiCategory } from '@/lib/wiki/types';
import { DocumentArrowUpIcon } from '@heroicons/react/24/outline';

interface ImportUploaderProps {
  categories: WikiCategory[];
}

export default function ImportUploader({ categories }: ImportUploaderProps) {
  const [categoryId, setCategoryId] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!files.length || !categoryId) return;

    setIsUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('categoryId', categoryId);
    files.forEach(file => formData.append('files', file));

    try {
      const res = await fetch('/api/wiki/import', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setResult(data);
      setFiles([]);
      if (inputRef.current) inputRef.current.value = '';
    } catch (error) {
      setResult({ imported: 0, skipped: 0, errors: ['Upload failed'] });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200">
      <div className="flex items-center space-x-2 mb-4">
        <DocumentArrowUpIcon className="h-6 w-6 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Import Markdown Files</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Target Category
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select category...</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Markdown Files
          </label>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".md,.markdown"
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
            className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {files.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">{files.length} file(s) selected</p>
          )}
        </div>

        <button
          onClick={handleUpload}
          disabled={!files.length || !categoryId || isUploading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isUploading ? 'Importing...' : 'Import Files'}
        </button>

        {result && (
          <div className={`p-4 rounded-lg ${result.errors.length ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
            <p className="font-medium text-gray-900">
              ✅ Imported: {result.imported} | ⏭️ Skipped: {result.skipped}
            </p>
            {result.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-red-700 mb-1">Errors:</p>
                <ul className="text-sm text-red-600 space-y-1">
                  {result.errors.map((err, i) => <li key={i}>• {err}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
          <p className="font-medium mb-2">Markdown Format:</p>
          <pre className="text-xs bg-white p-2 rounded border border-gray-200">
{`---
title: Article Title
tags: [tag1, tag2]
status: PUBLISHED
---

# Your Content Here`}
          </pre>
        </div>
      </div>
    </div>
  );
}
