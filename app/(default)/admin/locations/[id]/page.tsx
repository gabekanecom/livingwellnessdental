'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';
import {
  ArrowLeftIcon,
  MapPinIcon,
  UserGroupIcon,
  DocumentIcon,
  PhotoIcon,
  Cog6ToothIcon,
  ClockIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface LocationUser {
  id: string;
  isPrimary: boolean;
  isActive: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    jobTitle?: string;
  };
}

interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

interface LocationHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

interface Location {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  timezone: string;
  hours?: LocationHours;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  users: LocationUser[];
  _count?: { users: number };
}

const defaultHours: LocationHours = {
  monday: { open: '08:00', close: '17:00', closed: false },
  tuesday: { open: '08:00', close: '17:00', closed: false },
  wednesday: { open: '08:00', close: '17:00', closed: false },
  thursday: { open: '08:00', close: '17:00', closed: false },
  friday: { open: '08:00', close: '17:00', closed: false },
  saturday: { open: '09:00', close: '14:00', closed: true },
  sunday: { open: '09:00', close: '14:00', closed: true },
};

type TabKey = 'general' | 'hours' | 'staff' | 'documents' | 'photos' | 'settings';

const tabs = [
  { key: 'general' as TabKey, name: 'General', icon: MapPinIcon },
  { key: 'hours' as TabKey, name: 'Hours', icon: ClockIcon },
  { key: 'staff' as TabKey, name: 'Staff', icon: UserGroupIcon },
  { key: 'documents' as TabKey, name: 'Documents', icon: DocumentIcon },
  { key: 'photos' as TabKey, name: 'Photos', icon: PhotoIcon },
  { key: 'settings' as TabKey, name: 'Settings', icon: Cog6ToothIcon },
];

const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

const timezones = [
  'America/Edmonton',
  'America/Vancouver',
  'America/Toronto',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix'
];

