'use client'

import { useEffect } from 'react'
import { useBranding } from '@/lib/contexts/BrandingContext'

const GOOGLE_FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
  'Source Sans Pro', 'Nunito', 'Playfair Display', 'Merriweather',
  'Libre Baskerville', 'Fira Code', 'JetBrains Mono'
]

export default function BrandingHead() {
  const { brandSettings } = useBranding()

  useEffect(() => {
    if (!brandSettings) return

    const fontsToLoad = new Set<string>()
    if (brandSettings.fonts.primary && GOOGLE_FONTS.includes(brandSettings.fonts.primary)) {
      fontsToLoad.add(brandSettings.fonts.primary)
    }
    if (brandSettings.fonts.headings && GOOGLE_FONTS.includes(brandSettings.fonts.headings)) {
      fontsToLoad.add(brandSettings.fonts.headings)
    }
    if (brandSettings.fonts.mono && GOOGLE_FONTS.includes(brandSettings.fonts.mono)) {
      fontsToLoad.add(brandSettings.fonts.mono)
    }

    fontsToLoad.forEach(fontName => {
      const existingLink = document.querySelector(`link[href*="${fontName.replace(/ /g, '+')}"]`)
      if (!existingLink) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@300;400;500;600;700&display=swap`
        document.head.appendChild(link)
      }
    })

    const root = document.documentElement
    if (brandSettings.fonts.primary) {
      root.style.setProperty('--font-inter', `"${brandSettings.fonts.primary}", sans-serif`)
      root.style.setProperty('--font-primary', `"${brandSettings.fonts.primary}", sans-serif`)
    }
    if (brandSettings.fonts.headings) {
      root.style.setProperty('--font-headings', `"${brandSettings.fonts.headings}", sans-serif`)
    }
    if (brandSettings.fonts.mono) {
      root.style.setProperty('--font-mono', `"${brandSettings.fonts.mono}", monospace`)
    }
  }, [brandSettings?.fonts])

  useEffect(() => {
    if (!brandSettings?.favicon?.url) return

    let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement
    if (!favicon) {
      favicon = document.createElement('link')
      favicon.rel = 'icon'
      document.head.appendChild(favicon)
    }
    favicon.href = brandSettings.favicon.url

    let appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement
    if (!appleTouchIcon) {
      appleTouchIcon = document.createElement('link')
      appleTouchIcon.rel = 'apple-touch-icon'
      document.head.appendChild(appleTouchIcon)
    }
    appleTouchIcon.href = brandSettings.favicon.url
  }, [brandSettings?.favicon?.url])

  useEffect(() => {
    if (!brandSettings?.company?.name) return

    document.title = document.title.replace(/^[^-|]+/, brandSettings.company.name + ' ')
  }, [brandSettings?.company?.name])

  return null
}
