'use client';

import { useState } from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { BrandSettings } from '@/lib/contexts/BrandingContext';

interface FontSelectorProps {
  settings: BrandSettings;
  onUpdate: (settings: Partial<BrandSettings>) => Promise<void>;
  onHasChanges: (hasChanges: boolean) => void;
}

const FONT_OPTIONS = [
  {
    name: 'Inter',
    value: 'Inter',
    category: 'Sans Serif',
    preview: 'The quick brown fox jumps over the lazy dog',
    googleFont: true,
  },
  {
    name: 'Roboto',
    value: 'Roboto',
    category: 'Sans Serif',
    preview: 'The quick brown fox jumps over the lazy dog',
    googleFont: true,
  },
  {
    name: 'Open Sans',
    value: 'Open Sans',
    category: 'Sans Serif',
    preview: 'The quick brown fox jumps over the lazy dog',
    googleFont: true,
  },
  {
    name: 'Lato',
    value: 'Lato',
    category: 'Sans Serif',
    preview: 'The quick brown fox jumps over the lazy dog',
    googleFont: true,
  },
  {
    name: 'Montserrat',
    value: 'Montserrat',
    category: 'Sans Serif',
    preview: 'The quick brown fox jumps over the lazy dog',
    googleFont: true,
  },
  {
    name: 'Poppins',
    value: 'Poppins',
    category: 'Sans Serif',
    preview: 'The quick brown fox jumps over the lazy dog',
    googleFont: true,
  },
  {
    name: 'Source Sans Pro',
    value: 'Source Sans Pro',
    category: 'Sans Serif',
    preview: 'The quick brown fox jumps over the lazy dog',
    googleFont: true,
  },
  {
    name: 'Nunito',
    value: 'Nunito',
    category: 'Sans Serif',
    preview: 'The quick brown fox jumps over the lazy dog',
    googleFont: true,
  },
  {
    name: 'Playfair Display',
    value: 'Playfair Display',
    category: 'Serif',
    preview: 'The quick brown fox jumps over the lazy dog',
    googleFont: true,
  },
  {
    name: 'Merriweather',
    value: 'Merriweather',
    category: 'Serif',
    preview: 'The quick brown fox jumps over the lazy dog',
    googleFont: true,
  },
  {
    name: 'Libre Baskerville',
    value: 'Libre Baskerville',
    category: 'Serif',
    preview: 'The quick brown fox jumps over the lazy dog',
    googleFont: true,
  },
  {
    name: 'Fira Code',
    value: 'Fira Code',
    category: 'Monospace',
    preview: 'console.log("Hello World!");',
    googleFont: true,
  },
  {
    name: 'JetBrains Mono',
    value: 'JetBrains Mono',
    category: 'Monospace',
    preview: 'const variable = "value";',
    googleFont: true,
  },
];

