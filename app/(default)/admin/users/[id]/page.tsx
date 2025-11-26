"use client";

import { useState, useEffect, Fragment } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Dialog, Transition } from "@headlessui/react";
import { TrashIcon } from "@heroicons/react/24/outline";
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
  userType: { id: string; name: string };
}

interface UserLocation {
  location: Location;
  isPrimary: boolean;
  isActive: boolean;
}

interface UserRole {
  role: Role;
  location: Location | null;
  isActive: boolean;
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
  updatedAt: string;
}

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    jobTitle: "",
    isActive: true,
  });

  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchUser();
    fetchLocations();
    fetchRoles();
  }, [userId]);

  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        toast.error("User not found");
        router.push("/admin/users");
        return;
      }
      const data = await response.json();
      setUser(data.user);
      setFormData({
        name: data.user.name || "",
        email: data.user.email || "",
        phone: data.user.phone || "",
        jobTitle: data.user.jobTitle || "",
        isActive: data.user.isActive ?? true,
      });
      setSelectedLocationIds(
        data.user.locations
          .filter((ul: UserLocation) => ul.isActive)
          .map((ul: UserLocation) => ul.location.id)
      );
      if (data.user.userRoles.length > 0) {
        setSelectedRoleId(data.user.userRoles[0].role.id);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      toast.error("Failed to load user");
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

  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/roles?isActive=true");
      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles || []);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const isChecked =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? isChecked : value,
    }));
  };

  const handleLocationToggle = (locationId: string) => {
    setSelectedLocationIds((prev) =>
      prev.includes(locationId)
        ? prev.filter((id) => id !== locationId)
        : [...prev, locationId]
    );
  };

  const handleSelectAllLocations = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedLocationIds(locations.map((loc) => loc.id));
    } else {
      setSelectedLocationIds([]);
    }
  };

  const allLocationsSelected = locations.length > 0 && selectedLocationIds.length === locations.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update user");
      }

      if (selectedLocationIds.length > 0) {
        await fetch(`/api/users/${userId}/locations`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locationIds: selectedLocationIds }),
        });
      }

      if (selectedRoleId) {
        await fetch(`/api/users/${userId}/roles`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roleAssignments: [{ roleId: selectedRoleId }],
          }),
        });
      }

      toast.success("User updated successfully");
      fetchUser();
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error(`Failed to update user: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async () => {
    try {
      const newActiveStatus = !formData.isActive;

      setFormData((prev) => ({
        ...prev,
        isActive: newActiveStatus,
      }));

      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: [userId],
          action: newActiveStatus ? "activate" : "deactivate",
        }),
      });

      if (!response.ok) {
        setFormData((prev) => ({
          ...prev,
          isActive: !newActiveStatus,
        }));
        toast.error("Failed to update user status");
        return;
      }

      toast.success(
        `User ${newActiveStatus ? "activated" : "deactivated"} successfully`
      );
    } catch (error) {
      console.error("Error toggling user status:", error);
      toast.error("An error occurred");
    }
  };

  const handleDeleteUser = async () => {
    if (confirmationText !== "DELETE") return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      toast.success("User deleted successfully");
      router.push("/admin/users");
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  };

  const getPrimaryRole = () => {
    if (!user || user.userRoles.length === 0) return null;
    return user.userRoles[0].role;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
          <span className="ml-2">Loading user...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <p className="text-center text-gray-500">User not found</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Toaster position="top-right" />

      <div className="mb-8">
        <Link
          href="/admin/users"
          className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-violet-600 mb-3"
        >
          <svg
            className="mr-2 w-4 h-4 fill-current text-gray-400"
            viewBox="0 0 16 16"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M9.4 13.4l-4.7-4.8 4.7-4.8 1.4 1.4-3.4 3.4 3.4 3.4z" />
          </svg>
          <span>Back to Users</span>
        </Link>

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">User Profile</h2>
          <span
            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
              formData.isActive
                ? "bg-emerald-100 text-emerald-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {formData.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-xl">
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-60 lg:w-72 md:shrink-0 md:border-r border-gray-200">
            <div className="p-6 space-y-6">
              <div className="flex flex-col items-center">
                <div className="mb-3">
                  <UserAvatarSimple
                    src={user.avatar}
                    alt={user.name}
                    size={80}
                    className="w-20 h-20"
                  />
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-800">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>

              {getPrimaryRole() && (
                <div className="flex justify-center">
                  <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
                    {getPrimaryRole()?.name}
                  </span>
                </div>
              )}

              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase text-gray-500">
                  Actions
                </h3>

                <button
                  onClick={handleToggleActive}
                  className={`w-full btn ${
                    formData.isActive
                      ? "bg-white border-rose-300 hover:border-rose-500 text-gray-700"
                      : "bg-white border-emerald-300 hover:border-emerald-500 text-gray-700"
                  }`}
                >
                  {formData.isActive ? "Deactivate User" : "Activate User"}
                </button>

                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="w-full btn bg-white border-rose-300 hover:border-rose-500 text-rose-500"
                >
                  <TrashIcon className="w-4 h-4 mr-2 shrink-0" />
                  <span>Delete User</span>
                </button>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Created: {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="grow">
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg font-semibold text-gray-800">
                    User Details
                  </h3>
                </div>

                <section>
                  <h4 className="text-sm font-semibold text-gray-800 mb-4">
                    Personal Information
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <label
                        className="block text-sm font-medium mb-1"
                        htmlFor="name"
                      >
                        Full Name
                      </label>
                      <input
                        id="name"
                        name="name"
                        className="form-input w-full"
                        type="text"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div>
                      <label
                        className="block text-sm font-medium mb-1"
                        htmlFor="jobTitle"
                      >
                        Job Title
                      </label>
                      <input
                        id="jobTitle"
                        name="jobTitle"
                        className="form-input w-full"
                        type="text"
                        value={formData.jobTitle}
                        onChange={handleInputChange}
                        placeholder="e.g., Manager"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          className="block text-sm font-medium mb-1"
                          htmlFor="email"
                        >
                          Email Address
                        </label>
                        <input
                          id="email"
                          name="email"
                          className="form-input w-full"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div>
                        <label
                          className="block text-sm font-medium mb-1"
                          htmlFor="phone"
                        >
                          Phone Number
                        </label>
                        <input
                          id="phone"
                          name="phone"
                          className="form-input w-full"
                          type="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="(555) 555-5555"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="text-sm font-semibold text-gray-800 mb-4">
                    Access Information
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <label
                        className="block text-sm font-medium mb-1"
                        htmlFor="role"
                      >
                        Role
                      </label>
                      <select
                        id="role"
                        className="form-select w-full"
                        value={selectedRoleId}
                        onChange={(e) => setSelectedRoleId(e.target.value)}
                      >
                        <option value="">Select role</option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                            {role.userType?.name
                              ? ` (${role.userType.name})`
                              : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Locations
                      </label>
                      <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                        {locations.length === 0 ? (
                          <p className="text-sm text-gray-500">
                            No locations available
                          </p>
                        ) : (
                          <>
                            <label className="flex items-center pb-2 mb-2 border-b border-gray-200">
                              <input
                                type="checkbox"
                                className="form-checkbox"
                                checked={allLocationsSelected}
                                onChange={(e) =>
                                  handleSelectAllLocations(e.target.checked)
                                }
                              />
                              <span className="ml-2 text-sm font-medium text-gray-700">
                                All Locations
                              </span>
                            </label>
                            {locations.map((location) => (
                            <label
                              key={location.id}
                              className="flex items-center"
                            >
                              <input
                                type="checkbox"
                                className="form-checkbox"
                                checked={selectedLocationIds.includes(
                                  location.id
                                )}
                                onChange={() =>
                                  handleLocationToggle(location.id)
                                }
                              />
                              <span className="ml-2 text-sm text-gray-700">
                                {location.name}
                              </span>
                            </label>
                          ))}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <Link
                    href="/admin/users"
                    className="btn bg-white border-gray-200 hover:border-gray-300 text-gray-600"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    className="btn bg-violet-500 hover:bg-violet-600 text-white"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
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
                        Are you sure you want to delete "{user.name}"? This
                        action cannot be undone and all associated data will be
                        permanently removed.
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
                        setIsDeleteModalOpen(false);
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
                      onClick={handleDeleteUser}
                      disabled={confirmationText !== "DELETE" || isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Delete User"}
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
