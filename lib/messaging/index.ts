// Email Service exports
export {
  sendEmail,
  sendTemplatedEmail,
  sendBulkEmails,
  retryFailedEmails,
  getEmailStats,
  interpolateTemplate as interpolateEmailTemplate,
} from './email-service';

export type {
  SendEmailOptions,
  SendTemplatedEmailOptions,
  EmailResult,
} from './email-service';

// SMS Service exports
export {
  sendSms,
  sendTemplatedSms,
  sendBulkSms,
  retryFailedSms,
  updateSmsStatus,
  getSmsStats,
  normalizePhoneNumber,
  calculateSegments,
  interpolateTemplate as interpolateSmsTemplate,
} from './sms-service';

export type {
  SendSmsOptions,
  SendTemplatedSmsOptions,
  SmsResult,
} from './sms-service';
