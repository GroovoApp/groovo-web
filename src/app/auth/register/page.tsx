'use client'

import Button from '@/src/app/components/ui/button'
import Input from '@/src/app/components/ui/input'
import Link from '@/src/app/components/ui/link'
import React, { useState } from 'react'


export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    console.log('login', { email, password })
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        padding: '24px',
      }}
    >
      <form
        className='flex flex-col bg-white gap-6 w-full max-w-md rounded-xl p-6 '
        onSubmit={handleSubmit}
        style={{
          boxShadow: '0 10px 30px rgba(2,6,23,0.5)',
        }}
        aria-label="Login form"
      >
        <h1 className='text-2xl font-bold text-slate-900'>
          Sign up
        </h1>

        <div className='flex flex-col gap-2'>
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

        <Button>Create account</Button>

        <div style={{ marginTop: 12, fontSize: 13, color: '#64748b', textAlign: 'center' }}>
          Have an account? <Link underlined href='/auth/login'>Sign in now!</Link>
        </div>
      </form>
    </main>
  )
}