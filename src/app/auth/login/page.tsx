'use client'

import Button from '@/src/app/components/ui/button'
import Input from '@/src/app/components/ui/input'
import Link from '@/src/app/components/ui/link'
import Image from 'next/image'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthValid } from '@/src/app/utils/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthValid()) {
      router.push('/dashboard')
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

      const responseData = await response.json();
      console.log(responseData);
      
      if (!response.ok) {
        localStorage.removeItem('expiresAt');
        localStorage.removeItem('accessToken');
        throw new Error(responseData?.error.message || 'Login failed');
      }

      if (responseData && responseData.data) {
        try {
          localStorage.setItem('expiresAt', responseData.data.expiresAt);
          localStorage.setItem('accessToken', responseData.data.accessToken);
        } catch (err) {
          console.warn('Could not save accessToken to localStorage', err);
        }
      } else {
        console.warn('No accessToken returned from login endpoint', responseData);
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#12030a] to-[#1a0510] p-6">
      <form
        className="flex flex-col bg-white gap-6 w-full max-w-md rounded-2xl p-8 shadow-[0_20px_60px_rgba(187,33,105,0.4)] border border-[#bb2169]/20"
        onSubmit={handleSubmit}
        aria-label="Login form"
      >
        <div className="flex justify-center mb-2">
          <Image src="/Groovo-red-black.svg" alt="Groovo" width={150} height={50} className="h-12 w-auto" />
        </div>
        <h1 className="font-display text-3xl font-bold text-gray-900 text-center mb-2">Sign in</h1>

        {error && <p className="text-red-600 bg-red-50 p-3 rounded-lg text-sm">{error}</p>}

        <div className="flex flex-col gap-4">
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

        <Button type="submit" disabled={loading} className="!bg-[#bb2169] hover:!bg-[#a01d5c] !text-white mt-2">
          {loading ? 'Logging in...' : 'Login'}
        </Button>

        <div className="mt-2 text-sm text-gray-600 text-center">
          Don't have an account? <Link underlined href="/auth/register" className="!text-[#bb2169] hover:!text-[#a01d5c] font-semibold">Create one now!</Link>
        </div>
      </form>
    </main>
  )
}
