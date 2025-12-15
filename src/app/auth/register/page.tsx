'use client'

import Button from '@/src/app/components/ui/button'
import Input from '@/src/app/components/ui/input'
import Link from '@/src/app/components/ui/link'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthValid, getUserType } from '@/src/app/utils/auth'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthValid()) {
      const type = getUserType()?.toLowerCase()
      if (type === 'artist') {
        router.push('/artist/dashboard')
      } else {
        router.push('/user/dashboard')
      }
    }
  }, [router])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
      const response = await fetch(`${apiBase}/api/v1/Auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
        credentials: 'include',
      });

      const responseData = await response.json();

      if (!response.ok) {
        localStorage.removeItem('expiresAt');
        localStorage.removeItem('accessToken');
        throw new Error(responseData?.error.message || 'Registration failed');
      }

      if (responseData && responseData.data) {
        try {
          localStorage.setItem('expiresAt', responseData.data.expiresAt);
          localStorage.setItem('accessToken', responseData.data.accessToken);
        } catch (err) {
          console.warn('Could not save accessToken to localStorage', err);
        }
      } else {
        console.warn('No accessToken returned from register endpoint', responseData);
      }

      const type = getUserType()?.toLowerCase()
      if (type === 'artist') {
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
        aria-label="Register form"
      >
        <h1 className="text-2xl font-bold text-slate-900">Sign up</h1>

        {error && <p className="text-red-500">{error}</p>}

        <div className="flex flex-col gap-2">
          <Input
            label="Name"
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Your full name"
          />

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

          <Input
            label="Role (0 for user, 1 for admin)"
            id="role"
            type="number"
            value={role}
            onChange={(e) => setRole(Number(e.target.value))}
            required
          />
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create account'}
        </Button>

        <div className="mt-3 text-sm text-slate-500 text-center">
          Have an account? <Link underlined href="/auth/login">Sign in now!</Link>
        </div>
      </form>
    </main>
  )
}
