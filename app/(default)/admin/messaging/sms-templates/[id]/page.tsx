'use client';

import { useState, useEffect, use, useRef } from 'react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

interface SmsTemplate {
  id: string;
  slug: string;
  name: string;
  content: string;
  description: string | null;
  category: string;
  variables: string[];
  isActive: boolean;
  isSystem: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

// Available merge tags with descriptions (SMS-specific subset)
const AVAILABLE_VARIABLES = [
  { code: 'name', label: 'Recipient Name', description: 'Full name of the recipient', example: 'John Doe' },
  { code: 'firstName', label: 'First Name', description: 'First name only', example: 'John' },
  { code: 'code', label: 'Verification Code', description: 'One-time verification code', example: '123456' },
  { code: 'title', label: 'Title', description: 'Dynamic title (e.g., course name)', example: 'Dental Training' },
  { code: 'date', label: 'Date', description: 'Relevant date', example: 'Jan 15' },
  { code: 'time', label: 'Time', description: 'Relevant time', example: '2:00 PM' },
  { code: 'courseName', label: 'Course Name', description: 'Name of assigned course', example: 'HIPAA Training' },
  { code: 'dueDate', label: 'Due Date', description: 'Course or task due date', example: 'Feb 1' },
  { code: 'link', label: 'Short Link', description: 'Action link URL (use short URLs)', example: 'bit.ly/abc123' },
  { code: 'company', label: 'Company Name', description: 'Your company name', example: 'LWD' },
];

export default function EditSmsTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [template, setTemplate] = useState<SmsTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [showVariablePicker, setShowVariablePicker] = useState(false);
  const [variableSearch, setVariableSearch] = useState('');

  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchTemplate();
  }, [id]);

  const fetchTemplate = async () => {
    try {
      const res = await fetch(`/api/admin/messaging/sms-templates/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTemplate(data);
      } else if (res.status === 404) {
        toast.error('Template not found');
        router.push('/admin/messaging/sms-templates');
      }
    } catch (error) {
      console.error('Error fetching template:', error);
      toast.error('Failed to load template');
    } finally {
      setIsLoading(false);
    }
  };

  const updateTemplate = (updates: Partial<SmsTemplate>) => {
    if (template) {
      setTemplate({ ...template, ...updates });
      setHasChanges(true);
    }
  };

  const saveTemplate = async () => {
    if (!template) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/messaging/sms-templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.name,
          content: template.content,
          description: template.description,
          category: template.category,
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

  const sendTestSms = async () => {
    if (!testPhone) {
      toast.error('Please enter a phone number');
      return;
    }

    setIsSendingTest(true);
    try {
      const res = await fetch('/api/messaging/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateSlug: template?.slug,
          to: testPhone,
          variables: {
            name: 'Test User',
            firstName: 'Test',
            code: '123456',
            title: 'Test Course',
            time: '2:00 PM',
            date: 'Jan 15',
            courseName: 'Sample Course',
            dueDate: 'Feb 1',
            link: 'bit.ly/test',
            company: 'LWD',
          },
        }),
      });

      if (res.ok) {
        toast.success('Test SMS sent!');
        setTestPhone('');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to send test SMS');
      }
    } catch (error) {
      console.error('Error sending test:', error);
      toast.error('Failed to send test SMS');
    } finally {
      setIsSendingTest(false);
    }
  };

  const extractVariables = (content: string) => {
    const matches = content.match(/\{\{(\w+)\}\}/g) || [];
    const vars = matches.map(m => m.replace(/\{\{|\}\}/g, ''));
    return Array.from(new Set(vars));
  };

  const handleContentChange = (content: string) => {
    const variables = extractVariables(content);
    updateTemplate({ content, variables });
  };

  const insertVariable = (code: string) => {
    const tag = `{{${code}}}`;

    if (contentRef.current) {
      const textarea = contentRef.current;
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const newValue = template!.content.substring(0, start) + tag + template!.content.substring(end);
      handleContentChange(newValue);
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

  const getCharCount = (content: string) => content.length;

  const getSegmentCount = (content: string) => {
    const len = content.length;
    if (len <= 160) return 1;
    return Math.ceil(len / 153);
  };

  const renderPreview = () => {
    if (!template) return '';
    let preview = template.content;
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
          <Link href="/admin/messaging/sms-templates" className="text-violet-600 hover:underline mt-2 inline-block">
            Back to templates
          </Link>
        </div>
      </div>
    );
  }

  const charCount = getCharCount(template.content);
  const segmentCount = getSegmentCount(template.content);
  const isOverLimit = charCount > 160;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/admin/messaging" className="hover:text-violet-600">Messaging</Link>
          <span>/</span>
          <Link href="/admin/messaging/sms-templates" className="hover:text-violet-600">SMS Templates</Link>
          <span>/</span>
          <span className="text-gray-800">{template.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/messaging/sms-templates"
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
                  <option value="notification">Notification</option>
                  <option value="verification">Verification</option>
                  <option value="reminder">Reminder</option>
                  <option value="marketing">Marketing</option>
                </select>
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
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-800">Message Content</h2>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${isOverLimit ? 'text-amber-600 font-medium' : 'text-gray-500'}`}>
                  {charCount}/160 characters
                </span>
                {segmentCount > 1 && (
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                    {segmentCount} segments
                  </span>
                )}
              </div>
            </div>

            {isOverLimit && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-800">
                    Message exceeds 160 characters and will be sent as {segmentCount} segments.
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    This may result in higher costs per message.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end mb-1">
              <button
                type="button"
                onClick={() => setShowVariablePicker(true)}
                className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1"
              >
                <PlusIcon className="h-3 w-3" />
                Insert Variable
              </button>
            </div>
            <textarea
              ref={contentRef}
              value={template.content}
              onChange={(e) => handleContentChange(e.target.value)}
              rows={6}
              className="form-textarea w-full"
              placeholder="Hello {{name}}, your message here."
            />
            <p className="mt-2 text-xs text-gray-500">
              Use {'{{variable}}'} syntax for dynamic content. Click "Insert Variable" to see available options.
            </p>
          </div>

          {/* Preview */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Preview</h2>
            <div className="bg-gray-100 rounded-xl p-4 max-w-sm mx-auto">
              {/* Phone mockup */}
              <div className="bg-gray-800 rounded-2xl p-2">
                <div className="bg-gray-900 rounded-xl p-4">
                  {/* Message bubble */}
                  <div className="bg-blue-500 text-white rounded-2xl rounded-br-sm p-3 text-sm">
                    {renderPreview()}
                  </div>
                  <p className="text-gray-500 text-xs mt-2 text-right">Just now</p>
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-gray-500 mt-3">
              Preview shows sample values for variables
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Insert Variable */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-800 mb-3">Insert Variable</h3>
            <p className="text-xs text-gray-500 mb-3">Click a variable to copy, or use the + button to insert at cursor.</p>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {AVAILABLE_VARIABLES.slice(0, 6).map((v) => (
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

          {/* Used Variables */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-800 mb-3">Used in Template</h3>
            {template.variables.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {template.variables.map((v) => (
                  <span
                    key={v}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono bg-purple-100 text-purple-800"
                  >
                    {`{{${v}}}`}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No variables detected</p>
            )}
          </div>

          {/* Test SMS */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-800 mb-3">Send Test SMS</h3>
            <div className="space-y-3">
              <input
                type="tel"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="+15551234567"
                className="form-input w-full text-sm"
              />
              <button
                onClick={sendTestSms}
                disabled={isSendingTest || !testPhone}
                className="w-full btn bg-purple-500 hover:bg-purple-600 text-white disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
                {isSendingTest ? 'Sending...' : 'Send Test'}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Test SMS uses sample values for variables. Standard carrier rates apply.
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

          {/* SMS Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">SMS Tips</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Keep messages under 160 characters when possible</li>
              <li>• Messages over 160 chars are split into segments</li>
              <li>• Include opt-out info for marketing messages</li>
              <li>• Avoid special characters that increase segment size</li>
            </ul>
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
                  Select a variable to insert into your message
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
