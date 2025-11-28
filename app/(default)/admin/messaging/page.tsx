'use client';

import { useState, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import Link from 'next/link';
import {
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface MessagingSettingsData {
  id: string;
  emailEnabled: boolean;
  resendApiKey: string | null;
  fromEmail: string | null;
  fromName: string | null;
  replyToEmail: string | null;
  smsEnabled: boolean;
  twilioAccountSid: string | null;
  twilioAuthToken: string | null;
  twilioPhoneNumber: string | null;
  defaultEmailOptIn: boolean;
  defaultSmsOptIn: boolean;
  emailRateLimitPerHour: number;
  smsRateLimitPerHour: number;
}

interface MessagingStats {
  period: string;
  email: {
    total: number;
    sent: number;
    delivered: number;
    bounced: number;
    failed: number;
  };
  sms: {
    total: number;
    sent: number;
    delivered: number;
    failed: number;
  };
  totals: {
    messagesSent: number;
    emailsSent: number;
    smsSent: number;
  };
}

type TabType = 'settings' | 'email' | 'sms' | 'stats';

export default function MessagingPage() {
  const [settings, setSettings] = useState<MessagingSettingsData | null>(null);
  const [stats, setStats] = useState<MessagingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('settings');
  const [hasChanges, setHasChanges] = useState(false);

  const tabs = [
    { id: 'settings' as TabType, label: 'General', icon: Cog6ToothIcon },
    { id: 'email' as TabType, label: 'Email', icon: EnvelopeIcon },
    { id: 'sms' as TabType, label: 'SMS', icon: DevicePhoneMobileIcon },
    { id: 'stats' as TabType, label: 'Stats', icon: ChartBarIcon },
  ];

  useEffect(() => {
    fetchSettings();
    fetchStats();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/messaging/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load messaging settings');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/messaging/stats?days=30');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const updateSettings = (updates: Partial<MessagingSettingsData>) => {
    if (settings) {
      setSettings({ ...settings, ...updates });
      setHasChanges(true);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/messaging/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        toast.success('Messaging settings saved successfully!');
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

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
          <span className="ml-2">Loading settings...</span>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          Failed to load messaging settings. Please try refreshing the page.
        </div>
      </div>
    );
  }

  const emailConfigured = settings.resendApiKey && settings.fromEmail;
  const smsConfigured = settings.twilioAccountSid && settings.twilioAuthToken && settings.twilioPhoneNumber;

  return (
    <div className="p-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="sm:flex sm:justify-between sm:items-center mb-8">
        <div className="mb-4 sm:mb-0">
          <h2 className="text-xl font-semibold text-gray-800">Messaging Configuration</h2>
          <p className="text-sm text-gray-500">Configure email and SMS messaging for notifications</p>
        </div>
        {hasChanges && (
          <button
            onClick={saveSettings}
            disabled={isSaving}
            className="btn bg-violet-500 hover:bg-violet-600 text-white"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${settings.emailEnabled && emailConfigured ? 'bg-green-100' : 'bg-gray-100'}`}>
              <EnvelopeIcon className={`h-5 w-5 ${settings.emailEnabled && emailConfigured ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">Email</p>
              <p className={`text-xs ${settings.emailEnabled && emailConfigured ? 'text-green-600' : 'text-gray-500'}`}>
                {settings.emailEnabled && emailConfigured ? 'Active' : settings.emailEnabled ? 'Not Configured' : 'Disabled'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${settings.smsEnabled && smsConfigured ? 'bg-green-100' : 'bg-gray-100'}`}>
              <DevicePhoneMobileIcon className={`h-5 w-5 ${settings.smsEnabled && smsConfigured ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">SMS</p>
              <p className={`text-xs ${settings.smsEnabled && smsConfigured ? 'text-green-600' : 'text-gray-500'}`}>
                {settings.smsEnabled && smsConfigured ? 'Active' : settings.smsEnabled ? 'Not Configured' : 'Disabled'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <DocumentTextIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">Templates</p>
              <div className="flex gap-2 text-xs">
                <Link href="/admin/messaging/email-templates" className="text-violet-600 hover:underline">Email</Link>
                <span className="text-gray-400">|</span>
                <Link href="/admin/messaging/sms-templates" className="text-violet-600 hover:underline">SMS</Link>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">Messages (30d)</p>
              <p className="text-xs text-gray-500">{stats?.totals.messagesSent || 0} sent</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-4 px-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-violet-500 text-violet-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
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
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.defaultEmailOptIn}
                      onChange={(e) => updateSettings({ defaultEmailOptIn: e.target.checked })}
                      className="form-checkbox text-violet-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Default Email Opt-In</span>
                      <p className="text-xs text-gray-500">New users are opted into email notifications by default</p>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.defaultSmsOptIn}
                      onChange={(e) => updateSettings({ defaultSmsOptIn: e.target.checked })}
                      className="form-checkbox text-violet-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Default SMS Opt-In</span>
                      <p className="text-xs text-gray-500">New users are opted into SMS notifications by default</p>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Rate Limit (per hour)
                  </label>
                  <input
                    type="number"
                    value={settings.emailRateLimitPerHour}
                    onChange={(e) => updateSettings({ emailRateLimitPerHour: parseInt(e.target.value) || 100 })}
                    min={1}
                    max={10000}
                    className="form-input w-32"
                  />
                  <p className="mt-1 text-xs text-gray-500">Maximum emails to send per hour</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMS Rate Limit (per hour)
                  </label>
                  <input
                    type="number"
                    value={settings.smsRateLimitPerHour}
                    onChange={(e) => updateSettings({ smsRateLimitPerHour: parseInt(e.target.value) || 50 })}
                    min={1}
                    max={10000}
                    className="form-input w-32"
                  />
                  <p className="mt-1 text-xs text-gray-500">Maximum SMS to send per hour</p>
                </div>
              </div>

              {/* Quick Links */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-800 mb-4">Quick Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link
                    href="/admin/messaging/email-templates"
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-violet-500 hover:bg-violet-50 transition-colors"
                  >
                    <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">Email Templates</p>
                      <p className="text-xs text-gray-500">Manage email templates</p>
                    </div>
                  </Link>
                  <Link
                    href="/admin/messaging/sms-templates"
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-violet-500 hover:bg-violet-50 transition-colors"
                  >
                    <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">SMS Templates</p>
                      <p className="text-xs text-gray-500">Manage SMS templates</p>
                    </div>
                  </Link>
                  <Link
                    href="/admin/messaging/logs"
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-violet-500 hover:bg-violet-50 transition-colors"
                  >
                    <ChartBarIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">Message Logs</p>
                      <p className="text-xs text-gray-500">View sent messages</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="space-y-6 max-w-2xl">
              {/* Enable/Disable Email */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Enable Email Sending</p>
                    <p className="text-xs text-gray-500">Allow the system to send emails via Resend</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.emailEnabled}
                    onChange={(e) => updateSettings({ emailEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                </label>
              </div>

              {/* Configuration Status */}
              {!emailConfigured && settings.emailEnabled && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Configuration Required</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Please configure your Resend API key and from email address to enable email sending.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Resend API Key</label>
                <input
                  type="password"
                  value={settings.resendApiKey || ''}
                  onChange={(e) => updateSettings({ resendApiKey: e.target.value || null })}
                  className="form-input w-full font-mono text-sm"
                  placeholder="re_xxxxxxxxxxxx"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Get your API key from{' '}
                  <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline">
                    resend.com/api-keys
                  </a>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Email Address</label>
                <input
                  type="email"
                  value={settings.fromEmail || ''}
                  onChange={(e) => updateSettings({ fromEmail: e.target.value || null })}
                  className="form-input w-full"
                  placeholder="notifications@example.com"
                />
                <p className="mt-1 text-xs text-gray-500">Must be verified in your Resend account</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Name</label>
                <input
                  type="text"
                  value={settings.fromName || ''}
                  onChange={(e) => updateSettings({ fromName: e.target.value || null })}
                  className="form-input w-full"
                  placeholder="Living Wellness Dental"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reply-To Email (Optional)</label>
                <input
                  type="email"
                  value={settings.replyToEmail || ''}
                  onChange={(e) => updateSettings({ replyToEmail: e.target.value || null })}
                  className="form-input w-full"
                  placeholder="support@example.com"
                />
                <p className="mt-1 text-xs text-gray-500">Replies will be sent to this address</p>
              </div>
            </div>
          )}

          {activeTab === 'sms' && (
            <div className="space-y-6 max-w-2xl">
              {/* Enable/Disable SMS */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <DevicePhoneMobileIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Enable SMS Sending</p>
                    <p className="text-xs text-gray-500">Allow the system to send SMS via Twilio</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.smsEnabled}
                    onChange={(e) => updateSettings({ smsEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                </label>
              </div>

              {/* Configuration Status */}
              {!smsConfigured && settings.smsEnabled && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Configuration Required</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Please configure your Twilio credentials and phone number to enable SMS sending.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Twilio Account SID</label>
                <input
                  type="password"
                  value={settings.twilioAccountSid || ''}
                  onChange={(e) => updateSettings({ twilioAccountSid: e.target.value || null })}
                  className="form-input w-full font-mono text-sm"
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Found in your{' '}
                  <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline">
                    Twilio Console
                  </a>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Twilio Auth Token</label>
                <input
                  type="password"
                  value={settings.twilioAuthToken || ''}
                  onChange={(e) => updateSettings({ twilioAuthToken: e.target.value || null })}
                  className="form-input w-full font-mono text-sm"
                  placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Twilio Phone Number</label>
                <input
                  type="tel"
                  value={settings.twilioPhoneNumber || ''}
                  onChange={(e) => updateSettings({ twilioPhoneNumber: e.target.value || null })}
                  className="form-input w-full"
                  placeholder="+15551234567"
                />
                <p className="mt-1 text-xs text-gray-500">Your Twilio phone number in E.164 format</p>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6">
              {stats ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Email Stats */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <EnvelopeIcon className="h-5 w-5 text-blue-500" />
                        <h3 className="font-medium text-gray-800">Email Statistics ({stats.period})</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-2xl font-bold text-gray-800">{stats.email.total}</p>
                          <p className="text-xs text-gray-500">Total Sent</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-600">{stats.email.delivered}</p>
                          <p className="text-xs text-gray-500">Delivered</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-amber-600">{stats.email.bounced}</p>
                          <p className="text-xs text-gray-500">Bounced</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-red-600">{stats.email.failed}</p>
                          <p className="text-xs text-gray-500">Failed</p>
                        </div>
                      </div>
                    </div>

                    {/* SMS Stats */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <DevicePhoneMobileIcon className="h-5 w-5 text-purple-500" />
                        <h3 className="font-medium text-gray-800">SMS Statistics ({stats.period})</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-2xl font-bold text-gray-800">{stats.sms.total}</p>
                          <p className="text-xs text-gray-500">Total Sent</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-600">{stats.sms.delivered}</p>
                          <p className="text-xs text-gray-500">Delivered</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-blue-600">{stats.sms.sent}</p>
                          <p className="text-xs text-gray-500">Pending</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-red-600">{stats.sms.failed}</p>
                          <p className="text-xs text-gray-500">Failed</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center pt-4">
                    <Link
                      href="/admin/messaging/logs"
                      className="text-sm text-violet-600 hover:underline"
                    >
                      View detailed message logs →
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No statistics available yet</p>
                  <p className="text-sm mt-1">Statistics will appear once messages are sent</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!hasChanges && (
          <div className="px-6 py-4 bg-green-50 border-t border-gray-200">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-sm text-green-700">Settings are up to date</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
