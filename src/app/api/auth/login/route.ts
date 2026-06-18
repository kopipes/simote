import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/auth'
import { cookies } from 'next/headers'

// Simple in-memory rate limiter (resets on server restart)
const loginAttempts = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = loginAttempts.get(ip)
  if (entry) {
    if (now < entry.resetAt) {
      if (entry.count >= 5) return false
      entry.count++
    } else {
      loginAttempts.set(ip, { count: 1, resetAt: now + 60_000 })
    }
  } else {
    loginAttempts.set(ip, { count: 1, resetAt: now + 60_000 })
  }
  return true
}

function resetRateLimit(ip: string) {
  loginAttempts.delete(ip)
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Terlalu banyak percobaan login. Coba lagi dalam 1 menit.' },
        { status: 429 }
      )
    }

    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email/username dan password wajib diisi' }, { status: 400 })
    }

    // Support login by email OR username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { username: email }, // reuse 'email' field as the identifier input
        ],
      },
    })
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Email/username atau password salah' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 })
    }

    resetRateLimit(ip)

    const token = signToken({ userId: user.id, role: user.role, email: user.email })
    const cookieStore = await cookies()
    cookieStore.set('simote_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    })
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
