"use client";

import React, { useEffect, useState } from "react";
import DashboardSkeleton from "@/src/app/components/ui/dashboardSkeleton";
import PlaylistCard from "@/src/app/components/ui/playlistCard";
import { fetchPlaylistsByAuthor } from "@/src/app/utils/api";
import { useUserId } from "@/src/app/utils/auth";

export default function ArtistDashboardPage() {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userId = useUserId();

  useEffect(() => {
    const loadPlaylists = async () => {
      if (!userId) return;
      try {
        setIsLoading(true);
        const data = await fetchPlaylistsByAuthor(userId);
        setPlaylists(data.data || []);
      } catch (err) {
        console.error('Failed to load playlists:', err);
        setError(err instanceof Error ? err.message : 'Failed to load playlists');
      } finally {
        setIsLoading(false);
      }
    };

    loadPlaylists();
  }, [userId]);

  return (
    <div className="px-6 py-8">
      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <div>
          <h2 className="text-2xl font-semibold mb-6 text-white">Your albums</h2>
          {error ? (
            <p className="text-red-400">{error}</p>
          ) : playlists.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {playlists.map((playlist) => (
                <PlaylistCard
                  userType="artist"
                  key={playlist.id}
                  id={playlist.id}
                  name={playlist.name}
                  image={"https://api.dicebear.com/9.x/shapes/svg?backgroundType=gradientLinear&backgroundColor=2e1010,bb2169&shape1Color=bb2169,f48323&shape2Color=6a1cbb,f41d1c&shape3Color=18bb29,164ef4&seed=" + playlist.id}
                  description={playlist.description}
                  author={playlist.artist || 'Unknown'}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No playlists found</p>
          )}
        </div>
      )}
    </div>
  );
}
