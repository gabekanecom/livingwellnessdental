'use client';

import { useState, useEffect, use, useRef } from 'react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  EyeIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  CodeBracketIcon,
  DocumentTextIcon,
  PlusIcon,
  MagnifyingGlassIcon,
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

type ViewMode = 'edit' | 'preview' | 'html';

// Available merge tags with descriptions
const AVAILABLE_VARIABLES = [
  { code: 'name', label: 'Recipient Name', description: 'Full name of the recipient', example: 'John Doe' },
  { code: 'firstName', label: 'First Name', description: 'First name only', example: 'John' },
  { code: 'lastName', label: 'Last Name', description: 'Last name only', example: 'Doe' },
  { code: 'email', label: 'Email Address', description: 'Recipient email address', example: 'john@example.com' },
  { code: 'company', label: 'Company Name', description: 'Your company name', example: 'Living Wellness Dental' },
  { code: 'title', label: 'Title', description: 'Dynamic title (e.g., course name)', example: 'Introduction to Dental Health' },
  { code: 'message', label: 'Message', description: 'Dynamic message content', example: 'Your custom message here' },
  { code: 'link', label: 'Link URL', description: 'Action link URL', example: 'https://example.com/action' },
  { code: 'buttonText', label: 'Button Text', description: 'Call-to-action button text', example: 'Click Here' },
  { code: 'code', label: 'Verification Code', description: 'One-time verification code', example: '123456' },
  { code: 'date', label: 'Date', description: 'Relevant date', example: 'January 15, 2025' },
  { code: 'time', label: 'Time', description: 'Relevant time', example: '2:00 PM' },
  { code: 'courseName', label: 'Course Name', description: 'Name of assigned course', example: 'HIPAA Compliance Training' },
  { code: 'dueDate', label: 'Due Date', description: 'Course or task due date', example: 'February 1, 2025' },
  { code: 'unsubscribeLink', label: 'Unsubscribe Link', description: 'Email unsubscribe URL', example: 'https://example.com/unsubscribe' },
];

