"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import UserAvatarSimple from "@/components/user-avatar-simple";
import { toast, Toaster } from "react-hot-toast";
import { CameraIcon, UserIcon, BellIcon } from "@heroicons/react/24/outline";
import ImageCropper from "@/components/ImageCropper";

interface ProfileData {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  avatar: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  userRoles?: {
    role: {
      name: string;
    };
  }[];
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<"profile" | "notifications">("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [formattedPhone, setFormattedPhone] = useState("");
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Image upload
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    courseUpdates: true,
    newContent: true,
    reminders: false,
  });

  const formatPhoneNumber = (phoneNumberString: string) => {
    const cleaned = ("" + phoneNumberString).replace(/\D/g, "");
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return "(" + match[1] + ") " + match[2] + "-" + match[3];
    }
    return phoneNumberString;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const rawPhone = input.replace(/\D/g, "");
    setFormattedPhone(formatPhoneNumber(input));
    if (profile) {
      setProfile({ ...profile, phone: rawPhone });
    }
  };

  useEffect(() => {
    async function fetchUserData() {
      try {
        setLoading(true);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        const response = await fetch(`/api/users/${user.id}`);
        if (response.ok) {
          const data = await response.json();
          const profileData = data.user;
          setProfile(profileData);
          setEmail(profileData.email || "");
          setJobTitle(profileData.jobTitle || "");

          if (profileData.phone) {
            setFormattedPhone(formatPhoneNumber(profileData.phone));
          }

          if (profileData.name) {
            const nameParts = profileData.name.split(" ");
            setFirstName(nameParts[0] || "");
            setLastName(nameParts.slice(1).join(" ") || "");
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, []);

  const formatRole = (userRoles: any[] | undefined) => {
    if (!userRoles || userRoles.length === 0) return "User";
    return userRoles[0].role.name
      .split("_")
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
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
    if (!profile) return;

    setIsUploadingImage(true);
    try {
      const fileName = `profile_${Date.now()}.jpg`;
      const file = new File([croppedBlob], fileName, { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", profile.id);

      const response = await fetch("/api/upload/profile-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      setProfile((prev) => (prev ? { ...prev, avatar: data.url } : null));

      // Save to database
      await fetch(`/api/users/${profile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: data.url }),
      });

      window.dispatchEvent(new CustomEvent("avatarUpdated"));
      toast.success("Profile photo updated");
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

  const handleSaveProfile = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/users/${profile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${firstName} ${lastName}`.trim(),
          email: email,
          phone: profile.phone,
          jobTitle: jobTitle,
        }),
      });

      if (!response.ok) throw new Error("Failed to update profile");
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setChangingPassword(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error(error.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSaveNotifications = async () => {
    // In a real implementation, this would save to the database
    toast.success("Notification preferences saved");
  };

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
          <span className="ml-3 text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-4xl mx-auto">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl text-gray-800 font-bold">My Profile</h1>
        <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
      </div>

      {/* Profile Card with Avatar */}
      <div className="bg-white shadow-sm rounded-xl mb-6">
        <div className="p-6 flex items-center gap-6">
          <div className="relative group">
            <UserAvatarSimple
              src={profile?.avatar || null}
              alt={profile?.name || "User"}
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
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-800">
              {profile?.name || "User"}
            </h2>
            <p className="text-gray-500">{profile?.email}</p>
            <span className="inline-flex mt-2 px-2.5 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-600">
              {formatRole(profile?.userRoles)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow-sm rounded-xl overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 ${
                activeTab === "profile"
                  ? "border-violet-600 text-violet-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <UserIcon className="h-5 w-5 mr-2" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 ${
                activeTab === "notifications"
                  ? "border-violet-600 text-violet-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <BellIcon className="h-5 w-5 mr-2" />
              Notifications
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "profile" ? (
            <div className="space-y-8">
              {/* Personal Information */}
              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="firstName">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      className="form-input w-full"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="lastName">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      className="form-input w-full"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="email">
                      Email Address
                    </label>
                    <input
                      id="email"
                      className="form-input w-full"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john.doe@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="phone">
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      className="form-input w-full"
                      type="tel"
                      value={formattedPhone}
                      onChange={handlePhoneChange}
                      placeholder="(123) 456-7890"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1" htmlFor="jobTitle">
                      Job Title
                    </label>
                    <input
                      id="jobTitle"
                      className="form-input w-full"
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="Dental Hygienist"
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="btn bg-violet-500 hover:bg-violet-600 text-white"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </section>

              {/* Password */}
              <section className="border-t border-gray-200 pt-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Change Password
                </h3>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="newPassword">
                      New Password
                    </label>
                    <input
                      id="newPassword"
                      className="form-input w-full"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="confirmPassword">
                      Confirm New Password
                    </label>
                    <input
                      id="confirmPassword"
                      className="form-input w-full"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    onClick={handleChangePassword}
                    disabled={changingPassword}
                    className="btn bg-gray-800 hover:bg-gray-900 text-white"
                  >
                    {changingPassword ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </section>
            </div>
          ) : (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Notification Preferences
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Choose how you want to be notified about updates and activities.
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div>
                    <div className="font-medium text-gray-800">Email Notifications</div>
                    <div className="text-sm text-gray-500">
                      Receive notifications via email
                    </div>
                  </div>
                  <div className="form-switch">
                    <input
                      type="checkbox"
                      id="emailNotifications"
                      className="sr-only"
                      checked={notifications.emailNotifications}
                      onChange={() =>
                        setNotifications({
                          ...notifications,
                          emailNotifications: !notifications.emailNotifications,
                        })
                      }
                    />
                    <label htmlFor="emailNotifications">
                      <span className="bg-white shadow-sm" aria-hidden="true"></span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div>
                    <div className="font-medium text-gray-800">Course Updates</div>
                    <div className="text-sm text-gray-500">
                      Notifications about your enrolled courses
                    </div>
                  </div>
                  <div className="form-switch">
                    <input
                      type="checkbox"
                      id="courseUpdates"
                      className="sr-only"
                      checked={notifications.courseUpdates}
                      onChange={() =>
                        setNotifications({
                          ...notifications,
                          courseUpdates: !notifications.courseUpdates,
                        })
                      }
                    />
                    <label htmlFor="courseUpdates">
                      <span className="bg-white shadow-sm" aria-hidden="true"></span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div>
                    <div className="font-medium text-gray-800">New Content</div>
                    <div className="text-sm text-gray-500">
                      Notifications when new courses or articles are published
                    </div>
                  </div>
                  <div className="form-switch">
                    <input
                      type="checkbox"
                      id="newContent"
                      className="sr-only"
                      checked={notifications.newContent}
                      onChange={() =>
                        setNotifications({
                          ...notifications,
                          newContent: !notifications.newContent,
                        })
                      }
                    />
                    <label htmlFor="newContent">
                      <span className="bg-white shadow-sm" aria-hidden="true"></span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div>
                    <div className="font-medium text-gray-800">Learning Reminders</div>
                    <div className="text-sm text-gray-500">
                      Periodic reminders to continue your learning
                    </div>
                  </div>
                  <div className="form-switch">
                    <input
                      type="checkbox"
                      id="reminders"
                      className="sr-only"
                      checked={notifications.reminders}
                      onChange={() =>
                        setNotifications({
                          ...notifications,
                          reminders: !notifications.reminders,
                        })
                      }
                    />
                    <label htmlFor="reminders">
                      <span className="bg-white shadow-sm" aria-hidden="true"></span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSaveNotifications}
                  className="btn bg-violet-500 hover:bg-violet-600 text-white"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Cropper Modal */}
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
        />
      )}
    </div>
  );
}
