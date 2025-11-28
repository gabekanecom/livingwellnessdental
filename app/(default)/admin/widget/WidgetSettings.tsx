'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  ChatBubbleLeftRightIcon,
  SwatchIcon,
  Cog6ToothIcon,
  CodeBracketIcon,
  EyeIcon,
  CheckCircleIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';

interface WidgetSettings {
  isEnabled: boolean;
  theme: 'light' | 'dark';
  accentColor: string;
  position: 'left' | 'right';
  greeting: string;
  headerTitle: string;
  headerSubtitle: string;
  inputPlaceholder: string;
  systemPrompt: string | null;
  allowedDomains: string[];
  rateLimitPerMin: number;
}

type TabType = 'appearance' | 'content' | 'advanced' | 'embed' | 'preview';

export default function WidgetSettings() {
  const [settings, setSettings] = useState<WidgetSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('appearance');
  const [hasChanges, setHasChanges] = useState(false);

  const tabs = [
    { id: 'appearance' as TabType, label: 'Appearance', icon: SwatchIcon },
    { id: 'content' as TabType, label: 'Content', icon: ChatBubbleLeftRightIcon },
    { id: 'advanced' as TabType, label: 'Advanced', icon: Cog6ToothIcon },
    { id: 'embed' as TabType, label: 'Embed Code', icon: CodeBracketIcon },
    { id: 'preview' as TabType, label: 'Preview', icon: EyeIcon },
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/widget');
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load widget settings');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = (updates: Partial<WidgetSettings>) => {
    if (settings) {
      setSettings({ ...settings, ...updates });
      setHasChanges(true);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/widget', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        toast.success('Widget settings saved successfully!');
        setHasChanges(false);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const copyEmbedCode = () => {
    if (!settings) return;

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const embedCode = `<script
  src="${baseUrl}/widget/chat.js"
  data-base-url="${baseUrl}"
  data-theme="${settings.theme}"
  data-accent="${settings.accentColor}"
  data-position="${settings.position}"
  data-greeting="${settings.greeting}"
  async
></script>`;

    navigator.clipboard.writeText(embedCode);
    toast.success('Embed code copied to clipboard!');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        Failed to load widget settings
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Chat Widget Configuration</h1>
            <p className="text-sm text-gray-500 mt-1">
              Configure and customize the embeddable chat widget for your website
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.isEnabled}
                onChange={(e) => updateSettings({ isEnabled: e.target.checked })}
                className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
              />
              <span className="text-sm font-medium text-gray-700">Widget Enabled</span>
            </label>
            {hasChanges && (
              <button
                onClick={saveSettings}
                disabled={isSaving}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 text-sm font-medium"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-violet-500 text-violet-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'appearance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Theme */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                <div className="flex gap-3">
                  {(['light', 'dark'] as const).map((theme) => (
                    <button
                      key={theme}
                      onClick={() => updateSettings({ theme })}
                      className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                        settings.theme === theme
                          ? 'border-violet-500 bg-violet-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-full ${
                            theme === 'light' ? 'bg-white border border-gray-300' : 'bg-gray-800'
                          }`}
                        />
                        <span className="capitalize font-medium">{theme}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                <div className="flex gap-3">
                  {(['left', 'right'] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => updateSettings({ position: pos })}
                      className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                        settings.position === pos
                          ? 'border-violet-500 bg-violet-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="capitalize font-medium">{pos}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Color */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Accent Color
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={`#${settings.accentColor}`}
                    onChange={(e) =>
                      updateSettings({ accentColor: e.target.value.replace('#', '') })
                    }
                    className="w-12 h-12 rounded-lg cursor-pointer border border-gray-300"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">#</span>
                    <input
                      type="text"
                      value={settings.accentColor}
                      onChange={(e) =>
                        updateSettings({ accentColor: e.target.value.replace('#', '') })
                      }
                      maxLength={6}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono uppercase"
                      placeholder="3ec972"
                    />
                  </div>
                  <div
                    className="w-32 h-10 rounded-lg"
                    style={{ backgroundColor: `#${settings.accentColor}` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Header Title</label>
              <input
                type="text"
                value={settings.headerTitle}
                onChange={(e) => updateSettings({ headerTitle: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                placeholder="Living Wellness Dental"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Header Subtitle</label>
              <input
                type="text"
                value={settings.headerSubtitle}
                onChange={(e) => updateSettings({ headerSubtitle: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                placeholder="Ask us anything"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Welcome Greeting
              </label>
              <textarea
                value={settings.greeting}
                onChange={(e) => updateSettings({ greeting: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                placeholder="Hi! How can I help you today?"
              />
              <p className="mt-1 text-sm text-gray-500">
                This message appears when the chat is opened
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Input Placeholder
              </label>
              <input
                type="text"
                value={settings.inputPlaceholder}
                onChange={(e) => updateSettings({ inputPlaceholder: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                placeholder="Type your message..."
              />
            </div>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom System Prompt (Optional)
              </label>
              <textarea
                value={settings.systemPrompt || ''}
                onChange={(e) =>
                  updateSettings({ systemPrompt: e.target.value || null })
                }
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent font-mono text-sm"
                placeholder="Enter a custom system prompt to customize the AI's behavior..."
              />
              <p className="mt-1 text-sm text-gray-500">
                Leave empty to use the default system prompt
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rate Limit (requests per minute per IP)
              </label>
              <input
                type="number"
                value={settings.rateLimitPerMin}
                onChange={(e) =>
                  updateSettings({ rateLimitPerMin: parseInt(e.target.value) || 10 })
                }
                min={1}
                max={100}
                className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allowed Domains (Optional)
              </label>
              <textarea
                value={settings.allowedDomains.join('\n')}
                onChange={(e) =>
                  updateSettings({
                    allowedDomains: e.target.value
                      .split('\n')
                      .map((d) => d.trim())
                      .filter(Boolean),
                  })
                }
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent font-mono text-sm"
                placeholder="example.com&#10;another-domain.com"
              />
              <p className="mt-1 text-sm text-gray-500">
                One domain per line. Leave empty to allow all domains.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'embed' && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Embed Code</h3>
                <button
                  onClick={copyEmbedCode}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                >
                  <ClipboardDocumentIcon className="h-4 w-4" />
                  Copy Code
                </button>
              </div>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                <code>{`<script
  src="${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/widget/chat.js"
  data-base-url="${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}"
  data-theme="${settings.theme}"
  data-accent="${settings.accentColor}"
  data-position="${settings.position}"
  data-greeting="${settings.greeting}"
  async
></script>`}</code>
              </pre>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Installation Instructions</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700">
                <li>Copy the embed code above</li>
                <li>
                  Paste it just before the closing <code className="bg-blue-100 px-1 rounded">&lt;/body&gt;</code> tag on your website
                </li>
                <li>The chat widget will appear in the bottom-{settings.position} corner</li>
              </ol>
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="space-y-6">
            <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center min-h-[500px]">
              <div className={`relative ${settings.position === 'left' ? 'mr-auto' : 'ml-auto'}`}>
                {/* Preview Chat Window */}
                <div
                  className="w-[360px] h-[450px] rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-4"
                  style={{
                    backgroundColor: settings.theme === 'dark' ? '#1f2937' : '#ffffff',
                    border: `1px solid ${settings.theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                  }}
                >
                  {/* Header */}
                  <div
                    className="p-4 flex items-center gap-3"
                    style={{ backgroundColor: `#${settings.accentColor}` }}
                  >
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-sm">{settings.headerTitle}</h3>
                      <p className="text-white/80 text-xs">{settings.headerSubtitle}</p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div
                    className="flex-1 p-4"
                    style={{
                      backgroundColor: settings.theme === 'dark' ? '#111827' : '#f9fafb',
                    }}
                  >
                    <div className="flex justify-start">
                      <div
                        className="max-w-[80%] rounded-2xl rounded-bl-sm px-4 py-2 text-sm"
                        style={{
                          backgroundColor: settings.theme === 'dark' ? '#374151' : '#ffffff',
                          color: settings.theme === 'dark' ? '#f3f4f6' : '#1f2937',
                        }}
                      >
                        {settings.greeting}
                      </div>
                    </div>
                  </div>

                  {/* Input */}
                  <div
                    className="p-3 border-t"
                    style={{
                      backgroundColor: settings.theme === 'dark' ? '#1f2937' : '#ffffff',
                      borderColor: settings.theme === 'dark' ? '#374151' : '#e5e7eb',
                    }}
                  >
                    <div className="flex gap-2">
                      <input
                        type="text"
                        disabled
                        placeholder={settings.inputPlaceholder}
                        className="flex-1 rounded-full px-4 py-2 text-sm outline-none"
                        style={{
                          backgroundColor: settings.theme === 'dark' ? '#374151' : '#f3f4f6',
                          color: settings.theme === 'dark' ? '#9ca3af' : '#6b7280',
                        }}
                      />
                      <button
                        disabled
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `#${settings.accentColor}` }}
                      >
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Toggle Button */}
                <button
                  disabled
                  className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center ${
                    settings.position === 'left' ? 'mr-auto' : 'ml-auto'
                  }`}
                  style={{ backgroundColor: `#${settings.accentColor}` }}
                >
                  <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
            <p className="text-center text-sm text-gray-500">
              This is a preview of how the widget will appear on your website
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      {!hasChanges && (
        <div className="px-6 py-4 bg-green-50 border-t border-gray-200">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-sm text-green-700">
              Widget settings are up to date
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
