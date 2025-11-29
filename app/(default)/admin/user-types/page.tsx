'use client';

import React, { useState, useEffect } from 'react';
import UserTypesTable from '@/components/admin/UserTypesTable';
import UserTypeForm from '@/components/admin/UserTypeForm';
import RolesTable from '@/components/admin/RolesTable';
import RoleForm from '@/components/admin/RoleForm';
import RolePermissionsEditor from '@/components/admin/RolePermissionsEditor';

interface UserTypeRecord {
  id: string;
  name: string;
  description?: string;
  hierarchyLevel: number;
  isActive: boolean;
}

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

type ViewMode = 'table' | 'roles' | 'form' | 'role-form' | 'role-permissions';

export default function UserTypesAndRolesManagementPage() {
  const [currentView, setCurrentView] = useState<ViewMode>('table');
  const [selectedUserType, setSelectedUserType] = useState<UserTypeRecord | null>(null);
  const [selectedRole, setSelectedRole] = useState<RoleRecord | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleViewChange = (view: ViewMode) => {
    setCurrentView(view);
    if (view !== 'form') {
      setSelectedUserType(null);
    }
    if (view === 'roles') {
      setSelectedRole(null);
    }
  };

  const handleEditUserType = (userType: UserTypeRecord | null) => {
    setSelectedUserType(userType);
    setCurrentView('form');
  };

  const handleEditRole = (role: RoleRecord | null) => {
    setSelectedRole(role);
    setCurrentView('role-form');
  };

  const handleManagePermissions = (role: RoleRecord) => {
    setSelectedRole(role);
    setCurrentView('role-permissions');
  };

  const handleFormSuccess = () => {
    setCurrentView('table');
    setSelectedUserType(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleRoleFormSuccess = () => {
    setCurrentView('roles');
    setSelectedRole(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleFormCancel = () => {
    setCurrentView('table');
    setSelectedUserType(null);
  };

  const handleRoleFormCancel = () => {
    setCurrentView('roles');
    setSelectedRole(null);
  };

  const handleDataChange = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCreateClick = () => {
    if (currentView === 'roles') {
      handleEditRole(null);
    } else {
      handleEditUserType(null);
    }
  };

  return (
    <div className="p-6 w-full">
      <div className="mb-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              User Types & Roles Management
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage user types, roles, and their permission assignments.
            </p>
          </div>

          <div className="mt-4 sm:mt-0">
            {(currentView === 'table' || currentView === 'roles') && (
              <button
                onClick={handleCreateClick}
                className="inline-flex items-center px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {currentView === 'roles' ? 'Create Role' : 'Create User Type'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6">
        {selectedRole && currentView === 'role-permissions' && (
          <div className="mb-4">
            <button
              onClick={() => handleViewChange('roles')}
              className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Roles
            </button>
          </div>
        )}

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => handleViewChange('table')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                currentView === 'table'
                  ? 'border-violet-500 text-violet-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } transition-colors`}
            >
              User Types
            </button>

            <button
              onClick={() => handleViewChange('roles')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                currentView === 'roles'
                  ? 'border-violet-500 text-violet-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } transition-colors`}
            >
              Roles
            </button>

            {currentView === 'form' && (
              <button
                onClick={() => handleViewChange('form')}
                className="py-2 px-1 border-b-2 border-violet-500 text-violet-600 font-medium text-sm"
              >
                {selectedUserType ? 'Edit User Type' : 'Create User Type'}
              </button>
            )}

            {currentView === 'role-form' && (
              <button
                onClick={() => handleViewChange('role-form')}
                className="py-2 px-1 border-b-2 border-violet-500 text-violet-600 font-medium text-sm"
              >
                {selectedRole ? 'Edit Role' : 'Create Role'}
              </button>
            )}

            {currentView === 'role-permissions' && selectedRole && (
              <button
                onClick={() => handleViewChange('role-permissions')}
                className="py-2 px-1 border-b-2 border-violet-500 text-violet-600 font-medium text-sm"
              >
                Permissions: {selectedRole.name}
              </button>
            )}
          </nav>
        </div>
      </div>

      <div className="space-y-8">
        {currentView === 'table' && (
          <UserTypesTable
            onEditUserType={handleEditUserType}
            onDataChange={handleDataChange}
            showCreateButton={false}
            refreshTrigger={refreshTrigger}
          />
        )}

        {currentView === 'roles' && (
          <RolesTable
            showActiveOnly={true}
            onEditRole={handleEditRole}
            onManagePermissions={handleManagePermissions}
            onDataChange={handleDataChange}
            showCreateButton={false}
            refreshTrigger={refreshTrigger}
          />
        )}

        {currentView === 'form' && (
          <div className="max-w-4xl">
            <UserTypeForm
              userType={selectedUserType}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        )}

        {currentView === 'role-form' && (
          <div className="max-w-4xl">
            <RoleForm
              role={selectedRole}
              onSuccess={handleRoleFormSuccess}
              onCancel={handleRoleFormCancel}
            />
          </div>
        )}

        {currentView === 'role-permissions' && selectedRole && (
          <div className="max-w-6xl">
            <RolePermissionsEditor
              role={selectedRole}
              onPermissionsChange={handleDataChange}
              showTemplates={true}
            />
          </div>
        )}
      </div>

      {(currentView === 'table' || currentView === 'form') && (
        <div className="mt-12 bg-violet-50 border border-violet-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-violet-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-violet-800">
                User Types Management Guide
              </h3>
              <div className="mt-2 text-sm text-violet-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>User Types:</strong> Define different categories of users (Super Admin, Corporate, Location Staff)
                  </li>
                  <li>
                    <strong>Roles:</strong> Create specific job functions within each user type
                  </li>
                  <li>
                    <strong>Data Scope:</strong> Control what level of data access each role has
                  </li>
                  <li>
                    <strong>Best Practices:</strong> Start with predefined user types, then customize as needed
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentView === 'roles' && (
        <div className="mt-12 bg-violet-50 border border-violet-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-violet-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-violet-800">
                Roles Management Guide
              </h3>
              <div className="mt-2 text-sm text-violet-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>Roles:</strong> Define specific job functions within each user type (e.g., Manager, Staff)
                  </li>
                  <li>
                    <strong>Permissions:</strong> Click on a role to manage its specific permission assignments
                  </li>
                  <li>
                    <strong>Default Roles:</strong> Set default roles that are automatically assigned to new users
                  </li>
                  <li>
                    <strong>Data Scope:</strong> Control what level of data access each role has (self, location, all locations, global)
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentView === 'role-permissions' && (
        <div className="mt-12 bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Permission Assignment Tips
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>Templates:</strong> Start with a permission template that closely matches the role's needs
                  </li>
                  <li>
                    <strong>Bulk Operations:</strong> Use Grant All / Revoke All for quick category-wide changes
                  </li>
                  <li>
                    <strong>Categories:</strong> Permissions are organized by feature area for easier management
                  </li>
                  <li>
                    <strong>Visual Indicators:</strong> Green indicates assigned permissions, gray indicates unassigned
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
