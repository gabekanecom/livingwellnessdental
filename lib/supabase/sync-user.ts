import prisma from '@/lib/prisma'
import type { User } from '@supabase/supabase-js'

export async function syncUserToPrisma(supabaseUser: User) {
  const existingUser = await prisma.user.findUnique({
    where: { id: supabaseUser.id }
  })

  if (existingUser) {
    return existingUser
  }

  const user = await prisma.user.create({
    data: {
      id: supabaseUser.id,
      email: supabaseUser.email!,
      name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
      emailVerified: supabaseUser.email_confirmed_at ? new Date(supabaseUser.email_confirmed_at) : null,
    }
  })

  return user
}
