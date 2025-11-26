'use client';

import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { CloudArrowUpIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { BrandSettings } from '@/lib/contexts/BrandingContext';

interface LogoUploadProps {
  settings: BrandSettings;
  onUpdate: (settings: Partial<BrandSettings>) => Promise<void>;
  onHasChanges: (hasChanges: boolean) => void;
}

export default function LogoUpload({ settings, onUpdate, onHasChanges }: LogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [previewFavicon, setPreviewFavicon] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File, type: 'logo' | 'favicon') => {
    if (!file) return;

    const validTypes = type === 'logo' 
      ? ['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp']
      : ['image/x-icon', 'image/png', 'image/svg+xml'];
      
    if (!validTypes.includes(file.type)) {
      toast.error(`Invalid file type for ${type}. Please use ${validTypes.join(', ')}`);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    
    try {
      const previewUrl = URL.createObjectURL(file);
      if (type === 'logo') {
        setPreviewLogo(previewUrl);
      } else {
        setPreviewFavicon(previewUrl);
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/branding/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const { url } = await response.json();

      if (type === 'logo') {
        await onUpdate({
          logo: {
            ...settings.logo,
            url,
          },
        });
      } else {
        await onUpdate({
          favicon: {
            ...settings.favicon,
            url,
          },
        });
      }

      onHasChanges(true);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully!`);
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      toast.error(`Failed to upload ${type}`);
      if (type === 'logo') {
        setPreviewLogo(null);
      } else {
        setPreviewFavicon(null);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent, type: 'logo' | 'favicon') => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0], type);
    }
  };

  const resetToDefault = async (type: 'logo' | 'favicon') => {
    const defaultUrls = {
      logo: '/logo.svg',
      favicon: '/favicon.ico',
    };

    await onUpdate({
      [type]: {
        ...settings[type],
        url: defaultUrls[type],
      },
    });

    if (type === 'logo') {
      setPreviewLogo(null);
    } else {
      setPreviewFavicon(null);
    }

    onHasChanges(true);
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} reset to default`);
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Logo & Brand Assets
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Upload your company logo and favicon. These will appear throughout the application.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Logo
          </label>
          
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-violet-400 transition-colors"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'logo')}
          >
            {previewLogo || settings.logo.url ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <img
                    src={previewLogo || settings.logo.url}
                    alt={settings.logo.alt}
                    className="max-h-16 max-w-full object-contain"
                  />
                </div>
                <div className="flex justify-center space-x-2">
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="btn bg-violet-500 text-white hover:bg-violet-600 text-sm"
                    disabled={isUploading}
                  >
                    {isUploading ? 'Uploading...' : 'Change Logo'}
                  </button>
                  <button
                    onClick={() => resetToDefault('logo')}
                    className="btn bg-gray-500 text-white hover:bg-gray-600 text-sm"
                    disabled={isUploading}
                  >
                    Reset
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">
                    Drag and drop your logo here, or{' '}
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      className="text-violet-600 hover:text-violet-500 font-medium"
                      disabled={isUploading}
                    >
                      browse files
                    </button>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    SVG, PNG, JPG up to 5MB
                  </p>
                </div>
              </div>
            )}
          </div>

          <input
            ref={logoInputRef}
            type="file"
            accept="image/svg+xml,image/png,image/jpeg,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file, 'logo');
            }}
            className="hidden"
          />

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Width (px)
              </label>
              <input
                type="number"
                value={settings.logo.width || ''}
                onChange={async (e) => {
                  const width = parseInt(e.target.value) || undefined;
                  await onUpdate({
                    logo: { ...settings.logo, width },
                  });
                  onHasChanges(true);
                }}
                className="form-input w-full"
                placeholder="160"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Height (px)
              </label>
              <input
                type="number"
                value={settings.logo.height || ''}
                onChange={async (e) => {
                  const height = parseInt(e.target.value) || undefined;
                  await onUpdate({
                    logo: { ...settings.logo, height },
                  });
                  onHasChanges(true);
                }}
                className="form-input w-full"
                placeholder="40"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Favicon
          </label>
          
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-violet-400 transition-colors"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'favicon')}
          >
            {previewFavicon || settings.favicon.url ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <img
                    src={previewFavicon || settings.favicon.url}
                    alt="Favicon"
                    className="h-8 w-8 object-contain"
                  />
                </div>
                <div className="flex justify-center space-x-2">
                  <button
                    onClick={() => faviconInputRef.current?.click()}
                    className="btn bg-violet-500 text-white hover:bg-violet-600 text-sm"
                    disabled={isUploading}
                  >
                    {isUploading ? 'Uploading...' : 'Change Favicon'}
                  </button>
                  <button
                    onClick={() => resetToDefault('favicon')}
                    className="btn bg-gray-500 text-white hover:bg-gray-600 text-sm"
                    disabled={isUploading}
                  >
                    Reset
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <PhotoIcon className="mx-auto h-8 w-8 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">
                    <button
                      onClick={() => faviconInputRef.current?.click()}
                      className="text-violet-600 hover:text-violet-500 font-medium"
                      disabled={isUploading}
                    >
                      Upload favicon
                    </button>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    ICO, PNG, SVG (32x32px recommended)
                  </p>
                </div>
              </div>
            )}
          </div>

          <input
            ref={faviconInputRef}
            type="file"
            accept="image/x-icon,image/png,image/svg+xml"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file, 'favicon');
            }}
            className="hidden"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Logo Alt Text
        </label>
        <input
          type="text"
          value={settings.logo.alt}
          onChange={async (e) => {
            await onUpdate({
              logo: { ...settings.logo, alt: e.target.value },
            });
            onHasChanges(true);
          }}
          className="form-input w-full max-w-md"
          placeholder="Company name or description"
        />
        <p className="text-xs text-gray-500 mt-1">
          Used for accessibility and when the logo fails to load
        </p>
      </div>
    </div>
  );
}
