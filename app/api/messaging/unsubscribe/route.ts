import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Handle one-click unsubscribe (List-Unsubscribe header)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, type } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Find user by unsubscribe token
    const preferences = await prisma.userNotificationPreference.findUnique({
      where: { unsubscribeToken: token },
    });

    if (!preferences) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
    }

    // Update preferences based on type
    const updateData: any = {};

    if (type === 'email' || type === 'all') {
      updateData.emailEnabled = false;
      updateData.emailUnsubscribedAt = new Date();
    }

    if (type === 'sms' || type === 'all') {
      updateData.smsEnabled = false;
      updateData.smsUnsubscribedAt = new Date();
    }

    if (type === 'marketing') {
      updateData.emailMarketing = false;
      updateData.smsMarketing = false;
    }

    await prisma.userNotificationPreference.update({
      where: { unsubscribeToken: token },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing unsubscribe:', error);
    return NextResponse.json(
      { error: 'Failed to unsubscribe' },
      { status: 500 }
    );
  }
}

// GET for email link unsubscribe (redirects to confirmation page)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const type = searchParams.get('type') || 'email';

  if (!token) {
    return NextResponse.redirect(
      new URL('/unsubscribe?error=missing-token', request.url)
    );
  }

  try {
    // Find user by unsubscribe token
    const preferences = await prisma.userNotificationPreference.findUnique({
      where: { unsubscribeToken: token },
      include: { user: { select: { email: true } } },
    });

    if (!preferences) {
      return NextResponse.redirect(
        new URL('/unsubscribe?error=invalid-token', request.url)
      );
    }

    // Update preferences
    const updateData: any = {};

    if (type === 'email' || type === 'all') {
      updateData.emailEnabled = false;
      updateData.emailUnsubscribedAt = new Date();
    }

    if (type === 'sms' || type === 'all') {
      updateData.smsEnabled = false;
      updateData.smsUnsubscribedAt = new Date();
    }

    if (type === 'marketing') {
      updateData.emailMarketing = false;
      updateData.smsMarketing = false;
    }

    await prisma.userNotificationPreference.update({
      where: { unsubscribeToken: token },
      data: updateData,
    });

    // Redirect to success page
    return NextResponse.redirect(
      new URL(`/unsubscribe?success=true&type=${type}`, request.url)
    );
  } catch (error) {
    console.error('Error processing unsubscribe:', error);
    return NextResponse.redirect(
      new URL('/unsubscribe?error=failed', request.url)
    );
  }
}
