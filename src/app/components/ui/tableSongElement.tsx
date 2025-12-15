"use client";
import React, { useContext } from "react";
import Image from "next/image";
import { Song } from "@/src/app/types/song"; // adjust path
import { PlayerContext } from "@/src/app/user/layout";
import { useSignalR } from "@/src/app/contexts/SignalRContext";

type Props = {
  song: Song;
  index: number;
  onContextMenu?: (e: React.MouseEvent, songId: string) => void;
  isJoinedPlaylist?: boolean;
};

export default function TableSongElement({ song, index, onContextMenu, isJoinedPlaylist = false }: Props) {
  const { setCurrentSong, currentSong, isPlaying } = useContext(PlayerContext);
  const { playSong, isConnected } = useSignalR();

  const handlePlaySong = async () => {
    // Only allow playing when user has joined this playlist
    if (!isJoinedPlaylist) {
      console.log('Ignored play: user has not joined this playlist');
      return;
    }

    // Send play command to SignalR if connected
    if (isConnected && song.id) {
      console.log('📤 Sending PlaySong:', song.id);
      try {
        await playSong(song.id);
        // Server will send PlaybackState which will update currentSong
      } catch (error) {
        console.error('Error playing song via SignalR:', error);
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onContextMenu) {
      onContextMenu(e, song.id);
    }
  };

  const isActive = !!currentSong && currentSong.id === song.id && isJoinedPlaylist;

  return (
    <tr
      className={`transition-background px-2 transition-200 rounded-lg cursor-pointer select-none ${
        isActive ? "bg-indigo-600/20" : "hover:bg-neutral-700"
      }`}
      onDoubleClick={handlePlaySong}
      onContextMenu={handleContextMenu}
      aria-current={isActive ? "true" : undefined}
    >
      <td className="py-2 px-2 text-sm">{index}</td>
      <td className="py-2 px-2 text-sm flex items-center gap-2">
        <Image src={song.image} alt={song.title} width={40} height={40} className="rounded-md aspect-square object-cover" />
        {song.title}
      </td>
      <td className="py-2 px-2 text-sm">{song.album || "Album"}</td>
      <td className="py-2 px-2 text-sm">{song.dateAdded}</td>
      <td className="py-2 px-2 text-sm">{song.duration}</td>
    </tr>
  );
}
