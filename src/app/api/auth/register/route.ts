import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const { name, username, email, password } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password minimal 8 karakter' }, { status: 400 })
    }

    // Validate username format if provided
    if (username) {
      if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
        return NextResponse.json({ error: 'Username hanya boleh huruf, angka, underscore, 3-30 karakter' }, { status: 400 })
      }
      const existingUsername = await prisma.user.findUnique({ where: { username } })
      if (existingUsername) {
        return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 409 })
      }
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { name, email, username: username || null, passwordHash, role: 'user' },
      select: { id: true, name: true, email: true, role: true },
    })

    const token = signToken({ userId: user.id, role: user.role, email: user.email })
    const cookieStore = await cookies()
    cookieStore.set('simote_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
