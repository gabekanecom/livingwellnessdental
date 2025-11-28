'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import UserAvatarSimple from '@/components/user-avatar-simple'
import { UserCircleIcon, ChevronDownIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline'

export default function DropdownProfile({ align }: {
  align?: 'left' | 'right'
}) {
  const router = useRouter()
  const [userData, setUserData] = useState({
    name: 'Loading...',
    email: '',
    role: '',
    avatarUrl: null as string | null
  })
  const [loading, setLoading] = useState(true)
  
  const fetchUserData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return
      
      const response = await fetch(`/api/users/${user.id}`)
      if (response.ok) {
        const data = await response.json()
        const profile = data.user
        setUserData({
          name: profile?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          email: profile?.email || user.email || '',
          role: profile?.userRoles?.[0]?.role?.name || 'User',
          avatarUrl: profile?.avatar
        })
      } else {
        setUserData({
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          role: 'User',
          avatarUrl: null
        })
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchUserData()
    
    const handleAvatarUpdate = () => {
      fetchUserData()
    }
    
    window.addEventListener('avatarUpdated', handleAvatarUpdate)
    return () => window.removeEventListener('avatarUpdated', handleAvatarUpdate)
  }, [])
  
  const handleSignOut = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/signin')
      router.refresh()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }
  
  return (
    <Menu as="div" className="relative inline-flex">
      <MenuButton className="inline-flex justify-center items-center group">
        <UserAvatarSimple 
          src={userData.avatarUrl} 
          alt={userData.name} 
          size={32} 
        />
        <div className="flex items-center truncate">
          <span className="truncate ml-2 text-sm font-medium text-gray-600 group-hover:text-gray-800">
            {userData.name}
          </span>
          <ChevronDownIcon className="w-3 h-3 shrink-0 ml-1 text-gray-400" />
        </div>
      </MenuButton>
      <Transition
        as="div"
        className={`origin-top-right z-10 absolute top-full min-w-[11rem] bg-white border border-gray-200 py-1.5 rounded-lg shadow-lg overflow-hidden mt-1 ${align === 'right' ? 'right-0' : 'left-0'}`}
        enter="transition ease-out duration-200 transform"
        enterFrom="opacity-0 -translate-y-2"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-out duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="pt-0.5 pb-2 px-3 mb-1 border-b border-gray-200">
          <div className="font-medium text-gray-800">{userData.name}</div>
          <div className="text-xs text-gray-500 italic">
            {loading ? 'Loading...' : userData.role}
          </div>
        </div>
        <MenuItems as="ul" className="focus:outline-hidden">
          <MenuItem as="li">
            <Link
              className="flex items-center font-medium text-sm text-gray-600 hover:text-gray-700 py-1 px-3"
              href="/settings/profile"
            >
              <UserCircleIcon className="h-3.5 w-3.5 shrink-0 text-gray-400 mr-2" />
              <span>My Profile</span>
            </Link>
          </MenuItem>
          <MenuItem as="li">
            <button
              className="font-medium text-sm flex items-center py-1 px-3 text-violet-500 w-full text-left cursor-pointer"
              onClick={handleSignOut}
            >
              <ArrowLeftOnRectangleIcon className="h-3.5 w-3.5 shrink-0 text-violet-500 mr-2" />
              <span>Sign Out</span>
            </button>
          </MenuItem>
        </MenuItems>
      </Transition>
    </Menu>
  )
}
