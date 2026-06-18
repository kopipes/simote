import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'
import { encrypt, decrypt } from '@/lib/encryption'

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''
  const categoryId = searchParams.get('categoryId') || ''
  const type = searchParams.get('type') || ''
  const status = searchParams.get('status') || ''
  const trashed = searchParams.get('trashed') === 'true'

  const notes = await prisma.note.findMany({
    where: {
      userId: user.id,
      trashedItem: trashed ? { isNot: null } : { is: null },
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
      ...(categoryId
        ? { noteCategories: { some: { categoryId } } }
        : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { fields: { some: { fieldValue: { contains: q }, isSensitive: false } } },
              { noteCategories: { some: { category: { name: { contains: q } } } } },
            ],
          }
        : {}),
    },
    include: {
      fields: { orderBy: { sortOrder: 'asc' } },
      noteCategories: { include: { category: true } },
      trashedItem: true,
    },
    orderBy: { updatedAt: 'desc' },
  })

  // Decrypt sensitive fields for response
  const result = notes.map((note) => ({
    ...note,
    fields: note.fields.map((f) => {
      if (!f.isSensitive) return f
      try {
        return { ...f, fieldValue: decrypt(f.fieldValue) }
      } catch {
        // Value may not be encrypted (legacy data)
        return { ...f, fieldValue: f.fieldValue }
      }
    }),
  }))

  return NextResponse.json({ notes: result })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { type, title, fields = [], categoryIds = [] } = body

  if (!type || !title) {
    return NextResponse.json({ error: 'type dan title wajib diisi' }, { status: 400 })
  }

  const note = await prisma.note.create({
    data: {
      userId: user.id,
      type,
      title,
      fields: {
        create: fields.map(
          (f: { fieldKey: string; fieldValue: string; isSensitive: boolean; sortOrder?: number }) => ({
            fieldKey: f.fieldKey,
            fieldValue: f.isSensitive ? encrypt(f.fieldValue) : f.fieldValue,
            isSensitive: f.isSensitive,
            sortOrder: f.sortOrder ?? 0,
          })
        ),
      },
      noteCategories: {
        create: categoryIds.map((cid: string) => ({ categoryId: cid })),
      },
    },
    include: {
      fields: { orderBy: { sortOrder: 'asc' } },
      noteCategories: { include: { category: true } },
    },
  })

  const result = {
    ...note,
    fields: note.fields.map((f) => ({
      ...f,
      fieldValue: f.isSensitive ? decrypt(f.fieldValue) : f.fieldValue,
    })),
  }

  return NextResponse.json({ note: result }, { status: 201 })
}
