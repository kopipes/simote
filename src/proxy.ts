import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const PUBLIC_PATHS = ['/login', '/register', '/api/auth/login', '/api/auth/register']

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname === '/'
  ) {
    return NextResponse.next()
  }

  const token = req.cookies.get('simote_token')?.value

  if (!token || !verifyToken(token)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
