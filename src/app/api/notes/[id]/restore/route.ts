import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    const trashed = await prisma.trashedItem.findUnique({
      where: { noteId: id },
      include: { note: true },
    })

    if (!trashed) return NextResponse.json({ error: 'Item tidak ada di trash' }, { status: 404 })
    if (user.role !== 'admin' && trashed.note.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (new Date() > trashed.expiresAt) {
      return NextResponse.json({ error: 'Item sudah expired dan tidak bisa di-restore' }, { status: 410 })
    }

    await prisma.trashedItem.delete({ where: { noteId: id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
