import twilio from 'twilio';
import { prisma } from '@/lib/prisma';
import { SmsStatus, SmsTemplateCategory } from '@prisma/client';

// Types
export interface SendSmsOptions {
  to: string;
  body: string;
  userId?: string;
  templateId?: string;
  templateVariables?: Record<string, string>;
  category?: SmsTemplateCategory;
  referenceType?: string;
  referenceId?: string;
}

export interface SendTemplatedSmsOptions {
  to: string;
  userId?: string;
  templateSlug: string;
  variables: Record<string, string>;
  referenceType?: string;
  referenceId?: string;
}

export interface SmsResult {
  success: boolean;
  messageSid?: string;
  error?: string;
}

// Get messaging settings from database or environment
async function getMessagingSettings() {
  try {
    const settings = await prisma.messagingSettings.findUnique({
      where: { id: 'default' },
    });

    if (settings?.smsEnabled && settings.twilioAccountSid && settings.twilioAuthToken) {
      return {
        accountSid: settings.twilioAccountSid,
        authToken: settings.twilioAuthToken,
        phoneNumber: settings.twilioPhoneNumber || process.env.TWILIO_PHONE_NUMBER,
        enabled: settings.smsEnabled,
      };
    }
  } catch (error) {
    console.error('Error fetching messaging settings:', error);
  }

  // Fallback to environment variables
  return {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    enabled: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
  };
}

// Get or create Twilio client
let twilioClient: twilio.Twilio | null = null;

async function getTwilioClient(): Promise<twilio.Twilio | null> {
  const settings = await getMessagingSettings();

  if (!settings.enabled || !settings.accountSid || !settings.authToken) {
    console.warn('SMS service is not configured');
    return null;
  }

  if (!twilioClient) {
    twilioClient = twilio(settings.accountSid, settings.authToken);
  }

  return twilioClient;
}

// Normalize phone number to E.164 format
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters except leading +
  let normalized = phone.replace(/[^\d+]/g, '');

  // If doesn't start with +, assume US number
  if (!normalized.startsWith('+')) {
    // Remove leading 1 if present
    if (normalized.startsWith('1') && normalized.length === 11) {
      normalized = '+' + normalized;
    } else if (normalized.length === 10) {
      normalized = '+1' + normalized;
    } else {
      normalized = '+' + normalized;
    }
  }

  return normalized;
}

// Calculate SMS segments (standard SMS is 160 chars, Unicode is 70 chars)
export function calculateSegments(message: string): number {
  // Check if message contains non-GSM characters (requires Unicode)
  const gsmRegex =
    /^[@£$¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞ !"#%&'()*+,\-.\/0-9:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà\r\n]*$/;

  const isGsm = gsmRegex.test(message);
  const charLimit = isGsm ? 160 : 70;
  const concatLimit = isGsm ? 153 : 67; // Concatenated messages have header overhead

  if (message.length <= charLimit) {
    return 1;
  }

  return Math.ceil(message.length / concatLimit);
}

// Interpolate template variables
export function interpolateTemplate(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? variables[key] : match;
  });
}

