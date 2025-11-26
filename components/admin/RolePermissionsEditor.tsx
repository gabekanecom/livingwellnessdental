'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface RoleRecord {
  id: string;
  name: string;
  description?: string;
}

interface PermissionRecord {
  id: string;
  name: string;
  description?: string;
  category?: string;
  isActive: boolean;
}

interface PermissionWithStatus extends PermissionRecord {
  isAssigned: boolean;
}

interface PermissionsByCategory {
  [category: string]: PermissionWithStatus[];
}

interface RolePermissionsEditorProps {
  role: RoleRecord;
  onPermissionsChange?: () => void;
  showTemplates?: boolean;
}

const PERMISSION_TEMPLATES = [
  {
    id: 'basic_user',
    name: 'Basic User',
    description: 'Essential permissions for general users',
    permissions: ['users.view', 'wiki.view', 'courses.view']
  },
  {
    id: 'location_staff',
    name: 'Location Staff',
    description: 'Permissions for location staff members',
    permissions: ['users.view', 'wiki.view', 'wiki.create', 'courses.view', 'courses.enroll', 'locations.view']
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Permissions for managers',
    permissions: ['users.view', 'users.create', 'users.edit', 'wiki.view', 'wiki.create', 'wiki.edit', 'courses.view', 'courses.create', 'courses.edit', 'locations.view', 'reports.view']
  },
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full administrative permissions',
    permissions: ['users.view', 'users.create', 'users.edit', 'users.delete', 'admin.manage_roles', 'admin.manage_permissions', 'wiki.view', 'wiki.create', 'wiki.edit', 'wiki.delete', 'courses.view', 'courses.create', 'courses.edit', 'courses.delete', 'locations.view', 'locations.create', 'locations.edit', 'reports.view', 'reports.export']
  }
];

