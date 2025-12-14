"use client";

import { useEffect, useState } from "react";
import PlaylistCard from "@/src/app/components/ui/playlistCard";
import { fetchPlaylistsByUser } from "@/src/app/utils/api";
import { useUserId } from "@/src/app/utils/auth";
import DashboardSkeleton from "@/src/app/components/ui/dashboardSkeleton";

interface Playlist {
  id: string;
  name: string;
  picture?: string;
  description?: string;
}

export default function DashboardPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userId = useUserId();

  useEffect(() => {
    async function fetchData() {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await fetchPlaylistsByUser(userId);
        const playlistsData = data?.data || data || [];
        setPlaylists(playlistsData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500 text-lg">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-8">
      <h2 className="text-2xl font-bold mb-6">Public Playlists</h2>
      
      {playlists.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400 text-lg">No playlists available</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {playlists.map((playlist) => (
            <PlaylistCard
              key={playlist.id}
              id={playlist.id}
              name={playlist.name || "Untitled Playlist"}
              image={
                playlist.picture ||
                `https://api.dicebear.com/9.x/shapes/svg?backgroundType=gradientLinear&backgroundColor=2e1010,bb2169&shape1Color=bb2169,f48323&shape2Color=6a1cbb,f41d1c&shape3Color=18bb29,164ef4&seed=${playlist.id}`
              }
              description={playlist.description}
            />
          ))}
        </div>
      )}
    </div>
  );
}