"use client";

import { useState, useEffect, Fragment } from "react";
import { Dialog, Transition, Menu } from "@headlessui/react";
import {
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import UserAvatarSimple from "@/components/user-avatar-simple";
import { toast, Toaster } from "react-hot-toast";

interface Location {
  id: string;
  name: string;
  code: string;
}

interface Role {
  id: string;
  name: string;
  userType: { name: string };
}

interface UserLocation {
  location: Location;
  isPrimary: boolean;
}

interface UserRole {
  role: Role;
  location: Location | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  jobTitle?: string;
  isActive: boolean;
  locations: UserLocation[];
  userRoles: UserRole[];
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [showInactiveUsers, setShowInactiveUsers] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isBulkOperationLoading, setIsBulkOperationLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");

  useEffect(() => {
    fetchUsers();
    fetchLocations();
  }, [pagination.page, searchTerm, selectedLocation, showInactiveUsers]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (searchTerm) params.append("search", searchTerm);
      if (selectedLocation) params.append("locationId", selectedLocation);
      if (!showInactiveUsers) params.append("isActive", "true");

      const response = await fetch(`/api/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await fetch("/api/locations?isActive=true");
      if (response.ok) {
        const data = await response.json();
        setLocations(data.locations || []);
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  const handleSort = (column: string) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const renderSortIndicator = (column: string) => {
    if (column !== sortColumn) {
      return (
        <svg
          className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-50"
          viewBox="0 0 12 12"
          fill="currentColor"
        >
          <path d="M6 0l3 4H3l3-4zm0 12l3-4H3l3 4z" />
        </svg>
      );
    }
    return sortDirection === "asc" ? (
      <svg className="w-3 h-3 ml-1" viewBox="0 0 12 12" fill="currentColor">
        <path d="M6 0l3 4H3l3-4z" />
      </svg>
    ) : (
      <svg className="w-3 h-3 ml-1" viewBox="0 0 12 12" fill="currentColor">
        <path d="M6 12l3-4H3l3 4z" />
      </svg>
    );
  };

  const sortedUsers = [...users].sort((a, b) => {
    switch (sortColumn) {
      case "name":
        return sortDirection === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      case "email":
        return sortDirection === "asc"
          ? a.email.localeCompare(b.email)
          : b.email.localeCompare(a.email);
      case "isActive":
        const activeValueA = a.isActive ? 1 : 0;
        const activeValueB = b.isActive ? 1 : 0;
        return sortDirection === "asc"
          ? activeValueA - activeValueB
          : activeValueB - activeValueA;
      default:
        return 0;
    }
  });

  const handleSelectUser = (userId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedUsers((prev) => [...prev, userId]);
    } else {
      setSelectedUsers((prev) => prev.filter((id) => id !== userId));
    }
  };

  const handleSelectAll = (isChecked: boolean) => {
    if (isChecked) {
      setSelectedUsers(sortedUsers.map((user) => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (action === "activate" || action === "deactivate") {
      setIsBulkOperationLoading(true);
      try {
        const response = await fetch("/api/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, userIds: selectedUsers }),
        });

        if (response.ok) {
          toast.success(`Users ${action}d successfully`);
          fetchUsers();
        } else {
          toast.error(`Failed to ${action} users`);
        }
      } catch (error) {
        console.error(`Error during bulk ${action}:`, error);
        toast.error(`An error occurred during the bulk ${action}`);
      } finally {
        setIsBulkOperationLoading(false);
        setSelectedUsers([]);
      }
    } else if (action === "delete") {
      setIsBulkDeleteModalOpen(true);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("User deleted successfully");
        fetchUsers();
      } else {
        toast.error("Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("An error occurred while deleting the user");
    }

    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const handleBulkDeleteConfirm = async () => {
    if (confirmationText !== "DELETE") return;

    setIsBulkOperationLoading(true);
    try {
      for (const userId of selectedUsers) {
        await fetch(`/api/users/${userId}`, { method: "DELETE" });
      }
      toast.success("Users deleted successfully");
      fetchUsers();
    } catch (error) {
      console.error("Error during bulk delete:", error);
      toast.error("An error occurred during the bulk delete");
    } finally {
      setIsBulkOperationLoading(false);
      setSelectedUsers([]);
      setIsBulkDeleteModalOpen(false);
      setConfirmationText("");
    }
  };

  const getPrimaryRole = (user: User) => {
    if (user.userRoles.length === 0) return null;
    return user.userRoles[0].role;
  };

  if (isLoading && users.length === 0) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
          <span className="ml-2">Loading users...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Toaster position="top-right" />

      <div className="sm:flex sm:justify-between sm:items-center mb-8">
        <div className="mb-4 sm:mb-0">
          <h2 className="text-xl font-semibold text-gray-800">
            User Management
          </h2>
          <p className="text-sm text-gray-500">
            Manage user accounts, roles, and access
          </p>
        </div>

        <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
          {selectedUsers.length > 0 && (
            <Menu as="div" className="relative inline-flex">
              <Menu.Button
                className="btn bg-white border-gray-200 hover:border-gray-300 text-gray-600"
                disabled={isBulkOperationLoading}
              >
                {isBulkOperationLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    Bulk Actions ({selectedUsers.length})
                    <svg
                      className="w-3 h-3 shrink-0 ml-2 fill-current text-gray-400"
                      viewBox="0 0 12 12"
                    >
                      <path d="M5.9 11.4L.5 6l1.4-1.4 4 4 4-4L11.3 6z" />
                    </svg>
                  </>
                )}
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 -translate-y-2"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-out duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Menu.Items className="origin-top-right z-10 absolute top-full min-w-[14rem] bg-white border border-gray-200 py-1.5 rounded-lg shadow-lg mt-1 right-0">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => handleBulkAction("activate")}
                        className={`w-full text-left flex items-center py-1 px-3 text-sm ${
                          active ? "bg-gray-50" : ""
                        } text-gray-700`}
                      >
                        <CheckIcon className="mr-2 h-4 w-4 text-gray-400" />
                        Activate
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => handleBulkAction("deactivate")}
                        className={`w-full text-left flex items-center py-1 px-3 text-sm ${
                          active ? "bg-gray-50" : ""
                        } text-gray-700`}
                      >
                        <XMarkIcon className="mr-2 h-4 w-4 text-gray-400" />
                        Deactivate
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => handleBulkAction("delete")}
                        className={`w-full text-left flex items-center py-1 px-3 text-sm ${
                          active ? "bg-gray-50" : ""
                        } text-rose-500`}
                      >
                        <TrashIcon className="mr-2 h-4 w-4 text-rose-500" />
                        Delete Selected
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          )}

          <div className="relative">
            <input
              type="text"
              className="form-input pl-9 w-full"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>

          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="form-select"
          >
            <option value="">All Locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>

          <Link
            href="/admin/users/new"
            className="btn bg-violet-500 hover:bg-violet-600 text-white"
          >
            <svg
              className="w-4 h-4 fill-current opacity-50 shrink-0"
              viewBox="0 0 16 16"
            >
              <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z" />
            </svg>
            <span className="hidden xs:block ml-2">Add User</span>
          </Link>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-gray-200">
        <header className="px-4 sm:px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h3 className="font-semibold text-gray-800">
            All Users{" "}
            <span className="text-gray-400 font-medium">
              {pagination.total}
            </span>
          </h3>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={showInactiveUsers}
              onChange={() => setShowInactiveUsers(!showInactiveUsers)}
            />
            <span className="ml-2 text-sm text-gray-600">Show inactive</span>
          </label>
        </header>

        {/* Mobile Card Layout */}
        <div className="sm:hidden divide-y divide-gray-200">
          {sortedUsers.map((user) => (
            <div key={user.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="form-checkbox mt-1"
                    checked={selectedUsers.includes(user.id)}
                    onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                  />
                  <div className="w-10 h-10 shrink-0">
                    <UserAvatarSimple src={user.avatar} alt={user.name} size={40} />
                  </div>
                  <div>
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="font-medium text-gray-800 hover:text-violet-500"
                    >
                      {user.name}
                    </Link>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    {user.jobTitle && (
                      <p className="text-xs text-gray-400">{user.jobTitle}</p>
                    )}
                  </div>
                </div>
                <span
                  className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                    user.isActive
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {user.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="flex flex-wrap gap-1 pl-7">
                {user.locations.slice(0, 3).map((ul) => (
                  <span
                    key={ul.location.id}
                    className={`inline-flex items-center px-2 py-0.5 text-xs rounded ${
                      ul.isPrimary
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {ul.location.code || ul.location.name}
                  </span>
                ))}
                {user.locations.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{user.locations.length - 3}
                  </span>
                )}
                {getPrimaryRole(user) && (
                  <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-violet-100 text-violet-700">
                    {getPrimaryRole(user)?.name}
                  </span>
                )}
              </div>

              <div className="flex gap-2 pt-2 border-t border-gray-100 pl-7">
                <Link
                  href={`/admin/users/${user.id}`}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-violet-600 bg-gray-50 rounded-lg min-h-[44px]"
                >
                  <PencilIcon className="h-4 w-4" />
                  <span>Edit</span>
                </Link>
                <button
                  onClick={() => {
                    setUserToDelete(user);
                    setIsDeleteModalOpen(true);
                  }}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-rose-600 bg-gray-50 rounded-lg min-h-[44px]"
                >
                  <TrashIcon className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
          {sortedUsers.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500">
              No users found.
            </div>
          )}
        </div>

        {/* Desktop Table Layout */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="table-auto w-full">
            <thead className="text-xs font-semibold uppercase text-gray-500 bg-gray-50 border-t border-b border-gray-200">
              <tr>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap w-px">
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={
                      selectedUsers.length === sortedUsers.length &&
                      sortedUsers.length > 0
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <button
                    className="font-semibold text-left flex items-center group"
                    onClick={() => handleSort("name")}
                  >
                    User
                    {renderSortIndicator("name")}
                  </button>
                </th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <button
                    className="font-semibold text-left flex items-center group"
                    onClick={() => handleSort("email")}
                  >
                    Email
                    {renderSortIndicator("email")}
                  </button>
                </th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <span className="font-semibold text-left">Locations</span>
                </th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <span className="font-semibold text-left">Role</span>
                </th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <button
                    className="font-semibold text-left flex items-center group"
                    onClick={() => handleSort("isActive")}
                  >
                    Status
                    {renderSortIndicator("isActive")}
                  </button>
                </th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-200">
              {sortedUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap w-px">
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) =>
                        handleSelectUser(user.id, e.target.checked)
                      }
                    />
                  </td>
                  <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 shrink-0 mr-2 sm:mr-3">
                        <UserAvatarSimple
                          src={user.avatar}
                          alt={user.name}
                          size={40}
                        />
                      </div>
                      <div>
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="font-medium text-gray-800 hover:text-violet-500"
                        >
                          {user.name}
                        </Link>
                        {user.jobTitle && (
                          <p className="text-xs text-gray-500">
                            {user.jobTitle}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                    <span className="text-gray-600">{user.email}</span>
                  </td>
                  <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {user.locations.slice(0, 3).map((ul) => (
                        <span
                          key={ul.location.id}
                          className={`inline-flex items-center px-2 py-0.5 text-xs rounded ${
                            ul.isPrimary
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {ul.location.code || ul.location.name}
                        </span>
                      ))}
                      {user.locations.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{user.locations.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                    {getPrimaryRole(user) && (
                      <span className="inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full bg-violet-100 text-violet-700">
                        {getPrimaryRole(user)?.name}
                      </span>
                    )}
                  </td>
                  <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${
                        user.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="p-1 text-gray-400 hover:text-violet-600"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => {
                          setUserToDelete(user);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-1 text-gray-400 hover:text-rose-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {sortedUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-2 py-8 text-center text-gray-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-gray-500 text-center sm:text-left">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} users
            </p>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setPagination({ ...pagination, page: pagination.page - 1 })
                }
                disabled={pagination.page === 1}
                className="btn bg-white border-gray-200 hover:border-gray-300 text-gray-600 disabled:opacity-50 min-h-[44px]"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setPagination({ ...pagination, page: pagination.page + 1 })
                }
                disabled={pagination.page === pagination.totalPages}
                className="btn bg-white border-gray-200 hover:border-gray-300 text-gray-600 disabled:opacity-50 min-h-[44px]"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <Transition appear show={isDeleteModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setIsDeleteModalOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-white p-6 shadow-xl transition-all">
                  <div className="flex items-start">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100">
                      <TrashIcon className="h-5 w-5 text-rose-600" />
                    </div>
                    <div className="ml-4">
                      <Dialog.Title className="text-lg font-medium text-gray-900">
                        Delete User
                      </Dialog.Title>
                      <p className="mt-2 text-sm text-gray-500">
                        Are you sure you want to delete "{userToDelete?.name}"?
                        This action cannot be undone.
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      className="btn bg-white border-gray-200 hover:border-gray-300 text-gray-600"
                      onClick={() => setIsDeleteModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn bg-rose-500 hover:bg-rose-600 text-white"
                      onClick={handleDeleteUser}
                    >
                      Delete
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <Transition appear show={isBulkDeleteModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setIsBulkDeleteModalOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-white p-6 shadow-xl transition-all">
                  <div className="flex items-start">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100">
                      <TrashIcon className="h-5 w-5 text-rose-600" />
                    </div>
                    <div className="ml-4">
                      <Dialog.Title className="text-lg font-medium text-gray-900">
                        Delete Users
                      </Dialog.Title>
                      <p className="mt-2 text-sm text-gray-500">
                        Are you sure you want to delete {selectedUsers.length}{" "}
                        user{selectedUsers.length !== 1 ? "s" : ""}? This action
                        cannot be undone.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type "DELETE" to confirm:
                    </label>
                    <input
                      type="text"
                      value={confirmationText}
                      onChange={(e) => setConfirmationText(e.target.value)}
                      className="form-input w-full"
                      placeholder="DELETE"
                    />
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      className="btn bg-white border-gray-200 hover:border-gray-300 text-gray-600"
                      onClick={() => {
                        setIsBulkDeleteModalOpen(false);
                        setConfirmationText("");
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className={`btn text-white ${
                        confirmationText === "DELETE"
                          ? "bg-rose-500 hover:bg-rose-600"
                          : "bg-rose-300 cursor-not-allowed"
                      }`}
                      onClick={handleBulkDeleteConfirm}
                      disabled={
                        confirmationText !== "DELETE" || isBulkOperationLoading
                      }
                    >
                      {isBulkOperationLoading ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
