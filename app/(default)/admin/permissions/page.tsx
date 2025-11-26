'use client';

import { useState, useEffect } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  KeyIcon
} from '@heroicons/react/24/outline';

interface Permission {
  id: string;
  name: string;
  description?: string;
  category?: string;
  isActive: boolean;
}

interface Category {
  name: string | null;
  count: number;
}

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    category: ''
  });

  useEffect(() => {
    fetchPermissions();
  }, [selectedCategory]);

  const fetchPermissions = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);

      const response = await fetch(`/api/permissions?${params}`);
      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permissions);
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPermissions = permissions.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingPermission ? `/api/permissions/${editingPermission.id}` : '/api/permissions';
      const method = editingPermission ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowModal(false);
        setEditingPermission(null);
        resetForm();
        fetchPermissions();
      }
    } catch (error) {
      console.error('Error saving permission:', error);
    }
  };

  const handleEdit = (permission: Permission) => {
    setEditingPermission(permission);
    setFormData({
      id: permission.id,
      name: permission.name,
      description: permission.description || '',
      category: permission.category || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (permissionId: string) => {
    if (!confirm('Are you sure you want to delete this permission?')) return;

    try {
      const response = await fetch(`/api/permissions/${permissionId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchPermissions();
      }
    } catch (error) {
      console.error('Error deleting permission:', error);
    }
  };

  const resetForm = () => {
    setFormData({ id: '', name: '', description: '', category: '' });
  };

  const groupedPermissions = filteredPermissions.reduce((acc, perm) => {
    const cat = perm.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const suggestedCategories = [
    'Users',
    'Locations',
    'Courses',
    'Reports',
    'Settings',
    'Admin'
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Permissions</h1>
          <p className="text-gray-600 mt-1">Manage system permissions</p>
        </div>
        <button
          onClick={() => { resetForm(); setEditingPermission(null); setShowModal(true); }}
          className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
        >
          <PlusIcon className="h-4 w-4" />
          Add Permission
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search permissions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.name || 'other'} value={cat.name || ''}>
                  {cat.name || 'Other'} ({cat.count})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : Object.keys(groupedPermissions).length === 0 ? (
            <div className="text-center py-12 text-gray-500">No permissions found</div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedPermissions).sort(([a], [b]) => a.localeCompare(b)).map(([category, perms]) => (
                <div key={category}>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {perms.map((permission) => (
                      <div
                        key={permission.id}
                        className={`p-4 rounded-lg border ${
                          permission.isActive ? 'border-gray-200 bg-white' : 'border-red-200 bg-red-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                              <KeyIcon className="h-4 w-4 text-indigo-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{permission.name}</p>
                              <p className="text-xs text-gray-500 font-mono">{permission.id}</p>
                              {permission.description && (
                                <p className="text-sm text-gray-600 mt-1">{permission.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEdit(permission)}
                              className="p-1 text-gray-400 hover:text-indigo-600"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(permission.id)}
                              className="p-1 text-gray-400 hover:text-red-600"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingPermission ? 'Edit Permission' : 'Add Permission'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                <input
                  type="text"
                  required
                  disabled={!!editingPermission}
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  placeholder="e.g., users.create"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Create Users"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  list="category-suggestions"
                  placeholder="e.g., Users"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <datalist id="category-suggestions">
                  {suggestedCategories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingPermission(null); }}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                >
                  {editingPermission ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
