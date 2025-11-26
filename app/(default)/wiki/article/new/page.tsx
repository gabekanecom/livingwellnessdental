'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ArticleEditor from '@/components/wiki/ArticleEditor';
import { generateSlug } from '@/lib/wiki/utils';

export default function NewArticlePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

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

  const handleSave = async (status: 'DRAFT' | 'PUBLISHED') => {
    if (!title || !content || !categoryId) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/wiki/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          categoryId,
          authorId: 'temp-user-id',
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          status,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create article');
      }

      const article = await response.json();
      router.push(`/wiki/article/${article.slug}`);
    } catch (error) {
      console.error('Error saving article:', error);
      alert('Failed to save article');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Create New Article</h2>

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

        <div className="flex items-center space-x-4 pt-6 border-t border-gray-200">
          <button
            onClick={() => handleSave('DRAFT')}
            disabled={isSaving}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save as Draft'}
          </button>
          <button
            onClick={() => handleSave('PUBLISHED')}
            disabled={isSaving}
            className="px-6 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 disabled:opacity-50"
          >
            {isSaving ? 'Publishing...' : 'Publish'}
          </button>
          <button
            onClick={() => router.back()}
            disabled={isSaving}
            className="px-6 py-2 text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
