'use client';
import React, { useEffect, useState } from "react";
import SavedEntry from "@/src/app/components/ui/savedEntry";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchUserPlaylists, createPlaylist } from "@/src/app/utils/api";
import { useUserId } from "@/src/app/utils/auth";
import CreatePlaylistModal from "@/src/app/components/ui/createPlaylistModal";
import LeftSideNavSkeleton from "../leftSideNavSkeleton";

interface Entry {
  id: string;
  name: string;
  image: string;
  author: string;
}

export default function ArtistLeftSideNav() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
        setError(null);

        const data = await fetchUserPlaylists(userId);
        const playlists = data?.data || data || [];

        // Filter only albums for artists
        const albums = playlists.filter((p: any) => p.isAlbum);

        const formattedEntries: Entry[] = albums.map((album: any) => ({
          id: album.id,
          name: album.name || "Untitled Album",
          image: album.picture || "https://api.dicebear.com/9.x/shapes/svg?backgroundType=gradientLinear&backgroundColor=2e1010,bb2169&shape1Color=bb2169,f48323&shape2Color=6a1cbb,f41d1c&shape3Color=18bb29,164ef4&seed=" + album.id,
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
  }, [userId]);

  const handleCreateAlbum = async (name: string, description: string, ownerIds: string[], picture?: string, isPublic: boolean = true) => {
    if (!userId) return;
    
    try {
      const newAlbum = await createPlaylist({
        name,
        description,
        picture: picture || "",
        isPublic,
        isAlbum: true,
        ownerIds,
      });
      
      if (newAlbum?.id) {
        router.push(`/artist/playlist/${newAlbum.id}`);
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return (
    <div className="h-full w-[300px] flex flex-col gap-2 bg-neutral-900 rounded-lg p-4 pt-4 relative overflow-hidden pb-16">
      <h1 className="text-md font-semibold">Your Albums</h1>

      {loading ? (
        <LeftSideNavSkeleton />
      ) : error ? (
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <div className="w-full text-sm text-red-400 bg-neutral-800/60 border border-red-500/30 rounded p-3">
            Error: {error}
          </div>
        </div>
      ) : entries.length === 0 ? (
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4 text-center px-4">
          <div className="text-gray-400">
            <p className="font-medium">No albums yet</p>
            <p className="text-sm mt-1">Create your first album to organize your music</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 px-6 py-2 text-sm shadow-lg ring-1 ring-black/10"
          >
            Create Album
          </button>
        </div>
      ) : (
        <>
          <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-y-auto">
            {entries.map((entry) => (
              <SavedEntry key={entry.id} entry={entry} isAlbum={true} basePath="/artist" />
            ))}
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-2 w-full text-center py-2 text-sm text-gray-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
          >
            + Create Album
          </button>
        </>
      )}

      <CreatePlaylistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleCreateAlbum}
        isAlbum={true}
        userId={userId}
      />

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <Link
          href="/artist/upload"
          className="inline-flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 text-sm shadow-lg ring-1 ring-black/10"
        >
          Upload song
        </Link>
      </div>
    </div>
  );
}
