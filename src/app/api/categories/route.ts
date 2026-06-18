import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const categories = await prisma.category.findMany({
      where: { userId: user.id },
      include: { _count: { select: { noteCategories: true } } },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ categories })
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name, colorHex } = await req.json()
    if (!name) return NextResponse.json({ error: 'Nama kategori wajib diisi' }, { status: 400 })

    const color = colorHex || '#6366f1'
    if (!HEX_COLOR_RE.test(color)) {
      return NextResponse.json({ error: 'Format warna tidak valid' }, { status: 400 })
    }

    const category = await prisma.category.create({
      data: { userId: user.id, name, colorHex: color },
      include: { _count: { select: { noteCategories: true } } },
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
