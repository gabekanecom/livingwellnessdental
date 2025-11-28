'use client';

import { useState, useEffect } from 'react';
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';

interface MediaItem {
  id: string;
  url: string;
  filename: string;
  contentType: string;
  size: number;
  width: number | null;
  height: number | null;
  uploadedAt: string;
  uploadedBy: {
    name: string;
    email: string;
  };
  usageCount: number;
}

interface MediaResponse {
  media: MediaItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, alt?: string) => void;
}

export default function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
}: MediaPickerModalProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    hasMore: false,
  });
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
    }
  }, [isOpen, page, search]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        contentType: 'image',
        ...(search && { search }),
      });

      const response = await fetch(`/api/wiki/media?${params}`);
      if (response.ok) {
        const data: MediaResponse = await response.json();
        setMedia(data.media);
        setPagination({
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
          hasMore: data.pagination.hasMore,
        });
      }
    } catch (error) {
      console.error('Failed to fetch media:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = () => {
    if (selectedMedia) {
      onSelect(selectedMedia.url, selectedMedia.filename);
      onClose();
      setSelectedMedia(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Select from Media Library
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            aria-label="Close modal"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by filename..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-square bg-gray-200 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : media.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <PhotoIcon className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No media found
              </h3>
              <p className="text-gray-600">
                {search
                  ? 'Try adjusting your search'
                  : 'Upload images in the editor to see them here'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                {media.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedMedia(item)}
                    className={`group relative aspect-square bg-gray-100 rounded-lg overflow-hidden transition-all ${
                      selectedMedia?.id === item.id
                        ? 'ring-4 ring-violet-500'
                        : 'hover:ring-2 hover:ring-violet-300'
                    }`}
                  >
                    {item.contentType.startsWith('image/') ? (
                      <Image
                        src={item.url}
                        alt={item.filename}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 33vw, 25vw"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <PhotoIcon className="h-12 w-12 text-gray-400" />
                      </div>
                    )}

                    {/* Selection indicator */}
                    {selectedMedia?.id === item.id && (
                      <div className="absolute top-2 right-2 bg-violet-600 text-white rounded-full p-1">
                        <CheckCircleIcon className="h-5 w-5" />
                      </div>
                    )}

                    {/* Info overlay on hover */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200">
                      <div className="absolute bottom-0 left-0 right-0 p-2 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                        <p className="text-xs font-medium truncate mb-1">
                          {item.filename}
                        </p>
                        <div className="flex items-center justify-between text-xs opacity-90">
                          <span>{formatFileSize(item.size)}</span>
                          {item.width && item.height && (
                            <span>
                              {item.width} × {item.height}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  <span className="px-4 py-2 text-sm text-gray-700">
                    Page {page} of {pagination.totalPages}
                  </span>

                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!pagination.hasMore}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Selected media info & actions */}
        {selectedMedia && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {selectedMedia.filename}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(selectedMedia.size)}
                  {selectedMedia.width && selectedMedia.height && (
                    <> • {selectedMedia.width} × {selectedMedia.height}</>
                  )}
                </p>
              </div>
              <button
                onClick={handleSelect}
                className="ml-4 px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium"
              >
                Insert
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <p className="text-xs text-gray-600 text-center">
            Showing {media.length} of {pagination.total} images
          </p>
        </div>
      </div>
    </div>
  );
}
