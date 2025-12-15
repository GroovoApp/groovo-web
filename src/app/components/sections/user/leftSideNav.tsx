'use client';
import React, { useEffect, useState } from "react";
import SavedEntry from "@/src/app/components/ui/savedEntry";
import { useRouter } from "next/navigation";
import { fetchUserPlaylists, createPlaylist } from "@/src/app/utils/api";
import { useUserId } from "@/src/app/utils/auth";
import CreatePlaylistModal from "@/src/app/components/ui/createPlaylistModal";
import LeftSideNavSkeleton from "../leftSideNavSkeleton";
import { toast } from "sonner";

interface Entry {
  id: string;
  name: string;
  image: string;
  author: string;
}

export default function UserLeftSideNav() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const userId = useUserId();
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const data = await fetchUserPlaylists(userId);
        const playlists = data?.data || data || [];

        // Filter only playlists (not albums) for users
        const userPlaylists = playlists.filter((p: any) => !p.isAlbum);

        const formattedEntries: Entry[] = userPlaylists.map((playlist: any) => ({
          id: playlist.id,
          name: playlist.name || "Untitled Playlist",
          image: playlist.picture || "https://api.dicebear.com/9.x/shapes/svg?backgroundType=gradientLinear&backgroundColor=2e1010,bb2169&shape1Color=bb2169,f48323&shape2Color=6a1cbb,f41d1c&shape3Color=18bb29,164ef4&seed=" + playlist.id,
          author: "you",
        }));

        setEntries(formattedEntries);
      } catch (err: any) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        toast.error(errorMessage || "Failed to load playlists");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId]);

  const handleCreatePlaylist = async (name: string, description: string, ownerIds: string[], picture?: string, isPublic: boolean = true) => {
    if (!userId) return;
    
    try {
      const newPlaylist = await createPlaylist({
        name,
        description,
        picture: picture || "",
        isPublic,
        isAlbum: false,
        ownerIds,
      });
      
      if (newPlaylist?.id) {
        router.push(`/user/playlist/${newPlaylist.id}`);
      }
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const message = errorMessage || "Failed to create playlist";
      toast.error(message);
      throw err;
    }
  };

  return (
    <div className="h-full w-[300px] flex flex-col gap-2 bg-neutral-900 rounded-lg p-4 pt-4">
      <h1 className="text-md font-semibold">Your Playlists</h1>

      {loading ? (
        <LeftSideNavSkeleton />
      ) : entries.length === 0 ? (
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4 text-center px-4">
          <div className="text-gray-400">
            <p className="font-medium">No playlists yet</p>
            <p className="text-sm mt-1">Create a playlist to organize your favorite songs</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 px-6 py-2 text-sm shadow-lg ring-1 ring-black/10"
          >
            Create Playlist
          </button>
        </div>
      ) : (
        <>
          <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-y-auto">
            {entries.map((entry) => (
              <SavedEntry key={entry.id} entry={entry} />
            ))}
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-2 w-full text-center py-2 text-sm text-gray-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
          >
            + Create Playlist
          </button>
        </>
      )}

      <CreatePlaylistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleCreatePlaylist}
        isAlbum={false}
        userId={userId}
      />
    </div>
  );
}
