import React from "react";
import Image from "next/image";
import Link from "next/link";

// Define the type once at the top
type Entry = {
  id: string;
  name: string;
  image: string;
  author?: string;
};

type SavedEntryProps = {
  entry: Entry;
  isAlbum?: boolean;
  basePath?: string;
};

export default function SavedEntry({ entry, isAlbum = false, basePath = "/user" }: SavedEntryProps) {
  const href = `${basePath}/playlist/${entry.id}`;
  const itemType = isAlbum ? "Album" : "Playlist";

  return (
    <Link href={href} className="p-2 flex gap-3 rounded-md hover:bg-neutral-800 transition-colors duration-200 ease-in-out cursor-pointer items-center">
      <Image
        src={entry.image}
        alt={entry.name}
        width={40}
        height={40}
        priority
        unoptimized
        className="rounded-md border-2 aspect-square flex-none max-h-[40px] max-w-[40px]"
      />
      <div className="flex flex-col">
        <h3 className="text-sm font-medium text-white">{entry.name}</h3>
        <p className="text-xs text-gray-400">
          {itemType} by {entry.author || "Unknown"}
        </p>
      </div>
    </Link>
  );
}
