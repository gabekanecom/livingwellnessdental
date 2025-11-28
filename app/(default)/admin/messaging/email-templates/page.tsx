'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  EnvelopeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';

interface EmailTemplate {
  id: string;
  slug: string;
  name: string;
  subject: string;
  description: string | null;
  category: string;
  htmlContent: string;
  textContent: string | null;
  variables: string[];
  isActive: boolean;
  isSystem: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export default function EmailTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    slug: '',
    subject: '',
    description: '',
    category: 'transactional',
    htmlContent: '<p>Hello {{name}},</p>\n<p>Your message here.</p>',
    textContent: 'Hello {{name}},\n\nYour message here.',
    variables: ['name'],
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/admin/messaging/email-templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load email templates');
    } finally {
      setIsLoading(false);
    }
  };

  const createTemplate = async () => {
    if (!newTemplate.name || !newTemplate.slug || !newTemplate.subject) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch('/api/admin/messaging/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate),
      });

      if (res.ok) {
        const created = await res.json();
        toast.success('Template created successfully');
        setShowCreateModal(false);
        setNewTemplate({
          name: '',
          slug: '',
          subject: '',
          description: '',
          category: 'transactional',
          htmlContent: '<p>Hello {{name}},</p>\n<p>Your message here.</p>',
          textContent: 'Hello {{name}},\n\nYour message here.',
          variables: ['name'],
        });
        router.push(`/admin/messaging/email-templates/${created.id}`);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to create template');
      }
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    } finally {
      setIsCreating(false);
    }
  };

  const deleteTemplate = async (template: EmailTemplate) => {
    if (template.isSystem) {
      toast.error('Cannot delete system templates');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/messaging/email-templates/${template.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Template deleted');
        fetchTemplates();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const duplicateTemplate = async (template: EmailTemplate) => {
    setNewTemplate({
      name: `${template.name} (Copy)`,
      slug: `${template.slug}-copy`,
      subject: template.subject,
      description: template.description || '',
      category: template.category,
      htmlContent: template.htmlContent,
      textContent: template.textContent || '',
      variables: template.variables,
    });
    setShowCreateModal(true);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/admin/messaging" className="hover:text-violet-600 flex items-center gap-1">
            <ArrowLeftIcon className="h-4 w-4" />
            Messaging
          </Link>
          <span>/</span>
          <span>Email Templates</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Email Templates</h1>
            <p className="text-gray-500 mt-1">
              Manage email templates for notifications and communications
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn bg-violet-500 hover:bg-violet-600 text-white flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            New Template
          </button>
        </div>
      </div>

      {/* Templates List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Template
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Subject
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {templates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                    <EnvelopeIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No email templates found</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="mt-4 text-violet-600 hover:underline"
                    >
                      Create your first template
                    </button>
                  </td>
                </tr>
              ) : (
                templates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                          <EnvelopeIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{template.name}</p>
                          <p className="text-xs text-gray-500 font-mono truncate">{template.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <p className="text-sm text-gray-900 truncate max-w-[200px]">{template.subject}</p>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        template.category === 'transactional'
                          ? 'bg-blue-100 text-blue-800'
                          : template.category === 'marketing'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {template.category}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {template.isActive ? (
                          <>
                            <CheckCircleIcon className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-green-600">Active</span>
                          </>
                        ) : (
                          <>
                            <XCircleIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-500">Inactive</span>
                          </>
                        )}
                        {template.isSystem && (
                          <span className="text-xs text-gray-400">(System)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/messaging/email-templates/${template.id}`}
                          className="p-1.5 text-gray-400 hover:text-violet-600 rounded hover:bg-gray-100"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => duplicateTemplate(template)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-gray-100"
                          title="Duplicate"
                        >
                          <DocumentDuplicateIcon className="h-4 w-4" />
                        </button>
                        {!template.isSystem && (
                          <button
                            onClick={() => deleteTemplate(template)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-gray-100"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowCreateModal(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Create Email Template
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    className="form-input w-full"
                    placeholder="Welcome Email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug *
                  </label>
                  <input
                    type="text"
                    value={newTemplate.slug}
                    onChange={(e) => setNewTemplate({ ...newTemplate, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                    className="form-input w-full font-mono"
                    placeholder="welcome-email"
                  />
                  <p className="mt-1 text-xs text-gray-500">Used to reference this template in code</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={newTemplate.subject}
                    onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                    className="form-input w-full"
                    placeholder="Welcome to {{company}}!"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newTemplate.category}
                    onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                    className="form-select w-full"
                  >
                    <option value="transactional">Transactional</option>
                    <option value="marketing">Marketing</option>
                    <option value="notification">Notification</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                    rows={2}
                    className="form-textarea w-full"
                    placeholder="Brief description of when this template is used"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn border-gray-200 hover:border-gray-300 text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={createTemplate}
                  disabled={isCreating}
                  className="btn bg-violet-500 hover:bg-violet-600 text-white disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Template'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
