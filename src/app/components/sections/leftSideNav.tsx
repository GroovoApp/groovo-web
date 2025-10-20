'use client';
import React, { useEffect, useState } from "react";
import SavedEntry from "@/src/app/components/ui/savedEntry";

// The entry shape your UI uses
interface Entry {
  id: string;
  name: string;
  image: string;
  author: string;
}

export default function LeftSideNav() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlaylists() {
      try {
        const res = await fetch("http://localhost:8080/api/v1/Playlists", {
          method: "GET",
        });

        if (!res.ok) throw new Error(`Failed to fetch playlists: ${res.status}`);
        const json = await res.json();
        
        const formattedEntries: Entry[] = json.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          image: p.picture || "https://picsum.photos/seed/" + p.id + "/40/40", // fallback image
          author: p.description || "Unknown Author",
        }));

        setEntries(formattedEntries);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPlaylists();
  }, []);

  if (loading) return <div className="p-4 text-gray-400">Loading your library...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="h-full w-[300px] flex flex-col gap-2 bg-neutral-900 rounded-lg p-4 pt-4">
      <h1 className="text-md font-semibold">Your library</h1>
      <div className="flex flex-col gap-2">
        {entries.map((entry) => (
          <SavedEntry key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}
