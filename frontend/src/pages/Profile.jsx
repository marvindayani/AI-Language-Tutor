import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { ArrowLeft, Camera, Save, Edit2, LogOut, Upload } from "lucide-react";
import { motion } from "framer-motion";
import BASE_URL from "../config";

const Profile = () => {
  const { user, token, logoutUser, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    bio: user?.bio || "",
  });
  const [loading, setLoading] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [imagePreview, setImagePreview] = useState(
    user?.profilePicture || null,
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        bio: user.bio || "",
      });
      setImagePreview(user.profilePicture || null);
    }
  }, [user]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show preview while uploading
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload to S3
    await uploadProfilePicture(file);
  };

  const uploadProfilePicture = async (file) => {
    setUploadingPicture(true);
    try {
      console.log("Starting profile picture upload...");
      const formDataToSend = new FormData();
      formDataToSend.append("profilePicture", file);

      const res = await fetch(`${BASE_URL}/api/profile/picture`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      console.log("Upload response status:", res.status);
      const data = await res.json();
      console.log("Upload response data:", data);

      if (res.ok) {
        setMessage("Profile picture uploaded successfully!");
        refreshUser();
        setTimeout(() => setMessage(""), 3000);
      } else {
        console.error("Upload failed:", data);
        setMessage(data.error || "Failed to upload profile picture");
        setImagePreview(user?.profilePicture || null);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setMessage("Error uploading profile picture: " + err.message);
      setImagePreview(user?.profilePicture || null);
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSaveProfile = async () => {
    // Validate that we have at least a name
    if (!formData.name || formData.name.trim() === "") {
      setMessage("Name is required");
      return;
    }

    setLoading(true);
    try {
      console.log("Sending profile update with data:", formData);

      const res = await fetch(`${BASE_URL}/api/profile/info`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      console.log("Response status:", res.status);
      const data = await res.json();
      console.log("Response data:", data);

      if (res.ok) {
        setMessage("Profile updated successfully!");
        setIsEditing(false);
        refreshUser();
        setTimeout(() => setMessage(""), 3000);
      } else {
        console.error("Profile update error response:", data);
        setMessage(data.error || "Failed to update profile");
      }
    } catch (err) {
      console.error("Profile update network error:", err);
      setMessage("Error updating profile: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-slate-600 hover:text-[#1421AC] transition font-semibold"
          >
            <ArrowLeft size={24} />
            <span>Back to Dashboard</span>
          </button>
          <button
            onClick={logoutUser}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition font-semibold"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-lg overflow-hidden border border-slate-100"
        >
          {/* Profile Header Background */}
          <div className="h-40 bg-gradient-to-r from-[#1421AC] to-[#4F46E5]"></div>

          {/* Profile Content */}
          <div className="px-6 md:px-10 pb-10">
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center -mt-20 mb-8">
              <div className="relative">
                <div className="w-40 h-40 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-6xl font-bold text-[#1421AC]/20">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                {(isEditing || !user?.profilePicture) && (
                  <label
                    className={`absolute bottom-2 right-2 bg-[#1421AC] text-white p-3 rounded-full cursor-pointer transition shadow-lg flex items-center justify-center ${
                      uploadingPicture
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-[#0E178C]"
                    }`}
                  >
                    {uploadingPicture ? (
                      <Upload size={20} className="animate-pulse" />
                    ) : (
                      <Camera size={20} />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={uploadingPicture}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              {uploadingPicture && (
                <p className="text-sm text-slate-500 mt-3 font-medium">
                  Uploading...
                </p>
              )}
            </div>

            {/* Profile Information */}
            <div className="space-y-6 max-w-2xl mx-auto">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1421AC]/20 focus:border-[#1421AC] transition outline-none"
                  />
                ) : (
                  <p className="text-xl font-bold text-slate-800">
                    {user?.name}
                  </p>
                )}
              </div>

              {/* Email Field (Read-only) */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                  Email Address
                </label>
                <p className="text-slate-600">{user?.email}</p>
              </div>

              {/* Bio Field */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                  Bio
                </label>
                {isEditing ? (
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell us about yourself..."
                    rows="4"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1421AC]/20 focus:border-[#1421AC] transition outline-none resize-none"
                  />
                ) : (
                  <p className="text-slate-600">
                    {user?.bio || "No bio added yet"}
                  </p>
                )}
              </div>

              {/* Language & Level */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                    Learning Language
                  </label>
                  <p className="text-slate-600 font-semibold">
                    {user?.language}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                    Level
                  </label>
                  <p className="text-slate-600 font-semibold capitalize">
                    {user?.level}
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-6 rounded-2xl border border-slate-100 mt-8">
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                    Performance
                  </p>
                  <p className="text-3xl font-black text-[#1421AC]">
                    {user?.performanceScore || 0}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                    Accuracy
                  </p>
                  <p className="text-3xl font-black text-[#4F46E5]">
                    {user?.accuracyRate || 0}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                    Sessions
                  </p>
                  <p className="text-3xl font-black text-emerald-600">
                    {user?.sessionsCompleted || 0}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                    Streak
                  </p>
                  <p className="text-3xl font-black text-orange-600">
                    {user?.streakCount || 0}
                  </p>
                </div>
              </div>

              {/* Badges */}
              {user?.badges && user.badges.length > 0 && (
                <div className="mt-8">
                  <label className="block text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">
                    Badges Earned
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {user.badges.map((badge, idx) => (
                      <motion.div
                        key={idx}
                        whileHover={{ scale: 1.1 }}
                        className="flex flex-col items-center"
                        title={badge.description}
                      >
                        <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-full flex items-center justify-center text-3xl shadow-md border-2 border-yellow-200">
                          {badge.icon || "🏆"}
                        </div>
                        <p className="text-xs text-slate-600 mt-2 text-center font-semibold">
                          {badge.name}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Message */}
              {message && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`p-4 rounded-xl text-center font-semibold ${
                    message.includes("successfully")
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {message}
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-8">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSaveProfile}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#1421AC] hover:bg-[#0E178C] disabled:bg-slate-300 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-blue-900/20"
                    >
                      <Save size={20} />
                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          name: user?.name || "",
                          bio: user?.bio || "",
                        });
                      }}
                      className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 rounded-xl transition"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#1421AC] hover:bg-[#0E178C] text-white font-bold py-3 rounded-xl transition shadow-lg shadow-blue-900/20"
                  >
                    <Edit2 size={20} />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Profile;
