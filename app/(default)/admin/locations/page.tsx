'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  BuildingOffice2Icon,
  UsersIcon,
  MapPinIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';

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
  isActive: boolean;
  _count?: { users: number };
}

export default function LocationsPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLocations();
  }, [search]);

  const fetchLocations = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ includeStats: 'true' });
      if (search) params.append('search', search);

      const response = await fetch(`/api/locations?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLocations(data.locations);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (e: React.MouseEvent, location: Location) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/locations/${location.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !location.isActive })
      });
      if (response.ok) {
        fetchLocations();
      }
    } catch (error) {
      console.error('Error toggling location status:', error);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
          <p className="text-gray-600 mt-1">Manage clinic locations</p>
        </div>
        <button
          onClick={() => router.push('/admin/locations/new')}
          className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Add Location
        </button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
          </div>
        ) : locations.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <BuildingOffice2Icon className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No locations</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new location.</p>
            <div className="mt-6">
              <button
                onClick={() => router.push('/admin/locations/new')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700"
              >
                <PlusIcon className="h-4 w-4" />
                Add Location
              </button>
            </div>
          </div>
        ) : (
          locations.map((location) => (
            <div
              key={location.id}
              onClick={() => router.push(`/admin/locations/${location.id}`)}
              className={`bg-white rounded-xl shadow-sm border p-6 cursor-pointer hover:shadow-md transition-shadow ${
                location.isActive ? 'border-gray-200' : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${location.isActive ? 'bg-violet-100' : 'bg-red-100'}`}>
                    <BuildingOffice2Icon className={`h-6 w-6 ${location.isActive ? 'text-violet-600' : 'text-red-600'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{location.name}</h3>
                  </div>
                </div>
              </div>

              {(location.address || location.city) && (
                <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
                  <MapPinIcon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    {location.address && <span>{location.address}<br /></span>}
                    {location.city && `${location.city}, ${location.state} ${location.zipCode}`}
                  </div>
                </div>
              )}

              {location.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <PhoneIcon className="h-4 w-4 text-gray-400" />
                  <span>{location.phone}</span>
                </div>
              )}

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <UsersIcon className="h-4 w-4" />
                  <span>{location._count?.users || 0} staff</span>
                </div>
                <button
                  onClick={(e) => handleToggleActive(e, location)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                    location.isActive
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  {location.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
