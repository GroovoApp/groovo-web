"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserType, isAuthValid } from '@/src/app/utils/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const userType = getUserType();
    
    if (!isAuthValid()) {
      router.push('/auth/login');
      return;
    }
    
    // Redirect based on user type
    if (userType?.toLowerCase() === 'artist') {
      router.push('/artist/dashboard');
    } else if (userType?.toLowerCase() === 'user') {
      router.push('/user/dashboard');
    } else {
      // Default redirect if no valid user type is found
      router.push('/auth/login');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-gray-400">Redirecting...</div>
    </div>
  );
}
