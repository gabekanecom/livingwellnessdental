'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Certificate from '@/components/lms/Certificate';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface CertificateData {
  id: string;
  certificateNumber: string;
  issuedAt: string;
  enrollment: {
    user: {
      name: string;
    };
    course: {
      title: string;
      duration: number | null;
    };
  };
}

export default function CertificatePage() {
  const params = useParams();
  const certificateId = params.id as string;
  
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCertificate();
  }, [certificateId]);

  const fetchCertificate = async () => {
    try {
      const response = await fetch(`/api/lms/certificates?certificateNumber=${certificateId}`);
      if (response.ok) {
        const data = await response.json();
        setCertificate(data.certificate);
      } else {
        setError('Certificate not found');
      }
    } catch (error) {
      console.error('Error fetching certificate:', error);
      setError('Failed to load certificate');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Certificate Not Found</h1>
        <p className="text-gray-600 mb-6">{error || 'The certificate you are looking for does not exist.'}</p>
        <Link
          href="/lms/certificates"
          className="text-violet-600 hover:text-violet-700"
        >
          View your certificates
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-5xl mx-auto">
      <div className="mb-6 print:hidden">
        <Link
          href="/lms/certificates"
          className="inline-flex items-center text-sm text-gray-600 hover:text-violet-600"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Certificates
        </Link>
      </div>

      <Certificate
        studentName={certificate.enrollment.user.name}
        courseName={certificate.enrollment.course.title}
        completionDate={formatDate(certificate.issuedAt)}
        certificateNumber={certificate.certificateNumber}
        courseDuration={certificate.enrollment.course.duration}
      />
    </div>
  );
}
