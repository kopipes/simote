import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

export async function GET() {
  const user = await getSessionUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: { select: { notes: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ users })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { name, email, password, role } = await req.json()
  if (!name || !email || !password) {
    return NextResponse.json({ error: 'name, email, password wajib diisi' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const newUser = await prisma.user.create({
    data: { name, email, passwordHash, role: role === 'admin' ? 'admin' : 'user' },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  })

  return NextResponse.json({ user: newUser }, { status: 201 })
}
