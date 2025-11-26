'use client'

import { useState } from 'react'
import Link from 'next/link'
import AuthHeader from '../auth-header'
import AuthImage from '../auth-image'
import { createClient } from '@/lib/supabase/client'

export default function ResetPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
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
                  We've sent you a password reset link. Please check your email.
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
              <h1 className="text-3xl text-gray-800 font-bold mb-6">Reset your Password</h1>
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
                </div>
                {error && (
                  <div className="mt-4 text-sm text-red-600">{error}</div>
                )}
                <div className="flex justify-end mt-6">
                  <button
                    type="submit"
                    className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 whitespace-nowrap disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
              <div className="pt-5 mt-6 border-t border-gray-100">
                <div className="text-sm">
                  <Link className="font-medium text-violet-500 hover:text-violet-600" href="/signin">Back to Sign In</Link>
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