export default function RolePermissionsEditor({
  role,
  onPermissionsChange,
  showTemplates = true
}: RolePermissionsEditorProps) {
  const [permissions, setPermissions] = useState<PermissionsByCategory>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [savingPermissions, setSavingPermissions] = useState<Set<string>>(new Set());

  const loadPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [permissionsRes, rolePermissionsRes] = await Promise.all([
        fetch('/api/permissions?isActive=true'),
        fetch(`/api/roles/${role.id}/permissions`)
      ]);

      if (!permissionsRes.ok) throw new Error('Failed to load permissions');

      const permissionsData = await permissionsRes.json();
      const rolePermissionsData = rolePermissionsRes.ok ? await rolePermissionsRes.json() : { permissions: [] };

      const assignedPermissions = new Set(
        (rolePermissionsData.permissions || []).map((rp: any) => rp.permissionId || rp.permission?.id)
      );

      const groupedPermissions = (permissionsData.permissions || []).reduce((acc: PermissionsByCategory, permission: PermissionRecord) => {
        const category = permission.category || 'Other';
        if (!acc[category]) {
          acc[category] = [];
        }

        acc[category].push({
          ...permission,
          isAssigned: assignedPermissions.has(permission.id)
        });

        return acc;
      }, {} as PermissionsByCategory);

      setPermissions(groupedPermissions);
      setExpandedCategories(new Set());
    } catch (err) {
      console.error('Error loading permissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load permissions');
    } finally {
      setLoading(false);
    }
  }, [role.id]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const togglePermission = async (permissionId: string, currentlyAssigned: boolean) => {
    setSavingPermissions(prev => new Set(prev).add(permissionId));

    try {
      const response = await fetch(`/api/roles/${role.id}/permissions`, {
        method: currentlyAssigned ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissionId })
      });

      if (!response.ok) throw new Error('Failed to update permission');

      await loadPermissions();
      onPermissionsChange?.();
    } catch (err) {
      console.error('Error updating permission:', err);
      setError(err instanceof Error ? err.message : 'Failed to update permission');
    } finally {
      setSavingPermissions(prev => {
        const newSet = new Set(prev);
        newSet.delete(permissionId);
        return newSet;
      });
    }
  };

  const applyTemplate = async (template: typeof PERMISSION_TEMPLATES[0]) => {
    const confirmed = window.confirm(
      `Apply the "${template.name}" template? This will assign ${template.permissions.length} permissions to this role.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/roles/${role.id}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissionIds: template.permissions })
      });

      if (!response.ok) throw new Error('Failed to apply template');

      await loadPermissions();
      onPermissionsChange?.();
    } catch (err) {
      console.error('Error applying template:', err);
      setError(err instanceof Error ? err.message : 'Failed to apply template');
    }
  };

  const grantAllInCategory = async (categoryPermissions: PermissionWithStatus[]) => {
    const unassigned = categoryPermissions.filter(p => !p.isAssigned);
    for (const perm of unassigned) {
      await togglePermission(perm.id, false);
    }
  };

  const revokeAllInCategory = async (categoryPermissions: PermissionWithStatus[]) => {
    const assigned = categoryPermissions.filter(p => p.isAssigned);
    for (const perm of assigned) {
      await togglePermission(perm.id, true);
    }
  };

  const getFilteredPermissions = (): PermissionWithStatus[] => {
    let allPermissions: PermissionWithStatus[] = [];

    if (selectedCategory === 'all') {
      allPermissions = Object.values(permissions).flat();
    } else {
      allPermissions = permissions[selectedCategory] || [];
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      allPermissions = allPermissions.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term)
      );
    }

    return allPermissions.sort((a, b) => {
      if (a.isAssigned && !b.isAssigned) return -1;
      if (!a.isAssigned && b.isAssigned) return 1;
      return a.name.localeCompare(b.name);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
        <span className="ml-3 text-gray-600">Loading permissions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center">
          <div className="text-red-400">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Permissions</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
        <div className="mt-3">
          <button
            onClick={loadPermissions}
            className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const filteredPermissions = getFilteredPermissions();
  const permissionCategories = Object.keys(permissions);
  const assignedCount = filteredPermissions.filter(p => p.isAssigned).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Permissions for {role.name}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {assignedCount} of {filteredPermissions.length} permissions assigned
          </p>
        </div>

        <button
          onClick={loadPermissions}
          className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          title="Refresh permissions"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {showTemplates && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Permission Templates</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {PERMISSION_TEMPLATES.map(template => (
              <button
                key={template.id}
                onClick={() => applyTemplate(template)}
                className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-violet-300 hover:shadow-sm transition-all"
              >
                <div className="text-sm font-medium text-gray-900">{template.name}</div>
                <div className="text-xs text-gray-500 mt-1">{template.description}</div>
                <div className="text-xs text-violet-600 mt-2">
                  {template.permissions.length} permissions
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Role Permissions
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Control page access and feature permissions for this role
        </p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="flex items-center space-x-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          >
            <option value="all">All Categories ({filteredPermissions.length})</option>
            {permissionCategories.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)} ({permissions[category].length})
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search permissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 w-64"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        {selectedCategory === 'all' ? (
          Object.entries(permissions)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, categoryPermissions]) => {
              const filteredCategoryPerms = categoryPermissions.filter(p => {
                if (searchTerm) {
                  const term = searchTerm.toLowerCase();
                  return p.name.toLowerCase().includes(term) ||
                    p.description?.toLowerCase().includes(term);
                }
                return true;
              });

              if (filteredCategoryPerms.length === 0) return null;

              const isExpanded = expandedCategories.has(category);
              const assignedInCategory = filteredCategoryPerms.filter(p => p.isAssigned).length;

              return (
                <div key={category} className="border-b border-gray-200 last:border-b-0">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <svg
                        className={`w-4 h-4 mr-3 text-gray-600 transform transition-transform ${isExpanded ? 'rotate-90' : ''
                          }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <h4 className="text-sm font-medium text-gray-900 capitalize">
                        {category}
                      </h4>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{assignedInCategory}/{filteredCategoryPerms.length} assigned</span>
                      <div className={`w-2 h-2 rounded-full ${assignedInCategory === filteredCategoryPerms.length
                          ? 'bg-green-400'
                          : assignedInCategory > 0
                            ? 'bg-yellow-400'
                            : 'bg-gray-300'
                        }`} />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-4">
                      <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                        <p className="text-xs text-gray-500">
                          Quick actions for all permissions in this category
                        </p>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => grantAllInCategory(filteredCategoryPerms)}
                            disabled={filteredCategoryPerms.every(p => p.isAssigned)}
                            className="text-xs px-3 py-1 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded transition-colors"
                          >
                            Grant All
                          </button>
                          <button
                            onClick={() => revokeAllInCategory(filteredCategoryPerms)}
                            disabled={filteredCategoryPerms.every(p => !p.isAssigned)}
                            className="text-xs px-3 py-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-700 rounded transition-colors"
                          >
                            Revoke All
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-2">
                        {filteredCategoryPerms.map(permission => (
                          <PermissionRow
                            key={permission.id}
                            permission={permission}
                            isUpdating={savingPermissions.has(permission.id)}
                            onToggle={togglePermission}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
        ) : (
          <div className="p-6">
            <div className="grid gap-2">
              {filteredPermissions.map(permission => (
                <PermissionRow
                  key={permission.id}
                  permission={permission}
                  isUpdating={savingPermissions.has(permission.id)}
                  onToggle={togglePermission}
                />
              ))}
            </div>
          </div>
        )}

        {filteredPermissions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Permissions Found</h3>
            <p className="text-gray-600">
              {searchTerm
                ? `No permissions match "${searchTerm}"`
                : selectedCategory !== 'all'
                  ? `No permissions in the ${selectedCategory} category`
                  : 'No permissions are configured'
              }
            </p>
          </div>
        )}
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-gray-700">Assigned ({assignedCount})</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              <span className="text-gray-700">Not Assigned ({filteredPermissions.length - assignedCount})</span>
            </div>
          </div>
          <div className="text-gray-600">
            Total: {filteredPermissions.length} permissions
          </div>
        </div>
      </div>
    </div>
  );
}

function PermissionRow({
  permission,
  isUpdating,
  onToggle
}: {
  permission: PermissionWithStatus;
  isUpdating: boolean;
  onToggle: (permissionId: string, currentlyAssigned: boolean) => void;
}) {
  return (
    <div className={`flex items-center p-3 rounded-lg border transition-all ${permission.isAssigned
        ? 'bg-green-50 border-green-200'
        : 'bg-white border-gray-200'
      }`}>
      <button
        onClick={() => onToggle(permission.id, permission.isAssigned)}
        disabled={isUpdating}
        className={`w-4 h-4 rounded border-2 transition-all mr-3 ${permission.isAssigned
            ? 'bg-green-500 border-green-500 hover:bg-green-600'
            : 'border-gray-300 hover:border-gray-400'
          } ${isUpdating ? 'opacity-50' : ''}`}
      >
        {isUpdating ? (
          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
        ) : permission.isAssigned ? (
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : null}
      </button>

      <div className="flex-1">
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-900">{permission.name}</span>
        </div>
        {permission.description && (
          <p className="text-xs text-gray-500 mt-1">{permission.description}</p>
        )}
      </div>

      <div className={`w-2 h-2 rounded-full ${permission.isAssigned ? 'bg-green-400' : 'bg-gray-300'
        }`} />
    </div>
  );
}
