'use client';

import Link from 'next/link';
import {
  UsersIcon,
  BuildingOffice2Icon,
  ShieldCheckIcon,
  KeyIcon
} from '@heroicons/react/24/outline';

const adminSections = [
  {
    name: 'Users',
    description: 'Manage user accounts, roles, and location assignments',
    href: '/admin/users',
    icon: UsersIcon,
    color: 'bg-blue-500'
  },
  {
    name: 'Locations',
    description: 'Manage dental office locations and settings',
    href: '/admin/locations',
    icon: BuildingOffice2Icon,
    color: 'bg-green-500'
  },
  {
    name: 'User Types & Roles',
    description: 'Configure user types, roles, and their permissions',
    href: '/admin/user-types',
    icon: ShieldCheckIcon,
    color: 'bg-purple-500'
  },
  {
    name: 'Permissions',
    description: 'View and manage system permissions',
    href: '/admin/permissions',
    icon: KeyIcon,
    color: 'bg-amber-500'
  }
];

export default function AdminDashboard() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
        <p className="text-gray-600 mt-1">
          Manage users, locations, roles, and system settings
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {adminSections.map((section) => (
          <Link
            key={section.name}
            href={section.href}
            className="block p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className={`${section.color} p-3 rounded-lg`}>
                <section.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {section.name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {section.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
