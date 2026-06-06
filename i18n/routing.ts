import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['es', 'en'],
  defaultLocale: 'es',
  // 'always' → '/' redirects to '/es', '/apartamentos' → '/es/apartamentos'
  localePrefix: 'always',
})

export type Locale = (typeof routing.locales)[number]