export default function FontSelector({ settings, onUpdate, onHasChanges }: FontSelectorProps) {
  const [customFont, setCustomFont] = useState('');

  const handleFontChange = async (fontType: 'primary' | 'headings' | 'mono', fontValue: string) => {
    await onUpdate({
      fonts: {
        ...settings.fonts,
        [fontType]: fontValue,
      },
    });
    onHasChanges(true);
  };

  const loadGoogleFont = (fontName: string) => {
    const existingLink = document.querySelector(`link[href*="${fontName.replace(/ /g, '+')}"]`);
    if (existingLink) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@300;400;500;600;700&display=swap`;
    document.head.appendChild(link);
  };

  const resetToDefault = async () => {
    await onUpdate({
      fonts: {
        primary: 'Inter',
        headings: 'Inter',
        mono: 'ui-monospace',
      },
    });
    onHasChanges(true);
  };

  const FontPreview = ({ font, currentFont }: { font: typeof FONT_OPTIONS[0], currentFont: string }) => (
    <div
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
        currentFont === font.value
          ? 'border-violet-500 bg-violet-50'
          : 'border-gray-200 hover:border-violet-300'
      }`}
      onClick={() => {
        if (font.googleFont) {
          loadGoogleFont(font.name);
        }
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-900">
          {font.name}
        </h4>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {font.category}
        </span>
      </div>
      <p
        className="text-gray-700"
        style={{ fontFamily: `"${font.value}", sans-serif` }}
      >
        {font.preview}
      </p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Typography Settings
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Choose fonts for different text elements. Google Fonts will be automatically loaded.
        </p>
        
        <button
          onClick={resetToDefault}
          className="btn bg-gray-500 text-white hover:bg-gray-600"
        >
          Reset to Default
        </button>
      </div>

      <div>
        <div className="flex items-center space-x-2 mb-4">
          <DocumentTextIcon className="h-5 w-5 text-gray-400" />
          <h4 className="text-md font-medium text-gray-900">
            Primary Font
          </h4>
          <span className="text-sm text-gray-500">
            (Body text, UI elements)
          </span>
        </div>

        <div className="mb-4">
          <select
            value={settings.fonts.primary}
            onChange={(e) => {
              const selectedFont = FONT_OPTIONS.find(f => f.value === e.target.value);
              if (selectedFont?.googleFont) {
                loadGoogleFont(selectedFont.name);
              }
              handleFontChange('primary', e.target.value);
            }}
            className="form-select w-full max-w-md"
          >
            {FONT_OPTIONS.map(font => (
              <option key={font.value} value={font.value}>
                {font.name} ({font.category})
              </option>
            ))}
          </select>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-2">Preview:</p>
          <div style={{ fontFamily: `"${settings.fonts.primary}", sans-serif` }}>
            <p className="text-lg mb-2">This is a heading in primary font</p>
            <p className="text-base mb-2">This is regular body text that users will read throughout the application. It should be clear and legible.</p>
            <p className="text-sm text-gray-600">This is smaller text for secondary information.</p>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center space-x-2 mb-4">
          <DocumentTextIcon className="h-5 w-5 text-gray-400" />
          <h4 className="text-md font-medium text-gray-900">
            Headings Font
          </h4>
          <span className="text-sm text-gray-500">
            (H1, H2, H3, etc.)
          </span>
        </div>

        <div className="mb-4">
          <select
            value={settings.fonts.headings}
            onChange={(e) => {
              const selectedFont = FONT_OPTIONS.find(f => f.value === e.target.value);
              if (selectedFont?.googleFont) {
                loadGoogleFont(selectedFont.name);
              }
              handleFontChange('headings', e.target.value);
            }}
            className="form-select w-full max-w-md"
          >
            {FONT_OPTIONS.map(font => (
              <option key={font.value} value={font.value}>
                {font.name} ({font.category})
              </option>
            ))}
          </select>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-2">Preview:</p>
          <div>
            <h1 
              className="text-3xl font-bold mb-2"
              style={{ fontFamily: `"${settings.fonts.headings}", sans-serif` }}
            >
              Main Heading (H1)
            </h1>
            <h2 
              className="text-2xl font-semibold mb-2"
              style={{ fontFamily: `"${settings.fonts.headings}", sans-serif` }}
            >
              Section Heading (H2)
            </h2>
            <h3 
              className="text-xl font-medium"
              style={{ fontFamily: `"${settings.fonts.headings}", sans-serif` }}
            >
              Subsection Heading (H3)
            </h3>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center space-x-2 mb-4">
          <DocumentTextIcon className="h-5 w-5 text-gray-400" />
          <h4 className="text-md font-medium text-gray-900">
            Monospace Font
          </h4>
          <span className="text-sm text-gray-500">
            (Code, technical content)
          </span>
        </div>

        <div className="mb-4">
          <select
            value={settings.fonts.mono}
            onChange={(e) => {
              const selectedFont = FONT_OPTIONS.find(f => f.value === e.target.value);
              if (selectedFont?.googleFont) {
                loadGoogleFont(selectedFont.name);
              }
              handleFontChange('mono', e.target.value);
            }}
            className="form-select w-full max-w-md"
          >
            <option value="ui-monospace">ui-monospace (System Default)</option>
            {FONT_OPTIONS.filter(f => f.category === 'Monospace').map(font => (
              <option key={font.value} value={font.value}>
                {font.name}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-2">Preview:</p>
          <div>
            <pre 
              className="text-sm bg-gray-800 text-green-400 p-3 rounded overflow-x-auto"
              style={{ fontFamily: `"${settings.fonts.mono}", monospace` }}
            >
{`// API Response Example
{
  "status": "success",
  "data": {
    "id": "user-123",
    "name": "Jane Doe",
    "email": "jane@example.com"
  }
}`}
            </pre>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-md font-medium text-gray-900 mb-4">
          Available Fonts
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FONT_OPTIONS.map(font => (
            <FontPreview 
              key={font.value} 
              font={font} 
              currentFont={settings.fonts.primary}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
