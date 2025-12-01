'use client';
import React, { useEffect, useState } from "react";
import SavedEntry from "@/src/app/components/ui/savedEntry";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchUserPlaylists, createPlaylist } from "@/src/app/utils/api";
import { useUserType, useUserId } from "@/src/app/utils/auth";
import CreatePlaylistModal from "@/src/app/components/ui/createPlaylistModal";

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const userType = useUserType();
  const userId = useUserId();
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      if (!userId || !userType) {
        setLoading(false);
        return;
      }

      console.log("User ID:", userId);

      try {
        setLoading(true);
        setError(null);

        // Fetch user's private playlists/albums
        const data = await fetchUserPlaylists(userId);
        const playlists = data?.data || data || [];

        const isAuthor = userType.toLowerCase() === "author" || userType.toLowerCase() === "artist";
        
        // Filter albums vs playlists based on user type
        const filteredPlaylists = isAuthor 
          ? playlists.filter((p: any) => p.isAlbum)
          : playlists.filter((p: any) => !p.isAlbum);

        const formattedEntries: Entry[] = filteredPlaylists.map((playlist: any) => ({
          id: playlist.id,
          name: playlist.name || (isAuthor ? "Untitled Album" : "Untitled Playlist"),
          image: playlist.picture || "https://api.dicebear.com/9.x/shapes/svg?backgroundType=gradientLinear&backgroundColor=2e1010,bb2169&shape1Color=bb2169,f48323&shape2Color=6a1cbb,f41d1c&shape3Color=18bb29,164ef4&seed=" + playlist.id,
          author: "you",
        }));

        setEntries(formattedEntries);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId, userType]);

  const isAuthor = userType?.toLowerCase() === "author" || userType?.toLowerCase() === "artist";

  const handleCreatePlaylist = async (name: string, description: string, ownerIds: string[], picture?: string) => {
    if (!userId) return;
    
    try {
      const newPlaylist = await createPlaylist({
        name,
        description,
        picture: picture || "",
        isPublic: true,
        isAlbum: isAuthor,
        ownerIds,
      });
      
      // Redirect to the newly created playlist page
      if (newPlaylist?.id) {
        router.push(`/dashboard/playlist/${newPlaylist.id}`);
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  if (loading) return <div className="p-4 text-gray-400">Loading your library...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="h-full w-[300px] flex flex-col gap-2 bg-neutral-900 rounded-lg p-4 pt-4 relative">
      <h1 className="text-md font-semibold">Your library</h1>
      
      {entries.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-4">
          <div className="text-gray-400">
            <p className="font-medium">No {isAuthor ? "albums" : "playlists"} yet</p>
            <p className="text-sm mt-1">
              {isAuthor 
                ? "Create your first album to organize your music"
                : "Create a playlist to organize your favorite songs"}
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 px-6 py-2 text-sm shadow-lg ring-1 ring-black/10"
          >
            Create {isAuthor ? "Album" : "Playlist"}
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {entries.map((entry) => (
              <SavedEntry key={entry.id} entry={entry} />
            ))}
          </div>

          {/* Create new playlist/album button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-2 w-full text-center py-2 text-sm text-gray-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
          >
            + Create {isAuthor ? "Album" : "Playlist"}
          </button>
        </>
      )}

      {/* Create Playlist Modal */}
      <CreatePlaylistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleCreatePlaylist}
        isAlbum={isAuthor}
        userId={userId}
      />

      {/* Floating upload CTA — only visible for artists */}
      {isAuthor && (
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
