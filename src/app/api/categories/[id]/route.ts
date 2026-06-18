import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const { name, colorHex } = await req.json()

    if (colorHex !== undefined && !HEX_COLOR_RE.test(colorHex)) {
      return NextResponse.json({ error: 'Format warna tidak valid' }, { status: 400 })
    }

    const cat = await prisma.category.findUnique({ where: { id } })
    if (!cat || cat.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(colorHex !== undefined ? { colorHex } : {}),
      },
      include: { _count: { select: { noteCategories: true } } },
    })

    return NextResponse.json({ category: updated })
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const cat = await prisma.category.findUnique({ where: { id } })
    if (!cat || cat.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.category.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
