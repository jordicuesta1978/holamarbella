import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'

const key = new TextEncoder().encode(process.env.SESSION_SECRET!)
const intlMiddleware = createMiddleware(routing)

async function isAuthenticated(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('admin_session')?.value
  if (!token) return false
  try {
    await jwtVerify(token, key, { algorithms: ['HS256'] })
    return true
  } catch {
    return false
  }
}

// Single proxy (Next.js 16 renamed `middleware` → `proxy`). Merges two concerns:
//  1) /admin  → JWT auth gate, NO locale routing (panel stays Spanish-only)
//  2) public  → next-intl locale routing (/ → /es, /en/…)
// /api and /conversacion are passed through untouched.
export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname

  // 1) Admin — auth only, never localized
  if (path.startsWith('/admin')) {
    if (path === '/admin/login') return NextResponse.next()
    if (!(await isAuthenticated(req))) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
    return NextResponse.next()
  }

  // 2) Non-localized public routes — pass through
  if (path.startsWith('/api') || path.startsWith('/conversacion')) {
    return NextResponse.next()
  }

  // 3) Localized public routes — delegate to next-intl
  return intlMiddleware(req)
}

export const config = {
  matcher: [
    // Admin auth gate
    '/admin/:path*',
    // Everything else except api, conversacion, Next internals and files with an extension
    '/((?!api|conversacion|_next|_vercel|.*\\..*).*)',
  ],
}