export default function LocationDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const locationId = params.id;

  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: '',
    timezone: 'America/Edmonton',
    isActive: true
  });

  const [hoursData, setHoursData] = useState<LocationHours>(defaultHours);

  const fetchLocation = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/locations/${locationId}`);
      if (!response.ok) {
        toast.error('Failed to load location');
        return;
      }
      const data = await response.json();
      setLocation(data.location);
      setFormData({
        name: data.location.name || '',
        address: data.location.address || '',
        city: data.location.city || '',
        state: data.location.state || '',
        zipCode: data.location.zipCode || '',
        phone: data.location.phone || '',
        email: data.location.email || '',
        timezone: data.location.timezone || 'America/Edmonton',
        isActive: data.location.isActive
      });
      setHoursData(data.location.hours || defaultHours);
    } catch (error) {
      console.error('Error fetching location:', error);
      toast.error('Failed to load location');
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (name === 'phone') {
      setFormData(prev => ({ ...prev, phone: formatPhoneNumber(value) }));
    } else {
      const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
      setFormData(prev => ({ ...prev, [name]: finalValue }));
    }
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Name is required');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/locations/${locationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, hours: hoursData })
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || 'Failed to update location');
        return;
      }

      toast.success('Location updated successfully');
      fetchLocation();
    } catch (error) {
      console.error('Error updating location:', error);
      toast.error('Failed to update location');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmation !== 'DELETE') return;

    try {
      const response = await fetch(`/api/locations/${locationId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete location');
        return;
      }

      toast.success('Location deleted successfully');
      router.push('/admin/locations');
    } catch (error) {
      console.error('Error deleting location:', error);
      toast.error('Failed to delete location');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Location not found</h3>
        <p className="mt-2 text-sm text-gray-500">The location you're looking for doesn't exist.</p>
      </div>
    );
  }

  const renderGeneralTab = () => (
    <div className="space-y-6">
      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Location Information</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="form-input w-full max-w-md"
            required
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            className="form-input w-full"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className="form-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleInputChange}
              className="form-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
            <input
              type="text"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleInputChange}
              className="form-input w-full"
            />
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="form-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="form-input w-full"
            />
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
            <select
              name="timezone"
              value={formData.timezone}
              onChange={handleInputChange}
              className="form-select w-full"
            >
              {timezones.map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center pt-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="form-checkbox"
              />
              <span className="ml-2 text-sm text-gray-700">Active Location</span>
            </label>
          </div>
        </div>
      </section>
    </div>
  );

  const handleHoursChange = (day: keyof LocationHours, field: keyof DayHours, value: string | boolean) => {
    setHoursData(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const formatTimeDisplay = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'pm' : 'am';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const dayLabels: { key: keyof LocationHours; label: string }[] = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];

  const renderHoursTab = () => (
    <div className="space-y-6">
      <section>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Hours of Operation</h3>
          <p className="text-sm text-gray-500 mt-1">Set the operating hours for each day of the week</p>
        </div>

        <div className="space-y-3">
          {dayLabels.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="w-28 font-medium text-gray-700">{label}</div>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!hoursData[key].closed}
                  onChange={(e) => handleHoursChange(key, 'closed', !e.target.checked)}
                  className="form-checkbox text-violet-600"
                />
                <span className="text-sm text-gray-600">Open</span>
              </label>

              {!hoursData[key].closed ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={hoursData[key].open}
                    onChange={(e) => handleHoursChange(key, 'open', e.target.value)}
                    className="form-input text-sm"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="time"
                    value={hoursData[key].close}
                    onChange={(e) => handleHoursChange(key, 'close', e.target.value)}
                    className="form-input text-sm"
                  />
                  <span className="text-sm text-gray-500 ml-2">
                    ({formatTimeDisplay(hoursData[key].open)} – {formatTimeDisplay(hoursData[key].close)})
                  </span>
                </div>
              ) : (
                <span className="text-sm text-gray-500 italic">Closed</span>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  const renderStaffTab = () => (
    <div className="space-y-6">
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Staff Members</h3>
            <p className="text-sm text-gray-500 mt-1">Users assigned to this location</p>
          </div>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {location.users?.length || 0} members
          </span>
        </div>

        {!location.users || location.users.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-500">No staff assigned</p>
            <p className="text-xs text-gray-400 mt-1">Assign users to this location from User Management</p>
          </div>
        ) : (
          <div className="space-y-3">
            {location.users.map((userLoc) => (
              <div key={userLoc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                    {userLoc.user.avatar ? (
                      <img src={userLoc.user.avatar} alt="" className="w-10 h-10 rounded-full" />
                    ) : (
                      <span className="text-violet-600 font-medium">
                        {userLoc.user.name?.charAt(0) || '?'}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{userLoc.user.name}</p>
                    <p className="text-xs text-gray-500">{userLoc.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {userLoc.user.jobTitle && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {userLoc.user.jobTitle}
                    </span>
                  )}
                  {userLoc.isPrimary && (
                    <span className="text-xs text-violet-600 bg-violet-100 px-2 py-1 rounded">
                      Primary
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );

  const renderDocumentsTab = () => (
    <div className="space-y-6">
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Documents</h3>
            <p className="text-sm text-gray-500 mt-1">Licenses, certifications, and other documents</p>
          </div>
        </div>

        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <DocumentIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-500">No documents uploaded</p>
          <p className="text-xs text-gray-400 mt-1">Upload licenses, permits, and certifications</p>
        </div>
      </section>
    </div>
  );

  const renderPhotosTab = () => (
    <div className="space-y-6">
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Location Photos</h3>
            <p className="text-sm text-gray-500 mt-1">Photos of the facility</p>
          </div>
        </div>

        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <PhotoIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-500">No photos uploaded</p>
          <p className="text-xs text-gray-400 mt-1">Upload photos of your facility</p>
        </div>
      </section>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Danger Zone</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-800">Delete this location</h4>
          <p className="text-sm text-red-600 mt-1">
            Once you delete a location, there is no going back. Please be certain.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="mt-4 btn bg-red-600 text-white hover:bg-red-700"
          >
            Delete Location
          </button>
        </div>
      </section>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general': return renderGeneralTab();
      case 'hours': return renderHoursTab();
      case 'staff': return renderStaffTab();
      case 'documents': return renderDocumentsTab();
      case 'photos': return renderPhotosTab();
      case 'settings': return renderSettingsTab();
      default: return renderGeneralTab();
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
      <Toaster position="top-right" />

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/admin/locations')}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{location.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {location.address && `${location.address}, `}
              {location.city && `${location.city}, `}
              {location.state} {location.zipCode}
            </p>
          </div>
        </div>

        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
          location.isActive
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {location.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-violet-500 text-violet-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {renderTabContent()}
      </div>

      {activeTab !== 'settings' && (
        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={fetchLocation}
            disabled={isSaving}
            className="btn bg-white border-gray-200 hover:border-gray-300 text-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Delete Location</h2>
              <button onClick={() => { setShowDeleteModal(false); setDeleteConfirmation(''); }}>
                <XMarkIcon className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete this location? This action cannot be undone.
            </p>
            <div className="mb-4">
              <p className="text-sm text-gray-700 mb-2">Type <strong>DELETE</strong> to confirm:</p>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="form-input w-full"
                placeholder="Type DELETE"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmation(''); }}
                className="btn bg-white border-gray-200 hover:border-gray-300 text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteConfirmation !== 'DELETE'}
                className="btn bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
