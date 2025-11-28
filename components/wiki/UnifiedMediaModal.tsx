'use client';

import { useState, useEffect, useRef } from 'react';
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
  CheckCircleIcon,
  CloudArrowUpIcon,
  TagIcon,
  PlusIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';

interface MediaItem {
  id: string;
  url: string;
  filename: string;
  title: string | null;
  description: string | null;
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
  tags: Array<{
    tag: {
      id: string;
      name: string;
      color: string | null;
    };
  }>;
}

interface MediaTag {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

interface UnifiedMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, alt?: string) => void;
}

export default function UnifiedMediaModal({
  isOpen,
  onClose,
  onSelect,
}: UnifiedMediaModalProps) {
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');

  // Library state
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    hasMore: false,
  });
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadTags, setUploadTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Tags state
  const [availableTags, setAvailableTags] = useState<MediaTag[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && activeTab === 'library') {
      fetchMedia();
    }
  }, [isOpen, activeTab, page, search, selectedTags]);

  useEffect(() => {
    if (isOpen) {
      fetchTags();
    }
  }, [isOpen]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        contentType: 'image',
        ...(search && { search }),
        ...(selectedTags.length > 0 && { tags: selectedTags.join(',') }),
      });

      const response = await fetch(`/api/wiki/media?${params}`);
      if (response.ok) {
        const data = await response.json();
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

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/wiki/media/tags');
      if (response.ok) {
        const data = await response.json();
        setAvailableTags(data.tags);
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setUploadFile(file);
      setUploadTitle(file.name.replace(/\.[^/.]+$/, '')); // Remove extension

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTag = () => {
    if (newTagInput.trim() && !uploadTags.includes(newTagInput.trim())) {
      setUploadTags([...uploadTags, newTagInput.trim()]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setUploadTags(uploadTags.filter(t => t !== tag));
  };

  const handleUpload = async () => {
    if (!uploadFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      if (uploadTitle) formData.append('title', uploadTitle);
      if (uploadDescription) formData.append('description', uploadDescription);
      if (uploadTags.length > 0) formData.append('tags', JSON.stringify(uploadTags));

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const response = await fetch('/api/wiki/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const { url } = await response.json();
      setUploadProgress(100);

      // Insert the uploaded image
      onSelect(url, uploadTitle || uploadFile.name);

      // Reset form
      setUploadFile(null);
      setUploadPreview(null);
      setUploadTitle('');
      setUploadDescription('');
      setUploadTags([]);
      setUploadProgress(0);

      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelect = () => {
    if (selectedMedia) {
      onSelect(selectedMedia.url, selectedMedia.title || selectedMedia.filename);
      onClose();
      setSelectedMedia(null);
    }
  };

  const toggleTagFilter = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(id => id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
    setPage(1);
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Insert Media
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            aria-label="Close modal"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('library')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'library'
                  ? 'border-violet-600 text-violet-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Media Library
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'upload'
                  ? 'border-violet-600 text-violet-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Upload New
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'library' ? (
            <>
              {/* Search and Filters */}
              <div className="mb-6 space-y-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by title or filename..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>

                {/* Tag Filters */}
                {availableTags.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter by tags:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableTags.map((tag) => (
                        <button
                          key={tag.id}
                          onClick={() => toggleTagFilter(tag.id)}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            selectedTags.includes(tag.id)
                              ? 'bg-violet-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          style={
                            selectedTags.includes(tag.id) && tag.color
                              ? { backgroundColor: tag.color }
                              : {}
                          }
                        >
                          {tag.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Media Grid */}
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
                  <p className="text-gray-600 mb-4">
                    {search || selectedTags.length > 0
                      ? 'Try adjusting your search or filters'
                      : 'Upload your first image to get started'}
                  </p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
                  >
                    Upload Image
                  </button>
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
                            alt={item.title || item.filename}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 33vw, 25vw"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <PhotoIcon className="h-12 w-12 text-gray-400" />
                          </div>
                        )}

                        {selectedMedia?.id === item.id && (
                          <div className="absolute top-2 right-2 bg-violet-600 text-white rounded-full p-1">
                            <CheckCircleIcon className="h-5 w-5" />
                          </div>
                        )}

                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200">
                          <div className="absolute bottom-0 left-0 right-0 p-2 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                            <p className="text-xs font-medium truncate">
                              {item.title || item.filename}
                            </p>
                            {item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.tags.slice(0, 2).map(({ tag }) => (
                                  <span
                                    key={tag.id}
                                    className="text-[10px] px-1 py-0.5 bg-white/20 rounded"
                                  >
                                    {tag.name}
                                  </span>
                                ))}
                              </div>
                            )}
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
            </>
          ) : (
            /* Upload Tab */
            <div className="max-w-2xl mx-auto">
              {!uploadFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-violet-500 hover:bg-violet-50 transition-colors"
                >
                  <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-4 text-sm font-medium text-gray-900">
                    Click to upload an image
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    PNG, JPG, GIF up to 10MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Preview */}
                  {uploadPreview && (
                    <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={uploadPreview}
                        alt="Upload preview"
                        fill
                        className="object-contain"
                      />
                      <button
                        onClick={() => {
                          setUploadFile(null);
                          setUploadPreview(null);
                          setUploadTitle('');
                          setUploadDescription('');
                        }}
                        className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                      >
                        <XCircleIcon className="h-5 w-5" />
                      </button>
                    </div>
                  )}

                  {/* Upload Progress */}
                  {isUploading && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Uploading...</p>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-600 transition-all duration-200"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Metadata Form */}
                  {!isUploading && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title *
                        </label>
                        <input
                          type="text"
                          value={uploadTitle}
                          onChange={(e) => setUploadTitle(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          placeholder="Enter a descriptive title"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={uploadDescription}
                          onChange={(e) => setUploadDescription(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          placeholder="Add a description to help find this image later"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tags
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {uploadTags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm"
                            >
                              {tag}
                              <button
                                onClick={() => handleRemoveTag(tag)}
                                className="hover:text-violet-900"
                              >
                                <XCircleIcon className="h-4 w-4" />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newTagInput}
                            onChange={(e) => setNewTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddTag();
                              }
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                            placeholder="Type a tag and press Enter"
                          />
                          <button
                            onClick={handleAddTag}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                          >
                            <PlusIcon className="h-5 w-5" />
                          </button>
                        </div>
                        {availableTags.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Existing tags:</p>
                            <div className="flex flex-wrap gap-1">
                              {availableTags.map((tag) => (
                                <button
                                  key={tag.id}
                                  onClick={() => {
                                    if (!uploadTags.includes(tag.name)) {
                                      setUploadTags([...uploadTags, tag.name]);
                                    }
                                  }}
                                  className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                                >
                                  {tag.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <button
                          onClick={() => {
                            setUploadFile(null);
                            setUploadPreview(null);
                            setUploadTitle('');
                            setUploadDescription('');
                            setUploadTags([]);
                          }}
                          className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleUpload}
                          disabled={!uploadTitle.trim()}
                          className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Upload & Insert
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - only for library tab */}
        {activeTab === 'library' && selectedMedia && (
          <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-between items-center">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {selectedMedia.title || selectedMedia.filename}
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
        )}
      </div>
    </div>
  );
}
