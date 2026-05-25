import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const key = new TextEncoder().encode(process.env.SESSION_SECRET!)

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

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname

  if (!path.startsWith('/admin')) return NextResponse.next()
  if (path === '/admin/login') return NextResponse.next()

  if (!(await isAuthenticated(req))) {
    return NextResponse.redirect(new URL('/admin/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
