"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import UserAvatarSimple from "@/components/user-avatar-simple";
import { toast, Toaster } from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

interface Location {
  id: string;
  name: string;
  code?: string;
}

interface UserType {
  id: string;
  name: string;
  hierarchyLevel: number;
}

interface Role {
  id: string;
  name: string;
  userTypeId: string;
  userType: UserType;
}

interface AllowedAssignments {
  userTypes: UserType[];
  roles: Role[];
  locations: Location[];
  hierarchyLevel: number | null;
  dataScope: string | null;
  canManageAllLocations: boolean;
}

export default function CreateUserPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [allowedAssignments, setAllowedAssignments] = useState<AllowedAssignments | null>(null);
  const [noPermissions, setNoPermissions] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    jobTitle: "",
    isActive: true,
  });

  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");

  useEffect(() => {
    fetchAllowedAssignments();
  }, []);

  const fetchAllowedAssignments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/users/allowed-assignments");
      if (response.ok) {
        const data = await response.json();
        setAllowedAssignments(data);
        if (data.userTypes.length === 0 && data.roles.length === 0) {
          setNoPermissions(true);
        }
      }
    } catch (error) {
      console.error("Error fetching allowed assignments:", error);
      toast.error("Failed to load permissions");
    } finally {
      setIsLoading(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const supabase = createClient();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password || Math.random().toString(36).slice(-12),
        options: {
          data: {
            full_name: formData.name,
          },
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error("Failed to create auth user");
      }

      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: authData.user.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          jobTitle: formData.jobTitle,
          locationIds: selectedLocationIds,
          roleAssignments: selectedRoleId
            ? [{ roleId: selectedRoleId }]
            : [],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create user");
      }

      if (!formData.password) {
        await supabase.auth.resetPasswordForEmail(formData.email);
        toast.success(
          "User created! A password reset email has been sent.",
          { duration: 5000 }
        );
      } else {
        toast.success("User created successfully!");
      }

      router.push("/admin/users");
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(`Failed to create user: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const getSelectedRole = () => {
    return allowedAssignments?.roles.find((r) => r.id === selectedRoleId);
  };

  const getRolesByUserType = () => {
    if (!allowedAssignments) return {};
    
    const grouped: Record<string, Role[]> = {};
    for (const role of allowedAssignments.roles) {
      const userTypeName = role.userType?.name || 'Other';
      if (!grouped[userTypeName]) {
        grouped[userTypeName] = [];
      }
      grouped[userTypeName].push(role);
    }
    return grouped;
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  if (noPermissions) {
    return (
      <div className="p-6">
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
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-amber-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-amber-800">Insufficient Permissions</h3>
              <p className="text-amber-700 mt-1">
                You do not have permission to create users. This could be because:
              </p>
              <ul className="list-disc list-inside text-amber-700 mt-2 space-y-1">
                <li>You haven't been assigned a role yet</li>
                <li>Your role doesn't have user management permissions</li>
                <li>You can only manage users with lower authority than your own</li>
              </ul>
              <p className="text-amber-700 mt-3">
                Please contact your administrator if you believe this is an error.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const rolesByUserType = getRolesByUserType();

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

        <h2 className="text-xl font-semibold text-gray-800">Create New User</h2>
      </div>

      <div className="bg-white shadow-sm rounded-xl">
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-60 lg:w-72 md:shrink-0 md:border-r border-gray-200">
            <div className="p-6 space-y-6">
              <div className="flex flex-col items-center">
                <div className="mb-3">
                  <UserAvatarSimple
                    src={null}
                    alt={formData.name || "New User"}
                    size={80}
                    className="w-20 h-20"
                  />
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-800">
                    {formData.name || "New User"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formData.email || "Enter email address"}
                  </p>
                </div>
              </div>

              {getSelectedRole() && (
                <div className="flex justify-center">
                  <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
                    {getSelectedRole()?.name}
                  </span>
                </div>
              )}

              <div className="flex justify-center">
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

              {selectedLocationIds.length > 0 && allowedAssignments && (
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                    Locations
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedLocationIds.map((locId) => {
                      const location = allowedAssignments.locations.find((l) => l.id === locId);
                      return location ? (
                        <span
                          key={locId}
                          className="inline-flex px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700"
                        >
                          {location.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
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
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="name"
                        name="name"
                        className="form-input w-full"
                        type="text"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="John Doe"
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
                          Email Address <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="email"
                          name="email"
                          className="form-input w-full"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          placeholder="john.doe@example.com"
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

                    <div>
                      <label
                        className="block text-sm font-medium mb-1"
                        htmlFor="password"
                      >
                        Password{" "}
                        <span className="text-gray-500 font-normal">
                          (Optional)
                        </span>
                      </label>
                      <input
                        id="password"
                        name="password"
                        className="form-input w-full"
                        type="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Leave blank to send password reset email"
                        minLength={6}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        If left blank, a password reset email will be sent to
                        the user. Minimum 6 characters if provided.
                      </p>
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
                        {Object.entries(rolesByUserType).map(([userTypeName, roles]) => (
                          <optgroup key={userTypeName} label={userTypeName}>
                            {roles.map((role) => (
                              <option key={role.id} value={role.id}>
                                {role.name}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      {allowedAssignments && allowedAssignments.roles.length === 0 && (
                        <p className="mt-1 text-xs text-amber-600">
                          No roles available. You can only assign roles from user types with lower authority than your own.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Locations
                        {allowedAssignments && !allowedAssignments.canManageAllLocations && (
                          <span className="ml-2 text-xs font-normal text-gray-500">
                            (Showing locations you have access to)
                          </span>
                        )}
                      </label>
                      <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                        {!allowedAssignments || allowedAssignments.locations.length === 0 ? (
                          <p className="text-sm text-gray-500">
                            No locations available
                          </p>
                        ) : (
                          allowedAssignments.locations.map((location) => (
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
                                {location.name}{" "}
                                {location.code && `(${location.code})`}
                              </span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="flex items-center">
                      <input
                        id="isActive"
                        name="isActive"
                        type="checkbox"
                        className="form-checkbox"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                      />
                      <label
                        htmlFor="isActive"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        User is active
                      </label>
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
                        Creating User...
                      </>
                    ) : (
                      "Create User"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
