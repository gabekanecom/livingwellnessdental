'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ArticleEditor from '@/components/wiki/ArticleEditor';
import { generateSlug } from '@/lib/wiki/utils';
import { 
  CloudArrowUpIcon, 
  CheckCircleIcon,
  ExclamationCircleIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';

export default function NewArticlePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [articleId, setArticleId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    if (articleId && title && content && categoryId) {
      autoSaveTimer.current = setTimeout(() => {
        handleAutoSave();
      }, 30000);
    }

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [title, content, categoryId, tags, articleId]);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/wiki/categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoSave = async () => {
    if (!articleId || !title || !content || !categoryId) return;

    setSaveStatus('saving');
    try {
      const response = await fetch(`/api/wiki/articles/${articleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          categoryId,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });

      if (response.ok) {
        setSaveStatus('saved');
        setLastSaved(new Date());
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Auto-save error:', error);
      setSaveStatus('error');
    }
  };

  const handleSave = async (status: 'DRAFT' | 'PUBLISHED' | 'IN_REVIEW') => {
    if (!title || !content || !categoryId) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    setSaveStatus('saving');

    try {
      const authorId = 'temp-user-id';
      
      if (articleId) {
        const response = await fetch(`/api/wiki/articles/${articleId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            content,
            categoryId,
            tags: tags.split(',').map(t => t.trim()).filter(Boolean),
            status,
          }),
        });

        if (!response.ok) throw new Error('Failed to update article');
        
        const article = await response.json();
        setSaveStatus('saved');
        setLastSaved(new Date());
        
        if (status === 'PUBLISHED') {
          router.push(`/wiki/article/${article.slug}`);
        } else if (status === 'IN_REVIEW') {
          router.push('/wiki/my-articles');
        }
      } else {
        const response = await fetch('/api/wiki/articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            content,
            categoryId,
            authorId,
            tags: tags.split(',').map(t => t.trim()).filter(Boolean),
            status,
          }),
        });

        if (!response.ok) throw new Error('Failed to create article');

        const article = await response.json();
        setArticleId(article.id);
        setSaveStatus('saved');
        setLastSaved(new Date());

        if (status === 'PUBLISHED') {
          router.push(`/wiki/article/${article.slug}`);
        } else if (status === 'IN_REVIEW') {
          router.push('/wiki/my-articles');
        }
      }
    } catch (error) {
      console.error('Error saving article:', error);
      setSaveStatus('error');
      alert('Failed to save article');
    } finally {
      setIsSaving(false);
    }
  };

  const SaveStatusIndicator = () => {
    if (saveStatus === 'saving') {
      return (
        <span className="flex items-center gap-1.5 text-sm text-gray-500">
          <CloudArrowUpIcon className="h-4 w-4 animate-pulse" />
          Saving...
        </span>
      );
    }
    if (saveStatus === 'saved') {
      return (
        <span className="flex items-center gap-1.5 text-sm text-green-600">
          <CheckCircleIcon className="h-4 w-4" />
          Saved {lastSaved && `at ${lastSaved.toLocaleTimeString()}`}
        </span>
      );
    }
    if (saveStatus === 'error') {
      return (
        <span className="flex items-center gap-1.5 text-sm text-red-600">
          <ExclamationCircleIcon className="h-4 w-4" />
          Save failed
        </span>
      );
    }
    return null;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          {articleId ? 'Edit Article' : 'Create New Article'}
        </h2>
        <SaveStatusIndicator />
      </div>

      <div className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Article Title *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            placeholder="Enter article title"
          />
          {title && (
            <p className="mt-1 text-sm text-gray-500">
              URL slug: {generateSlug(title)}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
              Tags (comma-separated)
            </label>
            <input
              id="tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              placeholder="e.g. training, onboarding, hr"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content *
          </label>
          <ArticleEditor
            content={content}
            onChange={setContent}
            placeholder="Start writing your article..."
          />
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            onClick={() => router.back()}
            disabled={isSaving}
            className="px-6 py-2 text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSave('DRAFT')}
              disabled={isSaving}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              onClick={() => handleSave('IN_REVIEW')}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2 border border-violet-300 text-violet-700 rounded-lg hover:bg-violet-50 disabled:opacity-50"
            >
              <PaperAirplaneIcon className="h-4 w-4" />
              Submit for Review
            </button>
            <button
              onClick={() => handleSave('PUBLISHED')}
              disabled={isSaving}
              className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
            >
              {isSaving ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
