import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const currentUser = await getSessionUser()
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { name, username, email, password, role, isActive } = body

    const target = await prisma.user.findUnique({ where: { id } })
    if (!target) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })

    // Prevent admin from demoting or deactivating themselves
    if (id === currentUser.id) {
      if (role !== undefined && role !== 'admin') {
        return NextResponse.json({ error: 'Tidak bisa mengubah role akun sendiri' }, { status: 400 })
      }
      if (isActive !== undefined && isActive === false) {
        return NextResponse.json({ error: 'Tidak bisa menonaktifkan akun sendiri' }, { status: 400 })
      }
    }

    // Check email uniqueness if changing
    if (email !== undefined && email !== target.email) {
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) return NextResponse.json({ error: 'Email sudah digunakan' }, { status: 409 })
    }

    // Check username uniqueness if changing
    if (username !== undefined && username !== target.username) {
      if (username && !/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
        return NextResponse.json({ error: 'Username hanya boleh huruf, angka, underscore, 3-30 karakter' }, { status: 400 })
      }
      if (username) {
        const existingUsername = await prisma.user.findUnique({ where: { username } })
        if (existingUsername) return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 409 })
      }
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (username !== undefined) updateData.username = username || null
    if (email !== undefined) updateData.email = email
    if (role !== undefined) updateData.role = role === 'admin' ? 'admin' : 'user'
    if (isActive !== undefined) updateData.isActive = isActive
    if (password !== undefined) {
      if (password.length < 8) {
        return NextResponse.json({ error: 'Password minimal 8 karakter' }, { status: 400 })
      }
      updateData.passwordHash = await bcrypt.hash(password, 12)
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, username: true, email: true, role: true, isActive: true, createdAt: true },
    })

    return NextResponse.json({ user: updated })
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const currentUser = await getSessionUser()
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    if (id === currentUser.id) {
      return NextResponse.json({ error: 'Tidak bisa menghapus akun sendiri' }, { status: 400 })
    }

    const target = await prisma.user.findUnique({ where: { id } })
    if (!target) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })

    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
