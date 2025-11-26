'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AuthHeader from '../auth-header'
import AuthImage from '../auth-image'
import { createClient } from '@/lib/supabase/client'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.session) {
      const syncResponse = await fetch('/api/auth/sync', { method: 'POST' })
      if (!syncResponse.ok) {
        console.error('Failed to sync user:', await syncResponse.text())
      }
      router.push('/')
      router.refresh()
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <main className="bg-white">
        <div className="relative md:flex">
          <div className="md:w-1/2">
            <div className="min-h-[100dvh] h-full flex flex-col after:flex-1">
              <AuthHeader />
              <div className="max-w-sm mx-auto w-full px-4 py-8">
                <h1 className="text-3xl text-gray-800 font-bold mb-6">Check your email</h1>
                <p className="text-gray-600">
                  We've sent you a confirmation link. Please check your email to complete your registration.
                </p>
                <div className="mt-6">
                  <Link className="text-sm text-violet-500 hover:text-violet-600" href="/signin">
                    Back to Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <AuthImage />
        </div>
      </main>
    )
  }

  return (
    <main className="bg-white">
      <div className="relative md:flex">
        <div className="md:w-1/2">
          <div className="min-h-[100dvh] h-full flex flex-col after:flex-1">
            <AuthHeader />
            <div className="max-w-sm mx-auto w-full px-4 py-8">
              <h1 className="text-3xl text-gray-800 font-bold mb-6">Create your Account</h1>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="email">Email Address <span className="text-red-500">*</span></label>
                    <input
                      id="email"
                      className="form-input w-full"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="name">Full Name <span className="text-red-500">*</span></label>
                    <input
                      id="name"
                      className="form-input w-full"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="password">Password <span className="text-red-500">*</span></label>
                    <input
                      id="password"
                      className="form-input w-full"
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                {error && (
                  <div className="mt-4 text-sm text-red-600">{error}</div>
                )}
                <div className="flex items-center justify-between mt-6">
                  <button
                    type="submit"
                    className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 whitespace-nowrap disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'Creating account...' : 'Sign Up'}
                  </button>
                </div>
              </form>
              <div className="pt-5 mt-6 border-t border-gray-100">
                <div className="text-sm">
                  Have an account? <Link className="font-medium text-violet-500 hover:text-violet-600" href="/signin">Sign In</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        <AuthImage />
      </div>
    </main>
  )
}
