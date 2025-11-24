'use client'

import Button from '@/src/app/components/ui/button'
import Input from '@/src/app/components/ui/input'
import Link from '@/src/app/components/ui/link'
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
      const response = await fetch('http://localhost:8080/api/v1/Auth/login', {
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
