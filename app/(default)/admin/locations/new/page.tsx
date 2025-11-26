'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

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

const stateTimezoneMap: Record<string, string> = {
  // Canadian Provinces
  'AB': 'America/Edmonton',
  'BC': 'America/Vancouver',
  'SK': 'America/Regina',
  'MB': 'America/Winnipeg',
  'ON': 'America/Toronto',
  'QC': 'America/Toronto',
  'NB': 'America/Halifax',
  'NS': 'America/Halifax',
  'PE': 'America/Halifax',
  'NL': 'America/St_Johns',
  'YT': 'America/Whitehorse',
  'NT': 'America/Yellowknife',
  'NU': 'America/Iqaluit',
  // US States
  'NY': 'America/New_York',
  'NJ': 'America/New_York',
  'PA': 'America/New_York',
  'MA': 'America/New_York',
  'CT': 'America/New_York',
  'FL': 'America/New_York',
  'GA': 'America/New_York',
  'NC': 'America/New_York',
  'SC': 'America/New_York',
  'VA': 'America/New_York',
  'MD': 'America/New_York',
  'DC': 'America/New_York',
  'ME': 'America/New_York',
  'NH': 'America/New_York',
  'VT': 'America/New_York',
  'RI': 'America/New_York',
  'DE': 'America/New_York',
  'WV': 'America/New_York',
  'OH': 'America/New_York',
  'MI': 'America/New_York',
  'IN': 'America/Indiana/Indianapolis',
  'IL': 'America/Chicago',
  'WI': 'America/Chicago',
  'MN': 'America/Chicago',
  'IA': 'America/Chicago',
  'MO': 'America/Chicago',
  'TX': 'America/Chicago',
  'OK': 'America/Chicago',
  'KS': 'America/Chicago',
  'NE': 'America/Chicago',
  'SD': 'America/Chicago',
  'ND': 'America/Chicago',
  'LA': 'America/Chicago',
  'AR': 'America/Chicago',
  'MS': 'America/Chicago',
  'AL': 'America/Chicago',
  'TN': 'America/Chicago',
  'KY': 'America/New_York',
  'CO': 'America/Denver',
  'MT': 'America/Denver',
  'WY': 'America/Denver',
  'NM': 'America/Denver',
  'UT': 'America/Denver',
  'AZ': 'America/Phoenix',
  'NV': 'America/Los_Angeles',
  'CA': 'America/Los_Angeles',
  'OR': 'America/Los_Angeles',
  'WA': 'America/Los_Angeles',
  'ID': 'America/Boise',
  'AK': 'America/Anchorage',
  'HI': 'Pacific/Honolulu',
};

export default function NewLocationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: '',
    timezone: 'America/Edmonton'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'state') {
      const upperState = value.toUpperCase();
      const detectedTimezone = stateTimezoneMap[upperState];
      setFormData(prev => ({
        ...prev,
        state: upperState,
        ...(detectedTimezone && { timezone: detectedTimezone })
      }));
    } else if (name === 'phone') {
      setFormData(prev => ({
        ...prev,
        phone: formatPhoneNumber(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Location name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to create location');
        return;
      }

      toast.success('Location created successfully');
      router.push(`/admin/locations/${data.data.id}`);
    } catch (error) {
      console.error('Error creating location:', error);
      toast.error('Failed to create location');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-4xl mx-auto">
      <Toaster position="top-right" />

      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <button
            onClick={() => router.push('/admin/locations')}
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Add New Location</h1>
        </div>
        <p className="text-gray-600">Create a new dental office location</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="form-input w-full max-w-md"
              placeholder="e.g., Downtown Clinic"
              required
            />
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="form-input w-full"
                placeholder="123 Main Street"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  placeholder="e.g., NY"
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
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="form-input w-full"
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-input w-full"
                placeholder="clinic@example.com"
              />
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Settings</h3>

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
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.push('/admin/locations')}
            className="btn bg-white border-gray-200 hover:border-gray-300 text-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn bg-violet-500 hover:bg-violet-600 text-white disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Location'}
          </button>
        </div>
      </form>
    </div>
  );
}
