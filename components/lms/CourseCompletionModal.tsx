'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  TrophyIcon,
  AcademicCapIcon,
  ShareIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface CourseCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseName: string;
  courseId: string;
  enrollmentId: string;
}

export default function CourseCompletionModal({
  isOpen,
  onClose,
  courseName,
  courseId,
  enrollmentId
}: CourseCompletionModalProps) {
  const [certificateNumber, setCertificateNumber] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }, 300);

      generateCertificate();
    }
  }, [isOpen]);

  const generateCertificate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/lms/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId })
      });

      if (response.ok) {
        const data = await response.json();
        setCertificateNumber(data.certificate?.certificateNumber);
      }
    } catch (error) {
      console.error('Error generating certificate:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const shareOnLinkedIn = () => {
    const text = `I just completed "${courseName}" on Living Wellness! 🎉`;
    const url = certificateNumber 
      ? `${window.location.origin}/lms/certificates/verify?id=${certificateNumber}`
      : window.location.origin;
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`,
      '_blank'
    );
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-8 text-center shadow-xl transition-all">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-6">
                  <TrophyIcon className="h-10 w-10 text-white" />
                </div>

                <Dialog.Title className="text-2xl font-bold text-gray-900 mb-2">
                  Congratulations! 🎉
                </Dialog.Title>

                <p className="text-gray-600 mb-2">You have successfully completed</p>
                
                <h3 className="text-xl font-semibold text-violet-600 mb-6">
                  {courseName}
                </h3>

                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                    <AcademicCapIcon className="h-5 w-5" />
                    <span className="font-medium">Certificate Earned!</span>
                  </div>
                  {isGenerating ? (
                    <p className="text-sm text-gray-500">Generating your certificate...</p>
                  ) : certificateNumber ? (
                    <p className="text-sm text-gray-500 font-mono">{certificateNumber}</p>
                  ) : null}
                </div>

                <div className="space-y-3">
                  {certificateNumber && (
                    <Link
                      href={`/lms/certificates/${certificateNumber}`}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700"
                    >
                      <DocumentTextIcon className="h-5 w-5" />
                      View Certificate
                    </Link>
                  )}

                  <button
                    onClick={shareOnLinkedIn}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
                  >
                    <ShareIcon className="h-5 w-5" />
                    Share on LinkedIn
                  </button>

                  <Link
                    href="/lms/catalog"
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200"
                  >
                    Explore More Courses
                  </Link>
                </div>

                <button
                  onClick={onClose}
                  className="mt-4 text-sm text-gray-500 hover:text-gray-700"
                >
                  Close
                </button>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
