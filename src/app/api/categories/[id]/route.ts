import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { name, colorHex } = await req.json()

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
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const cat = await prisma.category.findUnique({ where: { id } })
  if (!cat || cat.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.category.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
