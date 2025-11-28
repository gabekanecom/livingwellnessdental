'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react'
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  actionUrl?: string
  isRead: boolean
  createdAt: string
}

function getNotificationIcon(type: string): string {
  switch (type) {
    case 'ARTICLE_SUBMITTED_FOR_REVIEW':
      return '📝'
    case 'ARTICLE_REVIEW_ASSIGNED':
      return '👤'
    case 'ARTICLE_APPROVED':
      return '✅'
    case 'ARTICLE_REJECTED':
      return '⚠️'
    case 'ARTICLE_PUBLISHED':
      return '🎉'
    case 'COURSE_ASSIGNED':
      return '📚'
    case 'COURSE_COMPLETED':
      return '🏆'
    default:
      return '📣'
  }
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export default function DropdownNotifications({ align }: {
  align?: 'left' | 'right'
}) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    try {
      const [notifResponse, countResponse] = await Promise.all([
        fetch('/api/notifications?limit=5'),
        fetch('/api/notifications/unread-count'),
      ])

      if (notifResponse.ok) {
        const data = await notifResponse.json()
        setNotifications(data.notifications || [])
      }

      if (countResponse.ok) {
        const data = await countResponse.json()
        setUnreadCount(data.count || 0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
      })
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  return (
    <Menu as="div" className="relative inline-flex">
      {({ open }) => (
        <>
          <MenuButton
            className={`w-8 h-8 flex items-center justify-center hover:bg-gray-100 lg:hover:bg-gray-200 rounded-full ${
              open && 'bg-gray-200'
            }`}
          >
            <span className="sr-only">Notifications</span>
            <BellIcon className="w-5 h-5 text-gray-500/80" />
            {unreadCount > 0 && (
              <div className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-gray-100 rounded-full flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </div>
            )}
          </MenuButton>
          <Transition
            as="div"
            className={`origin-top-right z-10 absolute top-full -mr-48 sm:mr-0 min-w-[20rem] bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden mt-1 ${
              align === 'right' ? 'right-0' : 'left-0'
            }`}
            enter="transition ease-out duration-200 transform"
            enterFrom="opacity-0 -translate-y-2"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-out duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="flex items-center justify-between pt-3 pb-2 px-4 border-b border-gray-200">
              <span className="text-xs font-semibold text-gray-400 uppercase">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1"
                >
                  <CheckIcon className="w-3 h-3" />
                  Mark all read
                </button>
              )}
            </div>
            <MenuItems as="ul" className="focus:outline-hidden max-h-80 overflow-y-auto">
              {isLoading ? (
                <li className="py-8 text-center text-gray-500 text-sm">
                  Loading...
                </li>
              ) : notifications.length === 0 ? (
                <li className="py-8 text-center text-gray-500 text-sm">
                  No notifications
                </li>
              ) : (
                notifications.map((notification) => (
                  <MenuItem key={notification.id} as="li" className="border-b border-gray-200 last:border-0">
                    {({ active }) => (
                      <Link
                        className={`block py-2 px-4 ${active && 'bg-gray-50'} ${
                          !notification.isRead && 'bg-violet-50'
                        }`}
                        href={notification.actionUrl || '#'}
                        onClick={() => {
                          if (!notification.isRead) {
                            markAsRead(notification.id)
                          }
                        }}
                      >
                        <span className="block text-sm mb-1">
                          {getNotificationIcon(notification.type)}{' '}
                          <span className="font-medium text-gray-800">{notification.title}</span>
                        </span>
                        <span className="block text-xs text-gray-600 line-clamp-2">
                          {notification.message}
                        </span>
                        <span className="block text-xs font-medium text-gray-400 mt-1">
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                      </Link>
                    )}
                  </MenuItem>
                ))
              )}
            </MenuItems>
            {notifications.length > 0 && (
              <div className="border-t border-gray-200 p-2">
                <Link
                  href="/notifications"
                  className="block text-center text-sm text-violet-600 hover:text-violet-700 py-1"
                >
                  View all notifications
                </Link>
              </div>
            )}
          </Transition>
        </>
      )}
    </Menu>
  )
}
