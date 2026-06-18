import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'
import { encrypt, decrypt } from '@/lib/encryption'

const VALID_TYPES = ['note', 'ssh', 'login', 'api'] as const
const VALID_STATUSES = ['active', 'invalid'] as const

function decryptFields(fields: { isSensitive: boolean; fieldValue: string; [key: string]: unknown }[]) {
  return fields.map((f) => {
    if (!f.isSensitive) return f
    try {
      return { ...f, fieldValue: decrypt(f.fieldValue) }
    } catch {
      return { ...f, fieldValue: f.fieldValue }
    }
  })
}

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') || ''
    const categoryId = searchParams.get('categoryId') || ''
    const typeParam = searchParams.get('type') || ''
    const statusParam = searchParams.get('status') || ''
    const trashed = searchParams.get('trashed') === 'true'

    // Validate enum params
    const type = VALID_TYPES.includes(typeParam as typeof VALID_TYPES[number]) ? typeParam : ''
    const status = VALID_STATUSES.includes(statusParam as typeof VALID_STATUSES[number]) ? statusParam : ''

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

    const result = notes.map((note) => ({
      ...note,
      fields: decryptFields(note.fields),
    }))

    return NextResponse.json({ notes: result })
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { type, title, fields = [], categoryIds = [] } = body

    if (!type || !title) {
      return NextResponse.json({ error: 'type dan title wajib diisi' }, { status: 400 })
    }

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Tipe tidak valid' }, { status: 400 })
    }

    // Validate categoryIds belong to current user
    if (categoryIds.length > 0) {
      const ownedCats = await prisma.category.findMany({
        where: { id: { in: categoryIds }, userId: user.id },
        select: { id: true },
      })
      const ownedIds = new Set(ownedCats.map((c) => c.id))
      const invalid = categoryIds.filter((id: string) => !ownedIds.has(id))
      if (invalid.length > 0) {
        return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 400 })
      }
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

    // Return decrypted values to the client
    const result = {
      ...note,
      fields: decryptFields(note.fields),
    }

    return NextResponse.json({ note: result }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
