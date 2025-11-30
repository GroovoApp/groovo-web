'use client';

import React, { useEffect } from "react";
import { Song } from "@/src/app/types/song";
import Image from "next/image";
import Button from "@/src/app/components/ui/button";
import { fetchWithAuth } from "@/src/app/utils/api";

type RightSideNavProps = {
  currentSong: Song | null;
};

export default function RightSideNav({ currentSong }: RightSideNavProps) {
  console.log(currentSong);
  useEffect(() => {
    async function fetchSong() {
      if (!currentSong?.id) return;

      try {
        const res = await fetchWithAuth(`http://localhost:8080/api/v1/Songs/${currentSong.id}`);
        console.log(res);
        if (!res.ok) throw new Error(`Failed to fetch song: ${res.status}`);
        const json = await res.json();

        console.log("Fetched song data:", json);
      } catch (err) {
        console.error("Error fetching song:", err);
      }
    }

    fetchSong();
  }, [currentSong?.id]);

  if (!currentSong)
    return (
      <div className="h-full w-[300px] flex flex-col gap-2 bg-neutral-900 rounded-lg p-4 text-gray-400">
        Select a song to show detailed info
      </div>
    );

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
