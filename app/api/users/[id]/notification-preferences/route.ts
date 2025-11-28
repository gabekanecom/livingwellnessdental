import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

// GET user notification preferences
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Users can only view their own preferences unless admin
    if (id !== user.id && id !== 'me') {
      // TODO: Add admin check here
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = id === 'me' ? user.id : id;

    // Get or create preferences
    let preferences = await prisma.userNotificationPreference.findUnique({
      where: { userId },
    });

    if (!preferences) {
      // Get default settings
      const settings = await prisma.messagingSettings.findUnique({
        where: { id: 'default' },
      });

      // Create default preferences
      preferences = await prisma.userNotificationPreference.create({
        data: {
          userId,
          emailEnabled: settings?.defaultEmailOptIn ?? true,
          smsEnabled: settings?.defaultSmsOptIn ?? false,
        },
      });
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

// PUT update user notification preferences
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Users can only update their own preferences unless admin
    if (id !== user.id && id !== 'me') {
      // TODO: Add admin check here
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = id === 'me' ? user.id : id;
    const body = await request.json();

    // Get client IP for consent tracking
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // Build update data
    const updateData: any = {};

    // Email preferences
    if (body.emailEnabled !== undefined) updateData.emailEnabled = body.emailEnabled;
    if (body.emailNotifications !== undefined)
      updateData.emailNotifications = body.emailNotifications;
    if (body.emailDigest !== undefined) updateData.emailDigest = body.emailDigest;
    if (body.digestFrequency !== undefined)
      updateData.digestFrequency = body.digestFrequency;

    // SMS preferences
    if (body.smsEnabled !== undefined) updateData.smsEnabled = body.smsEnabled;
    if (body.smsNotifications !== undefined)
      updateData.smsNotifications = body.smsNotifications;
    if (body.smsPhoneNumber !== undefined) {
      updateData.smsPhoneNumber = body.smsPhoneNumber;
      updateData.smsPhoneVerified = false; // Reset verification when phone changes
    }

    // Marketing consent (requires explicit tracking)
    if (body.emailMarketing !== undefined) {
      updateData.emailMarketing = body.emailMarketing;
      if (body.emailMarketing) {
        updateData.marketingConsentAt = new Date();
        updateData.marketingConsentIp = clientIp;
      }
    }
    if (body.smsMarketing !== undefined) {
      updateData.smsMarketing = body.smsMarketing;
      if (body.smsMarketing) {
        updateData.marketingConsentAt = new Date();
        updateData.marketingConsentIp = clientIp;
      }
    }

    // Track consent if enabling email/SMS
    if (body.emailEnabled === true) {
      updateData.emailConsentAt = new Date();
      updateData.emailConsentIp = clientIp;
      updateData.emailUnsubscribedAt = null;
    }
    if (body.smsEnabled === true) {
      updateData.smsConsentAt = new Date();
      updateData.smsConsentIp = clientIp;
      updateData.smsUnsubscribedAt = null;
    }

    // Track unsubscribe
    if (body.emailEnabled === false) {
      updateData.emailUnsubscribedAt = new Date();
    }
    if (body.smsEnabled === false) {
      updateData.smsUnsubscribedAt = new Date();
    }

    const preferences = await prisma.userNotificationPreference.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        ...updateData,
      },
    });

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
