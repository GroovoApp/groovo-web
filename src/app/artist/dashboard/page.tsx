"use client";

import React, { useEffect, useState } from "react";
import DashboardSkeleton from "@/src/app/components/ui/dashboardSkeleton";
import PlaylistCard from "@/src/app/components/ui/playlistCard";
import { fetchPublicPlaylists } from "@/src/app/utils/api";

export default function ArtistDashboardPage() {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPlaylists = async () => {
      try {
        setIsLoading(true);
        const data = await fetchPublicPlaylists();
        setPlaylists(data || []);
      } catch (err) {
        console.error('Failed to load playlists:', err);
        setError(err instanceof Error ? err.message : 'Failed to load playlists');
      } finally {
        setIsLoading(false);
      }
    };

    loadPlaylists();
  }, []);

  return (
    <div className="px-6 py-8">
      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <div>
          <h2 className="text-2xl font-semibold mb-6 text-white">Public Playlists</h2>
          {error ? (
            <p className="text-red-400">{error}</p>
          ) : playlists.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {playlists.map((playlist) => (
                <PlaylistCard
                  key={playlist.id}
                  id={playlist.id}
                  name={playlist.name}
                  image={playlist.coverImageUrl || '/placeholder.jpg'}
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
