'use client'

import Button from '@/src/app/components/ui/button'
import Input from '@/src/app/components/ui/input'
import Link from '@/src/app/components/ui/link'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthValid, getUserType } from '@/src/app/utils/auth'
import { fetchUserInfo } from '@/src/app/utils/api'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthValid()) {
      const checkUserType = async () => {
        const type = await getUserType();
        const typeStr = type ? String(type).toLowerCase() : null;
        if (typeStr && (typeStr === 'author' || typeStr === 'artist')) {
          router.push('/artist/dashboard')
        } else if (typeStr === 'user') {
          router.push('/user/dashboard')
        } else {
          //router.push('/auth/login')
        }
      }
      checkUserType();
    }
  }, [router])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
      const response = await fetch(`${apiBase}/api/v1/Auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      let responseData: any = null;
      try {
        responseData = await response.json();
      } catch (err) {
        console.error('Login response not JSON', err);
      }
      console.debug('Login response:', response.status, response.statusText, responseData);

      if (!response.ok) {
        try { localStorage.removeItem('expiresAt'); localStorage.removeItem('accessToken'); } catch {}
        const remoteMsg = responseData?.error?.message || responseData?.message || JSON.stringify(responseData || {});
        throw new Error(remoteMsg || `Login failed: ${response.status} ${response.statusText}`);
      }

      // Try several common field names for tokens/expiry to be resilient to API shape
      const token = responseData?.data?.accessToken || responseData?.data?.AccessToken || responseData?.accessToken || responseData?.AccessToken || null;
      const expires = responseData?.data?.expiresAt || responseData?.data?.expires_at || responseData?.data?.ExpiresAt || responseData?.expiresAt || responseData?.expires_at || null;

      if (!token) {
        console.warn('Login succeeded but no access token found in response', responseData);
        throw new Error('Login succeeded but server did not return an access token');
      }

      try {
        if (expires) localStorage.setItem('expiresAt', String(expires));
        localStorage.setItem('accessToken', String(token));
      } catch (err) {
        console.warn('Could not save accessToken to localStorage', err);
      }

      // First, try the server-side /auth/me to get authoritative role
      try {
        const me = await fetchUserInfo();
        // Role might be numeric (0 or 1) or string; prefer numeric mapping if present
        const rawRole = me?.role ?? me?.userType ?? me?.data?.role ?? me?.data?.userType ?? null;
        const num = rawRole != null ? Number(rawRole) : NaN;
        if (!Number.isNaN(num)) {
          if (num === 1) {
            router.push('/artist/dashboard');
            return;
          } else {
            router.push('/user/dashboard');
            return;
          }
        }
      } catch (err) {
        console.debug('fetchUserInfo failed during post-login redirect', err);
      }

      const type = await getUserType();
      let typeStr = type ? String(type).toLowerCase() : null;

      if (typeStr && (typeStr === 'author' || typeStr === 'artist')) {
        router.push('/artist/dashboard')
      } else {
        router.push('/user/dashboard')
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
      <form
        className="flex flex-col bg-white gap-6 w-full max-w-md rounded-xl p-6 shadow-[0_10px_30px_rgba(2,6,23,0.5)]"
        onSubmit={handleSubmit}
        aria-label="Login form"
      >
        <h1 className="text-2xl font-bold text-slate-900">Sign in</h1>

        {error && <p className="text-red-500">{error}</p>}

        <div className="flex flex-col gap-2">
          <Input
            label="Email"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />

          <Input
            label="Password"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="********"
          />
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </Button>

        <div className="mt-3 text-sm text-slate-500 text-center">
          Don't have an account? <Link underlined href="/auth/register">Create one now!</Link>
        </div>
      </form>
    </main>
  )
}
