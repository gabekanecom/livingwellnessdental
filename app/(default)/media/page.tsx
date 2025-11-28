'use client';

import { useState, useEffect } from 'react';
import { PhotoIcon, MagnifyingGlassIcon, FunnelIcon, PlusIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import MediaDetailModal from '@/components/media/MediaDetailModal';
import UnifiedMediaModal from '@/components/media/UnifiedMediaModal';

interface MediaItem {
  id: string;
  url: string;
  filename: string;
  title: string | null;
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

export default function MediaLibraryPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [contentType, setContentType] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    hasMore: false,
  });
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    fetchMedia();
  }, [page, search, contentType]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '24',
        ...(search && { search }),
        ...(contentType && { contentType }),
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleMediaClick = (mediaId: string) => {
    setSelectedMediaId(mediaId);
    setShowDetailModal(true);
  };

  const handleModalClose = () => {
    setShowDetailModal(false);
    setSelectedMediaId(null);
  };

  const handleDeleted = () => {
    fetchMedia(); // Refresh the list after deletion
  };

  const handleUploadComplete = () => {
    setShowUploadModal(false);
    fetchMedia(); // Refresh the list after upload
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      {/* Media Detail Modal */}
      <MediaDetailModal
        mediaId={selectedMediaId}
        isOpen={showDetailModal}
        onClose={handleModalClose}
        onDeleted={handleDeleted}
      />

      {/* Upload Modal */}
      <UnifiedMediaModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSelect={handleUploadComplete}
        module="media-library"
        defaultTab="upload"
        hideLibraryTab={true}
      />

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl text-gray-800 font-bold mb-2">
            Media Library
          </h1>
          <p className="text-gray-600">
            Browse and manage your uploaded images and media files used across all modules
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn bg-violet-500 hover:bg-violet-600 text-white inline-flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Upload Media
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by filename, title, or description..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Content Type Filter */}
          <div className="sm:w-48">
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={contentType}
                onChange={(e) => {
                  setContentType(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">All Types</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {media.length} of {pagination.total} files
          </p>
        </div>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : media.length === 0 ? (
        <div className="bg-white shadow-sm rounded-lg p-12 text-center">
          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No media found</h3>
          <p className="text-gray-600">
            {search || contentType
              ? 'Try adjusting your search or filters'
              : 'Upload images in the article editor or LMS to see them here'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {media.map((item) => (
              <div
                key={item.id}
                onClick={() => handleMediaClick(item.id)}
                className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              >
                {item.contentType.startsWith('image/') ? (
                  <Image
                    src={item.url}
                    alt={item.title || item.filename}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <PhotoIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}

                {/* Overlay with info */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200">
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                    <p className="text-xs font-medium truncate mb-1">
                      {item.title || item.filename}
                    </p>
                    <div className="flex items-center justify-between text-xs opacity-90">
                      <span>{formatFileSize(item.size)}</span>
                      {item.width && item.height && (
                        <span>{item.width} × {item.height}</span>
                      )}
                    </div>
                    <div className="mt-1 text-xs opacity-75">
                      <p>{formatDate(item.uploadedAt)}</p>
                      <p>Used {item.usageCount} time{item.usageCount !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <span className="px-4 py-2 text-sm text-gray-700">
                Page {page} of {pagination.totalPages}
              </span>

              <button
                onClick={() => setPage(p => p + 1)}
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
  );
}
