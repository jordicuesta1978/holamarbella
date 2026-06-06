'use client'

import { useEffect } from 'react'

// Root <html lang="es"> is fixed (shared with the admin panel, which can't be
// re-opened from a nested layout). On localized pages we correct the lang
// attribute client-side so /en reports lang="en" for accessibility & SEO.
export default function SetHtmlLang({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])
  return null
}
