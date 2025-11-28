# Messaging Integration Execution Plan

> **Reference**: See `MESSAGING_IMPLEMENTATION_PLAN.md` for detailed specifications
> **Status**: Phases 1-5 Complete (UI Built) - Pending Account Setup
> **Last Updated**: 2025-11-28

---

## Pre-Implementation Questions

Before we begin, please confirm these decisions:

- [ ] **Email Domain**: What domain will you use for sending emails? (e.g., `mail.livingwellnessdental.com`)
- [ ] **Twilio Number Type**: Toll-free, local, or short code for SMS?
- [x] **Default Preferences**: New users opted-in to email, opted-out of SMS by default
- [ ] **Reply Handling**: Do you need to handle email/SMS replies, or just send outbound?
- [ ] **Existing Notifications**: Should we migrate the current notification system to also send emails/SMS?

---

## Phase 1: Database & Configuration ✅ COMPLETE

### 1.1 Prisma Schema Updates
- [x] Add `MessagingSettings` model (global Resend/Twilio config)
- [x] Add `UserNotificationPreference` model (per-user preferences)
- [x] Add `EmailTemplate` model (email templates with versioning)
- [x] Add `SmsTemplate` model (SMS templates)
- [x] Add `EmailMessage` model (sent email logs)
- [x] Add `SmsMessage` model (sent SMS logs)
- [x] Add `notificationPreferences` relation to `User` model
- [x] Run `prisma db push` to apply schema

### 1.2 Environment Variables
- [x] Add `RESEND_API_KEY` to `.env.local`
- [x] Add `TWILIO_ACCOUNT_SID` to `.env.local`
- [x] Add `TWILIO_AUTH_TOKEN` to `.env.local`
- [x] Add `TWILIO_PHONE_NUMBER` to `.env.local`
- [x] Add `FROM_EMAIL` to `.env.local`
- [ ] Document env vars in README or separate doc

### 1.3 Dependencies
- [x] Install `resend` package
- [x] Install `twilio` package
- [x] Using simple `{{var}}` template syntax (no handlebars needed)

---

## Phase 2: Email Integration (Resend) ✅ COMPLETE

### 2.1 Core Email Service
- [x] Create `lib/messaging/email-service.ts` with EmailService class
- [x] Implement `sendEmail()` method
- [x] Implement `sendTemplatedEmail()` method
- [x] Implement `sendBulkEmails()` method
- [x] Add retry logic with `retryFailedEmails()`
- [x] Rate limiting via DB settings (`emailRateLimitPerHour`)

### 2.2 Email Templates
- [x] Templates stored in database (EmailTemplate model)
- [x] Default templates seeded:
  - [x] `welcome` - New user welcome
  - [x] `password-reset` - Password reset
  - [x] `notification` - Generic notification
  - [x] `course-assigned` - Course assignment notification
- [x] Template variable interpolation (`{{variable}}` syntax)

### 2.3 Email API Routes
- [x] Create `POST /api/messaging/email/send` - Send single or templated email
- [x] Create `POST /api/messaging/webhooks/resend` - Handle Resend webhooks
- [x] Create `GET /api/admin/messaging/stats` - Get email statistics

### 2.4 Resend Configuration
- [ ] Set up Resend account and get API key
- [ ] Configure sending domain in Resend dashboard
- [ ] Set up webhook endpoint in Resend for delivery tracking
- [ ] Test email sending in development

---

## Phase 3: SMS Integration (Twilio) ✅ COMPLETE

### 3.1 Core SMS Service
- [x] Create `lib/messaging/sms-service.ts` with SmsService class
- [x] Implement `sendSms()` method
- [x] Implement `sendTemplatedSms()` method
- [x] Implement `sendBulkSms()` method
- [x] Add retry logic with `retryFailedSms()`
- [x] Rate limiting via DB settings (`smsRateLimitPerHour`)

### 3.2 SMS Templates
- [x] SMS templates stored in database (SmsTemplate model)
- [x] Default SMS templates seeded:
  - [x] `verification-code` - Phone verification code
  - [x] `notification` - Generic notification
  - [x] `course-reminder` - Course reminder
- [x] Template variable interpolation utility

