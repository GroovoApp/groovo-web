import React from "react";
import Image from "next/image";

// Define the type once at the top
type Entry = {
  id: string;
  name: string;
  image: string;
  author?: string;
};

export default function SavedEntry({ entry }: { entry: Entry }) {
  return (
    <a href={"/dashboard/playlist/" + entry.id} className="p-2 flex gap-3 rounded-md hover:bg-neutral-800 transition-colors duration-200 ease-in-out cursor-pointer items-center">
      <Image
        src={entry.image}
        alt={entry.name}
        width={40}
        height={40}
        priority
        className="rounded-md invert border-2 aspect-square flex-none max-h-[40px] max-w-[40px]"
      />
      <div className="flex flex-col">
        <h3 className="text-sm font-medium text-white">{entry.name}</h3>
        <p className="text-xs text-gray-400">
          Playlist by {entry.author || "Unknown"}
        </p>
      </div>
    </a>
  );
}
