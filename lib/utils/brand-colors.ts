export const LWD_BRAND_CLASSES = {
  backgrounds: {
    primary: 'bg-lwd-brand-500',
    primaryHover: 'bg-lwd-brand-600',
    light: 'bg-lwd-brand-50',
    lightDark: 'dark:bg-lwd-brand-900/20',
    disabled: 'bg-lwd-brand-100',
  },
  
  text: {
    primary: 'text-lwd-brand-500',
    primaryDark: 'text-lwd-brand-600',
    light: 'text-lwd-brand-200',
    dark: 'text-lwd-brand-700',
    darkest: 'text-lwd-brand-900',
    lightDark: 'dark:text-lwd-brand-200',
    darkDark: 'dark:text-lwd-brand-100',
  },
  
  borders: {
    primary: 'border-lwd-brand-500',
    light: 'border-lwd-brand-200',
    dark: 'border-lwd-brand-800',
    darkMode: 'dark:border-lwd-brand-800',
  },
  
  focus: {
    ring: 'focus:ring-lwd-brand-500',
    border: 'focus:border-lwd-brand-500',
    outline: 'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lwd-brand-500',
  },
} as const;

export const BUTTON_CLASSES = {
  primary: `${LWD_BRAND_CLASSES.backgrounds.primary} text-white hover:${LWD_BRAND_CLASSES.backgrounds.primaryHover} ${LWD_BRAND_CLASSES.focus.outline}`,
  secondary: `${LWD_BRAND_CLASSES.borders.primary} ${LWD_BRAND_CLASSES.text.primary} hover:${LWD_BRAND_CLASSES.backgrounds.light}`,
  disabled: `${LWD_BRAND_CLASSES.backgrounds.disabled} ${LWD_BRAND_CLASSES.text.primary} opacity-50 cursor-not-allowed`,
} as const;

export const INPUT_CLASSES = {
  base: `border-gray-300 dark:border-gray-600 ${LWD_BRAND_CLASSES.focus.ring} ${LWD_BRAND_CLASSES.focus.border}`,
  error: `border-red-500 focus:ring-red-500 focus:border-red-500`,
} as const;

export const INFO_BOX_CLASSES = {
  light: `${LWD_BRAND_CLASSES.backgrounds.light} ${LWD_BRAND_CLASSES.backgrounds.lightDark} ${LWD_BRAND_CLASSES.borders.light} ${LWD_BRAND_CLASSES.borders.darkMode} ${LWD_BRAND_CLASSES.text.dark} ${LWD_BRAND_CLASSES.text.lightDark}`,
} as const;

export function toLwdBrand(violetClass: string): string {
  return violetClass.replace(/\b(bg|text|border|ring)-violet-/g, '$1-lwd-brand-');
}

export function usesStandardViolet(className: string): boolean {
  return /\b(bg|text|border|ring)-violet-\d+\b/.test(className);
}

export function validateBrandColors(className: string): void {
  if (process.env.NODE_ENV === 'development' && usesStandardViolet(className)) {
    console.warn(
      `Brand Color Warning: Found standard violet class "${className}". ` +
      `Consider using lwd-brand instead: "${toLwdBrand(className)}"`
    );
  }
}
