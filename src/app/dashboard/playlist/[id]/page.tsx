"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import TableSongElement from "@/src/app/components/ui/tableSongElement";
import { useParams } from "next/navigation";
import { fetchWithAuth } from "@/src/app/utils/api";

type Song = {
  id: string;
  title: string;
  album: string;
  image: string;
  author: string;
  dateAdded: string;
  duration: string;
};

type Playlist = {
  id: string;
  name: string;
  image?: string;
  creator: string;
  description?: string;
  songs: Song[];
};

export default function PlaylistPage() {
  const params = useParams();
  const { id } = params;

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlaylist() {
      try {
        const res = await fetchWithAuth(`http://localhost:8080/api/v1/Playlists/${id}`);
        if (!res.ok) throw new Error(`Failed to fetch playlist: ${res.status}`);
        const json = await res.json();

        if (!json.success || !json.data) {
          throw new Error("Playlist not found or API error");
        }

        const apiData = json.data;

        // Map API data to our internal Playlist/Song types
        const mappedPlaylist: Playlist = {
          id: apiData.id,
          name: apiData.name,
          description: apiData.description,
          image: apiData.picture || "https://picsum.photos/seed/default-image/200/200",
          creator: apiData.owners?.[0]?.name || "Unknown",
          songs: (apiData.songs || []).map((s: any) => ({
            id: s.id,
            title: s.name,
            album: "", // API does not provide album
            image: s.picture || "https://picsum.photos/seed/default-image/200/200",
            author: s.authorNames?.join(", ") || "Unknown",
            dateAdded: new Date(s.releaseDate).toLocaleDateString(),
            duration: s.duration,
          })),
        };

        setPlaylist(mappedPlaylist);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchPlaylist();
  }, [id]);

  if (loading) return <p className="p-8">Loading playlist...</p>;
  if (error) return <p className="p-8 text-red-500">{error}</p>;
  if (!playlist) return <p className="p-8">Playlist not found</p>;

  return (
    <div className="p-8 flex flex-col gap-8">
      {/* Playlist header */}
      <div className="flex gap-4 items-end max-h-72">
        <Image
          src={playlist.image!}
          alt={playlist.name}
          width={200}
          height={200}
          className="rounded-lg aspect-square"
        />
        <div className="flex flex-col gap-2">
          <h1 className="text-5xl font-bold">{playlist.name}</h1>
          {playlist.description && <p className="text-gray-400">{playlist.description}</p>}
          <p className="text-gray-400 text-sm mt-4">Delightfully crafted by {playlist.creator}</p>
          <p className="text-gray-400 text-sm">{playlist.songs.length} {playlist.songs.length === 1 ? "song" : "songs"}</p>
        </div>
      </div>

      {/* Song list */}
      {playlist.songs.length > 0 ? (
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-gray-700">
              <th className="pb-2 font-light text-sm text-neutral-400">#</th>
              <th className="pb-2 font-light text-sm text-neutral-400">Title</th>
              <th className="pb-2 font-light text-sm text-neutral-400">Album</th>
              <th className="pb-2 font-light text-sm text-neutral-400">Date added</th>
              <th className="pb-2 font-light text-sm text-neutral-400">Duration</th>
            </tr>
          </thead>
          <tbody>
            {playlist.songs.map((song, index) => (
              <TableSongElement song={song} index={index + 1} />
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-400">No songs in this playlist yet.</p>
      )}
    </div>
  );
}
