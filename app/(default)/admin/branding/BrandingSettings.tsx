'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { 
  PhotoIcon,
  SwatchIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  EyeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useBranding } from '@/lib/contexts/BrandingContext';
import LogoUpload from './components/LogoUpload';
import ColorEditor from './components/ColorEditor';
import FontSelector from './components/FontSelector';
import CompanyInfo from './components/CompanyInfo';
import LivePreview from './components/LivePreview';

type TabType = 'logo' | 'colors' | 'typography' | 'company' | 'preview';

export default function BrandingSettings() {
  const { brandSettings, updateBrandSettings, isLoading } = useBranding();
  const [activeTab, setActiveTab] = useState<TabType>('logo');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const tabs = [
    { id: 'logo' as TabType, label: 'Logo & Assets', icon: PhotoIcon },
    { id: 'colors' as TabType, label: 'Brand Colors', icon: SwatchIcon },
    { id: 'typography' as TabType, label: 'Typography', icon: DocumentTextIcon },
    { id: 'company' as TabType, label: 'Company Info', icon: BuildingOfficeIcon },
    { id: 'preview' as TabType, label: 'Live Preview', icon: EyeIcon },
  ];

  const handleSaveChanges = async () => {
    try {
      toast.success('Branding settings saved successfully!');
      setHasUnsavedChanges(false);
    } catch (error) {
      toast.error('Failed to save branding settings');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-lg">
      {hasUnsavedChanges && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex items-center justify-between">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  You have unsaved changes to your branding settings.
                </p>
              </div>
            </div>
            <button
              onClick={handleSaveChanges}
              className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-md text-sm font-medium hover:bg-yellow-200"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-violet-500 text-violet-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'logo' && (
          <LogoUpload 
            settings={brandSettings}
            onUpdate={updateBrandSettings}
            onHasChanges={setHasUnsavedChanges}
          />
        )}
        
        {activeTab === 'colors' && (
          <ColorEditor
            settings={brandSettings}
            onUpdate={updateBrandSettings}
            onHasChanges={setHasUnsavedChanges}
          />
        )}
        
        {activeTab === 'typography' && (
          <FontSelector
            settings={brandSettings}
            onUpdate={updateBrandSettings}
            onHasChanges={setHasUnsavedChanges}
          />
        )}
        
        {activeTab === 'company' && (
          <CompanyInfo
            settings={brandSettings}
            onUpdate={updateBrandSettings}
            onHasChanges={setHasUnsavedChanges}
          />
        )}
        
        {activeTab === 'preview' && (
          <LivePreview settings={brandSettings} />
        )}
      </div>

      {!hasUnsavedChanges && !isLoading && (
        <div className="px-6 py-4 bg-green-50 border-t border-gray-200">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-sm text-green-700">
              All branding settings are up to date and applied across the application.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
