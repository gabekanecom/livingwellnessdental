import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const settings = await prisma.brandingSettings.findUnique({
      where: { id: 'default' },
    })

    if (!settings) {
      return NextResponse.json({ settings: null })
    }

    return NextResponse.json({ settings: settings.settings })
  } catch (error: unknown) {
    console.error('Error fetching branding settings:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to fetch settings', details: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const settings = await prisma.brandingSettings.upsert({
      where: { id: 'default' },
      update: { settings: body },
      create: { id: 'default', settings: body },
    })

    return NextResponse.json({ settings: settings.settings })
  } catch (error: unknown) {
    console.error('Error updating branding settings:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to update settings', details: message }, { status: 500 })
  }
}
