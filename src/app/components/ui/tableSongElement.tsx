"use client";
import React, { useContext } from "react";
import Image from "next/image";
import { Song } from "@/src/app/types/song"; // adjust path
import { CurrentSongContext } from "@/src/app/dashboard/layout";

type Props = {
  song: Song;
  index: number;
};

export default function TableSongElement({ song, index }: Props) {
  const { setCurrentSong } = useContext(CurrentSongContext);

  return (
    <tr
      className="transition-background transition-200 hover:bg-neutral-700 rounded-lg cursor-pointer"
      onDoubleClick={() => setCurrentSong(song)}
    >
      <td className="py-2 text-sm text-center">{index}</td>
      <td className="py-2 text-sm flex items-center gap-2">
        <Image src={song.image} alt={song.title} width={40} height={40} className="rounded-md" />
        {song.title}
      </td>
      <td className="py-2 text-sm">{song.album || "Album"}</td>
      <td className="py-2 text-sm">{song.dateAdded}</td>
      <td className="py-2 text-sm">{song.duration}</td>
    </tr>
  );
}
