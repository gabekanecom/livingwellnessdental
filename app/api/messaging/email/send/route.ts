import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail, sendTemplatedEmail } from '@/lib/messaging/email-service';
import { EmailTemplateCategory } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Check if using template or raw email
    if (body.templateSlug) {
      // Templated email
      const { templateSlug, to, toName, variables, referenceType, referenceId } = body;

      if (!templateSlug || !to) {
        return NextResponse.json(
          { error: 'templateSlug and to are required' },
          { status: 400 }
        );
      }

      const result = await sendTemplatedEmail({
        to,
        toName,
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
        messageId: result.messageId,
      });
    } else {
      // Raw email
      const {
        to,
        toName,
        subject,
        html,
        text,
        userId,
        category,
        referenceType,
        referenceId,
      } = body;

      if (!to || !subject || !html) {
        return NextResponse.json(
          { error: 'to, subject, and html are required' },
          { status: 400 }
        );
      }

      const result = await sendEmail({
        to,
        toName,
        subject,
        html,
        text,
        userId,
        category: category as EmailTemplateCategory,
        referenceType,
        referenceId,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        messageId: result.messageId,
      });
    }
  } catch (error) {
    console.error('Error in email send API:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
