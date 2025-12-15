"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ArtistPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/artist/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-gray-400">Redirecting...</div>
    </div>
  );
}
