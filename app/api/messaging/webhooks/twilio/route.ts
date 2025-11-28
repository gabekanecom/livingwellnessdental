import { NextRequest, NextResponse } from 'next/server';
import { updateSmsStatus } from '@/lib/messaging/sms-service';

// Twilio webhook for SMS status updates
export async function POST(request: NextRequest) {
  try {
    // Parse form data (Twilio sends x-www-form-urlencoded)
    const formData = await request.formData();

    const messageSid = formData.get('MessageSid') as string;
    const messageStatus = formData.get('MessageStatus') as string;
    const errorCode = formData.get('ErrorCode') as string | null;
    const errorMessage = formData.get('ErrorMessage') as string | null;

    if (!messageSid || !messageStatus) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update the SMS status in database
    await updateSmsStatus(
      messageSid,
      messageStatus,
      errorCode || undefined,
      errorMessage || undefined
    );

    // Twilio expects a 200 response with empty body or TwiML
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error('Error processing Twilio webhook:', error);
    // Still return 200 to prevent Twilio from retrying
    return new NextResponse(null, { status: 200 });
  }
}
