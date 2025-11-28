'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ArticleEditor from '@/components/wiki/ArticleEditor';
import CategorySelect from '@/components/wiki/CategorySelect';
import { generateSlug } from '@/lib/wiki/utils';
import {
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';

interface WikiPermissions {
  canCreateArticle: boolean;
  canSubmitForReview: boolean;
  canViewReviewQueue: boolean;
  canReviewArticles: boolean;
  canPublishDirectly: boolean;
  canAssignReviewers: boolean;
}

export default function NewArticlePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [articleId, setArticleId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const [permissions, setPermissions] = useState<WikiPermissions | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const res = await fetch('/api/wiki/permissions');
      if (res.ok) {
        const data = await res.json();
        setPermissions(data.permissions);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  useEffect(() => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    if (articleId && title && content && selectedCategoryIds.length > 0) {
      autoSaveTimer.current = setTimeout(() => {
        handleAutoSave();
      }, 30000);
    }

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [title, content, selectedCategoryIds, tags, articleId]);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/wiki/categories');
      const data = await response.json();
      // Ensure we always set an array, even if API returns an error object
      if (Array.isArray(data)) {
        setCategories(data);
      } else {
        console.error('Categories API returned non-array:', data);
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoSave = async () => {
    if (!articleId || !title || !content || selectedCategoryIds.length === 0) return;

    setSaveStatus('saving');
    try {
      const response = await fetch(`/api/wiki/articles/${articleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          categoryIds: selectedCategoryIds,
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

  const handleSave = async (action: 'DRAFT' | 'PUBLISHED' | 'SUBMIT_FOR_REVIEW') => {
    if (!title || !content || selectedCategoryIds.length === 0) {
      alert('Please fill in all required fields (including at least one category)');
      return;
    }

    setIsSaving(true);
    setSaveStatus('saving');

    try {
      let savedArticleId = articleId;
      let slug = '';

      // First save the article as DRAFT if it doesn't exist
      if (!savedArticleId) {
        const response = await fetch('/api/wiki/articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            content,
            categoryIds: selectedCategoryIds,
            tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
            status: 'DRAFT',
          }),
        });

        if (!response.ok) throw new Error('Failed to create article');

        const article = await response.json();
        savedArticleId = article.id;
        slug = article.slug;
        setArticleId(article.id);
      } else {
        // Update existing article
        const response = await fetch(`/api/wiki/articles/${savedArticleId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            content,
            categoryIds: selectedCategoryIds,
            tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
            status: action === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
          }),
        });

        if (!response.ok) throw new Error('Failed to update article');
        const article = await response.json();
        slug = article.slug;
      }

      // Handle submit for review
      if (action === 'SUBMIT_FOR_REVIEW' && savedArticleId) {
        const reviewRes = await fetch(
          `/api/wiki/articles/${savedArticleId}/submit-for-review`,
          { method: 'POST' }
        );

        if (!reviewRes.ok) {
          const error = await reviewRes.json();
          throw new Error(error.error || 'Failed to submit for review');
        }

        setSaveStatus('saved');
        setLastSaved(new Date());
        router.push('/wiki/my-articles');
        return;
      }

      // Handle publish directly
      if (action === 'PUBLISHED') {
        setSaveStatus('saved');
        setLastSaved(new Date());
        router.push(`/wiki/article/${slug}`);
        return;
      }

      // Just saving as draft
      setSaveStatus('saved');
      setLastSaved(new Date());
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving article:', error);
      setSaveStatus('error');
      alert(error instanceof Error ? error.message : 'Failed to save article');
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categories *
            </label>
            <CategorySelect
              categories={categories}
              selectedIds={selectedCategoryIds}
              onChange={setSelectedCategoryIds}
              placeholder="Search and select categories..."
              required
            />
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
            {permissions?.canSubmitForReview && !permissions?.canPublishDirectly && (
              <button
                onClick={() => handleSave('SUBMIT_FOR_REVIEW')}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
                {isSaving ? 'Submitting...' : 'Submit for Review'}
              </button>
            )}
            {permissions?.canPublishDirectly && (
              <>
                <button
                  onClick={() => handleSave('SUBMIT_FOR_REVIEW')}
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
