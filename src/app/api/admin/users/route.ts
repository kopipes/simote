import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: { select: { notes: true } },
    },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ users })
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { name, username, email, password, role } = await req.json()
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'name, email, password wajib diisi' }, { status: 400 })
    }

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Format email tidak valid' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password minimal 8 karakter' }, { status: 400 })
    }

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
    const newUser = await prisma.user.create({
      data: { name, username: username || null, email, passwordHash, role: role === 'admin' ? 'admin' : 'user' },
      select: { id: true, name: true, username: true, email: true, role: true, isActive: true, createdAt: true },
    })

    return NextResponse.json({ user: newUser }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