export default function EditEmailTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [testEmail, setTestEmail] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [showVariablePicker, setShowVariablePicker] = useState(false);
  const [variableSearch, setVariableSearch] = useState('');
  const [activeField, setActiveField] = useState<'subject' | 'htmlContent' | 'textContent'>('htmlContent');

  const subjectRef = useRef<HTMLInputElement>(null);
  const htmlContentRef = useRef<HTMLTextAreaElement>(null);
  const textContentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchTemplate();
  }, [id]);

  const fetchTemplate = async () => {
    try {
      const res = await fetch(`/api/admin/messaging/email-templates/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTemplate(data);
      } else if (res.status === 404) {
        toast.error('Template not found');
        router.push('/admin/messaging/email-templates');
      }
    } catch (error) {
      console.error('Error fetching template:', error);
      toast.error('Failed to load template');
    } finally {
      setIsLoading(false);
    }
  };

  const updateTemplate = (updates: Partial<EmailTemplate>) => {
    if (template) {
      setTemplate({ ...template, ...updates });
      setHasChanges(true);
    }
  };

  const saveTemplate = async () => {
    if (!template) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/messaging/email-templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.name,
          subject: template.subject,
          description: template.description,
          category: template.category,
          htmlContent: template.htmlContent,
          textContent: template.textContent,
          variables: template.variables,
          isActive: template.isActive,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setTemplate(updated);
        toast.success('Template saved successfully');
        setHasChanges(false);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to save template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast.error('Please enter an email address');
      return;
    }

    setIsSendingTest(true);
    try {
      const res = await fetch('/api/messaging/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateSlug: template?.slug,
          to: testEmail,
          variables: {
            name: 'Test User',
            firstName: 'Test',
            lastName: 'User',
            company: 'Living Wellness Dental',
            link: 'https://example.com',
            email: testEmail,
            code: '123456',
            title: 'Sample Title',
            message: 'This is a sample message',
            courseName: 'Sample Course',
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
          },
        }),
      });

      if (res.ok) {
        toast.success('Test email sent!');
        setTestEmail('');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to send test email');
      }
    } catch (error) {
      console.error('Error sending test:', error);
      toast.error('Failed to send test email');
    } finally {
      setIsSendingTest(false);
    }
  };

  const extractVariables = (content: string) => {
    const matches = content.match(/\{\{(\w+)\}\}/g) || [];
    const vars = matches.map(m => m.replace(/\{\{|\}\}/g, ''));
    return Array.from(new Set(vars));
  };

  const handleContentChange = (content: string, field: 'htmlContent' | 'textContent') => {
    const allContent = field === 'htmlContent'
      ? content + (template?.textContent || '') + (template?.subject || '')
      : (template?.htmlContent || '') + content + (template?.subject || '');
    const variables = extractVariables(allContent);
    updateTemplate({ [field]: content, variables });
  };

  const handleSubjectChange = (subject: string) => {
    const allContent = (template?.htmlContent || '') + (template?.textContent || '') + subject;
    const variables = extractVariables(allContent);
    updateTemplate({ subject, variables });
  };

  const insertVariable = (code: string) => {
    const tag = `{{${code}}}`;

    if (activeField === 'subject' && subjectRef.current) {
      const input = subjectRef.current;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const newValue = template!.subject.substring(0, start) + tag + template!.subject.substring(end);
      handleSubjectChange(newValue);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + tag.length, start + tag.length);
      }, 0);
    } else if (activeField === 'htmlContent' && htmlContentRef.current) {
      const textarea = htmlContentRef.current;
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const newValue = template!.htmlContent.substring(0, start) + tag + template!.htmlContent.substring(end);
      handleContentChange(newValue, 'htmlContent');
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + tag.length, start + tag.length);
      }, 0);
    } else if (activeField === 'textContent' && textContentRef.current) {
      const textarea = textContentRef.current;
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const currentValue = template!.textContent || '';
      const newValue = currentValue.substring(0, start) + tag + currentValue.substring(end);
      handleContentChange(newValue, 'textContent');
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + tag.length, start + tag.length);
      }, 0);
    }

    setShowVariablePicker(false);
    setVariableSearch('');
  };

  const filteredVariables = AVAILABLE_VARIABLES.filter(v =>
    v.code.toLowerCase().includes(variableSearch.toLowerCase()) ||
    v.label.toLowerCase().includes(variableSearch.toLowerCase()) ||
    v.description.toLowerCase().includes(variableSearch.toLowerCase())
  );

  const renderPreview = () => {
    if (!template) return '';
    let preview = template.htmlContent;
    AVAILABLE_VARIABLES.forEach(v => {
      const regex = new RegExp(`\\{\\{${v.code}\\}\\}`, 'g');
      preview = preview.replace(regex, v.example);
    });
    preview = preview.replace(/\{\{(\w+)\}\}/g, '[$1]');
    return preview;
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

  if (!template) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Template not found</p>
          <Link href="/admin/messaging/email-templates" className="text-violet-600 hover:underline mt-2 inline-block">
            Back to templates
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/admin/messaging" className="hover:text-violet-600">Messaging</Link>
          <span>/</span>
          <Link href="/admin/messaging/email-templates" className="hover:text-violet-600">Email Templates</Link>
          <span>/</span>
          <span className="text-gray-800">{template.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/messaging/email-templates"
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                {template.name}
                {template.isSystem && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">System</span>
                )}
              </h1>
              <p className="text-sm text-gray-500 font-mono">{template.slug}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={template.isActive}
                onChange={(e) => updateTemplate({ isActive: e.target.checked })}
                className="form-checkbox rounded border-gray-300 text-violet-600 focus:ring-violet-500"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
            {hasChanges && (
              <button
                onClick={saveTemplate}
                disabled={isSaving}
                className="btn bg-violet-500 hover:bg-violet-600 text-white disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Template Details */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Template Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={template.name}
                  onChange={(e) => updateTemplate({ name: e.target.value })}
                  className="form-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={template.category}
                  onChange={(e) => updateTemplate({ category: e.target.value })}
                  className="form-select w-full"
                >
                  <option value="transactional">Transactional</option>
                  <option value="marketing">Marketing</option>
                  <option value="notification">Notification</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <div className="flex gap-2">
                  <input
                    ref={subjectRef}
                    type="text"
                    value={template.subject}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                    onFocus={() => setActiveField('subject')}
                    className="form-input flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => { setActiveField('subject'); setShowVariablePicker(true); }}
                    className="btn border-gray-200 hover:border-gray-300 text-gray-600 px-3"
                    title="Insert Variable"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={template.description || ''}
                  onChange={(e) => updateTemplate({ description: e.target.value || null })}
                  rows={2}
                  className="form-textarea w-full"
                />
              </div>
            </div>
          </div>

          {/* Content Editor */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Editor Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex">
                <button
                  onClick={() => setViewMode('edit')}
                  className={`px-4 py-3 text-sm font-medium ${
                    viewMode === 'edit'
                      ? 'border-b-2 border-violet-500 text-violet-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <DocumentTextIcon className="h-4 w-4" />
                    Edit
                  </div>
                </button>
                <button
                  onClick={() => setViewMode('html')}
                  className={`px-4 py-3 text-sm font-medium ${
                    viewMode === 'html'
                      ? 'border-b-2 border-violet-500 text-violet-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CodeBracketIcon className="h-4 w-4" />
                    HTML Source
                  </div>
                </button>
                <button
                  onClick={() => setViewMode('preview')}
                  className={`px-4 py-3 text-sm font-medium ${
                    viewMode === 'preview'
                      ? 'border-b-2 border-violet-500 text-violet-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <EyeIcon className="h-4 w-4" />
                    Preview
                  </div>
                </button>
              </nav>
            </div>

            <div className="p-6">
              {viewMode === 'edit' && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        HTML Content
                      </label>
                      <button
                        type="button"
                        onClick={() => { setActiveField('htmlContent'); setShowVariablePicker(true); }}
                        className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1"
                      >
                        <PlusIcon className="h-3 w-3" />
                        Insert Variable
                      </button>
                    </div>
                    <textarea
                      ref={htmlContentRef}
                      value={template.htmlContent}
                      onChange={(e) => handleContentChange(e.target.value, 'htmlContent')}
                      onFocus={() => setActiveField('htmlContent')}
                      rows={12}
                      className="form-textarea w-full font-mono text-sm"
                      placeholder="<p>Hello {{name}},</p>"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Plain Text Content (Optional)
                      </label>
                      <button
                        type="button"
                        onClick={() => { setActiveField('textContent'); setShowVariablePicker(true); }}
                        className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1"
                      >
                        <PlusIcon className="h-3 w-3" />
                        Insert Variable
                      </button>
                    </div>
                    <textarea
                      ref={textContentRef}
                      value={template.textContent || ''}
                      onChange={(e) => handleContentChange(e.target.value || '', 'textContent')}
                      onFocus={() => setActiveField('textContent')}
                      rows={6}
                      className="form-textarea w-full font-mono text-sm"
                      placeholder="Hello {{name}},"
                    />
                    <p className="mt-1 text-xs text-gray-500">Used for email clients that don't support HTML</p>
                  </div>
                </div>
              )}

              {viewMode === 'html' && (
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{template.htmlContent}</code>
                </pre>
              )}

              {viewMode === 'preview' && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-700">
                      Subject: {template.subject.replace(/\{\{(\w+)\}\}/g, '[$1]')}
                    </p>
                  </div>
                  <div
                    className="p-4 bg-white"
                    dangerouslySetInnerHTML={{ __html: renderPreview() }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Insert Variable */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-800 mb-3">Insert Variable</h3>
            <p className="text-xs text-gray-500 mb-3">Click a variable to copy, or use the + buttons while editing to insert at cursor.</p>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {AVAILABLE_VARIABLES.slice(0, 8).map((v) => (
                <button
                  key={v.code}
                  onClick={() => {
                    navigator.clipboard.writeText(`{{${v.code}}}`);
                    toast.success(`Copied {{${v.code}}} to clipboard`);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-50 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-violet-600">{`{{${v.code}}}`}</span>
                  </div>
                  <p className="text-xs text-gray-500">{v.label}</p>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowVariablePicker(true)}
              className="mt-3 w-full text-xs text-violet-600 hover:text-violet-700"
            >
              View all variables...
            </button>
          </div>

          {/* Detected Variables */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-800 mb-3">Used in Template</h3>
            {template.variables.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {template.variables.map((v) => (
                  <span
                    key={v}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono bg-blue-100 text-blue-800"
                  >
                    {`{{${v}}}`}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No variables detected</p>
            )}
          </div>

          {/* Test Email */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-800 mb-3">Send Test Email</h3>
            <div className="space-y-3">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                className="form-input w-full text-sm"
              />
              <button
                onClick={sendTestEmail}
                disabled={isSendingTest || !testEmail}
                className="w-full btn bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
                {isSendingTest ? 'Sending...' : 'Send Test'}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Test emails use sample values for variables
            </p>
          </div>

          {/* Info */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-800 mb-3">Template Info</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Version</dt>
                <dd className="text-gray-800">v{template.version}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Created</dt>
                <dd className="text-gray-800">
                  {new Date(template.createdAt).toLocaleDateString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Updated</dt>
                <dd className="text-gray-800">
                  {new Date(template.updatedAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Variable Picker Modal */}
      {showVariablePicker && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => { setShowVariablePicker(false); setVariableSearch(''); }} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">Insert Variable</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Select a variable to insert into {activeField === 'subject' ? 'subject' : activeField === 'htmlContent' ? 'HTML content' : 'text content'}
                </p>
              </div>

              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={variableSearch}
                    onChange={(e) => setVariableSearch(e.target.value)}
                    placeholder="Search variables..."
                    className="form-input w-full pl-9 text-sm"
                    autoFocus
                  />
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto p-2">
                {filteredVariables.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No variables found</p>
                ) : (
                  filteredVariables.map((v) => (
                    <button
                      key={v.code}
                      onClick={() => insertVariable(v.code)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-800">{v.label}</span>
                        <span className="text-xs font-mono text-violet-600 bg-violet-50 px-2 py-0.5 rounded">{`{{${v.code}}}`}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{v.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Example: {v.example}</p>
                    </button>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => { setShowVariablePicker(false); setVariableSearch(''); }}
                  className="btn border-gray-200 hover:border-gray-300 text-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Indicator */}
      {!hasChanges && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg shadow-lg">
          <CheckCircleIcon className="h-5 w-5" />
          <span className="text-sm">All changes saved</span>
        </div>
      )}
    </div>
  );
}
