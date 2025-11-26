'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import SettingsSidebar from '@/components/settings-sidebar'
import { adminSettingsLinks } from '@/components/sidebar-configs'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/signin')
        return
      }
      
      setIsAuthenticated(true)
      setLoading(false)
    }
    
    checkAuth()
  }, [router])
  
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 mb-2"></div>
        <p className="ml-2 text-gray-500">Loading...</p>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return null
  }
  
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl text-gray-800 font-bold">
              Admin Settings
            </h1>
            <p className="text-sm text-gray-500">
              Manage system configuration and settings
            </p>
          </div>
          <Link 
            href="/"
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-violet-600"
          >
            <svg className="mr-2 w-4 h-4 fill-current text-gray-400" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.4 13.4l-4.7-4.8 4.7-4.8 1.4 1.4-3.4 3.4 3.4 3.4z" />
            </svg>
            <span>Return to App</span>
          </Link>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-xl mb-8">
        <div className="flex flex-col md:flex-row md:-mr-px">
          <SettingsSidebar 
            title="Admin Menu"
            links={adminSettingsLinks}
          />
          
          <div className="grow">
            {children} 
          </div>
        </div>
      </div>
    </div>
  )
}
