'use client';

import React, { useEffect } from "react";
import { Song } from "@/src/app/types/song";
import Image from "next/image";
import { fetchWithAuth } from "@/src/app/utils/api";
import { toast } from "sonner";

type RightSideNavProps = {
  currentSong: Song | null;
};

export default function UserRightSideNav({ currentSong }: RightSideNavProps) {
  useEffect(() => {
    async function fetchSong() {
      if (!currentSong?.id) return;

      try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
        const res = await fetchWithAuth(`${apiBase}/api/v1/Songs/${currentSong.id}`);
        if (!res.ok) throw new Error(`Failed to fetch song: ${res.status}`);
        const json = await res.json();

        console.log("Fetched song data:", json);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        toast.error(errorMessage || "Error fetching song");
      }
    }

    fetchSong();
  }, [currentSong?.id]);

  if (!currentSong) return null;

  return (
    <div className="h-full w-[300px] flex flex-col gap-2 bg-neutral-900 rounded-lg p-4">
      <h2 className="text-lg font-bold w-full">Selected song</h2>
      <Image
        src={currentSong.image}
        alt={currentSong.title}
        width={220}
        height={220}
        className="w-[80%] aspect-square mx-auto rounded-md"
      />
      <span className="font-semibold">{currentSong.title}</span>
      <span className="text-sm text-gray-400">{currentSong.author}</span>
      <span className="text-sm text-gray-400">{currentSong.album}</span>
      <span className="text-sm text-gray-400">{currentSong.duration}</span>
      <span className="text-sm text-gray-400">id: {currentSong.id}</span>
    </div>
  );
}
