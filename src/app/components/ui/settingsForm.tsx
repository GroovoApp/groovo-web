"use client";

import React, { useEffect, useState } from "react";
import { fetchUserInfo, updateUserInfo } from "@/src/app/utils/api";
import { toast } from "sonner";

interface UserInfo {
  name: string;
  bio: string;
}

export default function SettingsForm() {
  const [formData, setFormData] = useState<UserInfo>({
    name: "",
    bio: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current user info
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchUserInfo();
        console.log("Fetched user info:", data);
        
        if (data) {
          setFormData({
            name: data.name ?? "",
            bio: data.bio ?? "",
          });
        } else {
          console.warn("No user data returned from API");
        }
      } catch (err) {
        console.error("Failed to load user info:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load user information"
        );
        toast.error("Failed to load user information");
      } finally {
        setIsLoading(false);
      }
    };

    loadUserInfo();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      setError(null);
      
      const updatedData = await updateUserInfo(formData);
      if (updatedData) {
        setFormData({
          name: updatedData.name || formData.name,
          bio: updatedData.bio || formData.bio,
        });
      }
      
      toast.success("Settings updated successfully!");
    } catch (err) {
      console.error("Failed to save settings:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save settings";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
            placeholder="Enter your name"
          />
        </div>

        {/* Bio Field */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-2">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            rows={5}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition resize-none"
            placeholder="Tell us about yourself"
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
