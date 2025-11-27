'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckBadgeIcon, XCircleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

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
    };
  };
}

function VerifyContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id') || '';
  
  const [certificateId, setCertificateId] = useState(initialId);
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialId) {
      verifyCertificate(initialId);
    }
  }, [initialId]);

  const verifyCertificate = async (id: string) => {
    if (!id.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setSearched(true);
    
    try {
      const response = await fetch(`/api/lms/certificates?certificateNumber=${id}`);
      if (response.ok) {
        const data = await response.json();
        setCertificate(data.certificate);
      } else {
        setCertificate(null);
        setError('Certificate not found');
      }
    } catch (error) {
      console.error('Error verifying certificate:', error);
      setCertificate(null);
      setError('Failed to verify certificate');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyCertificate(certificateId);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-12 w-full max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Verify Certificate</h1>
        <p className="text-gray-600">
          Enter a certificate ID to verify its authenticity
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={certificateId}
              onChange={(e) => setCertificateId(e.target.value)}
              placeholder="Enter certificate ID (e.g., CERT-ABC123-XYZ)"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !certificateId.trim()}
            className="px-6 py-3 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      </form>

      {searched && !isLoading && (
        <div className={`rounded-xl p-6 ${certificate ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          {certificate ? (
            <div className="text-center">
              <CheckBadgeIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-green-800 mb-2">Certificate Verified</h2>
              <p className="text-green-700 mb-6">This certificate is valid and authentic.</p>
              
              <div className="bg-white rounded-lg p-4 text-left space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Recipient</p>
                  <p className="font-medium text-gray-900">{certificate.enrollment.user.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Course</p>
                  <p className="font-medium text-gray-900">{certificate.enrollment.course.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date Issued</p>
                  <p className="font-medium text-gray-900">{formatDate(certificate.issuedAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Certificate ID</p>
                  <p className="font-mono text-sm text-gray-900">{certificate.certificateNumber}</p>
                </div>
              </div>

              <Link
                href={`/lms/certificates/${certificate.certificateNumber}`}
                className="inline-block mt-4 text-violet-600 hover:text-violet-700 font-medium"
              >
                View Full Certificate →
              </Link>
            </div>
          ) : (
            <div className="text-center">
              <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-red-800 mb-2">Certificate Not Found</h2>
              <p className="text-red-700">
                {error || 'No certificate found with this ID. Please check the ID and try again.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function VerifyCertificatePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
