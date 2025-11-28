# Comprehensive Email & SMS Implementation Plan

## Living Wellness Dental - Transactional Messaging System

---

## Executive Summary

This plan outlines the integration of **Resend** for transactional/marketing emails and **Twilio** for SMS notifications. The system is designed to be extensible, starting with transactional notifications and scaling to support marketing campaigns in the future.

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Architecture Overview](#2-architecture-overview)
3. [Database Schema Design](#3-database-schema-design)
4. [Service Provider Integration](#4-service-provider-integration)
5. [Template System Design](#5-template-system-design)
6. [Notification Flow Architecture](#6-notification-flow-architecture)
7. [User Preferences & Consent](#7-user-preferences--consent)
8. [Admin Interface](#8-admin-interface)
9. [API Design](#9-api-design)
10. [Security & Compliance](#10-security--compliance)
11. [Monitoring & Analytics](#11-monitoring--analytics)
12. [Future Marketing Extensions](#12-future-marketing-extensions)
13. [Implementation Phases](#13-implementation-phases)
14. [Environment Variables](#14-environment-variables)
15. [Dependencies](#15-dependencies)
16. [Testing Strategy](#16-testing-strategy)
17. [Rollback Plan](#17-rollback-plan)
18. [Checklist](#18-checklist)

---

## 1. Current State Analysis

### What Exists

| Component | Status | Notes |
|-----------|--------|-------|
| In-app notifications | ✅ Complete | Database-backed, real-time polling |
| User email field | ✅ Exists | Required, unique, verified tracking |
| User phone field | ✅ Exists | Optional, stored but unused |
| Branding system | ✅ Complete | Colors, fonts, logo - can feed into email templates |
| Notification types enum | ✅ Defined | 8 types including future placeholders |
| Admin settings pattern | ✅ Established | Singleton JSON pattern with API |

### What's Missing

| Component | Priority | Complexity |
|-----------|----------|------------|
| Email service integration | High | Medium |
| SMS service integration | High | Medium |
| Email templates | High | Medium |
| SMS templates | High | Low |
| User notification preferences | High | Medium |
| Message queue/tracking | High | Medium |
| Admin template editor | Medium | High |
| Admin messaging settings | Medium | Medium |
| Delivery analytics | Low | Medium |
| Marketing list management | Future | High |

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         APPLICATION LAYER                           │
├─────────────────────────────────────────────────────────────────────┤
│  Trigger Points:                                                     │
│  • Wiki article submitted/approved/rejected                          │
│  • Course assigned/completed                                         │
│  • User account created/password reset                               │
│  • System announcements                                              │
│  • (Future) Marketing campaigns                                      │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      MESSAGING SERVICE LAYER                         │
│                     /lib/messaging/index.ts                          │
├─────────────────────────────────────────────────────────────────────┤
│  • sendNotification(userId, type, data)                              │
│  • Checks user preferences                                           │
│  • Renders templates with branding                                   │
│  • Routes to appropriate channel(s)                                  │
│  • Creates delivery records                                          │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   IN-APP        │  │     EMAIL       │  │      SMS        │
│   (existing)    │  │    (Resend)     │  │    (Twilio)     │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ Notification    │  │ EmailMessage    │  │ SmsMessage      │
│ table           │  │ table           │  │ table           │
└─────────────────┘  └─────────────────┘  └─────────────────┘
                               │                │
                               ▼                ▼
                     ┌─────────────────────────────────┐
                     │     DELIVERY TRACKING           │
                     │  • Sent/Delivered/Failed        │
                     │  • Open/Click tracking (email)  │
                     │  • Retry logic                  │
                     └─────────────────────────────────┘
```

### Key Design Principles

1. **Channel Agnostic**: Core notification logic doesn't know about delivery channels
2. **User Preference Driven**: Users control what they receive and how
3. **Template-Based**: All messages use templates for consistency
4. **Brand-Aware**: Templates automatically use current branding
5. **Trackable**: Every message has a delivery record
6. **Extensible**: Easy to add new channels (push notifications, Slack, etc.)
7. **Fail-Safe**: Email/SMS failures don't break the application

---

## 3. Database Schema Design

### New Models

```prisma
// ============================================
// MESSAGING SETTINGS (Admin Configuration)
// ============================================

model MessagingSettings {
  id        String   @id @default("default")
  settings  Json     // See structure below
  updatedAt DateTime @updatedAt
  createdAt DateTime @default(now())
}

// MessagingSettings.settings structure:
// {
//   email: {
//     enabled: boolean,
//     provider: "resend",
//     fromName: "Living Wellness Dental",
//     fromEmail: "notifications@livingwellnessdental.com",
//     replyToEmail: "support@livingwellnessdental.com",
//     // Resend-specific
//     apiKey: "re_xxxxx" (encrypted or use env var reference)
//   },
//   sms: {
//     enabled: boolean,
//     provider: "twilio",
//     fromNumber: "+1234567890",
//     // Twilio-specific (use env var references)
//   },
//   defaults: {
//     enableEmailForNewUsers: true,
//     enableSmsForNewUsers: false,
//   }
// }


// ============================================
// USER NOTIFICATION PREFERENCES
// ============================================

model UserNotificationPreference {
  id        String   @id @default(cuid())
  userId    String   @db.Uuid
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Channel preferences
  emailEnabled       Boolean @default(true)
  smsEnabled         Boolean @default(false)
  inAppEnabled       Boolean @default(true)

  // Per-type preferences (JSON for flexibility)
  // Key: NotificationType, Value: { email: bool, sms: bool, inApp: bool }
  typePreferences    Json    @default("{}")

  // Email frequency
  emailDigest        EmailDigestFrequency @default(IMMEDIATE)

  // Quiet hours (don't send SMS during these times)
  quietHoursEnabled  Boolean @default(false)
  quietHoursStart    String? // "22:00" (HH:MM in user's timezone)
  quietHoursEnd      String? // "08:00"
  timezone           String  @default("America/New_York")

  // Marketing consent (for future)
  marketingEmailConsent    Boolean   @default(false)
  marketingEmailConsentAt  DateTime?
  marketingSmsConsent      Boolean   @default(false)
  marketingSmsConsentAt    DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId])
  @@index([userId])
}

enum EmailDigestFrequency {
  IMMEDIATE    // Send immediately
  HOURLY       // Batch and send hourly
  DAILY        // Daily digest at configured time
  WEEKLY       // Weekly digest
}


// ============================================
// EMAIL TEMPLATES
// ============================================

model EmailTemplate {
  id          String   @id @default(cuid())

  // Identification
  slug        String   @unique  // e.g., "article-approved", "course-assigned"
  name        String            // Human-readable name
  description String?           // Admin description

  // Template category
  category    EmailTemplateCategory @default(TRANSACTIONAL)

  // Content
  subject     String            // Supports variables: "{{user.name}}, your article was approved"
  htmlBody    String   @db.Text // Full HTML with variables
  textBody    String   @db.Text // Plain text fallback

  // Variables documentation (for admin UI)
  // JSON: { "user.name": "Recipient's name", "article.title": "Article title", ... }
  availableVariables Json @default("{}")

  // Status
  isActive    Boolean  @default(true)
  isSystem    Boolean  @default(false) // System templates can't be deleted

  // Versioning
  version     Int      @default(1)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdById String?  @db.Uuid
  createdBy   User?    @relation("EmailTemplateCreator", fields: [createdById], references: [id])

  // Usage tracking
  messages    EmailMessage[]

  @@index([slug])
  @@index([category])
}

enum EmailTemplateCategory {
  TRANSACTIONAL  // System notifications (article approved, etc.)
  ACCOUNT        // Account-related (welcome, password reset)
  MARKETING      // Marketing campaigns (future)
  DIGEST         // Digest/summary emails
}


// ============================================
// SMS TEMPLATES
// ============================================

model SmsTemplate {
  id          String   @id @default(cuid())

  slug        String   @unique
  name        String
  description String?

  category    SmsTemplateCategory @default(TRANSACTIONAL)

  // Content (SMS is text-only, 160 char limit for single segment)
  body        String   // Supports variables: "Hi {{user.firstName}}, your article..."

  // Character count warning threshold
  maxLength   Int      @default(160)

  availableVariables Json @default("{}")

  isActive    Boolean  @default(true)
  isSystem    Boolean  @default(false)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  messages    SmsMessage[]

  @@index([slug])
}

enum SmsTemplateCategory {
  TRANSACTIONAL
  ACCOUNT
  MARKETING
  ALERT        // Urgent alerts
}


// ============================================
// EMAIL MESSAGE LOG
// ============================================

model EmailMessage {
  id          String   @id @default(cuid())

  // Recipient
  userId      String?  @db.Uuid
  user        User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  toEmail     String   // Stored separately in case user is deleted
  toName      String?

  // Template used
  templateId  String?
  template    EmailTemplate? @relation(fields: [templateId], references: [id], onDelete: SetNull)

  // Content (rendered/final)
  subject     String
  htmlBody    String   @db.Text
  textBody    String?  @db.Text

  // Metadata
  category    EmailTemplateCategory
  notificationType String?  // Links to NotificationType if applicable

  // Provider info
  provider    String   @default("resend") // resend, sendgrid, etc.
  providerId  String?  // External message ID from provider

  // Status tracking
  status      MessageStatus @default(PENDING)
  statusMessage String?     // Error message if failed

  // Timestamps
  scheduledFor DateTime?    // For scheduled sends
  sentAt       DateTime?
  deliveredAt  DateTime?
  openedAt     DateTime?
  clickedAt    DateTime?
  failedAt     DateTime?

  // Retry tracking
  attempts     Int      @default(0)
  maxAttempts  Int      @default(3)
  nextRetryAt  DateTime?

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([userId])
  @@index([status])
  @@index([createdAt])
  @@index([providerId])
}


// ============================================
// SMS MESSAGE LOG
// ============================================

model SmsMessage {
  id          String   @id @default(cuid())

  userId      String?  @db.Uuid
  user        User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  toPhone     String   // E.164 format: +12223334444

  templateId  String?
  template    SmsTemplate? @relation(fields: [templateId], references: [id], onDelete: SetNull)

  body        String   // Rendered message

  category    SmsTemplateCategory
  notificationType String?

  provider    String   @default("twilio")
  providerId  String?  // Twilio SID

  status      MessageStatus @default(PENDING)
  statusMessage String?

  // SMS-specific
  segments    Int      @default(1)  // Number of SMS segments

  scheduledFor DateTime?
  sentAt       DateTime?
  deliveredAt  DateTime?
  failedAt     DateTime?

  attempts     Int      @default(0)
  maxAttempts  Int      @default(3)
  nextRetryAt  DateTime?

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([userId])
  @@index([status])
  @@index([createdAt])
  @@index([providerId])
}

enum MessageStatus {
  PENDING      // Created, not yet sent
  QUEUED       // In provider's queue
  SENT         // Sent to provider successfully
  DELIVERED    // Confirmed delivered
  OPENED       // Email opened (email only)
  CLICKED      // Link clicked (email only)
  BOUNCED      // Hard or soft bounce
  FAILED       // Failed to send
  CANCELLED    // Cancelled before sending
}


// ============================================
// UPDATE EXISTING USER MODEL
// ============================================

model User {
  // ... existing fields ...

  // Add these relations
  notificationPreference UserNotificationPreference?
  emailMessages          EmailMessage[]
  smsMessages            SmsMessage[]
  createdEmailTemplates  EmailTemplate[] @relation("EmailTemplateCreator")
}


// ============================================
// MARKETING (FUTURE)
// ============================================

// These are placeholders for future marketing features

model MarketingList {
  id          String   @id @default(cuid())
  name        String
  description String?

  // Dynamic list criteria (JSON)
  // e.g., { "userType": ["location_staff"], "location": ["northland"] }
  criteria    Json?

  // Or static members
  isStatic    Boolean  @default(false)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  members     MarketingListMember[]
  campaigns   MarketingCampaign[]
}

model MarketingListMember {
  id        String   @id @default(cuid())
  listId    String
  list      MarketingList @relation(fields: [listId], references: [id], onDelete: Cascade)
  userId    String   @db.Uuid
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  addedAt   DateTime @default(now())

  @@unique([listId, userId])
}

model MarketingCampaign {
  id          String   @id @default(cuid())
  name        String
  description String?

  listId      String?
  list        MarketingList? @relation(fields: [listId], references: [id])

  // Channel
  channel     CampaignChannel
  templateId  String   // EmailTemplate or SmsTemplate id

  // Scheduling
  status      CampaignStatus @default(DRAFT)
  scheduledFor DateTime?
  startedAt   DateTime?
  completedAt DateTime?

  // Stats
  totalRecipients Int @default(0)
  sent            Int @default(0)
  delivered       Int @default(0)
  opened          Int @default(0)
  clicked         Int @default(0)
  bounced         Int @default(0)
  unsubscribed    Int @default(0)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum CampaignChannel {
  EMAIL
  SMS
}

enum CampaignStatus {
  DRAFT
  SCHEDULED
  SENDING
  COMPLETED
  CANCELLED
}
```

### Schema Migration Notes

1. Add `MarketingListMember` relation to User model when implementing marketing
2. Consider partitioning EmailMessage/SmsMessage tables by date for performance at scale
3. Add indexes based on query patterns during implementation

---

## 4. Service Provider Integration

### Resend (Email)

**Why Resend?**
- Developer-friendly API
- Excellent deliverability
- React Email support for templates
- Reasonable pricing
- Webhook support for tracking

**Integration Structure:**

```
lib/
  messaging/
    providers/
      resend.ts         # Resend client wrapper
      twilio.ts         # Twilio client wrapper
    index.ts            # Main messaging service
    email.ts            # Email-specific logic
    sms.ts              # SMS-specific logic
    templates.ts        # Template rendering
    queue.ts            # Queue processing (optional)
```

**Resend Client (`lib/messaging/providers/resend.ts`):**

```typescript
import { Resend } from 'resend';

// Singleton pattern
let resendClient: Resend | null = null;

export function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

export async function sendEmail(params: SendEmailParams) {
  const client = getResendClient();
  const fromEmail = params.from || process.env.RESEND_FROM_EMAIL;

  const result = await client.emails.send({
    from: fromEmail,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
    reply_to: params.replyTo,
    tags: params.tags,
  });

  return result;
}
```

### Twilio (SMS)

**Why Twilio?**
- Industry standard
- Global reach
- Excellent documentation
- Webhook support
- Compliance features (opt-out handling)

**Twilio Client (`lib/messaging/providers/twilio.ts`):**

```typescript
import twilio from 'twilio';

let twilioClient: twilio.Twilio | null = null;

export function getTwilioClient(): twilio.Twilio {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }

    twilioClient = twilio(accountSid, authToken);
  }
  return twilioClient;
}

export interface SendSmsParams {
  to: string;       // E.164 format
  body: string;
  from?: string;
}

export async function sendSms(params: SendSmsParams) {
  const client = getTwilioClient();
  const fromNumber = params.from || process.env.TWILIO_FROM_NUMBER;

  const message = await client.messages.create({
    to: params.to,
    from: fromNumber,
    body: params.body,
  });

  return message;
}
```

---

## 5. Template System Design

### Email Template Architecture

**Option A: Database-stored HTML (Simpler, Admin-editable)**
- Store HTML in database
- Use Handlebars/Mustache for variable interpolation
- Admin UI for editing templates
- Preview with test data

**Option B: React Email (Developer-controlled, Type-safe)**
- Templates as React components
- Better type safety
- Version controlled
- Requires deployment for changes

**Recommended: Hybrid Approach**
- System templates (account, critical notifications) as code
- User-editable templates stored in database
- React Email for rendering both

### Template Variable System

```typescript
// Standard variables available to all templates
interface BaseTemplateVariables {
  // Recipient
  user: {
    id: string;
    name: string;
    firstName: string;
    email: string;
  };

  // Branding (auto-injected)
  brand: {
    name: string;
    logo: string;
    primaryColor: string;
    website: string;
  };

  // Links
  links: {
    unsubscribe: string;
    preferences: string;
    website: string;
  };

  // Meta
  currentYear: number;
}

// Type-specific variables
interface ArticleApprovedVariables extends BaseTemplateVariables {
  article: {
    id: string;
    title: string;
    slug: string;
    url: string;
  };
  approvedBy: {
    name: string;
  };
}
```

### Default Email Templates

| Slug | Category | Description |
|------|----------|-------------|
| `welcome` | ACCOUNT | New user welcome email |
| `password-reset` | ACCOUNT | Password reset request |
| `email-verification` | ACCOUNT | Verify email address |
| `article-submitted` | TRANSACTIONAL | Author: article submitted for review |
| `article-review-assigned` | TRANSACTIONAL | Reviewer: article assigned to you |
| `article-approved` | TRANSACTIONAL | Author: article approved |
| `article-rejected` | TRANSACTIONAL | Author: article rejected with feedback |
| `course-assigned` | TRANSACTIONAL | User: new course assigned |
| `course-completed` | TRANSACTIONAL | User: course completion certificate |
| `daily-digest` | DIGEST | Daily notification summary |
| `weekly-digest` | DIGEST | Weekly notification summary |

### Default SMS Templates

| Slug | Category | Description |
|------|----------|-------------|
| `article-approved` | TRANSACTIONAL | Brief: "Your article 'X' was approved" |
| `course-assigned` | TRANSACTIONAL | "New training: X. Login to start." |
| `urgent-alert` | ALERT | System-wide urgent notifications |

### Email Template Structure

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{subject}}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;">

          <!-- Header with Logo -->
          <tr>
            <td style="padding:32px 40px;text-align:center;border-bottom:1px solid #e5e5e5;">
              <img src="{{brand.logo}}" alt="{{brand.name}}" height="40">
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:40px;">
              {{content}}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background:#f9fafb;border-radius:0 0 8px 8px;">
              <p style="margin:0;font-size:12px;color:#6b7280;text-align:center;">
                © {{currentYear}} {{brand.name}}. All rights reserved.
              </p>
              <p style="margin:8px 0 0;font-size:12px;color:#6b7280;text-align:center;">
                <a href="{{links.preferences}}" style="color:#6b7280;">Notification Preferences</a>
                {{#if links.unsubscribe}}
                 · <a href="{{links.unsubscribe}}" style="color:#6b7280;">Unsubscribe</a>
                {{/if}}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 6. Notification Flow Architecture

### Unified Send Flow

```typescript
// lib/messaging/index.ts

import { NotificationType } from '@prisma/client';
import { sendEmailNotification } from './email';
import { sendSmsNotification } from './sms';
import { createNotification } from '@/lib/notifications';

interface SendNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  data?: Record<string, any>;  // Template variables
}

export async function sendNotification(params: SendNotificationParams) {
  const { userId, type, title, message, link, data } = params;

  // 1. Get user with preferences
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { notificationPreference: true },
  });

  if (!user) throw new Error('User not found');

  const prefs = user.notificationPreference || getDefaultPreferences();
  const typePrefs = prefs.typePreferences[type] || { email: true, sms: false, inApp: true };

  const results = {
    inApp: null as string | null,
    email: null as string | null,
    sms: null as string | null,
  };

  // 2. In-app notification (always, unless disabled)
  if (prefs.inAppEnabled && typePrefs.inApp) {
    const notification = await createNotification({
      userId,
      type,
      title,
      message,
      link,
    });
    results.inApp = notification.id;
  }

  // 3. Email notification
  if (prefs.emailEnabled && typePrefs.email) {
    try {
      const emailMessage = await sendEmailNotification({
        user,
        type,
        data: { ...data, title, message, link },
      });
      results.email = emailMessage.id;
    } catch (error) {
      console.error('Email notification failed:', error);
      // Don't throw - in-app notification still succeeded
    }
  }

  // 4. SMS notification
  if (prefs.smsEnabled && typePrefs.sms && user.phone) {
    // Check quiet hours
    if (!isInQuietHours(prefs)) {
      try {
        const smsMessage = await sendSmsNotification({
          user,
          type,
          data: { ...data, title, message },
        });
        results.sms = smsMessage.id;
      } catch (error) {
        console.error('SMS notification failed:', error);
      }
    }
  }

  return results;
}
```

### Integration Points

Update existing notification calls to use the new unified system:

```typescript
// Before (lib/notifications/index.ts)
export async function notifyAuthorOfApproval(article, author, approvedBy) {
  return createNotification({
    userId: author.id,
    type: 'ARTICLE_APPROVED',
    title: 'Article Approved',
    message: `Your article "${article.title}" has been approved`,
    link: `/wiki/article/${article.slug}`,
  });
}

// After
export async function notifyAuthorOfApproval(article, author, approvedBy) {
  return sendNotification({
    userId: author.id,
    type: 'ARTICLE_APPROVED',
    title: 'Article Approved',
    message: `Your article "${article.title}" has been approved`,
    link: `/wiki/article/${article.slug}`,
    data: {
      article: {
        id: article.id,
        title: article.title,
        slug: article.slug,
      },
      approvedBy: {
        name: approvedBy.name,
      },
    },
  });
}
```

---

## 7. User Preferences & Consent

### Default Preferences

```typescript
const DEFAULT_PREFERENCES = {
  emailEnabled: true,
  smsEnabled: false,  // Opt-in for SMS
  inAppEnabled: true,

  typePreferences: {
    // Account-related: always email
    'ARTICLE_APPROVED': { email: true, sms: false, inApp: true },
    'ARTICLE_REJECTED': { email: true, sms: false, inApp: true },
    'ARTICLE_SUBMITTED_FOR_REVIEW': { email: true, sms: false, inApp: true },
    'ARTICLE_REVIEW_ASSIGNED': { email: true, sms: false, inApp: true },
    'COURSE_ASSIGNED': { email: true, sms: false, inApp: true },
    'COURSE_COMPLETED': { email: true, sms: false, inApp: true },
    'SYSTEM_ANNOUNCEMENT': { email: true, sms: false, inApp: true },
  },

  emailDigest: 'IMMEDIATE',

  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  timezone: 'America/New_York',

  marketingEmailConsent: false,
  marketingSmsConsent: false,
};
```

### Preference UI Location

- **Settings Page**: New tab "Notifications" in user profile/settings
- **Quick Toggle**: In notification dropdown "Manage preferences" link
- **Onboarding**: Optional step for new users

### Consent Tracking

For compliance (TCPA for SMS, CAN-SPAM for email):

```typescript
// Record consent with timestamp
await prisma.userNotificationPreference.update({
  where: { userId },
  data: {
    marketingSmsConsent: true,
    marketingSmsConsentAt: new Date(),
  },
});
```

---

## 8. Admin Interface

### New Admin Pages

```
app/(default)/admin/
  messaging/
    page.tsx              # Overview dashboard
    settings/
      page.tsx            # Provider configuration
    templates/
      page.tsx            # Template list
      [id]/
        page.tsx          # Edit template
      new/
        page.tsx          # Create template
    logs/
      page.tsx            # Message history/logs
```

### Admin Settings Page

**Tabs:**
1. **Email Settings**
   - Provider selection (Resend)
   - From name & email
   - Reply-to email
   - Test email button

2. **SMS Settings**
   - Provider selection (Twilio)
   - From phone number
   - Test SMS button

3. **Defaults**
   - Default preferences for new users
   - Enable/disable email notifications globally
   - Enable/disable SMS notifications globally

### Template Editor

**Features:**
- WYSIWYG or code editor toggle
- Variable insertion helper
- Preview with test data
- Send test email/SMS
- Version history
- Duplicate template

### Message Logs

**Columns:**
- Date/Time
- Recipient
- Channel (Email/SMS)
- Template
- Status
- Actions (View, Resend)

**Filters:**
- Date range
- Status
- Channel
- Template

---

## 9. API Design

### Admin APIs

```typescript
// Messaging Settings
GET    /api/admin/messaging/settings
PUT    /api/admin/messaging/settings
POST   /api/admin/messaging/settings/test-email
POST   /api/admin/messaging/settings/test-sms

// Email Templates
GET    /api/admin/messaging/email-templates
POST   /api/admin/messaging/email-templates
GET    /api/admin/messaging/email-templates/[id]
PUT    /api/admin/messaging/email-templates/[id]
DELETE /api/admin/messaging/email-templates/[id]
POST   /api/admin/messaging/email-templates/[id]/preview
POST   /api/admin/messaging/email-templates/[id]/test

// SMS Templates
GET    /api/admin/messaging/sms-templates
POST   /api/admin/messaging/sms-templates
GET    /api/admin/messaging/sms-templates/[id]
PUT    /api/admin/messaging/sms-templates/[id]
DELETE /api/admin/messaging/sms-templates/[id]
POST   /api/admin/messaging/sms-templates/[id]/test

// Message Logs
GET    /api/admin/messaging/logs
GET    /api/admin/messaging/logs/[id]
POST   /api/admin/messaging/logs/[id]/resend

// Stats
GET    /api/admin/messaging/stats
```

### User APIs

```typescript
// User notification preferences
GET    /api/users/me/notification-preferences
PUT    /api/users/me/notification-preferences

// Unsubscribe (public, token-based)
GET    /api/unsubscribe/[token]
POST   /api/unsubscribe/[token]
```

### Webhook Endpoints

```typescript
// Resend webhooks (email events)
POST   /api/webhooks/resend

// Twilio webhooks (SMS status)
POST   /api/webhooks/twilio
```

---

## 10. Security & Compliance

### Data Security

1. **API Key Storage**
   - Store in environment variables, NOT database
   - Never log API keys
   - Use secrets manager in production (Vercel, AWS, etc.)

2. **Phone Number Handling**
   - Store in E.164 format (+12223334444)
   - Validate format on input
   - Don't log full phone numbers

3. **Email Security**
   - Implement SPF, DKIM, DMARC for sending domain
   - Configure with Resend's domain verification

### Compliance

**CAN-SPAM (Email):**
- Physical address in footer
- Clear unsubscribe link
- Accurate "From" information
- No misleading subject lines

**TCPA (SMS):**
- Explicit consent required for marketing SMS
- Clear opt-out mechanism (STOP to unsubscribe)
- Twilio handles STOP/HELP automatically
- Record consent timestamps

**GDPR Considerations:**
- Right to access message history
- Right to deletion (cascade deletes)
- Data export functionality (future)

### Rate Limiting

```typescript
// Implement rate limiting per user
const RATE_LIMITS = {
  email: {
    perMinute: 10,
    perHour: 50,
    perDay: 200,
  },
  sms: {
    perMinute: 5,
    perHour: 20,
    perDay: 50,
  },
};
```

---

## 11. Monitoring & Analytics

### Key Metrics

**Email:**
- Delivery rate
- Open rate
- Click rate
- Bounce rate
- Spam complaints

**SMS:**
- Delivery rate
- Failure rate
- Segment count

### Dashboard Widgets

1. **Delivery Overview** - Pie chart of statuses
2. **Volume Over Time** - Line chart of sends
3. **Template Performance** - Table with open/click rates
4. **Recent Failures** - List of failed messages

### Alerting

- Alert if failure rate exceeds threshold
- Alert if provider errors
- Daily summary email to admins

---

## 12. Future Marketing Extensions

### Phase 2: Marketing Features

1. **Audience Lists**
   - Static lists (manually curated)
   - Dynamic lists (query-based: all dentists, all Northland staff)

2. **Campaign Builder**
   - Select audience
   - Choose template or create new
   - Schedule send
   - A/B testing (future)

3. **Campaign Analytics**
   - Opens, clicks, conversions
   - Unsubscribe tracking
   - Geographic breakdown

### Integration Points

- Connect to LMS for "course completion" triggers
- Connect to wiki for "new article" announcements
- Scheduled newsletters

---

## 13. Implementation Phases

### Phase 1: Foundation (Core Infrastructure)

**Duration: ~3-4 days**

1. Database schema additions
2. Resend integration
3. Twilio integration
4. Template rendering engine
5. Basic email templates (5 core)
6. Basic SMS templates (3 core)
7. User preference model
8. Unified notification service

**Deliverables:**
- Migrations applied
- `sendNotification()` function working
- Test emails/SMS sending successfully

### Phase 2: Admin Interface

**Duration: ~3-4 days**

1. Admin settings page
2. Template list page
3. Template editor (basic)
4. Message logs page
5. Test send functionality

**Deliverables:**
- Admins can configure providers
- Admins can edit templates
- Admins can view message history

### Phase 3: User Preferences

**Duration: ~2-3 days**

1. User preferences API
2. Preferences UI page
3. Per-type preference toggles
4. Email digest configuration
5. Quiet hours for SMS

**Deliverables:**
- Users can manage their preferences
- Preferences respected in send flow

### Phase 4: Webhooks & Tracking

**Duration: ~2-3 days**

1. Resend webhook handler
2. Twilio webhook handler
3. Status update processing
4. Open/click tracking
5. Admin analytics dashboard

**Deliverables:**
- Real-time delivery status updates
- Analytics visible in admin

### Phase 5: Polish & Testing

**Duration: ~2-3 days**

1. Error handling improvements
2. Retry logic
3. Rate limiting
4. Integration testing
5. Load testing
6. Documentation

**Deliverables:**
- Production-ready system
- Comprehensive test coverage

---

## 14. Environment Variables

```bash
# ======================
# RESEND (Email)
# ======================
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=notifications@livingwellnessdental.com
RESEND_FROM_NAME=Living Wellness Dental
RESEND_REPLY_TO=support@livingwellnessdental.com

# Domain for sending (configure in Resend dashboard)
RESEND_DOMAIN=livingwellnessdental.com

# Webhook secret (for verifying webhook requests)
RESEND_WEBHOOK_SECRET=whsec_xxxxxxxx

# ======================
# TWILIO (SMS)
# ======================
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_FROM_NUMBER=+12223334444

# Optional: Twilio Messaging Service SID (for better deliverability)
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Webhook auth token
TWILIO_WEBHOOK_AUTH_TOKEN=xxxxxxxx

# ======================
# APPLICATION
# ======================
# Base URL for links in emails
NEXT_PUBLIC_APP_URL=https://app.livingwellnessdental.com

# Unsubscribe token secret
UNSUBSCRIBE_TOKEN_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 15. Dependencies

```json
{
  "dependencies": {
    "resend": "^3.0.0",
    "twilio": "^4.0.0",
    "@react-email/components": "^0.0.15",
    "handlebars": "^4.7.8",
    "phone": "^3.1.0"
  },
  "devDependencies": {
    "react-email": "^2.0.0"
  }
}
```

### Package Purposes

| Package | Purpose |
|---------|---------|
| `resend` | Resend API client |
| `twilio` | Twilio API client |
| `@react-email/components` | Email template components |
| `handlebars` | Template variable interpolation |
| `phone` | Phone number validation/formatting |
| `react-email` | CLI for email template development |

---

## 16. Testing Strategy

### Unit Tests

```typescript
// Template rendering
test('renders email template with variables', async () => {
  const html = await renderEmailTemplate('article-approved', {
    user: { name: 'John' },
    article: { title: 'Test Article' },
  });
  expect(html).toContain('John');
  expect(html).toContain('Test Article');
});

// Preference checking
test('respects user email preference', async () => {
  const prefs = { emailEnabled: false };
  const result = await sendNotification({ userId, type, prefs });
  expect(result.email).toBeNull();
});
```

### Integration Tests

```typescript
// Full flow test (with mocked providers)
test('sends email and SMS for notification', async () => {
  mockResend.sendEmail.mockResolvedValue({ id: 'email-123' });
  mockTwilio.messages.create.mockResolvedValue({ sid: 'sms-123' });

  const result = await sendNotification({
    userId: testUser.id,
    type: 'ARTICLE_APPROVED',
    data: { article: { title: 'Test' } },
  });

  expect(mockResend.sendEmail).toHaveBeenCalled();
  expect(mockTwilio.messages.create).toHaveBeenCalled();
});
```

### E2E Tests

- Test email receipt with MailSlurp or similar
- Test SMS with Twilio test credentials
- Test unsubscribe flow
- Test webhook processing

---

## 17. Rollback Plan

### Database Rollback

```bash
# If migration fails, rollback
npx prisma migrate resolve --rolled-back <migration-name>
```

### Feature Flags

```typescript
// Use feature flags for gradual rollout
const FEATURES = {
  EMAIL_NOTIFICATIONS: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
  SMS_NOTIFICATIONS: process.env.ENABLE_SMS_NOTIFICATIONS === 'true',
};

// In sendNotification:
if (FEATURES.EMAIL_NOTIFICATIONS && prefs.emailEnabled) {
  // Send email
}
```

### Quick Disable

If issues arise in production:
1. Set `ENABLE_EMAIL_NOTIFICATIONS=false`
2. Restart app
3. All notifications fall back to in-app only

---

## 18. Checklist

### Pre-Implementation

- [ ] Create Resend account and verify domain
- [ ] Create Twilio account and purchase phone number
- [ ] Configure DNS for email (SPF, DKIM, DMARC)
- [ ] Design email templates (mockups)
- [ ] Review compliance requirements with stakeholders
- [ ] Gather environment variables

### Phase 1 Checklist

- [ ] Prisma schema changes
  - [ ] MessagingSettings model
  - [ ] UserNotificationPreference model
  - [ ] EmailTemplate model
  - [ ] SmsTemplate model
  - [ ] EmailMessage model
  - [ ] SmsMessage model
  - [ ] Update User relations
- [ ] Run migrations
- [ ] Create lib/messaging/ structure
  - [ ] providers/resend.ts
  - [ ] providers/twilio.ts
  - [ ] templates.ts
  - [ ] email.ts
  - [ ] sms.ts
  - [ ] index.ts
- [ ] Create seed data for default templates
- [ ] Update existing notification calls
- [ ] Test email sending
- [ ] Test SMS sending

### Phase 2 Checklist

- [ ] Admin messaging settings page
- [ ] Admin template list page
- [ ] Admin template editor
- [ ] Admin message logs page
- [ ] Test send functionality
- [ ] Permissions for admin pages

### Phase 3 Checklist

- [ ] User preferences API
- [ ] User preferences UI
- [ ] Link from notification dropdown
- [ ] Preference migration for existing users

### Phase 4 Checklist

- [ ] Resend webhook endpoint
- [ ] Twilio webhook endpoint
- [ ] Status update processing
- [ ] Analytics dashboard
- [ ] Error alerting

### Phase 5 Checklist

- [ ] Retry logic implementation
- [ ] Rate limiting
- [ ] Integration tests
- [ ] Load testing
- [ ] Documentation
- [ ] Security audit

### Go-Live Checklist

- [ ] All environment variables set in production
- [ ] DNS configured correctly
- [ ] Webhooks registered with providers
- [ ] Feature flags enabled
- [ ] Monitoring dashboards set up
- [ ] On-call process documented
- [ ] Rollback plan tested

---

## Questions to Answer Before Starting

1. **From Email**: What email address should notifications come from?
2. **Phone Number**: What phone number should SMS come from? (Need to purchase in Twilio)
3. **Branding**: Should email templates use the existing branding system?
4. **Digest Emails**: Do we need digest/summary emails, or only immediate?
5. **Marketing Timeline**: When do we anticipate needing marketing features?
6. **Volume Estimates**: Expected volume of emails/SMS per day?
7. **Compliance**: Any specific HIPAA considerations for healthcare context?

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-11-28 | Claude | Initial comprehensive plan |
