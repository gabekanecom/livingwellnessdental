import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EmailStatus } from '@prisma/client';

// Resend webhook event types
type ResendEventType =
  | 'email.sent'
  | 'email.delivered'
  | 'email.delivery_delayed'
  | 'email.complained'
  | 'email.bounced'
  | 'email.opened'
  | 'email.clicked';

interface ResendWebhookEvent {
  type: ResendEventType;
  created_at: string;
  data: {
    email_id: string;
    to: string[];
    from: string;
    subject: string;
    created_at: string;
    // For bounce events
    bounce?: {
      message: string;
    };
    // For click events
    click?: {
      link: string;
    };
  };
}

// Map Resend event types to our EmailStatus
function mapEventToStatus(eventType: ResendEventType): EmailStatus | null {
  const statusMap: Partial<Record<ResendEventType, EmailStatus>> = {
    'email.sent': 'SENT',
    'email.delivered': 'DELIVERED',
    'email.bounced': 'BOUNCED',
    'email.complained': 'COMPLAINED',
    'email.opened': 'OPENED',
    'email.clicked': 'CLICKED',
  };
  return statusMap[eventType] || null;
}

export async function POST(request: NextRequest) {
  try {
    const event: ResendWebhookEvent = await request.json();

    // Validate the webhook (in production, verify signature)
    // Resend sends a webhook signature in the 'svix-signature' header
    // For now, we'll accept all webhooks but you should verify in production

    const { type, data } = event;
    const resendId = data.email_id;

    if (!resendId) {
      return NextResponse.json({ error: 'Missing email_id' }, { status: 400 });
    }

    const newStatus = mapEventToStatus(type);

    if (!newStatus) {
      // Event type we don't track, just acknowledge
      return NextResponse.json({ received: true });
    }

    // Build update data based on event type
    const updateData: any = {
      status: newStatus,
    };

    switch (type) {
      case 'email.delivered':
        updateData.deliveredAt = new Date(event.created_at);
        break;
      case 'email.opened':
        updateData.openedAt = new Date(event.created_at);
        break;
      case 'email.clicked':
        updateData.clickedAt = new Date(event.created_at);
        break;
      case 'email.bounced':
        updateData.bouncedAt = new Date(event.created_at);
        if (data.bounce?.message) {
          updateData.errorMessage = data.bounce.message;
        }
        break;
      case 'email.complained':
        updateData.complainedAt = new Date(event.created_at);
        break;
    }

    // Update the email message record
    await prisma.emailMessage.updateMany({
      where: { resendId },
      data: updateData,
    });

    // If bounced or complained, consider updating user preferences
    if (type === 'email.bounced' || type === 'email.complained') {
      const emailMessage = await prisma.emailMessage.findFirst({
        where: { resendId },
        select: { userId: true, toEmail: true },
      });

      if (emailMessage?.userId) {
        // Log the issue - you might want to disable email for this user
        console.warn(
          `Email ${type} for user ${emailMessage.userId}: ${emailMessage.toEmail}`
        );

        // Optionally disable email for users with hard bounces or complaints
        if (type === 'email.complained') {
          await prisma.userNotificationPreference.updateMany({
            where: { userId: emailMessage.userId },
            data: {
              emailEnabled: false,
              emailUnsubscribedAt: new Date(),
            },
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing Resend webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
