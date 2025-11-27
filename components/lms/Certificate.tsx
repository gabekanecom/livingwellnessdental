'use client';

import { useRef } from 'react';
import { AcademicCapIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';

interface CertificateProps {
  studentName: string;
  courseName: string;
  completionDate: string;
  certificateNumber: string;
  courseDuration?: number | null;
}

export default function Certificate({
  studentName,
  courseName,
  completionDate,
  certificateNumber,
  courseDuration
}: CertificateProps) {
  const certificateRef = useRef<HTMLDivElement>(null);

  const formatDuration = (minutes: number | null | undefined) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-4 flex justify-end gap-3 print:hidden">
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700"
        >
          Print Certificate
        </button>
      </div>

      <div
        ref={certificateRef}
        className="bg-white border-8 border-double border-violet-200 rounded-lg p-8 md:p-12 shadow-lg print:shadow-none print:border-violet-300"
        style={{ aspectRatio: '1.414' }}
      >
        <div className="h-full flex flex-col items-center justify-between text-center">
          <div className="flex items-center gap-3 text-violet-600">
            <AcademicCapIcon className="h-10 w-10" />
            <span className="text-2xl font-bold tracking-wider uppercase">
              Living Wellness
            </span>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-gray-500 text-lg tracking-widest uppercase mb-2">
                Certificate of Completion
              </p>
              <div className="w-32 h-1 bg-gradient-to-r from-violet-400 to-purple-500 mx-auto rounded" />
            </div>

            <div>
              <p className="text-gray-600 text-lg">This is to certify that</p>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mt-2 mb-4">
                {studentName}
              </h1>
              <p className="text-gray-600 text-lg">has successfully completed the course</p>
            </div>

            <div className="bg-gradient-to-r from-violet-50 to-purple-50 px-8 py-4 rounded-lg">
              <h2 className="text-2xl md:text-3xl font-bold text-violet-800">
                {courseName}
              </h2>
              {courseDuration && (
                <p className="text-violet-600 mt-1">
                  {formatDuration(courseDuration)} of learning
                </p>
              )}
            </div>
          </div>

          <div className="w-full">
            <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
              <CheckBadgeIcon className="h-6 w-6" />
              <span className="font-medium">Verified Certificate</span>
            </div>

            <div className="flex justify-between items-end border-t border-gray-200 pt-4">
              <div className="text-left">
                <p className="text-sm text-gray-500">Date of Completion</p>
                <p className="font-medium text-gray-900">{completionDate}</p>
              </div>
              
              <div className="text-center">
                <div className="w-32 border-b-2 border-gray-400 mb-1" />
                <p className="text-sm text-gray-500">Authorized Signature</p>
              </div>

              <div className="text-right">
                <p className="text-sm text-gray-500">Certificate ID</p>
                <p className="font-mono text-sm text-gray-900">{certificateNumber}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center text-sm text-gray-500 print:hidden">
        <p>
          Verify this certificate at:{' '}
          <span className="font-mono text-violet-600">
            {typeof window !== 'undefined' ? window.location.origin : ''}/lms/certificates/verify?id={certificateNumber}
          </span>
        </p>
      </div>
    </div>
  );
}
