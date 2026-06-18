import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const categories = await prisma.category.findMany({
    where: { userId: user.id },
    include: { _count: { select: { noteCategories: true } } },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ categories })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, colorHex } = await req.json()
  if (!name) return NextResponse.json({ error: 'Nama kategori wajib diisi' }, { status: 400 })

  const category = await prisma.category.create({
    data: { userId: user.id, name, colorHex: colorHex || '#6366f1' },
    include: { _count: { select: { noteCategories: true } } },
  })

  return NextResponse.json({ category }, { status: 201 })
}