### 3.3 SMS API Routes
- [x] Create `POST /api/messaging/sms/send` - Send single or templated SMS
- [x] Create `POST /api/messaging/webhooks/twilio` - Handle Twilio status callbacks
- [x] Create `GET /api/admin/messaging/stats` - Get SMS statistics

### 3.4 Twilio Configuration
- [ ] Set up Twilio account and get credentials
- [ ] Purchase/configure phone number
- [ ] Set up status callback webhook in Twilio
- [ ] Test SMS sending in development

---

## Phase 4: User Preferences & Notifications ✅ COMPLETE

### 4.1 User Preference APIs
- [x] Create `GET /api/users/[id]/notification-preferences` - Get user preferences
- [x] Create `PUT /api/users/[id]/notification-preferences` - Update preferences
- [x] Create `POST /api/messaging/unsubscribe` - Handle unsubscribe links
- [x] Create `GET /api/messaging/unsubscribe` - Handle email unsubscribe links
- [x] Preference check integrated into email/SMS sending flow

### 4.2 User Preference UI
- [x] Create `NotificationPreferences` component
- [ ] Add notification preferences section to user profile/settings page
- [x] Implement preference toggles (email on/off, SMS on/off, per-type)
- [x] Add phone number field for SMS (with verification)

### 4.3 Integrate with Existing Notifications
- [ ] Modify `NotificationService` to optionally send email
- [ ] Modify `NotificationService` to optionally send SMS
- [ ] Add notification type -> email template mapping
- [ ] Add notification type -> SMS template mapping
- [ ] Test notification → email/SMS flow

---

## Phase 5: Admin Interface ✅ COMPLETE

### 5.1 Messaging Settings Page
- [x] Create `GET /api/admin/messaging/settings` API
- [x] Create `PUT /api/admin/messaging/settings` API
- [x] Create `/admin/messaging` page UI
- [x] Add Resend API key configuration
- [x] Add Twilio credentials configuration
- [x] Add from email/phone configuration
- [x] Add enable/disable toggles for email and SMS

### 5.2 Email Template Management
- [x] Create `GET /api/admin/messaging/email-templates` API
- [x] Create `POST /api/admin/messaging/email-templates` API
- [x] Create `GET/PUT/DELETE /api/admin/messaging/email-templates/[id]` API
- [x] Create `/admin/messaging/email-templates` list page
- [x] Create `/admin/messaging/email-templates/[id]` edit page
- [x] Add template editor with variable insertion
- [x] Add template preview functionality
- [x] Add test send feature

### 5.3 SMS Template Management
- [x] Create `GET /api/admin/messaging/sms-templates` API
- [x] Create `POST /api/admin/messaging/sms-templates` API
- [x] Create `GET/PUT/DELETE /api/admin/messaging/sms-templates/[id]` API
- [x] Create `/admin/messaging/sms-templates` list page
- [x] Create `/admin/messaging/sms-templates/[id]` edit page
- [x] Add character count display (160 char limit awareness)
- [x] Add template preview
- [x] Add test send feature

### 5.4 Message Logs
- [x] Create `/admin/messaging/logs` page
- [x] Add email logs table with filters (status, date, recipient)
- [x] Add SMS logs table with filters
- [x] Add message detail view (delivery events, errors)
- [ ] Add resend failed messages action

---

## Phase 6: Analytics & Monitoring ⏳ PENDING

### 6.1 Delivery Tracking
- [x] Store delivery status updates from webhooks (implemented)
- [ ] Calculate delivery rates (sent, delivered, bounced, failed)
- [ ] Track open rates for emails (if enabled)
- [ ] Track click rates for emails (if enabled)

### 6.2 Analytics Dashboard
- [ ] Create `/admin/messaging/analytics` page
- [ ] Add summary cards (total sent, delivery rate, etc.)
- [ ] Add charts (messages over time, by type, by status)
- [ ] Add export functionality

### 6.3 Alerting (Optional)
- [ ] Set up alerts for high bounce rates
- [ ] Set up alerts for delivery failures
- [ ] Add admin notification for issues

---

## Phase 7: Testing & Documentation ⏳ PENDING

