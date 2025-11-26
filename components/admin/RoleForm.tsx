'use client';

import React, { useState, useEffect } from 'react';

interface RoleRecord {
  id: string;
  name: string;
  description?: string;
  userTypeId: string;
  dataScope: string;
  isDefault: boolean;
  isProtected: boolean;
  isActive: boolean;
  displayOrder: number;
}

interface UserTypeRecord {
  id: string;
  name: string;
  description?: string;
}

interface RoleFormProps {
  role?: RoleRecord | null;
  preselectedUserType?: string;
  onSuccess?: (role: RoleRecord) => void;
  onCancel?: () => void;
}

interface RoleFormData {
  id: string;
  name: string;
  description: string;
  userTypeId: string;
  dataScope: string;
  isActive: boolean;
  isDefault: boolean;
  displayOrder: number;
}

const DATA_SCOPE_OPTIONS = [
  { value: 'SELF', label: 'Self Only', description: 'User can only access their own data' },
  { value: 'LOCATION', label: 'Location', description: 'User can access data within their location' },
  { value: 'ALL_LOCATIONS', label: 'All Locations', description: 'User can access data from all locations' },
  { value: 'GLOBAL', label: 'Global Access', description: 'User can access all data across the system' }
];

export default function RoleForm({
  role,
  preselectedUserType,
  onSuccess,
  onCancel
}: RoleFormProps) {
  const [formData, setFormData] = useState<RoleFormData>({
    id: '',
    name: '',
    description: '',
    userTypeId: preselectedUserType || '',
    dataScope: 'LOCATION',
    isActive: true,
    isDefault: false,
    displayOrder: 0
  });

  const [userTypes, setUserTypes] = useState<UserTypeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (role) {
      setIsEditing(true);
      setFormData({
        id: role.id,
        name: role.name,
        description: role.description || '',
        userTypeId: role.userTypeId,
        dataScope: role.dataScope,
        isActive: role.isActive,
        isDefault: role.isDefault || false,
        displayOrder: role.displayOrder || 0
      });
    } else {
      setIsEditing(false);
      setFormData({
        id: '',
        name: '',
        description: '',
        userTypeId: preselectedUserType || '',
        dataScope: 'LOCATION',
        isActive: true,
        isDefault: false,
        displayOrder: 0
      });
    }
  }, [role, preselectedUserType]);

  useEffect(() => {
    const loadUserTypes = async () => {
      try {
        const response = await fetch('/api/user-types?isActive=true');
        if (response.ok) {
          const data = await response.json();
          setUserTypes(data.userTypes || []);
        }
      } catch (err) {
        console.error('Error loading user types:', err);
      }
    };

    loadUserTypes();
  }, []);

  const handleInputChange = (field: keyof RoleFormData, value: any) => {
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
      return 'Role name is required';
    }

    if (!formData.userTypeId) {
      return 'User type is required';
    }

    if (!formData.id.trim()) {
      return 'Role ID is required';
    }

    if (!/^[a-z][a-z0-9_]*$/.test(formData.id)) {
      return 'Role ID must start with a letter and contain only lowercase letters, numbers, and underscores';
    }

    if (formData.displayOrder < 0) {
      return 'Display order must be a positive number';
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
      const url = isEditing ? `/api/roles/${formData.id}` : '/api/roles';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: formData.id,
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          userTypeId: formData.userTypeId,
          dataScope: formData.dataScope,
          isActive: formData.isActive,
          isDefault: formData.isDefault,
          displayOrder: formData.displayOrder
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save role');
      }

      const result = await response.json();
      onSuccess?.(result.data || result.role);
    } catch (err) {
      console.error('Error saving role:', err);
      setError(err instanceof Error ? err.message : 'Failed to save role');
    } finally {
      setLoading(false);
    }
  };

  const handleSetAsDefault = async (makeDefault: boolean) => {
    if (!makeDefault || !formData.userTypeId) {
      handleInputChange('isDefault', makeDefault);
      return;
    }

    const confirmed = window.confirm(
      'Setting this role as default will remove the default status from any other role in this user type. Continue?'
    );

    if (confirmed) {
      handleInputChange('isDefault', true);
    }
  };

  const selectedUserType = userTypes.find(ut => ut.id === formData.userTypeId);

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {isEditing ? 'Edit Role' : 'Create New Role'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {isEditing
            ? 'Update the configuration for this role'
            : 'Configure a new role with its permissions and settings'
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
              Role Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              placeholder="Enter role name"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="id" className="block text-sm font-medium text-gray-700 mb-2">
              Role ID *
            </label>
            <input
              type="text"
              id="id"
              value={formData.id}
              onChange={(e) => handleInputChange('id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="role_id"
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
            placeholder="Describe the role and its responsibilities"
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="user_type_id" className="block text-sm font-medium text-gray-700 mb-2">
              User Type *
            </label>
            <select
              id="user_type_id"
              value={formData.userTypeId}
              onChange={(e) => handleInputChange('userTypeId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              required
              disabled={loading}
            >
              <option value="">Select a user type</option>
              {userTypes.map(userType => (
                <option key={userType.id} value={userType.id}>
                  {userType.name}
                </option>
              ))}
            </select>
            {selectedUserType?.description && (
              <p className="text-xs text-gray-500 mt-1">
                {selectedUserType.description}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="data_scope" className="block text-sm font-medium text-gray-700 mb-2">
              Data Scope *
            </label>
            <select
              id="data_scope"
              value={formData.dataScope}
              onChange={(e) => handleInputChange('dataScope', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              required
              disabled={loading}
            >
              {DATA_SCOPE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {DATA_SCOPE_OPTIONS.find(opt => opt.value === formData.dataScope)?.description}
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="display_order" className="block text-sm font-medium text-gray-700 mb-2">
            Display Order
          </label>
          <input
            type="number"
            id="display_order"
            value={formData.displayOrder}
            onChange={(e) => handleInputChange('displayOrder', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            min="0"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">Order in which this role appears in lists within its user type</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
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
              <p className="ml-2 text-xs text-gray-500">Role is available for assignment</p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_default"
                checked={formData.isDefault}
                onChange={(e) => handleSetAsDefault(e.target.checked)}
                className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
                disabled={loading || !formData.userTypeId}
              />
              <label htmlFor="is_default" className="ml-2 text-sm text-gray-700">
                Default Role
              </label>
              <p className="ml-2 text-xs text-gray-500">
                Automatically assign this role to new users of this type
              </p>
            </div>
          </div>
        </div>

        {formData.name && formData.userTypeId && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Role Preview</h4>
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 h-10 w-10 bg-violet-500 rounded-lg flex items-center justify-center text-white font-medium text-sm">
                {formData.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">{formData.name}</span>
                  {formData.isDefault && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {selectedUserType?.name} • {DATA_SCOPE_OPTIONS.find(opt => opt.value === formData.dataScope)?.label} scope
                </p>
              </div>
            </div>
          </div>
        )}

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
              isEditing ? 'Update Role' : 'Create Role'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
