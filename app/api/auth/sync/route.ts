import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncUserToPrisma } from '@/lib/supabase/sync-user'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const prismaUser = await syncUserToPrisma(user)

    return NextResponse.json({ user: prismaUser })
  } catch (error) {
    console.error('Error syncing user:', error)
    return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 })
  }
}
