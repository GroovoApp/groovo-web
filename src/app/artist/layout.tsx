"use client";
import React, { useState, useEffect } from "react";
import TopNav from "@/src/app/components/sections/topNav";
import ArtistLeftSideNav from "@/src/app/components/sections/artist/leftSideNav";
import Player from "@/src/app/components/sections/player";
import { Song } from "@/src/app/types/song";
import { useAuthGuard, useUserType } from "@/src/app/utils/auth";
import { SignalRProvider } from "@/src/app/contexts/SignalRContext";
import { useRouter } from "next/navigation";

export const PlayerContext = React.createContext<{
  currentSong: Song | null;
  setCurrentSong: (song: Song) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  isShuffled: boolean;
  setIsShuffled: (shuffled: boolean) => void;
}>({
  currentSong: null,
  setCurrentSong: () => {},
  isPlaying: false,
  setIsPlaying: () => {},
  isShuffled: false,
  setIsShuffled: () => {},
});

export default function ArtistLayout({ children }: { children: React.ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off");
  const isCheckingAuth = useAuthGuard();
  const userType = useUserType();
  const router = useRouter();

  const playerHeight = currentSong ? 120 : 0;

  useEffect(() => {
    if (!isCheckingAuth) {
      const typeStr = userType ? String(userType).toLowerCase() : null;
      if (typeStr && typeStr !== "author") {
        if (typeStr === "user") {
          router.replace("/user");
        } else {
          router.replace("/auth/login");
        }
      }
    }
  }, [isCheckingAuth, userType, router]);

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <SignalRProvider>
      <PlayerContext.Provider
        value={{
          currentSong,
          setCurrentSong,
          isPlaying,
          setIsPlaying,
          isShuffled,
          setIsShuffled,
        }}
      >
        <div className="flex flex-col h-screen">
          <TopNav />
          <div className="flex flex-1 gap-2 px-2 pb-3 bg-black min-h-0">
            <div className="flex-shrink-0 h-full">
              <ArtistLeftSideNav />
            </div>

            <div 
              className="flex-1 h-full bg-neutral-900 rounded-lg p-4 overflow-y-auto transition-all duration-300"
              style={{ paddingBottom: currentSong ? `${playerHeight}px` : '16px' }}
            >
              {children}
            </div>
          </div>
          <Player />
        </div>
      </PlayerContext.Provider>
    </SignalRProvider>
  );
}
