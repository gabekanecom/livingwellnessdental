'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  AcademicCapIcon, 
  DocumentTextIcon,
  ArrowDownTrayIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface CertificateData {
  id: string;
  certificateNumber: string;
  issuedAt: string;
  enrollment: {
    course: {
      id: string;
      title: string;
      coverImage: string | null;
    };
  };
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<CertificateData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const response = await fetch('/api/lms/certificates');
      if (response.ok) {
        const data = await response.json();
        setCertificates(data.certificates || []);
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <AcademicCapIcon className="h-8 w-8 text-violet-600" />
          <h1 className="text-3xl font-bold text-gray-900">My Certificates</h1>
        </div>
        <p className="text-gray-600">
          View and download your course completion certificates
        </p>
      </div>

      {certificates.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Certificates Yet</h3>
          <p className="text-gray-600 mb-6">
            Complete a course to earn your first certificate!
          </p>
          <Link
            href="/lms/catalog"
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700"
          >
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="h-32 bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <AcademicCapIcon className="h-16 w-16 text-white/30" />
              </div>
              
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  {cert.enrollment.course.title}
                </h3>
                
                <p className="text-sm text-gray-500 mb-4">
                  Completed on {formatDate(cert.issuedAt)}
                </p>

                <p className="text-xs text-gray-400 font-mono mb-4">
                  {cert.certificateNumber}
                </p>

                <div className="flex gap-2">
                  <Link
                    href={`/lms/certificates/${cert.certificateNumber}`}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-violet-100 text-violet-700 text-sm font-medium rounded-lg hover:bg-violet-200"
                  >
                    <EyeIcon className="h-4 w-4" />
                    View
                  </Link>
                  <button
                    onClick={() => window.open(`/lms/certificates/${cert.certificateNumber}?print=true`, '_blank')}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
