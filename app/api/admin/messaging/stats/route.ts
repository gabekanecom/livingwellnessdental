import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEmailStats } from '@/lib/messaging/email-service';
import { getSmsStats } from '@/lib/messaging/sms-service';

// GET messaging statistics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);

    // Get stats from both services in parallel
    const [emailStats, smsStats] = await Promise.all([
      getEmailStats(days),
      getSmsStats(days),
    ]);

    return NextResponse.json({
      period: `${days} days`,
      email: emailStats,
      sms: smsStats,
      totals: {
        messagesSent: emailStats.total + smsStats.total,
        emailsSent: emailStats.total,
        smsSent: smsStats.total,
      },
    });
  } catch (error) {
    console.error('Error fetching messaging stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
