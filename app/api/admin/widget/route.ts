import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

// Default settings for new installations
const defaultSettings = {
  isEnabled: true,
  theme: 'light',
  accentColor: '3ec972',
  position: 'right',
  greeting: 'Hi! How can I help you today?',
  headerTitle: 'Living Wellness Dental',
  headerSubtitle: 'Ask us anything',
  inputPlaceholder: 'Type your message...',
  systemPrompt: null,
  allowedDomains: [],
  rateLimitPerMin: 10,
};

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create widget settings
    let settings = await prisma.chatWidgetSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await prisma.chatWidgetSettings.create({
        data: {
          id: 'default',
          ...defaultSettings,
        },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching widget settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch widget settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    const allowedFields = [
      'isEnabled',
      'theme',
      'accentColor',
      'position',
      'greeting',
      'headerTitle',
      'headerSubtitle',
      'inputPlaceholder',
      'systemPrompt',
      'allowedDomains',
      'rateLimitPerMin',
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Validate accentColor format (hex without #)
    if (updateData.accentColor) {
      const hexRegex = /^[0-9A-Fa-f]{6}$/;
      if (!hexRegex.test(updateData.accentColor as string)) {
        return NextResponse.json(
          { error: 'Invalid accent color format. Use 6 hex characters without #' },
          { status: 400 }
        );
      }
    }

    // Validate theme
    if (updateData.theme && !['light', 'dark'].includes(updateData.theme as string)) {
      return NextResponse.json(
        { error: 'Theme must be either "light" or "dark"' },
        { status: 400 }
      );
    }

    // Validate position
    if (updateData.position && !['left', 'right'].includes(updateData.position as string)) {
      return NextResponse.json(
        { error: 'Position must be either "left" or "right"' },
        { status: 400 }
      );
    }

    const settings = await prisma.chatWidgetSettings.upsert({
      where: { id: 'default' },
      update: updateData,
      create: {
        id: 'default',
        ...defaultSettings,
        ...updateData,
      },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error updating widget settings:', error);
    return NextResponse.json(
      { error: 'Failed to update widget settings' },
      { status: 500 }
    );
  }
}
