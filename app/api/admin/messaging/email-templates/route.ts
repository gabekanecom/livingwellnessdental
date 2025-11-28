import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

// GET all email templates
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');

    const where: any = {};
    if (category) where.category = category;
    if (isActive !== null) where.isActive = isActive === 'true';

    const templates = await prisma.emailTemplate.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching email templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST create new email template
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      slug,
      subject,
      htmlContent,
      textContent,
      description,
      category,
      variables,
      isActive,
      isSystem,
    } = body;

    if (!name || !slug || !subject || !htmlContent) {
      return NextResponse.json(
        { error: 'name, slug, subject, and htmlContent are required' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existing = await prisma.emailTemplate.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Template with this slug already exists' },
        { status: 400 }
      );
    }

    const template = await prisma.emailTemplate.create({
      data: {
        name,
        slug,
        subject,
        htmlContent,
        textContent,
        description,
        category: category || 'TRANSACTIONAL',
        variables,
        isActive: isActive ?? true,
        isSystem: isSystem ?? false,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error creating email template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
