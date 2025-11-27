import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

function generateCertificateNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CERT-${timestamp}-${random}`;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const enrollmentId = searchParams.get('enrollmentId');
    const certificateNumber = searchParams.get('certificateNumber');

    if (certificateNumber) {
      const certificate = await prisma.certificate.findUnique({
        where: { certificateNumber },
        include: {
          enrollment: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              },
              course: {
                select: { id: true, title: true, duration: true }
              }
            }
          }
        }
      });

      if (!certificate) {
        return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
      }

      return NextResponse.json({ certificate });
    }

    if (enrollmentId) {
      const certificate = await prisma.certificate.findUnique({
        where: { enrollmentId },
        include: {
          enrollment: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              },
              course: {
                select: { id: true, title: true, duration: true }
              }
            }
          }
        }
      });

      return NextResponse.json({ certificate });
    }

    const certificates = await prisma.certificate.findMany({
      where: {
        enrollment: {
          userId: user.id
        }
      },
      include: {
        enrollment: {
          include: {
            course: {
              select: { id: true, title: true, coverImage: true }
            }
          }
        }
      },
      orderBy: { issuedAt: 'desc' }
    });

    return NextResponse.json({ certificates });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { enrollmentId } = await request.json();

    if (!enrollmentId) {
      return NextResponse.json({ error: 'Enrollment ID is required' }, { status: 400 });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        certificate: true,
        course: true
      }
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    if (enrollment.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (enrollment.status !== 'COMPLETED' && enrollment.progress < 100) {
      return NextResponse.json({ error: 'Course not completed' }, { status: 400 });
    }

    if (enrollment.certificate) {
      return NextResponse.json({ 
        certificate: enrollment.certificate,
        message: 'Certificate already exists' 
      });
    }

    const certificate = await prisma.certificate.create({
      data: {
        enrollmentId,
        certificateNumber: generateCertificateNumber()
      },
      include: {
        enrollment: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            },
            course: {
              select: { id: true, title: true, duration: true }
            }
          }
        }
      }
    });

    return NextResponse.json({ certificate, message: 'Certificate generated' });
  } catch (error) {
    console.error('Error generating certificate:', error);
    return NextResponse.json({ error: 'Failed to generate certificate' }, { status: 500 });
  }
}
