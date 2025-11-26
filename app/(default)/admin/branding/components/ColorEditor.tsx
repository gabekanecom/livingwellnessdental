'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { SwatchIcon, ArrowPathIcon, PlusIcon, TrashIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { BrandSettings, BrandColor, ColorShades, generateColorShades } from '@/lib/contexts/BrandingContext';

interface ColorEditorProps {
  settings: BrandSettings;
  onUpdate: (settings: Partial<BrandSettings>) => Promise<void>;
  onHasChanges: (hasChanges: boolean) => void;
}

export default function ColorEditor({ settings, onUpdate, onHasChanges }: ColorEditorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedColors, setExpandedColors] = useState<Set<string>>(new Set(['primary']));
  const [newColorName, setNewColorName] = useState('');
  const [newColorBase, setNewColorBase] = useState('#6366f1');

  const secondaryColors = settings.colors.secondary || [];

  const toggleExpanded = (colorId: string) => {
    const newExpanded = new Set(expandedColors);
    if (newExpanded.has(colorId)) {
      newExpanded.delete(colorId);
    } else {
      newExpanded.add(colorId);
    }
    setExpandedColors(newExpanded);
  };

  const handlePrimaryColorChange = async (color: string) => {
    try {
      const shades = generateColorShades(color);
      await onUpdate({
        colors: {
          ...settings.colors,
          primary: color,
          primaryShades: shades,
        },
      });
      onHasChanges(true);
    } catch (error) {
      toast.error('Failed to update primary color');
    }
  };

  const handlePrimaryShadeChange = async (shade: keyof ColorShades, color: string) => {
    try {
      await onUpdate({
        colors: {
          ...settings.colors,
          primaryShades: {
            ...settings.colors.primaryShades,
            [shade]: color,
          },
        },
      });
      onHasChanges(true);
    } catch (error) {
      toast.error('Failed to update color shade');
    }
  };

  const handleAddSecondaryColor = async () => {
    if (!newColorName.trim()) {
      toast.error('Please enter a color name');
      return;
    }

    const existingNames = secondaryColors.map(c => c.name.toLowerCase());
    if (existingNames.includes(newColorName.toLowerCase())) {
      toast.error('A color with this name already exists');
      return;
    }

    const shades = generateColorShades(newColorBase);
    const newColor: BrandColor = {
      name: newColorName.trim(),
      base: newColorBase,
      shades,
    };

    await onUpdate({
      colors: {
        ...settings.colors,
        secondary: [...secondaryColors, newColor],
      },
    });

    setNewColorName('');
    setNewColorBase('#6366f1');
    setExpandedColors(new Set([...expandedColors, newColorName.trim()]));
    onHasChanges(true);
    toast.success(`Added ${newColorName} to brand colors`);
  };

  const handleSecondaryColorChange = async (index: number, base: string) => {
    const shades = generateColorShades(base);
    const updated = [...secondaryColors];
    updated[index] = { ...updated[index], base, shades };

    await onUpdate({
      colors: {
        ...settings.colors,
        secondary: updated,
      },
    });
    onHasChanges(true);
  };

  const handleSecondaryShadeChange = async (index: number, shade: keyof ColorShades, color: string) => {
    const updated = [...secondaryColors];
    updated[index] = {
      ...updated[index],
      shades: { ...updated[index].shades, [shade]: color },
    };

    await onUpdate({
      colors: {
        ...settings.colors,
        secondary: updated,
      },
    });
    onHasChanges(true);
  };

  const handleRemoveSecondaryColor = async (index: number) => {
    const colorName = secondaryColors[index].name;
    if (!confirm(`Are you sure you want to remove "${colorName}"?`)) return;

    const updated = secondaryColors.filter((_, i) => i !== index);
    await onUpdate({
      colors: {
        ...settings.colors,
        secondary: updated,
      },
    });
    onHasChanges(true);
    toast.success(`Removed ${colorName}`);
  };

  const handleRegenerateShades = async (type: 'primary' | number) => {
    setIsGenerating(true);
    try {
      if (type === 'primary') {
        const shades = generateColorShades(settings.colors.primary);
        await onUpdate({
          colors: {
            ...settings.colors,
            primaryShades: shades,
          },
        });
      } else {
        const color = secondaryColors[type];
        const shades = generateColorShades(color.base);
        const updated = [...secondaryColors];
        updated[type] = { ...updated[type], shades };
        await onUpdate({
          colors: {
            ...settings.colors,
            secondary: updated,
          },
        });
      }
      onHasChanges(true);
      toast.success('Shades regenerated');
    } catch (error) {
      toast.error('Failed to generate shades');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSemanticColorChange = async (colorName: keyof BrandSettings['colors']['semantic'], color: string) => {
    await onUpdate({
      colors: {
        ...settings.colors,
        semantic: { ...settings.colors.semantic, [colorName]: color },
      },
    });
    onHasChanges(true);
  };

  const handleStatusColorChange = async (colorName: keyof BrandSettings['colors']['status'], color: string) => {
    await onUpdate({
      colors: {
        ...settings.colors,
        status: { ...settings.colors.status, [colorName]: color },
      },
    });
    onHasChanges(true);
  };

  const renderShadesPalette = (
    shades: ColorShades,
    onShadeChange: (shade: keyof ColorShades, color: string) => void,
    prefix: string
  ) => (
    <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2 mt-4">
      {Object.entries(shades).map(([shade, color]) => (
        <div key={shade} className="space-y-1">
          <div
            className="h-12 w-full rounded border border-gray-300 cursor-pointer"
            style={{ backgroundColor: color }}
            title={`${prefix}-${shade}: ${color}`}
          />
          <input
            type="color"
            value={color}
            onChange={(e) => onShadeChange(shade as keyof ColorShades, e.target.value)}
            className="w-full h-6 rounded border border-gray-200 cursor-pointer"
          />
          <p className="text-xs text-gray-500 text-center">{shade}</p>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Brand Colors</h3>
        <p className="text-sm text-gray-600 mb-6">
          Define your brand's color palette. Each color automatically generates a full shade range (50-900).
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div
            className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer"
            onClick={() => toggleExpanded('primary')}
          >
            <div className="flex items-center gap-3">
              {expandedColors.has('primary') ? (
                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRightIcon className="h-5 w-5 text-gray-400" />
              )}
              <div
                className="w-8 h-8 rounded-full border-2 border-white shadow"
                style={{ backgroundColor: settings.colors.primary }}
              />
              <div>
                <h4 className="font-medium text-gray-900">Primary</h4>
                <p className="text-xs text-gray-500">Main brand color • {settings.colors.primary}</p>
              </div>
            </div>
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => handleRegenerateShades('primary')}
                disabled={isGenerating}
                className="p-1.5 text-gray-400 hover:text-violet-600 rounded"
                title="Regenerate shades"
              >
                <ArrowPathIcon className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
              </button>
              <input
                type="color"
                value={settings.colors.primary}
                onChange={(e) => handlePrimaryColorChange(e.target.value)}
                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
              />
            </div>
          </div>

          {expandedColors.has('primary') && (
            <div className="px-4 py-4 border-t border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="text"
                  value={settings.colors.primary}
                  onChange={(e) => handlePrimaryColorChange(e.target.value)}
                  className="form-input w-32 text-sm font-mono"
                  placeholder="#000000"
                />
                <span className="text-sm text-gray-500">Base color (500)</span>
              </div>
              {renderShadesPalette(
                settings.colors.primaryShades,
                handlePrimaryShadeChange,
                'primary'
              )}
            </div>
          )}
        </div>

        {secondaryColors.map((brandColor, index) => (
          <div key={brandColor.name} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div
              className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer"
              onClick={() => toggleExpanded(brandColor.name)}
            >
              <div className="flex items-center gap-3">
                {expandedColors.has(brandColor.name) ? (
                  <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                )}
                <div
                  className="w-8 h-8 rounded-full border-2 border-white shadow"
                  style={{ backgroundColor: brandColor.base }}
                />
                <div>
                  <h4 className="font-medium text-gray-900">{brandColor.name}</h4>
                  <p className="text-xs text-gray-500">Secondary color • {brandColor.base}</p>
                </div>
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleRegenerateShades(index)}
                  disabled={isGenerating}
                  className="p-1.5 text-gray-400 hover:text-violet-600 rounded"
                  title="Regenerate shades"
                >
                  <ArrowPathIcon className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                </button>
                <input
                  type="color"
                  value={brandColor.base}
                  onChange={(e) => handleSecondaryColorChange(index, e.target.value)}
                  className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                />
                <button
                  onClick={() => handleRemoveSecondaryColor(index)}
                  className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                  title="Remove color"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {expandedColors.has(brandColor.name) && (
              <div className="px-4 py-4 border-t border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="text"
                    value={brandColor.base}
                    onChange={(e) => handleSecondaryColorChange(index, e.target.value)}
                    className="form-input w-32 text-sm font-mono"
                    placeholder="#000000"
                  />
                  <span className="text-sm text-gray-500">Base color (500)</span>
                </div>
                {renderShadesPalette(
                  brandColor.shades,
                  (shade, color) => handleSecondaryShadeChange(index, shade, color),
                  brandColor.name.toLowerCase().replace(/\s+/g, '-')
                )}
                <p className="mt-3 text-xs text-gray-500">
                  CSS Variable: <code className="bg-gray-100 px-1 rounded">--color-{brandColor.name.toLowerCase().replace(/\s+/g, '-')}-[shade]</code>
                </p>
              </div>
            )}
          </div>
        ))}

        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Add Secondary Color</h4>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Color Name</label>
              <input
                type="text"
                value={newColorName}
                onChange={(e) => setNewColorName(e.target.value)}
                placeholder="e.g., Coral, Teal, Gold"
                className="form-input w-40 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Base Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newColorBase}
                  onChange={(e) => setNewColorBase(e.target.value)}
                  className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={newColorBase}
                  onChange={(e) => setNewColorBase(e.target.value)}
                  className="form-input w-24 text-sm font-mono"
                />
              </div>
            </div>
            <button
              onClick={handleAddSecondaryColor}
              className="btn bg-violet-500 text-white hover:bg-violet-600 flex items-center gap-1"
            >
              <PlusIcon className="h-4 w-4" />
              Add Color
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center space-x-4 mb-4">
          <SwatchIcon className="h-6 w-6 text-gray-400" />
          <h4 className="text-md font-medium text-gray-900">Semantic Colors</h4>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Colors for success, warning, error, and info states.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(settings.colors.semantic).map(([name, color]) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{name}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => handleSemanticColorChange(name as keyof BrandSettings['colors']['semantic'], e.target.value)}
                  className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => handleSemanticColorChange(name as keyof BrandSettings['colors']['semantic'], e.target.value)}
                  className="form-input flex-1 text-xs font-mono"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center space-x-4 mb-4">
          <SwatchIcon className="h-6 w-6 text-gray-400" />
          <h4 className="text-md font-medium text-gray-900">Status Colors</h4>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Colors for status badges and workflow indicators.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(settings.colors.status).map(([name, color]) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{name}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => handleStatusColorChange(name as keyof BrandSettings['colors']['status'], e.target.value)}
                  className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => handleStatusColorChange(name as keyof BrandSettings['colors']['status'], e.target.value)}
                  className="form-input flex-1 text-xs font-mono"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-violet-50 border border-violet-200 rounded-lg p-6">
        <h4 className="text-md font-medium text-violet-900 mb-4">Color Preview</h4>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-violet-800 mb-2">Primary Palette</p>
            <div className="flex gap-1">
              {Object.entries(settings.colors.primaryShades).map(([shade, color]) => (
                <div
                  key={shade}
                  className="h-10 flex-1 first:rounded-l last:rounded-r"
                  style={{ backgroundColor: color }}
                  title={`${shade}: ${color}`}
                />
              ))}
            </div>
          </div>
          {secondaryColors.map((brandColor) => (
            <div key={brandColor.name}>
              <p className="text-sm text-violet-800 mb-2">{brandColor.name} Palette</p>
              <div className="flex gap-1">
                {Object.entries(brandColor.shades).map(([shade, color]) => (
                  <div
                    key={shade}
                    className="h-10 flex-1 first:rounded-l last:rounded-r"
                    style={{ backgroundColor: color }}
                    title={`${shade}: ${color}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
