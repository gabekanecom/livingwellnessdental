'use client';

import React, { useState, useEffect } from 'react';

interface UserTypeRecord {
  id: string;
  name: string;
  description?: string;
  hierarchyLevel: number;
  isActive: boolean;
}

interface UserTypeFormProps {
  userType?: UserTypeRecord | null;
  onSuccess?: (userType: UserTypeRecord) => void;
  onCancel?: () => void;
}

interface UserTypeFormData {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  hierarchyLevel: number;
}

export default function UserTypeForm({
  userType,
  onSuccess,
  onCancel
}: UserTypeFormProps) {
  const [formData, setFormData] = useState<UserTypeFormData>({
    id: '',
    name: '',
    description: '',
    isActive: true,
    hierarchyLevel: 0
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (userType) {
      setIsEditing(true);
      setFormData({
        id: userType.id,
        name: userType.name,
        description: userType.description || '',
        isActive: userType.isActive,
        hierarchyLevel: userType.hierarchyLevel || 0
      });
    } else {
      setIsEditing(false);
      setFormData({
        id: '',
        name: '',
        description: '',
        isActive: true,
        hierarchyLevel: 0
      });
    }
  }, [userType]);

  const handleInputChange = (field: keyof UserTypeFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateIdFromName = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .trim();
  };

  const handleNameChange = (name: string) => {
    handleInputChange('name', name);
    if (!isEditing) {
      handleInputChange('id', generateIdFromName(name));
    }
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) {
      return 'User type name is required';
    }

    if (!formData.id.trim()) {
      return 'User type ID is required';
    }

    if (!/^[a-z][a-z0-9_]*$/.test(formData.id)) {
      return 'User type ID must start with a letter and contain only lowercase letters, numbers, and underscores';
    }

    if (formData.hierarchyLevel < 0) {
      return 'Hierarchy level must be a positive number';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = isEditing ? `/api/user-types/${formData.id}` : '/api/user-types';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: formData.id,
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          isActive: formData.isActive,
          hierarchyLevel: formData.hierarchyLevel
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save user type');
      }

      const result = await response.json();
      onSuccess?.(result.data || result.userType);
    } catch (err) {
      console.error('Error saving user type:', err);
      setError(err instanceof Error ? err.message : 'Failed to save user type');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {isEditing ? 'Edit User Type' : 'Create New User Type'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {isEditing
            ? 'Update the configuration for this user type'
            : 'Configure a new user type with its settings'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="text-red-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              placeholder="Enter user type name"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="id" className="block text-sm font-medium text-gray-700 mb-2">
              ID *
            </label>
            <input
              type="text"
              id="id"
              value={formData.id}
              onChange={(e) => handleInputChange('id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="user_type_id"
              required
              disabled={loading || isEditing}
            />
            <p className="text-xs text-gray-500 mt-1">
              {isEditing ? 'ID cannot be changed after creation' : 'Auto-generated from name, or enter custom ID'}
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            placeholder="Describe the user type and its purpose"
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="hierarchy_level" className="block text-sm font-medium text-gray-700 mb-2">
              Hierarchy Level *
            </label>
            <input
              type="number"
              id="hierarchy_level"
              value={formData.hierarchyLevel}
              onChange={(e) => handleInputChange('hierarchyLevel', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              min="0"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Lower number = higher authority (0 = highest). Users can only manage users with higher level numbers.
            </p>
          </div>

          <div className="flex items-center pt-8">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
              disabled={loading}
            />
            <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
              Active
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-violet-600 border border-transparent rounded-lg hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              isEditing ? 'Update User Type' : 'Create User Type'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
