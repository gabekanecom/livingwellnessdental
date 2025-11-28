'use client';

import { useState, useEffect } from 'react';
import {
  XMarkIcon,
  TrashIcon,
  ClipboardDocumentIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';

interface MediaDetail {
  id: string;
  url: string;
  key: string;
  filename: string;
  contentType: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string | null;
  uploadedAt: string;
  lastUsedAt: string | null;
  uploadedBy: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  usedInArticles: Array<{
    article: {
      id: string;
      title: string;
      slug: string;
      status: string;
    };
  }>;
}

interface MediaDetailModalProps {
  mediaId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

export default function MediaDetailModal({
  mediaId,
  isOpen,
  onClose,
  onDeleted,
}: MediaDetailModalProps) {
  const [media, setMedia] = useState<MediaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && mediaId) {
      fetchMediaDetail();
    }
  }, [isOpen, mediaId]);

  const fetchMediaDetail = async () => {
    if (!mediaId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/wiki/media/${mediaId}`);
      if (response.ok) {
        const data = await response.json();
        setMedia(data.media);
      } else {
        console.error('Failed to fetch media details');
        onClose();
      }
    } catch (error) {
      console.error('Error fetching media details:', error);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!media) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${media.filename}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/wiki/media/${media.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onDeleted?.();
        onClose();
      } else {
        const data = await response.json();
        if (response.status === 409) {
          alert(
            `Cannot delete this media file because it is currently used in ${data.usedIn} article(s).\n\nPlease remove it from articles first.`
          );
        } else {
          alert(data.error || 'Failed to delete media');
        }
      }
    } catch (error) {
      console.error('Error deleting media:', error);
      alert('Failed to delete media');
    } finally {
      setDeleting(false);
    }
  };

  const copyUrl = async () => {
    if (!media) return;

    try {
      await navigator.clipboard.writeText(media.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Media Details</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            aria-label="Close modal"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-4">
              <div className="aspect-video bg-gray-200 rounded-lg animate-pulse" />
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            </div>
          ) : media ? (
            <div className="space-y-6">
              {/* Image Preview */}
              {media.contentType.startsWith('image/') && (
                <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={media.url}
                    alt={media.alt || media.filename}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 768px"
                  />
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filename
                  </label>
                  <p className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded break-all">
                    {media.filename}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    File Size
                  </label>
                  <p className="text-sm text-gray-900">{formatFileSize(media.size)}</p>
                </div>

                {media.width && media.height && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dimensions
                    </label>
                    <p className="text-sm text-gray-900">
                      {media.width} × {media.height} pixels
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content Type
                  </label>
                  <p className="text-sm text-gray-900 font-mono">{media.contentType}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Uploaded By
                  </label>
                  <p className="text-sm text-gray-900">{media.uploadedBy.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Uploaded At
                  </label>
                  <p className="text-sm text-gray-900">{formatDate(media.uploadedAt)}</p>
                </div>

                {media.lastUsedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Used
                    </label>
                    <p className="text-sm text-gray-900">{formatDate(media.lastUsedAt)}</p>
                  </div>
                )}
              </div>

              {/* URL Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={media.url}
                    readOnly
                    className="flex-1 text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded border border-gray-300"
                  />
                  <button
                    onClick={copyUrl}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <CheckIcon className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Copied!</span>
                      </>
                    ) : (
                      <>
                        <ClipboardDocumentIcon className="h-4 w-4" />
                        <span className="text-sm">Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Used In Articles */}
              {media.usedInArticles.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Used in {media.usedInArticles.length} Article
                    {media.usedInArticles.length !== 1 ? 's' : ''}
                  </label>
                  <div className="space-y-2">
                    {media.usedInArticles.map(({ article }) => (
                      <a
                        key={article.id}
                        href={`/wiki/article/${article.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <p className="text-sm font-medium text-gray-900">
                          {article.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Status: {article.status}
                        </p>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {media && (
          <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-between items-center">
            <button
              onClick={handleDelete}
              disabled={deleting || media.usedInArticles.length > 0}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <TrashIcon className="h-4 w-4" />
              {deleting ? 'Deleting...' : 'Delete Media'}
            </button>

            {media.usedInArticles.length > 0 && (
              <p className="text-xs text-gray-600">
                Remove from articles before deleting
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
