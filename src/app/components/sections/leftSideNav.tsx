'use client';
import React, { useEffect, useState } from "react";
import SavedEntry from "@/src/app/components/ui/savedEntry";
import Link from "next/link";
import { fetchPlaylistsByAuthor, fetchPlaylistsByUser } from "@/src/app/utils/api";
import { useUserType, useUserId } from "@/src/app/utils/auth";

// The entry shape your UI uses
interface Entry {
  id: string;
  name: string;
  image: string;
  author: string;
}

export default function LeftSideNav() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userType = useUserType();
  const userId = useUserId();

  useEffect(() => {
    async function fetchData() {
      if (!userId || !userType) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        if (userType.toLowerCase() === "author") {
          // Fetch playlists/albums for authors
          const data = await fetchPlaylistsByAuthor(userId);
          console.log(data);
          const playlists = data?.data || data || [];
          
          const formattedEntries: Entry[] = playlists.map((playlist: any) => ({
            id: playlist.id,
            name: playlist.name || "Untitled Album",
            image: playlist.picture || "https://picsum.photos/seed/" + playlist.id + "/40/40",
            author: "you",
          }));

          console.log("Fetched playlists for author:", formattedEntries);

          setEntries(formattedEntries);
        } else {
          // Fetch playlists for users/listeners
          const data = await fetchPlaylistsByUser(userId);
          const playlists = data?.data || data || [];

          const formattedEntries: Entry[] = playlists.map((p: any) => ({
            id: p.id,
            name: p.name || "Untitled Playlist",
            image: "https://api.dicebear.com/9.x/shapes/svg?backgroundType=gradientLinear&backgroundColor=2e1010,bb2169&shape1Color=bb2169,f48323&shape2Color=6a1cbb,f41d1c&shape3Color=18bb29,164ef4&seed=" + p.id,
            author: p.description || "Playlist",
          }));

          setEntries(formattedEntries);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId, userType]);

  if (loading) return <div className="p-4 text-gray-400">Loading your library...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="h-full w-[300px] flex flex-col gap-2 bg-neutral-900 rounded-lg p-4 pt-4 relative">
      <h1 className="text-md font-semibold">Your library</h1>
      <div className="flex flex-col gap-2">
        {entries.map((entry) => (
          <SavedEntry key={entry.id} entry={entry} />
        ))}
      </div>

      {/* Floating upload CTA — only visible for artists */}
      {(userType?.toLowerCase() === "author" || userType?.toLowerCase() === "artist") && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <Link
            href="/dashboard/upload"
            className="inline-flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 text-sm shadow-lg ring-1 ring-black/10"
          >
            Upload song
          </Link>
        </div>
      )}
    </div>
  );
}
