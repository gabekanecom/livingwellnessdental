import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

// GET message logs
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const where: any = {};
    if (status) {
      where.status = status;
    }

    if (type === 'email' || type === 'all') {
      const emails = await prisma.emailMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      if (type === 'email') {
        return NextResponse.json({
          messages: emails,
          total: await prisma.emailMessage.count({ where }),
        });
      }
    }

    if (type === 'sms' || type === 'all') {
      const sms = await prisma.smsMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      if (type === 'sms') {
        return NextResponse.json({
          messages: sms,
          total: await prisma.smsMessage.count({ where }),
        });
      }
    }

    // Return both for 'all' type
    const [emails, sms] = await Promise.all([
      prisma.emailMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.smsMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
    ]);

    return NextResponse.json({
      emails,
      sms,
      totals: {
        emails: await prisma.emailMessage.count({ where }),
        sms: await prisma.smsMessage.count({ where }),
      },
    });
  } catch (error) {
    console.error('Error fetching message logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}
