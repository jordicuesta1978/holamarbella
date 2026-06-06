import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

// Locale-aware navigation helpers — use these instead of next/link & next/navigation
// in localized (public) pages so links keep the active locale prefix.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)