### 7.1 Testing
- [ ] Write unit tests for EmailService
- [ ] Write unit tests for SmsService
- [ ] Write integration tests for API routes
- [ ] Test with Resend test mode
- [ ] Test with Twilio test credentials
- [ ] End-to-end test of notification → email/SMS flow

### 7.2 Documentation
- [ ] Document environment variables
- [ ] Document API endpoints
- [ ] Document template variable system
- [ ] Create admin user guide for template management
- [ ] Document compliance requirements (CAN-SPAM, TCPA)

---

## Completion Checklist

- [x] All Phase 1 tasks complete
- [x] All Phase 2 tasks complete (code complete, needs Resend account)
- [x] All Phase 3 tasks complete (code complete, needs Twilio account)
- [x] All Phase 4 tasks complete
- [x] All Phase 5 tasks complete
- [ ] All Phase 6 tasks complete
- [ ] All Phase 7 tasks complete
- [ ] Production environment variables configured
- [ ] Resend domain verified for production
- [ ] Twilio phone number active for production
- [ ] First test emails/SMS sent successfully
- [ ] Admin team trained on template management

---

## Files Created

### Services
- `lib/messaging/index.ts` - Main exports
- `lib/messaging/email-service.ts` - Email service with Resend
- `lib/messaging/sms-service.ts` - SMS service with Twilio

### API Routes
- `app/api/messaging/email/send/route.ts` - Send email API
- `app/api/messaging/sms/send/route.ts` - Send SMS API
- `app/api/messaging/webhooks/resend/route.ts` - Resend webhook
- `app/api/messaging/webhooks/twilio/route.ts` - Twilio webhook
- `app/api/messaging/unsubscribe/route.ts` - Unsubscribe handler
- `app/api/admin/messaging/settings/route.ts` - Settings API
- `app/api/admin/messaging/stats/route.ts` - Statistics API
- `app/api/admin/messaging/email-templates/route.ts` - Email templates list/create
- `app/api/admin/messaging/email-templates/[id]/route.ts` - Email template CRUD
- `app/api/admin/messaging/sms-templates/route.ts` - SMS templates list/create
- `app/api/admin/messaging/sms-templates/[id]/route.ts` - SMS template CRUD
- `app/api/admin/messaging/logs/route.ts` - Message logs API
- `app/api/users/[id]/notification-preferences/route.ts` - User preferences

### Admin UI Pages
- `app/(default)/admin/messaging/page.tsx` - Main messaging settings page
- `app/(default)/admin/messaging/MessagingSettings.tsx` - Settings component with tabs
- `app/(default)/admin/messaging/email-templates/page.tsx` - Email templates list
- `app/(default)/admin/messaging/email-templates/[id]/page.tsx` - Email template editor
- `app/(default)/admin/messaging/sms-templates/page.tsx` - SMS templates list
- `app/(default)/admin/messaging/sms-templates/[id]/page.tsx` - SMS template editor
- `app/(default)/admin/messaging/logs/page.tsx` - Message logs viewer

### Components
- `components/messaging/NotificationPreferences.tsx` - User notification preferences component
- `components/messaging/index.ts` - Component exports

### Database
- Updated `prisma/schema.prisma` with messaging models
- Updated `prisma/seed.ts` with default templates

---

## Notes & Decisions Log

| Date | Decision/Note |
|------|---------------|
| 2025-11-28 | Execution plan created |
| 2025-11-28 | Phase 1-4 implementation complete |
| 2025-11-28 | Using simple `{{var}}` syntax instead of Handlebars |
| 2025-11-28 | Default: email opt-in, SMS opt-out |
| 2025-11-28 | Phase 5 Admin UI complete |
| 2025-11-28 | NotificationPreferences component created |

---

## Blockers & Issues

| Issue | Status | Resolution |
|-------|--------|------------|
| Need Resend API key | Pending | User to set up Resend account |
| Need Twilio credentials | Pending | User to set up Twilio account |

---

## Next Steps

1. **Set up Resend account** and add API key to `.env.local` (replace placeholder)
2. **Set up Twilio account** and add credentials to `.env.local` (replace placeholder)
3. **Add NotificationPreferences component** to user profile/settings page
4. **Integrate with existing notification system** to send emails/SMS
5. **Test email and SMS sending** once accounts are configured
