import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendSms, sendTemplatedSms } from '@/lib/messaging/sms-service';
import { SmsTemplateCategory } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Check if using template or raw SMS
    if (body.templateSlug) {
      // Templated SMS
      const { templateSlug, to, variables, referenceType, referenceId } = body;

      if (!templateSlug || !to) {
        return NextResponse.json(
          { error: 'templateSlug and to are required' },
          { status: 400 }
        );
      }

      const result = await sendTemplatedSms({
        to,
        templateSlug,
        variables: variables || {},
        referenceType,
        referenceId,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        messageSid: result.messageSid,
      });
    } else {
      // Raw SMS
      const {
        to,
        body: smsBody,
        userId,
        category,
        referenceType,
        referenceId,
      } = body;

      if (!to || !smsBody) {
        return NextResponse.json(
          { error: 'to and body are required' },
          { status: 400 }
        );
      }

      const result = await sendSms({
        to,
        body: smsBody,
        userId,
        category: category as SmsTemplateCategory,
        referenceType,
        referenceId,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        messageSid: result.messageSid,
      });
    }
  } catch (error) {
    console.error('Error in SMS send API:', error);
    return NextResponse.json(
      { error: 'Failed to send SMS' },
      { status: 500 }
    );
  }
}
