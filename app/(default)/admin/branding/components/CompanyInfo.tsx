'use client';

import { BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { BrandSettings } from '@/lib/contexts/BrandingContext';

interface CompanyInfoProps {
  settings: BrandSettings;
  onUpdate: (settings: Partial<BrandSettings>) => Promise<void>;
  onHasChanges: (hasChanges: boolean) => void;
}

export default function CompanyInfo({ settings, onUpdate, onHasChanges }: CompanyInfoProps) {
  const handleCompanyChange = async (field: keyof BrandSettings['company'], value: string) => {
    await onUpdate({
      company: {
        ...settings.company,
        [field]: value,
      },
    });
    onHasChanges(true);
  };

  const resetToDefault = async () => {
    await onUpdate({
      company: {
        name: 'Living Wellness',
        tagline: 'Empowering healthier lives',
      },
    });
    onHasChanges(true);
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Company Information
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Update your company name and tagline. These will appear in page titles, emails, and other branded content.
        </p>
        
        <button
          onClick={resetToDefault}
          className="btn bg-gray-500 text-white hover:bg-gray-600"
        >
          Reset to Default
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
            <label className="block text-sm font-medium text-gray-700">
              Company Name
            </label>
          </div>
          
          <input
            type="text"
            value={settings.company.name}
            onChange={(e) => handleCompanyChange('name', e.target.value)}
            className="form-input w-full"
            placeholder="Your Company Name"
          />
          
          <p className="text-xs text-gray-500 mt-2">
            Used in page titles, emails, and throughout the application
          </p>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Preview in page title:</p>
            <p className="font-medium text-gray-900">
              {settings.company.name} - Dashboard
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Company Tagline
          </label>
          
          <textarea
            value={settings.company.tagline || ''}
            onChange={(e) => handleCompanyChange('tagline', e.target.value)}
            rows={3}
            className="form-textarea w-full"
            placeholder="Your company's mission or tagline"
          />
          
          <p className="text-xs text-gray-500 mt-2">
            Optional. Used in footers, welcome emails, and marketing materials
          </p>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Preview in footer:</p>
            <div className="text-center">
              <p className="font-medium text-gray-900">
                {settings.company.name}
              </p>
              {settings.company.tagline && (
                <p className="text-sm text-gray-600 mt-1">
                  {settings.company.tagline}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-violet-50 border border-violet-200 rounded-lg p-6">
        <h4 className="text-md font-medium text-violet-900 mb-4">
          Where This Information Appears
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="text-sm font-medium text-violet-800 mb-2">
              Company Name Usage
            </h5>
            <ul className="text-sm text-violet-700 space-y-1">
              <li>• Browser page titles</li>
              <li>• Email signatures</li>
              <li>• Welcome messages</li>
              <li>• Login page header</li>
              <li>• Invoice headers</li>
              <li>• System notifications</li>
            </ul>
          </div>
          
          <div>
            <h5 className="text-sm font-medium text-violet-800 mb-2">
              Tagline Usage
            </h5>
            <ul className="text-sm text-violet-700 space-y-1">
              <li>• Email templates footer</li>
              <li>• Welcome email content</li>
              <li>• Public pages</li>
              <li>• Proposal documents</li>
              <li>• Marketing materials</li>
              <li>• About sections</li>
            </ul>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-md font-medium text-gray-900 mb-4">
          Email Template Preview
        </h4>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-md">
          <div className="text-center mb-4">
            <div 
              className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: settings.colors.primary }}
            >
              {settings.company.name.charAt(0)}
            </div>
            <h3 className="font-semibold text-gray-900">
              Welcome to {settings.company.name}!
            </h3>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Thank you for joining our wellness platform. We're excited to help you on your journey to better health.
          </p>
          
          <div className="border-t border-gray-200 pt-4 text-center">
            <p className="text-xs text-gray-500">
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
      </div>
    </div>
  );
}
