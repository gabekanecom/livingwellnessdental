'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ArticleEditor from '@/components/wiki/ArticleEditor';
import CategorySelect from '@/components/wiki/CategorySelect';
import { generateSlug } from '@/lib/wiki/utils';
import {
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PaperAirplaneIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  categories: { category: { id: string; name: string; slug: string }; isPrimary: boolean }[];
  status: string;
  tags: { id: string; name: string }[];
}

interface WikiPermissions {
  canCreateArticle: boolean;
  canSubmitForReview: boolean;
  canViewReviewQueue: boolean;
  canReviewArticles: boolean;
  canPublishDirectly: boolean;
  canAssignReviewers: boolean;
}

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const [permissions, setPermissions] = useState<WikiPermissions | null>(null);

  useEffect(() => {
    fetchArticle();
    fetchCategories();
    fetchPermissions();
  }, [slug]);

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

    if (article && title && content && selectedCategoryIds.length > 0) {
      autoSaveTimer.current = setTimeout(() => {
        handleAutoSave();
      }, 30000);
    }

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [title, content, selectedCategoryIds, tags]);

  const fetchArticle = async () => {
    try {
      const response = await fetch(`/api/wiki/articles/${slug}`);
      if (response.ok) {
        const data = await response.json();
        setArticle(data);
        setTitle(data.title);
        setContent(data.content);
        // Sort by isPrimary to ensure primary category is first, then extract IDs
        const sortedCats = [...(data.categories || [])].sort((a, b) =>
          (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0)
        );
        setSelectedCategoryIds(sortedCats.map((c: any) => c.category.id));
        setTags(data.tags.map((t: any) => t.name).join(', '));
      }
    } catch (error) {
      console.error('Error fetching article:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/wiki/categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleAutoSave = async () => {
    if (!article) return;

    setSaveStatus('saving');
    try {
      const response = await fetch(`/api/wiki/articles/${article.id}`, {
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

  const handleSave = async (action: 'SAVE' | 'PUBLISHED' | 'SUBMIT_FOR_REVIEW' = 'SAVE') => {
    if (!article || !title || !content || selectedCategoryIds.length === 0) {
      alert('Please fill in all required fields (including at least one category)');
      return;
    }

    setIsSaving(true);
    setSaveStatus('saving');

    try {
      // First save the article changes
      const response = await fetch(`/api/wiki/articles/${article.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          categoryIds: selectedCategoryIds,
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
          ...(action === 'PUBLISHED' && { status: 'PUBLISHED' }),
        }),
      });

      if (!response.ok) throw new Error('Failed to update article');

      const updated = await response.json();

      // Handle submit for review
      if (action === 'SUBMIT_FOR_REVIEW') {
        const reviewRes = await fetch(
          `/api/wiki/articles/${article.id}/submit-for-review`,
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
        router.push(`/wiki/article/${updated.slug}`);
        return;
      }

      // Just saving changes
      setSaveStatus('saved');
      setLastSaved(new Date());
      setArticle(updated);
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

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64" />
          <div className="h-12 bg-gray-200 rounded" />
          <div className="h-96 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          Article not found
        </div>
      </div>
    );
  }

  const statusBadge = {
    DRAFT: 'bg-gray-100 text-gray-700',
    IN_REVIEW: 'bg-yellow-100 text-yellow-700',
    PUBLISHED: 'bg-green-100 text-green-700',
    ARCHIVED: 'bg-red-100 text-red-700',
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Edit Article</h2>
            <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${statusBadge[article.status as keyof typeof statusBadge]}`}>
              {article.status}
            </span>
          </div>
        </div>
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
          {title && title !== article.title && (
            <p className="mt-1 text-sm text-gray-500">
              New URL slug: {generateSlug(title)}
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
              onClick={() => handleSave()}
              disabled={isSaving}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Draft'}
            </button>
            {article.status === 'DRAFT' && permissions?.canSubmitForReview && !permissions?.canPublishDirectly && (
              <button
                onClick={() => handleSave('SUBMIT_FOR_REVIEW')}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
                Submit for Review
              </button>
            )}
            {permissions?.canPublishDirectly && (
              <>
                {article.status === 'DRAFT' && (
                  <button
                    onClick={() => handleSave('SUBMIT_FOR_REVIEW')}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2 border border-violet-300 text-violet-700 rounded-lg hover:bg-violet-50 disabled:opacity-50"
                  >
                    <PaperAirplaneIcon className="h-4 w-4" />
                    Submit for Review
                  </button>
                )}
                {(article.status === 'DRAFT' || article.status === 'IN_REVIEW') && (
                  <button
                    onClick={() => handleSave('PUBLISHED')}
                    disabled={isSaving}
                    className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
                  >
                    Publish
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
