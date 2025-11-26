'use client';

import { EyeIcon, DevicePhoneMobileIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { BrandSettings } from '@/lib/contexts/BrandingContext';
import { useState } from 'react';

interface LivePreviewProps {
  settings: BrandSettings;
}

export default function LivePreview({ settings }: LivePreviewProps) {
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  const PreviewCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h4 className="text-sm font-medium text-gray-900">{title}</h4>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center space-x-2 mb-2">
          <EyeIcon className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">
            Live Preview
          </h3>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          See how your branding changes will look across different parts of the application.
        </p>

        <div className="flex items-center space-x-4 mb-6">
          <span className="text-sm font-medium text-gray-700">View:</span>
          <div className="flex rounded-md border border-gray-300">
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`px-4 py-2 text-sm font-medium rounded-l-md flex items-center space-x-2 ${
                previewMode === 'desktop'
                  ? 'bg-violet-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ComputerDesktopIcon className="h-4 w-4" />
              <span>Desktop</span>
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`px-4 py-2 text-sm font-medium rounded-r-md border-l border-gray-300 flex items-center space-x-2 ${
                previewMode === 'mobile'
                  ? 'bg-violet-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <DevicePhoneMobileIcon className="h-4 w-4" />
              <span>Mobile</span>
            </button>
          </div>
        </div>
      </div>

      <div className={`grid gap-6 ${previewMode === 'desktop' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-sm mx-auto'}`}>
        <PreviewCard title="Application Header">
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img
                  src={settings.logo.url}
                  alt={settings.logo.alt}
                  style={{
                    width: settings.logo.width ? `${settings.logo.width}px` : 'auto',
                    height: settings.logo.height ? `${settings.logo.height}px` : '32px',
                    maxWidth: '160px',
                    maxHeight: '40px',
                  }}
                  className="object-contain"
                />
                <span 
                  className="text-lg font-semibold"
                  style={{ 
                    fontFamily: `"${settings.fonts.headings}", sans-serif`,
                    color: settings.colors.primary 
                  }}
                >
                  {settings.company.name}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  className="px-3 py-1 rounded text-sm font-medium text-white"
                  style={{ backgroundColor: settings.colors.primary }}
                >
                  Dashboard
                </button>
              </div>
            </div>
          </div>
        </PreviewCard>

        <PreviewCard title="Buttons & Interactive Elements">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <button 
                className="px-4 py-2 rounded-md text-white font-medium"
                style={{ backgroundColor: settings.colors.primary }}
              >
                Primary Button
              </button>
              <button 
                className="px-4 py-2 rounded-md font-medium border-2"
                style={{ 
                  color: settings.colors.primary, 
                  borderColor: settings.colors.primary,
                  backgroundColor: 'transparent'
                }}
              >
                Secondary
              </button>
              <button 
                className="px-4 py-2 rounded-md text-white font-medium"
                style={{ backgroundColor: settings.colors.primaryShades[600] }}
              >
                Hover State
              </button>
            </div>
            
            <div className="space-y-2">
              <a 
                href="#" 
                className="text-sm font-medium hover:underline"
                style={{ color: settings.colors.primary }}
              >
                Primary Link Text
              </a>
              <p className="text-sm" style={{ color: settings.colors.primaryShades[700] }}>
                This is secondary text in a darker shade.
              </p>
            </div>
          </div>
        </PreviewCard>

        <PreviewCard title="Typography Hierarchy">
          <div className="space-y-4">
            <h1 
              className="text-2xl font-bold"
              style={{ fontFamily: `"${settings.fonts.headings}", sans-serif` }}
            >
              Main Heading (H1)
            </h1>
            <h2 
              className="text-xl font-semibold"
              style={{ fontFamily: `"${settings.fonts.headings}", sans-serif` }}
            >
              Section Heading (H2)
            </h2>
            <p 
              className="text-base"
              style={{ fontFamily: `"${settings.fonts.primary}", sans-serif` }}
            >
              This is regular body text that demonstrates how your primary font will look in paragraphs and general content throughout the application.
            </p>
            <p 
              className="text-sm text-gray-600"
              style={{ fontFamily: `"${settings.fonts.primary}", sans-serif` }}
            >
              This is smaller text for secondary information, captions, and helper text.
            </p>
            <pre 
              className="text-sm bg-gray-100 p-2 rounded overflow-x-auto"
              style={{ fontFamily: `"${settings.fonts.mono}", monospace` }}
            >
              code: "monospace font example"
            </pre>
          </div>
        </PreviewCard>

        <PreviewCard title="Card Components">
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 
                  className="font-semibold"
                  style={{ fontFamily: `"${settings.fonts.headings}", sans-serif` }}
                >
                  Wellness Program
                </h3>
                <span 
                  className="px-2 py-1 rounded text-xs font-medium text-white"
                  style={{ backgroundColor: settings.colors.primary }}
                >
                  Active
                </span>
              </div>
              <p 
                className="text-sm text-gray-600"
                style={{ fontFamily: `"${settings.fonts.primary}", sans-serif` }}
              >
                A comprehensive health program designed for employee wellbeing.
              </p>
            </div>
          </div>
        </PreviewCard>

        <PreviewCard title="Form Elements">
          <div className="space-y-4">
            <div>
              <label 
                className="block text-sm font-medium mb-1"
                style={{ fontFamily: `"${settings.fonts.primary}", sans-serif` }}
              >
                Patient Name
              </label>
              <input
                type="text"
                placeholder="Enter patient name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                style={{
                  fontFamily: `"${settings.fonts.primary}", sans-serif`,
                }}
              />
            </div>
            <div className="flex space-x-2">
              <button 
                className="flex-1 px-4 py-2 rounded-md text-white font-medium"
                style={{ backgroundColor: settings.colors.primary }}
              >
                Save Changes
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-md font-medium">
                Cancel
              </button>
            </div>
          </div>
        </PreviewCard>

        <PreviewCard title="Email Template">
          <div className="max-w-sm mx-auto bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div 
              className="p-6 text-center text-white"
              style={{ backgroundColor: settings.colors.primary }}
            >
              <div className="w-12 h-12 mx-auto mb-2 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold">
                  {settings.company.name.charAt(0)}
                </span>
              </div>
              <h2 
                className="text-lg font-bold"
                style={{ fontFamily: `"${settings.fonts.headings}", sans-serif` }}
              >
                Welcome to {settings.company.name}!
              </h2>
            </div>
            
            <div className="p-6">
              <p 
                className="text-sm text-gray-600 mb-4"
                style={{ fontFamily: `"${settings.fonts.primary}", sans-serif` }}
              >
                Thank you for joining our wellness platform. We're excited to help you on your journey to better health.
              </p>
              
              <button 
                className="w-full py-2 rounded text-white font-medium"
                style={{ backgroundColor: settings.colors.primary }}
              >
                Get Started
              </button>
            </div>
            
            <div className="p-4 bg-gray-50 text-center border-t border-gray-200">
              <p 
                className="text-xs text-gray-500"
                style={{ fontFamily: `"${settings.fonts.primary}", sans-serif` }}
              >
                {settings.company.name}
                {settings.company.tagline && (
                  <>
                    <br />
                    <em>{settings.company.tagline}</em>
                  </>
                )}
              </p>
            </div>
          </div>
        </PreviewCard>
      </div>

      <div>
        <h4 className="text-md font-medium text-gray-900 mb-4">
          Current Color Palette
        </h4>
        <div className="flex flex-wrap gap-2">
          {Object.entries(settings.colors.primaryShades).map(([shade, color]) => (
            <div key={shade} className="text-center">
              <div 
                className="w-16 h-16 rounded-lg border border-gray-200 mb-1"
                style={{ backgroundColor: color }}
                title={`${shade}: ${color}`}
              />
              <div className="text-xs text-gray-600">
                <div className="font-mono">{shade}</div>
                <div className="font-mono text-xs">{color}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