// Send an SMS
export async function sendSms(options: SendSmsOptions): Promise<SmsResult> {
  const settings = await getMessagingSettings();
  const client = await getTwilioClient();

  if (!client || !settings.phoneNumber) {
    return { success: false, error: 'SMS service not configured' };
  }

  const normalizedTo = normalizePhoneNumber(options.to);
  const segments = calculateSegments(options.body);

  // Create SMS message record
  const smsMessage = await prisma.smsMessage.create({
    data: {
      toPhone: normalizedTo,
      userId: options.userId,
      content: options.body,
      templateId: options.templateId,
      templateVariables: options.templateVariables,
      category: options.category || 'TRANSACTIONAL',
      referenceType: options.referenceType,
      referenceId: options.referenceId,
      segments,
      status: 'QUEUED',
    },
  });

  try {
    // Update status to sending
    await prisma.smsMessage.update({
      where: { id: smsMessage.id },
      data: { status: 'SENDING' },
    });

    const message = await client.messages.create({
      body: options.body,
      from: settings.phoneNumber,
      to: normalizedTo,
      statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/messaging/webhooks/twilio`,
    });

    // Update with Twilio SID
    await prisma.smsMessage.update({
      where: { id: smsMessage.id },
      data: {
        status: 'SENT',
        twilioSid: message.sid,
        sentAt: new Date(),
      },
    });

    // Update template sent count if using a template
    if (options.templateId) {
      await prisma.smsTemplate.update({
        where: { id: options.templateId },
        data: { sentCount: { increment: 1 } },
      });
    }

    return { success: true, messageSid: message.sid };
  } catch (error: any) {
    // Parse Twilio error
    const errorCode = error.code?.toString();
    const errorMessage = error.message || 'Unknown error';

    // Update status to failed
    await prisma.smsMessage.update({
      where: { id: smsMessage.id },
      data: {
        status: 'FAILED',
        failedAt: new Date(),
        errorCode,
        errorMessage,
        retryCount: { increment: 1 },
        lastRetryAt: new Date(),
      },
    });

    console.error('Error sending SMS:', error);
    return { success: false, error: errorMessage };
  }
}

// Send an SMS using a template
export async function sendTemplatedSms(
  options: SendTemplatedSmsOptions
): Promise<SmsResult> {
  // Fetch the template
  const template = await prisma.smsTemplate.findUnique({
    where: { slug: options.templateSlug },
  });

  if (!template) {
    return { success: false, error: `Template '${options.templateSlug}' not found` };
  }

  if (!template.isActive) {
    return { success: false, error: `Template '${options.templateSlug}' is not active` };
  }

  // Check user preferences if userId is provided
  if (options.userId) {
    const preferences = await prisma.userNotificationPreference.findUnique({
      where: { userId: options.userId },
    });

    if (preferences) {
      // Check if SMS is enabled
      if (!preferences.smsEnabled) {
        return { success: false, error: 'User has disabled SMS notifications' };
      }

      // Check specific preference based on template category
      if (template.category === 'MARKETING' && !preferences.smsMarketing) {
        return { success: false, error: 'User has not opted in to marketing SMS' };
      }

      if (template.category === 'NOTIFICATION' && !preferences.smsNotifications) {
        return { success: false, error: 'User has disabled SMS notifications' };
      }
    }
  }

  // Interpolate variables
  const body = interpolateTemplate(template.content, options.variables);

  return sendSms({
    to: options.to,
    body,
    userId: options.userId,
    templateId: template.id,
    templateVariables: options.variables,
    category: template.category,
    referenceType: options.referenceType,
    referenceId: options.referenceId,
  });
}

// Send bulk SMS (with rate limiting)
export async function sendBulkSms(
  messages: SendSmsOptions[],
  delayMs: number = 200
): Promise<{ total: number; sent: number; failed: number; results: SmsResult[] }> {
  const results: SmsResult[] = [];
  let sent = 0;
  let failed = 0;

  for (const sms of messages) {
    const result = await sendSms(sms);
    results.push(result);

    if (result.success) {
      sent++;
    } else {
      failed++;
    }

    // Add delay between messages to avoid rate limiting
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return { total: messages.length, sent, failed, results };
}

// Retry failed SMS
export async function retryFailedSms(maxRetries: number = 3): Promise<number> {
  const failedMessages = await prisma.smsMessage.findMany({
    where: {
      status: 'FAILED',
      retryCount: { lt: maxRetries },
    },
    include: {
      template: true,
    },
    take: 50,
  });

  let retriedCount = 0;

  for (const sms of failedMessages) {
    const result = await sendSms({
      to: sms.toPhone,
      body: sms.content,
      userId: sms.userId || undefined,
      templateId: sms.templateId || undefined,
      templateVariables: sms.templateVariables as Record<string, string> | undefined,
      category: sms.category,
      referenceType: sms.referenceType || undefined,
      referenceId: sms.referenceId || undefined,
    });

    if (result.success) {
      retriedCount++;
    }

    // Small delay between retries
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return retriedCount;
}

// Update SMS status from Twilio webhook
export async function updateSmsStatus(
  twilioSid: string,
  status: string,
  errorCode?: string,
  errorMessage?: string
): Promise<void> {
  const statusMap: Record<string, SmsStatus> = {
    queued: 'QUEUED',
    sending: 'SENDING',
    sent: 'SENT',
    delivered: 'DELIVERED',
    undelivered: 'UNDELIVERED',
    failed: 'FAILED',
  };

  const mappedStatus = statusMap[status.toLowerCase()] || 'SENT';

  const updateData: any = {
    status: mappedStatus,
  };

  if (mappedStatus === 'DELIVERED') {
    updateData.deliveredAt = new Date();
  } else if (mappedStatus === 'FAILED' || mappedStatus === 'UNDELIVERED') {
    updateData.failedAt = new Date();
    if (errorCode) updateData.errorCode = errorCode;
    if (errorMessage) updateData.errorMessage = errorMessage;
  }

  await prisma.smsMessage.updateMany({
    where: { twilioSid },
    data: updateData,
  });
}

// Get SMS statistics
export async function getSmsStats(days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [total, byStatus, byCategory, totalCost] = await Promise.all([
    prisma.smsMessage.count({
      where: { createdAt: { gte: startDate } },
    }),
    prisma.smsMessage.groupBy({
      by: ['status'],
      where: { createdAt: { gte: startDate } },
      _count: true,
    }),
    prisma.smsMessage.groupBy({
      by: ['category'],
      where: { createdAt: { gte: startDate } },
      _count: true,
    }),
    prisma.smsMessage.aggregate({
      where: { createdAt: { gte: startDate } },
      _sum: { price: true },
    }),
  ]);

  const statusMap = byStatus.reduce((acc, item) => {
    acc[item.status] = item._count;
    return acc;
  }, {} as Record<string, number>);

  const categoryMap = byCategory.reduce((acc, item) => {
    acc[item.category] = item._count;
    return acc;
  }, {} as Record<string, number>);

  return {
    total,
    byStatus: statusMap,
    byCategory: categoryMap,
    totalCost: totalCost._sum.price || 0,
    deliveryRate:
      total > 0 ? (statusMap.DELIVERED || 0) / total : 0,
    failureRate:
      total > 0 ? ((statusMap.FAILED || 0) + (statusMap.UNDELIVERED || 0)) / total : 0,
  };
}
