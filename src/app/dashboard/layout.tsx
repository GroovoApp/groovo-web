"use client";
import React, { useState } from "react";
import TopNav from "@/src/app/components/sections/topNav";
import LeftSideNav from "@/src/app/components/sections/leftSideNav";
import RightSideNav from "@/src/app/components/sections/rightSideNav";
import { Song } from "@/src/app/types/song";
import { useAuthGuard, useUserType } from "@/src/app/utils/auth";

export const CurrentSongContext = React.createContext<{
  currentSong: Song | null;
  setCurrentSong: (song: Song) => void;
}>({
  currentSong: null,
  setCurrentSong: () => {},
});

export default function Layout({ children }: { children: React.ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const userType = useUserType();
  const isCheckingAuth = useAuthGuard();

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <CurrentSongContext.Provider value={{ currentSong, setCurrentSong }}>
      <div className="flex flex-col h-screen">
        <TopNav />
        <div className="flex flex-1 gap-2 px-2 pb-3 bg-black min-h-0">
          <div className="flex-shrink-0 h-full">
            <LeftSideNav />
          </div>

          <div className="flex-1 h-full bg-neutral-900 rounded-lg p-4 overflow-y-auto">
            {children}
          </div>

          {userType?.toLowerCase() !== "author" && (
            <div className="flex-shrink-0 h-full">
              <RightSideNav currentSong={currentSong} />
            </div>
          )}
        </div>
      </div>
    </CurrentSongContext.Provider>
  );
}
