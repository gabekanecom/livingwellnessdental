'use client'

import { useState } from 'react'
import Image from 'next/image'
import DefaultAvatar from '@/public/images/user-avatar-default.svg'

interface UserAvatarSimpleProps {
  src?: string | null
  alt?: string
  size?: number
  className?: string
}

export default function UserAvatarSimple({ 
  src, 
  alt = 'User', 
  size = 80,
  className = ''
}: UserAvatarSimpleProps) {
  const [error, setError] = useState(false)

  if (!src || error) {
    return (
      <Image
        className={`rounded-full ${className}`}
        src={DefaultAvatar}
        width={size}
        height={size}
        alt={alt}
      />
    )
  }

  return (
    <img
      className={`rounded-full object-cover ${className}`}
      src={src}
      width={size}
      height={size}
      alt={alt}
      onError={() => setError(true)}
    />
  )
}
