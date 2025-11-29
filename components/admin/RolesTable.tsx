'use client';

import React, { useState, useEffect, useRef } from 'react';

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
}

interface RoleWithStats extends RoleRecord {
  userTypeName: string;
  permissionCount: number;
  userCount: number;
}

interface RolesTableProps {
  userTypeFilter?: string;
  showActiveOnly?: boolean;
  onEditRole?: (role: RoleRecord | null) => void;
  onManagePermissions?: (role: RoleRecord) => void;
  onDataChange?: () => void;
  showCreateButton?: boolean;
  refreshTrigger?: number;
}

const DATA_SCOPE_LABELS: Record<string, { label: string; color: string }> = {
  SELF: { label: 'Self Only', color: 'bg-gray-100 text-gray-800' },
  LOCATION: { label: 'Location', color: 'bg-blue-100 text-blue-800' },
  ALL_LOCATIONS: { label: 'All Locations', color: 'bg-yellow-100 text-yellow-800' },
  GLOBAL: { label: 'Global', color: 'bg-purple-100 text-purple-800' }
};

export default function RolesTable({
  userTypeFilter,
  showActiveOnly = true,
  onEditRole,
  onManagePermissions,
  onDataChange,
  showCreateButton = true,
  refreshTrigger = 0
}: RolesTableProps) {
  const [roles, setRoles] = useState<RoleWithStats[]>([]);
  const [userTypes, setUserTypes] = useState<UserTypeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterUserType, setFilterUserType] = useState<string>(userTypeFilter || 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownRole, setDropdownRole] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const loadRoles = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (showActiveOnly) params.append('isActive', 'true');
      if (filterUserType !== 'all') params.append('userTypeId', filterUserType);

      const [rolesRes, userTypesRes] = await Promise.all([
        fetch(`/api/roles?${params}&includeStats=true`),
        fetch('/api/user-types?isActive=true')
      ]);

      if (!rolesRes.ok) throw new Error('Failed to load roles');
      if (!userTypesRes.ok) throw new Error('Failed to load user types');

      const rolesData = await rolesRes.json();
      const userTypesData = await userTypesRes.json();

      setUserTypes(userTypesData.userTypes || []);

      const userTypesMap = new Map(
        (userTypesData.userTypes || []).map((ut: UserTypeRecord) => [ut.id, ut.name])
      );

      const rolesWithStats = (rolesData.roles || []).map((role: any) => ({
        ...role,
        userTypeName: userTypesMap.get(role.userTypeId) || 'Unknown',
        permissionCount: role._count?.permissions || role.permissions?.length || 0,
        userCount: role._count?.userRoles || 0
      }));

      let filteredRoles = rolesWithStats;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredRoles = rolesWithStats.filter((role: RoleWithStats) =>
          role.name.toLowerCase().includes(term) ||
          role.description?.toLowerCase().includes(term) ||
          role.userTypeName.toLowerCase().includes(term)
        );
      }

      setRoles(filteredRoles);
    } catch (err) {
      console.error('Error loading roles:', err);
      setError(err instanceof Error ? err.message : 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, [filterUserType, showActiveOnly, searchTerm, refreshTrigger]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (dropdownRole && !target.closest('[data-dropdown]')) {
        setDropdownRole(null);
      }
    };

    if (dropdownRole) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRole]);

  const deleteRole = async (roleId: string, roleName: string) => {
    if (!window.confirm(`Are you sure you want to delete the role "${roleName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/roles/${roleId}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete role');
      }

      await loadRoles();
      onDataChange?.();
    } catch (err) {
      console.error('Error deleting role:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete role');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
        <span className="ml-3 text-gray-600">Loading roles...</span>
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
            <h3 className="text-sm font-medium text-red-800">Error Loading Roles</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
        <div className="mt-3">
          <button
            onClick={loadRoles}
            className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-end space-y-4 md:space-y-0">
        <div className="flex items-center space-x-4">
          <select
            value={filterUserType}
            onChange={(e) => setFilterUserType(e.target.value)}
            className="px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat"
          >
            <option value="all">All User Types</option>
            {userTypes.map(userType => (
              <option key={userType.id} value={userType.id}>
                {userType.name}
              </option>
            ))}
          </select>

          <div className="relative">
            <input
              type="text"
              placeholder="Search roles..."
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
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200 table-fixed">
            <colgroup>
              <col className="w-[28%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[10%]" />
              <col className="w-[12%]" />
              <col className="w-[8%]" />
            </colgroup>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data Scope
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Users
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider sr-only">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {roles.map((role) => (
                <tr key={role.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center min-w-0">
                      <div className="flex-shrink-0 h-10 w-10 bg-violet-500 rounded-lg flex items-center justify-center text-white font-medium text-sm">
                        {role.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="ml-3 min-w-0">
                        <div className="flex items-center flex-wrap gap-1">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {role.name}
                          </span>
                          {role.isDefault && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Default
                            </span>
                          )}
                          {role.isProtected && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                              Protected
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-800">
                      {role.userTypeName}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      DATA_SCOPE_LABELS[role.dataScope]?.color || 'bg-gray-100 text-gray-800'
                    }`}>
                      {DATA_SCOPE_LABELS[role.dataScope]?.label || role.dataScope}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center text-sm text-gray-900">
                    <span className="font-medium">{role.permissionCount}</span>
                  </td>
                  <td className="px-4 py-4 text-center text-sm text-gray-900">
                    <span className="font-medium">{role.userCount}</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      role.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {role.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-medium">
                    <div className="relative inline-block text-left" data-dropdown>
                      <button
                        type="button"
                        onClick={() => setDropdownRole(dropdownRole === role.id ? null : role.id)}
                        className="inline-flex items-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                      >
                        <span className="sr-only">Open options</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>

                      {dropdownRole === role.id && (
                        <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                          <div className="py-1">
                            {!role.isProtected && (
                              <button
                                onClick={() => {
                                  onEditRole?.(role);
                                  setDropdownRole(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                              >
                                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit Role
                              </button>
                            )}
                            <button
                              onClick={() => {
                                onManagePermissions?.(role);
                                setDropdownRole(null);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              Manage Permissions
                            </button>
                            {!role.isProtected && role.userCount === 0 && (
                              <>
                                <div className="border-t border-gray-100 my-1"></div>
                                <button
                                  onClick={() => {
                                    deleteRole(role.id, role.name);
                                    setDropdownRole(null);
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Delete Role
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {roles.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Roles Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterUserType !== 'all'
                ? 'No roles match your current filters'
                : 'Get started by creating your first role'
              }
            </p>
            {showCreateButton && (
              <button
                onClick={() => onEditRole?.(null)}
                className="inline-flex items-center px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Role
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
