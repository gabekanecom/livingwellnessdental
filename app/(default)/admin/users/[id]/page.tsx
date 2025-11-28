"use client";

import { useState, useEffect, Fragment, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Dialog, Transition } from "@headlessui/react";
import { TrashIcon, CameraIcon, AcademicCapIcon, CheckCircleIcon, ClockIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import UserAvatarSimple from "@/components/user-avatar-simple";
import ImageCropper from "@/components/ImageCropper";
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

interface LearningStats {
  totalEnrollments: number;
  completedEnrollments: number;
  activeEnrollments: number;
  avgProgress: number;
  avgDaysToComplete: number;
  completionRate: number;
}

interface CourseEnrollment {
  id: string;
  status: string;
  progress: number;
  lessonsCompleted: number;
  totalLessons: number;
  enrolledAt: string;
  lastAccessedAt: string | null;
  completedAt: string | null;
  daysSinceEnrollment: number;
  daysSinceActivity: number | null;
  course: {
    id: string;
    title: string;
    description: string;
    coverImage: string | null;
    difficulty: string;
    duration: number | null;
    category: { id: string; name: string } | null;
  };
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

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Learning data state
  const [learningStats, setLearningStats] = useState<LearningStats | null>(null);
  const [courseEnrollments, setCourseEnrollments] = useState<CourseEnrollment[]>([]);
  const [isLoadingLearning, setIsLoadingLearning] = useState(false);

  useEffect(() => {
    fetchUser();
    fetchLocations();
    fetchRoles();
    fetchLearningData();
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

  const fetchLearningData = async () => {
    setIsLoadingLearning(true);
    try {
      const response = await fetch(`/api/users/${userId}/learning`);
      if (response.ok) {
        const data = await response.json();
        setLearningStats(data.stats);
        setCourseEnrollments(data.enrollments);
      }
    } catch (error) {
      console.error("Error fetching learning data:", error);
    } finally {
      setIsLoadingLearning(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ACTIVE: "bg-blue-100 text-blue-800",
      COMPLETED: "bg-green-100 text-green-800",
      PAUSED: "bg-yellow-100 text-yellow-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return styles[status] || "bg-gray-100 text-gray-800";
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCroppedImage = async (croppedBlob: Blob) => {
    setIsUploadingImage(true);
    try {
      const fileName = `profile_${Date.now()}.jpg`;
      const file = new File([croppedBlob], fileName, { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", userId);

      const response = await fetch("/api/upload/profile-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      
      setUser((prev) => prev ? { ...prev, avatar: data.url } : null);
      toast.success("Profile image updated");
      window.dispatchEvent(new CustomEvent('avatarUpdated'));
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploadingImage(false);
      setSelectedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
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
                <div className="mb-3 relative group">
                  <UserAvatarSimple
                    src={user.avatar}
                    alt={user.name}
                    size={80}
                    className="w-20 h-20"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    {isUploadingImage ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                    ) : (
                      <CameraIcon className="h-6 w-6 text-white" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-800">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 text-xs text-violet-600 hover:text-violet-700"
                >
                  Change Photo
                </button>
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

      {/* Learning Progress Section */}
      <div className="mt-6 bg-white shadow-sm rounded-xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-violet-100 p-2 rounded-lg">
                <AcademicCapIcon className="h-5 w-5 text-violet-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Learning Progress</h3>
            </div>
            {learningStats && learningStats.totalEnrollments > 0 && (
              <Link
                href="/lms/analytics"
                className="text-sm text-violet-600 hover:text-violet-700"
              >
                View in Analytics →
              </Link>
            )}
          </div>

          {isLoadingLearning ? (
            <div className="animate-pulse space-y-4">
              <div className="grid grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
              <div className="h-32 bg-gray-200 rounded-lg"></div>
            </div>
          ) : learningStats && learningStats.totalEnrollments > 0 ? (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <AcademicCapIcon className="w-4 h-4" />
                    <span className="text-xs">Enrolled Courses</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{learningStats.totalEnrollments}</p>
                  <p className="text-xs text-gray-500">{learningStats.activeEnrollments} active</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <CheckCircleIcon className="w-4 h-4" />
                    <span className="text-xs">Completed</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{learningStats.completedEnrollments}</p>
                  <p className="text-xs text-gray-500">{learningStats.completionRate}% completion rate</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <ChartBarIcon className="w-4 h-4" />
                    <span className="text-xs">Avg Progress</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{learningStats.avgProgress}%</p>
                  <p className="text-xs text-gray-500">across all courses</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <ClockIcon className="w-4 h-4" />
                    <span className="text-xs">Avg Days to Complete</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{learningStats.avgDaysToComplete}</p>
                  <p className="text-xs text-gray-500">for completed courses</p>
                </div>
              </div>

              {/* Course List */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-800">Course Enrollments</h4>
                {courseEnrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    {/* Course Image */}
                    {enrollment.course.coverImage ? (
                      <img
                        src={enrollment.course.coverImage}
                        alt=""
                        className="w-16 h-12 rounded object-cover"
                      />
                    ) : (
                      <div className="w-16 h-12 rounded bg-gray-100 flex items-center justify-center">
                        <AcademicCapIcon className="w-6 h-6 text-gray-400" />
                      </div>
                    )}

                    {/* Course Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate">
                          {enrollment.course.title}
                        </p>
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                            enrollment.status
                          )}`}
                        >
                          {enrollment.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        <span>
                          Enrolled {formatDate(enrollment.enrolledAt)}
                        </span>
                        {enrollment.completedAt && (
                          <span>
                            Completed {formatDate(enrollment.completedAt)}
                          </span>
                        )}
                        {!enrollment.completedAt && enrollment.lastAccessedAt && (
                          <span>
                            Last active {enrollment.daysSinceActivity} days ago
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              enrollment.progress >= 100
                                ? "bg-green-500"
                                : enrollment.progress >= 50
                                ? "bg-violet-500"
                                : "bg-amber-500"
                            }`}
                            style={{ width: `${enrollment.progress}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-12 text-right">
                          {enrollment.progress}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {enrollment.lessonsCompleted}/{enrollment.totalLessons} lessons
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <AcademicCapIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No course enrollments yet</p>
              <p className="text-sm text-gray-400 mt-1">
                This user hasn&apos;t been enrolled in any courses
              </p>
            </div>
          )}
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

      {selectedImage && (
        <ImageCropper
          image={selectedImage}
          onCropComplete={handleCroppedImage}
          onCancel={() => {
            setSelectedImage(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }}
          aspectRatio={1}
        />
      )}
    </div>
  );
}
