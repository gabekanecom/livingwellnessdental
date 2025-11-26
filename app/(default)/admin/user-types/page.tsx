'use client';

import { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

interface Permission {
  id: string;
  name: string;
  category?: string;
}

interface RolePermission {
  permission: Permission;
}

interface Role {
  id: string;
  name: string;
  description?: string;
  dataScope: string;
  isDefault: boolean;
  isProtected: boolean;
  isActive: boolean;
  displayOrder: number;
  permissions: RolePermission[];
  _count?: { userRoles: number };
}

interface UserType {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  roles: Role[];
}

export default function UserTypesPage() {
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingType, setEditingType] = useState<UserType | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedUserType, setSelectedUserType] = useState<string>('');

  const [typeForm, setTypeForm] = useState({ id: '', name: '', description: '' });
  const [roleForm, setRoleForm] = useState({
    id: '',
    name: '',
    description: '',
    dataScope: 'LOCATION',
    isDefault: false,
    permissionIds: [] as string[]
  });

  useEffect(() => {
    fetchUserTypes();
    fetchPermissions();
  }, []);

  const fetchUserTypes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/user-types?includeRoles=true');
      if (response.ok) {
        const data = await response.json();
        setUserTypes(data.userTypes);
        if (data.userTypes.length > 0) {
          setExpandedTypes(new Set([data.userTypes[0].id]));
        }
      }
    } catch (error) {
      console.error('Error fetching user types:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/permissions?isActive=true');
      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permissions);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  const toggleExpanded = (typeId: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(typeId)) {
      newExpanded.delete(typeId);
    } else {
      newExpanded.add(typeId);
    }
    setExpandedTypes(newExpanded);
  };

  const handleSaveType = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingType ? `/api/user-types/${editingType.id}` : '/api/user-types';
      const method = editingType ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(typeForm)
      });

      if (response.ok) {
        setShowTypeModal(false);
        setEditingType(null);
        setTypeForm({ id: '', name: '', description: '' });
        fetchUserTypes();
      }
    } catch (error) {
      console.error('Error saving user type:', error);
    }
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingRole ? `/api/roles/${editingRole.id}` : '/api/roles';
      const method = editingRole ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...roleForm,
          userTypeId: selectedUserType
        })
      });

      if (response.ok) {
        const roleData = await response.json();
        const roleId = editingRole?.id || roleData.data.id;

        await fetch(`/api/roles/${roleId}/permissions`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ permissionIds: roleForm.permissionIds })
        });

        setShowRoleModal(false);
        setEditingRole(null);
        setRoleForm({ id: '', name: '', description: '', dataScope: 'LOCATION', isDefault: false, permissionIds: [] });
        fetchUserTypes();
      }
    } catch (error) {
      console.error('Error saving role:', error);
    }
  };

  const handleEditType = (type: UserType) => {
    setEditingType(type);
    setTypeForm({ id: type.id, name: type.name, description: type.description || '' });
    setShowTypeModal(true);
  };

  const handleEditRole = (role: Role, userTypeId: string) => {
    setEditingRole(role);
    setSelectedUserType(userTypeId);
    setRoleForm({
      id: role.id,
      name: role.name,
      description: role.description || '',
      dataScope: role.dataScope,
      isDefault: role.isDefault,
      permissionIds: role.permissions.map(p => p.permission.id)
    });
    setShowRoleModal(true);
  };

  const handleAddRole = (userTypeId: string) => {
    setEditingRole(null);
    setSelectedUserType(userTypeId);
    setRoleForm({ id: '', name: '', description: '', dataScope: 'LOCATION', isDefault: false, permissionIds: [] });
    setShowRoleModal(true);
  };

  const handleDeleteType = async (typeId: string) => {
    if (!confirm('Are you sure you want to delete this user type?')) return;
    try {
      const response = await fetch(`/api/user-types/${typeId}`, { method: 'DELETE' });
      if (response.ok) {
        fetchUserTypes();
      } else {
        const data = await response.json();
        alert(data.error);
      }
    } catch (error) {
      console.error('Error deleting user type:', error);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;
    try {
      const response = await fetch(`/api/roles/${roleId}`, { method: 'DELETE' });
      if (response.ok) {
        fetchUserTypes();
      } else {
        const data = await response.json();
        alert(data.error);
      }
    } catch (error) {
      console.error('Error deleting role:', error);
    }
  };

  const dataScopeLabels: Record<string, string> = {
    SELF: 'Own Data',
    LOCATION: 'Location Data',
    ALL_LOCATIONS: 'All Locations',
    GLOBAL: 'Global Access'
  };

  const permissionsByCategory = permissions.reduce((acc, perm) => {
    const cat = perm.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Types & Roles</h1>
          <p className="text-gray-600 mt-1">Configure user types, roles, and permissions</p>
        </div>
        <button
          onClick={() => { setEditingType(null); setTypeForm({ id: '', name: '', description: '' }); setShowTypeModal(true); }}
          className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
        >
          <PlusIcon className="h-4 w-4" />
          Add User Type
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : userTypes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No user types configured</div>
      ) : (
        <div className="space-y-4">
          {userTypes.map((type) => (
            <div key={type.id} className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div
                className="flex items-center justify-between px-6 py-4 cursor-pointer"
                onClick={() => toggleExpanded(type.id)}
              >
                <div className="flex items-center gap-3">
                  {expandedTypes.has(type.id) ? (
                    <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                  )}
                  <ShieldCheckIcon className="h-6 w-6 text-indigo-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{type.name}</h3>
                    {type.description && (
                      <p className="text-sm text-gray-500">{type.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <span className="text-sm text-gray-500">{type.roles.length} roles</span>
                  <button
                    onClick={() => handleEditType(type)}
                    className="p-1 text-gray-400 hover:text-indigo-600"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteType(type.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {expandedTypes.has(type.id) && (
                <div className="border-t border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-gray-700">Roles</h4>
                    <button
                      onClick={() => handleAddRole(type.id)}
                      className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Add Role
                    </button>
                  </div>

                  {type.roles.length === 0 ? (
                    <p className="text-sm text-gray-500 py-4">No roles defined</p>
                  ) : (
                    <div className="space-y-3">
                      {type.roles.map((role) => (
                        <div
                          key={role.id}
                          className={`flex items-center justify-between p-4 rounded-lg ${
                            role.isProtected ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{role.name}</span>
                              {role.isDefault && (
                                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">Default</span>
                              )}
                              {role.isProtected && (
                                <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded">Protected</span>
                              )}
                            </div>
                            {role.description && (
                              <p className="text-sm text-gray-500 mt-1">{role.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>Scope: {dataScopeLabels[role.dataScope]}</span>
                              <span>{role.permissions.length} permissions</span>
                              <span>{role._count?.userRoles || 0} users</span>
                            </div>
                          </div>
                          {!role.isProtected && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditRole(role, type.id)}
                                className="p-1 text-gray-400 hover:text-indigo-600"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteRole(role.id)}
                                className="p-1 text-gray-400 hover:text-red-600"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingType ? 'Edit User Type' : 'Add User Type'}
              </h2>
            </div>
            <form onSubmit={handleSaveType} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                <input
                  type="text"
                  required
                  disabled={!!editingType}
                  value={typeForm.id}
                  onChange={(e) => setTypeForm({ ...typeForm, id: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  placeholder="e.g., location_staff"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={typeForm.name}
                  onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={typeForm.description}
                  onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTypeModal(false)}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                >
                  {editingType ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingRole ? 'Edit Role' : 'Add Role'}
              </h2>
            </div>
            <form onSubmit={handleSaveRole} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingRole}
                    value={roleForm.id}
                    onChange={(e) => setRoleForm({ ...roleForm, id: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    placeholder="e.g., practice_manager"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={roleForm.name}
                    onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Scope</label>
                  <select
                    value={roleForm.dataScope}
                    onChange={(e) => setRoleForm({ ...roleForm, dataScope: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="SELF">Own Data Only</option>
                    <option value="LOCATION">Location Data</option>
                    <option value="ALL_LOCATIONS">All Locations</option>
                    <option value="GLOBAL">Global Access</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={roleForm.isDefault}
                      onChange={(e) => setRoleForm({ ...roleForm, isDefault: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Default role for new users</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                  {Object.entries(permissionsByCategory).map(([category, perms]) => (
                    <div key={category} className="border-b border-gray-100 last:border-0">
                      <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase">
                        {category}
                      </div>
                      <div className="p-2 space-y-1">
                        {perms.map((perm) => (
                          <label key={perm.id} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={roleForm.permissionIds.includes(perm.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setRoleForm({ ...roleForm, permissionIds: [...roleForm.permissionIds, perm.id] });
                                } else {
                                  setRoleForm({ ...roleForm, permissionIds: roleForm.permissionIds.filter(id => id !== perm.id) });
                                }
                              }}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">{perm.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                >
                  {editingRole ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
