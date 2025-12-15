import React from "react";
import Image from "next/image";
import Link from "next/link";

type PlaylistCardProps = {
  id: string;
  name: string;
  image: string;
  description?: string;
  author?: string;
};

export default function PlaylistCard({ id, name, image, description, author }: PlaylistCardProps) {
  return (
    <Link 
      href={`/user/playlist/${id}`}
      className="group relative bg-neutral-900 hover:bg-neutral-800 p-2 rounded-lg transition-all duration-300 ease-in-out cursor-pointer"
    >
      {/* Playlist Cover */}
      <div className="relative aspect-square mb-4 overflow-hidden rounded-md shadow-lg">
        <Image
          src={image}
          alt={name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          unoptimized
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-end p-2">
          <div className="bg-green-500 rounded-full p-3 shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <svg 
              className="w-6 h-6 text-black" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Playlist Info */}
      <div className="space-y-1">
        <h3 className="font-semibold text-white truncate">
          {name}
        </h3>
        <p className="text-sm text-gray-400 line-clamp-2 min-h-[2.5rem]">
          {description || `By ${author || "Unknown"}`}
        </p>
      </div>
    </Link>
  );
}
