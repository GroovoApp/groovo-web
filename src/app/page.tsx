"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserType, isAuthValid } from '@/src/app/utils/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const redirectUser = async () => {
      if (!isAuthValid()) {
        //router.push('/auth/login');
        return;
      }
      
      const userType = await getUserType();

      // Redirect based on normalized user type (supports both 'artist' and 'author')
      const typeStr = userType ? String(userType).toLowerCase() : null;
      if (typeStr === 'artist') {
        router.push('/artist/dashboard');
      } else if (typeStr === 'user') {
        router.push('/user/dashboard');
      } else {
        // Default redirect if no valid user type is found
        //router.push('/auth/login');
      }
    };

    redirectUser();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-gray-400">Redirecting...</div>
    </div>
  );
}
