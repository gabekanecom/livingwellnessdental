'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ColorShades {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

export interface BrandColor {
  name: string;
  base: string;
  shades: ColorShades;
}

export interface BrandSettings {
  logo: {
    url: string;
    alt: string;
    width?: number;
    height?: number;
  };
  favicon: {
    url: string;
  };
  
  fonts: {
    primary: string;
    headings: string;
    mono: string;
  };
  
  colors: {
    primary: string;
    primaryShades: ColorShades;
    secondary: BrandColor[];
    semantic: {
      success: string;
      warning: string; 
      danger: string;
      info: string;
      neutral: string;
    };
    status: {
      active: string;
      inactive: string;
      pending: string;
      approved: string;
      rejected: string;
      suspended: string;
    };
  };
  
  company: {
    name: string;
    tagline?: string;
  };
}

interface BrandingContextType {
  brandSettings: BrandSettings;
  updateBrandSettings: (settings: Partial<BrandSettings>) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const defaultBrandSettings: BrandSettings = {
  logo: {
    url: '/logo.svg',
    alt: 'Living Wellness',
    width: 160,
    height: 40,
  },
  favicon: {
    url: '/favicon.ico',
  },
  fonts: {
    primary: 'Inter',
    headings: 'Inter',
    mono: 'ui-monospace',
  },
  colors: {
    primary: '#8470ff',
    primaryShades: {
      50: '#f1eeff',
      100: '#e6e1ff',
      200: '#d2cbff',
      300: '#b7acff',
      400: '#9c8cff',
      500: '#8470ff',
      600: '#755ff8',
      700: '#5d47de',
      800: '#4634b1',
      900: '#2f227c',
    },
    secondary: [],
    semantic: {
      success: '#3ec972',
      warning: '#f0bb33', 
      danger: '#ff5656',
      info: '#67bfff',
      neutral: '#6b7280',
    },
    status: {
      active: '#3ec972',
      inactive: '#6b7280',
      pending: '#f0bb33',
      approved: '#3ec972',
      rejected: '#ff5656',
      suspended: '#ff5656',
    },
  },
  company: {
    name: 'Living Wellness',
    tagline: 'Empowering healthier lives',
  },
};

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [brandSettings, setBrandSettings] = useState<BrandSettings>(defaultBrandSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/branding');
        if (response.ok) {
          const data = await response.json();
          if (data.settings) {
            const db = data.settings;
            const mergedSettings: BrandSettings = {
              logo: { ...defaultBrandSettings.logo, ...db.logo },
              favicon: { ...defaultBrandSettings.favicon, ...db.favicon },
              fonts: { ...defaultBrandSettings.fonts, ...db.fonts },
              colors: {
                primary: db.colors?.primary || defaultBrandSettings.colors.primary,
                primaryShades: { ...defaultBrandSettings.colors.primaryShades, ...db.colors?.primaryShades },
                secondary: db.colors?.secondary || defaultBrandSettings.colors.secondary,
                semantic: { ...defaultBrandSettings.colors.semantic, ...db.colors?.semantic },
                status: { ...defaultBrandSettings.colors.status, ...db.colors?.status },
              },
              company: { ...defaultBrandSettings.company, ...db.company },
            };
            setBrandSettings(mergedSettings);
            applyBrandSettings(mergedSettings);
          } else {
            applyBrandSettings(defaultBrandSettings);
          }
        } else {
          applyBrandSettings(defaultBrandSettings);
        }
      } catch (error) {
        console.error('Failed to load brand settings:', error);
        setError('Failed to load brand settings');
        applyBrandSettings(defaultBrandSettings);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const applyBrandSettings = (settings: BrandSettings) => {
    if (typeof document === 'undefined' || !settings) return;

    const root = document.documentElement;
    
    if (settings?.colors?.primary) {
      root.style.setProperty('--color-lwd-brand', settings.colors.primary);
    }
    if (settings?.colors?.primaryShades) {
      Object.entries(settings.colors.primaryShades).forEach(([shade, color]) => {
        root.style.setProperty(`--color-lwd-brand-${shade}`, color);
      });
    }

    if (settings?.colors?.secondary) {
      settings.colors.secondary.forEach((brandColor, index) => {
        const varName = brandColor.name.toLowerCase().replace(/\s+/g, '-');
        root.style.setProperty(`--color-${varName}`, brandColor.base);
        Object.entries(brandColor.shades).forEach(([shade, color]) => {
          root.style.setProperty(`--color-${varName}-${shade}`, color);
        });
      });
    }

    if (settings?.colors?.semantic) {
      Object.entries(settings.colors.semantic).forEach(([name, color]) => {
        root.style.setProperty(`--color-${name}`, color);
      });
    }

    if (settings?.colors?.status) {
      Object.entries(settings.colors.status).forEach(([name, color]) => {
        root.style.setProperty(`--color-status-${name}`, color);
      });
    }

    if (settings?.fonts?.primary) {
      root.style.setProperty('--font-inter', `"${settings.fonts.primary}", sans-serif`);
    }

    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (favicon && settings?.favicon?.url) {
      favicon.href = settings.favicon.url;
    }

    const titleElements = document.querySelectorAll('title');
    titleElements.forEach(title => {
      if (title.textContent?.includes('Living Wellness')) {
        title.textContent = title.textContent.replace('Living Wellness', settings.company.name);
      }
    });
  };

  const updateBrandSettings = async (newSettings: Partial<BrandSettings>) => {
    try {
      setError(null);

      const updatedSettings = {
        ...brandSettings,
        ...newSettings,
        logo: { ...brandSettings.logo, ...newSettings.logo },
        favicon: { ...brandSettings.favicon, ...newSettings.favicon },
        fonts: { ...brandSettings.fonts, ...newSettings.fonts },
        colors: {
          ...brandSettings.colors,
          ...newSettings.colors,
          primaryShades: { 
            ...brandSettings.colors.primaryShades, 
            ...newSettings.colors?.primaryShades 
          },
          secondary: newSettings.colors?.secondary !== undefined 
            ? newSettings.colors.secondary 
            : brandSettings.colors.secondary,
          semantic: {
            ...brandSettings.colors.semantic,
            ...newSettings.colors?.semantic
          },
          status: {
            ...brandSettings.colors.status,
            ...newSettings.colors?.status
          },
        },
        company: { ...brandSettings.company, ...newSettings.company },
      };

      setBrandSettings(updatedSettings);
      applyBrandSettings(updatedSettings);

      const response = await fetch('/api/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

    } catch (error) {
      console.error('Failed to update brand settings:', error);
      setError('Failed to update brand settings');
      throw error;
    }
  };

  return (
    <BrandingContext.Provider value={{
      brandSettings,
      updateBrandSettings,
      isLoading,
      error,
    }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
}

export function generateColorShades(baseColor: string): BrandSettings['colors']['primaryShades'] {
  const hexToHsl = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return [h * 360, s * 100, l * 100];
  };

  const hslToHex = (h: number, s: number, l: number) => {
    h /= 360;
    s /= 100;
    l /= 100;

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    const r = Math.round(hue2rgb(p, q, h + 1/3) * 255);
    const g = Math.round(hue2rgb(p, q, h) * 255);
    const b = Math.round(hue2rgb(p, q, h - 1/3) * 255);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  const [h, s, l] = hexToHsl(baseColor);

  return {
    50: hslToHex(h, Math.max(s - 20, 10), Math.min(l + 40, 95)),
    100: hslToHex(h, Math.max(s - 10, 20), Math.min(l + 30, 90)),
    200: hslToHex(h, s, Math.min(l + 20, 85)),
    300: hslToHex(h, s, Math.min(l + 10, 75)),
    400: hslToHex(h, s, Math.max(l - 5, 25)),
    500: baseColor,
    600: hslToHex(h, s, Math.max(l - 10, 15)),
    700: hslToHex(h, s, Math.max(l - 20, 10)),
    800: hslToHex(h, s, Math.max(l - 30, 8)),
    900: hslToHex(h, s, Math.max(l - 40, 5)),
  };
}
