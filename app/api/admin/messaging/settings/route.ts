import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

// GET messaging settings
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create default settings
    let settings = await prisma.messagingSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await prisma.messagingSettings.create({
        data: { id: 'default' },
      });
    }

    // Mask sensitive data
    return NextResponse.json({
      ...settings,
      resendApiKey: settings.resendApiKey ? '***' + settings.resendApiKey.slice(-4) : null,
      twilioAccountSid: settings.twilioAccountSid
        ? '***' + settings.twilioAccountSid.slice(-4)
        : null,
      twilioAuthToken: settings.twilioAuthToken ? '********' : null,
    });
  } catch (error) {
    console.error('Error fetching messaging settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT update messaging settings
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Only update fields that are provided and not masked
    const updateData: any = {};

    // Email settings
    if (body.emailEnabled !== undefined) updateData.emailEnabled = body.emailEnabled;
    if (body.resendApiKey && !body.resendApiKey.startsWith('***')) {
      updateData.resendApiKey = body.resendApiKey;
    }
    if (body.fromEmail !== undefined) updateData.fromEmail = body.fromEmail;
    if (body.fromName !== undefined) updateData.fromName = body.fromName;
    if (body.replyToEmail !== undefined) updateData.replyToEmail = body.replyToEmail;

    // SMS settings
    if (body.smsEnabled !== undefined) updateData.smsEnabled = body.smsEnabled;
    if (body.twilioAccountSid && !body.twilioAccountSid.startsWith('***')) {
      updateData.twilioAccountSid = body.twilioAccountSid;
    }
    if (body.twilioAuthToken && body.twilioAuthToken !== '********') {
      updateData.twilioAuthToken = body.twilioAuthToken;
    }
    if (body.twilioPhoneNumber !== undefined) {
      updateData.twilioPhoneNumber = body.twilioPhoneNumber;
    }

    // Default preferences
    if (body.defaultEmailOptIn !== undefined) {
      updateData.defaultEmailOptIn = body.defaultEmailOptIn;
    }
    if (body.defaultSmsOptIn !== undefined) {
      updateData.defaultSmsOptIn = body.defaultSmsOptIn;
    }

    // Rate limits
    if (body.emailRateLimitPerHour !== undefined) {
      updateData.emailRateLimitPerHour = body.emailRateLimitPerHour;
    }
    if (body.smsRateLimitPerHour !== undefined) {
      updateData.smsRateLimitPerHour = body.smsRateLimitPerHour;
    }

    const settings = await prisma.messagingSettings.upsert({
      where: { id: 'default' },
      update: updateData,
      create: { id: 'default', ...updateData },
    });

    // Mask sensitive data in response
    return NextResponse.json({
      ...settings,
      resendApiKey: settings.resendApiKey ? '***' + settings.resendApiKey.slice(-4) : null,
      twilioAccountSid: settings.twilioAccountSid
        ? '***' + settings.twilioAccountSid.slice(-4)
        : null,
      twilioAuthToken: settings.twilioAuthToken ? '********' : null,
    });
  } catch (error) {
    console.error('Error updating messaging settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
