import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { canEditArticle } from '@/lib/wiki/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ canEdit: false });
    }

    const canEdit = await canEditArticle(user.id, id);

    return NextResponse.json({ canEdit });
  } catch (error) {
    console.error('Error checking edit permission:', error);
    return NextResponse.json({ canEdit: false });
  }
}
