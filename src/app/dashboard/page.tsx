"use client";

import UserTypeGuard from "@/src/app/components/ui/userTypeGuard";
import { useUserType } from "@/src/app/utils/auth";

export default function DashboardPage() {
  const userType = useUserType();

  return (
    <div>
      <h2 className="text-3xl font-bold mb-4">Dashboard</h2>
      <p className="mb-4">Welcome to your dashboard! Here you can manage your music and playlists.</p>
      
      {userType && (
        <div className="mb-6 p-4 bg-neutral-800 rounded-lg">
          <p className="text-sm text-gray-400">Logged in as: <span className="text-white font-semibold">{userType}</span></p>
        </div>
      )}

      <UserTypeGuard allowedTypes={["artist"]}>
        <div className="mt-6 p-6 bg-blue-900/20 border border-blue-700 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">Artist Features</h3>
          <p className="text-gray-300 mb-4">As an artist, you can upload and manage your music.</p>
          <a 
            href="/dashboard/upload" 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Upload New Song
          </a>
        </div>
      </UserTypeGuard>

      <UserTypeGuard allowedTypes={["listener", "user"]}>
        <div className="mt-6 p-6 bg-green-900/20 border border-green-700 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">Listener Features</h3>
          <p className="text-gray-300">Discover and enjoy music from your favorite artists.</p>
        </div>
      </UserTypeGuard>
    </div>
  );
}