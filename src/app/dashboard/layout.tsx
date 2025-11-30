"use client";
import React, { useState } from "react";
import TopNav from "@/src/app/components/sections/topNav";
import LeftSideNav from "@/src/app/components/sections/leftSideNav";
import RightSideNav from "@/src/app/components/sections/rightSideNav";
import Player from "@/src/app/components/sections/player";
import { Song } from "@/src/app/types/song";
import { useAuthGuard, useUserType } from "@/src/app/utils/auth";
import { SignalRProvider } from "@/src/app/contexts/SignalRContext";

export const CurrentSongContext = React.createContext<{
  currentSong: Song | null;
  setCurrentSong: (song: Song) => void;
}>({
  currentSong: null,
  setCurrentSong: () => {},
});

export const PlayerContext = React.createContext<{
  currentSong: Song | null;
  setCurrentSong: (song: Song) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  isShuffled: boolean;
  setIsShuffled: (shuffled: boolean) => void;
  repeatMode: "off" | "all" | "one";
  setRepeatMode: (mode: "off" | "all" | "one") => void;
}>({
  currentSong: null,
  setCurrentSong: () => {},
  isPlaying: false,
  setIsPlaying: () => {},
  isShuffled: false,
  setIsShuffled: () => {},
  repeatMode: "off",
  setRepeatMode: () => {},
});

export default function Layout({ children }: { children: React.ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off");
  const userType = useUserType();
  const isCheckingAuth = useAuthGuard();

  // Calculate player height + spacing to prevent content from hiding under player
  const playerHeight = currentSong ? 120 : 0; // Player height + bottom offset

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <SignalRProvider>
      <CurrentSongContext.Provider value={{ currentSong, setCurrentSong }}>
        <PlayerContext.Provider
          value={{
            currentSong,
            setCurrentSong,
            isPlaying,
            setIsPlaying,
            isShuffled,
            setIsShuffled,
            repeatMode,
            setRepeatMode,
          }}
        >
          <div className="flex flex-col h-screen">
            <TopNav />
            <div className="flex flex-1 gap-2 px-2 pb-3 bg-black min-h-0">
              <div className="flex-shrink-0 h-full">
                <LeftSideNav />
              </div>

              <div 
                className="flex-1 h-full bg-neutral-900 rounded-lg p-4 overflow-y-auto transition-all duration-300"
                style={{ paddingBottom: currentSong ? `${playerHeight}px` : '16px' }}
              >
                {children}
              </div>

              {userType?.toLowerCase() !== "author" && (
                <div className="flex-shrink-0 h-full">
                  <RightSideNav currentSong={currentSong} />
                </div>
              )}
            </div>
            <Player />
          </div>
        </PlayerContext.Provider>
      </CurrentSongContext.Provider>
    </SignalRProvider>
  );
}
