import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import { EmailStatus, EmailTemplateCategory } from '@prisma/client';

// Types
export interface SendEmailOptions {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
  userId?: string;
  templateId?: string;
  templateVariables?: Record<string, string>;
  category?: EmailTemplateCategory;
  referenceType?: string;
  referenceId?: string;
}

export interface SendTemplatedEmailOptions {
  to: string;
  toName?: string;
  userId?: string;
  templateSlug: string;
  variables: Record<string, string>;
  referenceType?: string;
  referenceId?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Get messaging settings from database or environment
async function getMessagingSettings() {
  try {
    const settings = await prisma.messagingSettings.findUnique({
      where: { id: 'default' },
    });

    if (settings?.emailEnabled && settings.resendApiKey) {
      return {
        apiKey: settings.resendApiKey,
        fromEmail: settings.fromEmail || process.env.FROM_EMAIL,
        fromName: settings.fromName || process.env.FROM_NAME,
        replyTo: settings.replyToEmail,
        enabled: settings.emailEnabled,
      };
    }
  } catch (error) {
    console.error('Error fetching messaging settings:', error);
  }

  // Fallback to environment variables
  return {
    apiKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.FROM_EMAIL,
    fromName: process.env.FROM_NAME,
    replyTo: undefined,
    enabled: !!process.env.RESEND_API_KEY,
  };
}

// Get or create Resend client
let resendClient: Resend | null = null;

async function getResendClient(): Promise<Resend | null> {
  const settings = await getMessagingSettings();

  if (!settings.enabled || !settings.apiKey) {
    console.warn('Email service is not configured');
    return null;
  }

  if (!resendClient) {
    resendClient = new Resend(settings.apiKey);
  }

  return resendClient;
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

// Send a raw email
export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  const settings = await getMessagingSettings();
  const resend = await getResendClient();

  if (!resend) {
    return { success: false, error: 'Email service not configured' };
  }

  // Create email message record
  const emailMessage = await prisma.emailMessage.create({
    data: {
      toEmail: options.to,
      toName: options.toName,
      userId: options.userId,
      subject: options.subject,
      htmlContent: options.html,
      textContent: options.text,
      templateId: options.templateId,
      templateVariables: options.templateVariables,
      category: options.category || 'TRANSACTIONAL',
      referenceType: options.referenceType,
      referenceId: options.referenceId,
      status: 'QUEUED',
    },
  });

  try {
    // Update status to sending
    await prisma.emailMessage.update({
      where: { id: emailMessage.id },
      data: { status: 'SENDING' },
    });

    const fromAddress = settings.fromName
      ? `${settings.fromName} <${settings.fromEmail}>`
      : settings.fromEmail;

    const { data, error } = await resend.emails.send({
      from: fromAddress!,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: settings.replyTo || undefined,
    });

    if (error) {
      await prisma.emailMessage.update({
        where: { id: emailMessage.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
        },
      });
      return { success: false, error: error.message };
    }

    // Update with Resend message ID
    await prisma.emailMessage.update({
      where: { id: emailMessage.id },
      data: {
        status: 'SENT',
        resendId: data?.id,
        sentAt: new Date(),
      },
    });

    // Update template sent count if using a template
    if (options.templateId) {
      await prisma.emailTemplate.update({
        where: { id: options.templateId },
        data: { sentCount: { increment: 1 } },
      });
    }

    return { success: true, messageId: data?.id };
  } catch (error: any) {
    // Update status to failed
    await prisma.emailMessage.update({
      where: { id: emailMessage.id },
      data: {
        status: 'FAILED',
        errorMessage: error.message,
        retryCount: { increment: 1 },
        lastRetryAt: new Date(),
      },
    });

    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

// Send an email using a template
export async function sendTemplatedEmail(
  options: SendTemplatedEmailOptions
): Promise<EmailResult> {
  // Fetch the template
  const template = await prisma.emailTemplate.findUnique({
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
      // Check if email is enabled
      if (!preferences.emailEnabled) {
        return { success: false, error: 'User has disabled email notifications' };
      }

      // Check specific preference based on template category
      if (template.category === 'MARKETING' && !preferences.emailMarketing) {
        return { success: false, error: 'User has not opted in to marketing emails' };
      }

      if (template.category === 'NOTIFICATION' && !preferences.emailNotifications) {
        return { success: false, error: 'User has disabled notification emails' };
      }
    }
  }

  // Interpolate variables
  const subject = interpolateTemplate(template.subject, options.variables);
  const html = interpolateTemplate(template.htmlContent, options.variables);
  const text = template.textContent
    ? interpolateTemplate(template.textContent, options.variables)
    : undefined;

  return sendEmail({
    to: options.to,
    toName: options.toName,
    userId: options.userId,
    subject,
    html,
    text,
    templateId: template.id,
    templateVariables: options.variables,
    category: template.category,
    referenceType: options.referenceType,
    referenceId: options.referenceId,
  });
}

// Send bulk emails (with rate limiting)
export async function sendBulkEmails(
  emails: SendEmailOptions[],
  delayMs: number = 100
): Promise<{ total: number; sent: number; failed: number; results: EmailResult[] }> {
  const results: EmailResult[] = [];
  let sent = 0;
  let failed = 0;

  for (const email of emails) {
    const result = await sendEmail(email);
    results.push(result);

    if (result.success) {
      sent++;
    } else {
      failed++;
    }

    // Add delay between emails to avoid rate limiting
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return { total: emails.length, sent, failed, results };
}

// Retry failed emails
export async function retryFailedEmails(maxRetries: number = 3): Promise<number> {
  const failedEmails = await prisma.emailMessage.findMany({
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

  for (const email of failedEmails) {
    const result = await sendEmail({
      to: email.toEmail,
      toName: email.toName || undefined,
      userId: email.userId || undefined,
      subject: email.subject,
      html: email.htmlContent,
      text: email.textContent || undefined,
      templateId: email.templateId || undefined,
      templateVariables: email.templateVariables as Record<string, string> | undefined,
      category: email.category,
      referenceType: email.referenceType || undefined,
      referenceId: email.referenceId || undefined,
    });

    if (result.success) {
      retriedCount++;
    }

    // Small delay between retries
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return retriedCount;
}

// Get email statistics
export async function getEmailStats(days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [total, byStatus, byCategory] = await Promise.all([
    prisma.emailMessage.count({
      where: { createdAt: { gte: startDate } },
    }),
    prisma.emailMessage.groupBy({
      by: ['status'],
      where: { createdAt: { gte: startDate } },
      _count: true,
    }),
    prisma.emailMessage.groupBy({
      by: ['category'],
      where: { createdAt: { gte: startDate } },
      _count: true,
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
    deliveryRate:
      total > 0
        ? ((statusMap.DELIVERED || 0) + (statusMap.OPENED || 0) + (statusMap.CLICKED || 0)) /
          total
        : 0,
    openRate: total > 0 ? ((statusMap.OPENED || 0) + (statusMap.CLICKED || 0)) / total : 0,
    bounceRate: total > 0 ? (statusMap.BOUNCED || 0) / total : 0,
  };
}
