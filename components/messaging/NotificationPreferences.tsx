'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  BellIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface NotificationPreference {
  id: string;
  userId: string;
  emailEnabled: boolean;
  emailNotifications: boolean;
  emailDigest: boolean;
  digestFrequency: string;
  emailMarketing: boolean;
  smsEnabled: boolean;
  smsNotifications: boolean;
  smsMarketing: boolean;
  smsPhoneNumber: string | null;
  smsPhoneVerified: boolean;
}

interface NotificationPreferencesProps {
  userId?: string; // Optional - defaults to 'me' for current user
}

export default function NotificationPreferences({ userId = 'me' }: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    fetchPreferences();
  }, [userId]);

  const fetchPreferences = async () => {
    try {
      const res = await fetch(`/api/users/${userId}/notification-preferences`);
      if (res.ok) {
        const data = await res.json();
        setPreferences(data);
        setPhoneNumber(data.smsPhoneNumber || '');
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast.error('Failed to load notification preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = (updates: Partial<NotificationPreference>) => {
    if (preferences) {
      setPreferences({ ...preferences, ...updates });
      setHasChanges(true);
    }
  };

  const savePreferences = async () => {
    if (!preferences) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/users/${userId}/notification-preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...preferences,
          smsPhoneNumber: phoneNumber || null,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setPreferences(updated);
        toast.success('Notification preferences saved!');
        setHasChanges(false);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
        Failed to load notification preferences
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Email Preferences */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <EnvelopeIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">Email Notifications</h3>
            <p className="text-sm text-gray-500">Manage your email notification preferences</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Enable email notifications</span>
              <p className="text-xs text-gray-500">Receive notifications via email</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.emailEnabled}
              onChange={(e) => updatePreferences({ emailEnabled: e.target.checked })}
              className="rounded border-gray-300 text-violet-600 focus:ring-violet-500 h-5 w-5"
            />
          </label>

          {preferences.emailEnabled && (
            <>
              <label className="flex items-center justify-between pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                <div>
                  <span className="text-sm text-gray-700 dark:text-gray-200">System notifications</span>
                  <p className="text-xs text-gray-500">Course updates, assignments, etc.</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.emailNotifications}
                  onChange={(e) => updatePreferences({ emailNotifications: e.target.checked })}
                  className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
              </label>

              <label className="flex items-center justify-between pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                <div>
                  <span className="text-sm text-gray-700 dark:text-gray-200">Email digest</span>
                  <p className="text-xs text-gray-500">Receive a summary of activity</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.emailDigest}
                  onChange={(e) => updatePreferences({ emailDigest: e.target.checked })}
                  className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
              </label>

              {preferences.emailDigest && (
                <div className="pl-8">
                  <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Digest frequency</label>
                  <select
                    value={preferences.digestFrequency}
                    onChange={(e) => updatePreferences({ digestFrequency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              )}

              <label className="flex items-center justify-between pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                <div>
                  <span className="text-sm text-gray-700 dark:text-gray-200">Marketing emails</span>
                  <p className="text-xs text-gray-500">News, promotions, and updates</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.emailMarketing}
                  onChange={(e) => updatePreferences({ emailMarketing: e.target.checked })}
                  className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
              </label>
            </>
          )}
        </div>
      </div>

      {/* SMS Preferences */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <DevicePhoneMobileIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">SMS Notifications</h3>
            <p className="text-sm text-gray-500">Manage your SMS notification preferences</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Enable SMS notifications</span>
              <p className="text-xs text-gray-500">Receive notifications via text message</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.smsEnabled}
              onChange={(e) => updatePreferences({ smsEnabled: e.target.checked })}
              className="rounded border-gray-300 text-violet-600 focus:ring-violet-500 h-5 w-5"
            />
          </label>

          {preferences.smsEnabled && (
            <>
              <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Phone number</label>
                <div className="flex items-center gap-2">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      setHasChanges(true);
                    }}
                    placeholder="+1 (555) 123-4567"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                  />
                  {preferences.smsPhoneVerified ? (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircleIcon className="h-4 w-4" />
                      Verified
                    </span>
                  ) : phoneNumber ? (
                    <span className="flex items-center gap-1 text-xs text-amber-600">
                      <ExclamationTriangleIcon className="h-4 w-4" />
                      Not verified
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-gray-500 mt-1">Standard messaging rates may apply</p>
              </div>

              <label className="flex items-center justify-between pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                <div>
                  <span className="text-sm text-gray-700 dark:text-gray-200">System notifications</span>
                  <p className="text-xs text-gray-500">Important alerts and reminders</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.smsNotifications}
                  onChange={(e) => updatePreferences({ smsNotifications: e.target.checked })}
                  className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
              </label>

              <label className="flex items-center justify-between pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                <div>
                  <span className="text-sm text-gray-700 dark:text-gray-200">Marketing messages</span>
                  <p className="text-xs text-gray-500">Promotions and offers via SMS</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.smsMarketing}
                  onChange={(e) => updatePreferences({ smsMarketing: e.target.checked })}
                  className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
              </label>
            </>
          )}
        </div>
      </div>

      {/* Save Button */}
      {hasChanges && (
        <div className="flex justify-end">
          <button
            onClick={savePreferences}
            disabled={isSaving}
            className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 text-sm font-medium"
          >
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      )}

      {/* Compliance Notice */}
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 text-xs text-gray-500">
        <p className="flex items-center gap-2 mb-2">
          <BellIcon className="h-4 w-4" />
          <span className="font-medium">Notification Preferences</span>
        </p>
        <p>
          You can change your notification preferences at any time. For SMS, standard carrier rates apply.
          Marketing communications comply with CAN-SPAM and TCPA regulations. You can unsubscribe from
          marketing emails using the link at the bottom of each email, or reply STOP to any marketing SMS.
        </p>
      </div>
    </div>
  );
}
