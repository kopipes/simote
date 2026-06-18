import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'
import { encrypt, decrypt } from '@/lib/encryption'

type Params = { params: Promise<{ id: string }> }

async function getNoteForUser(noteId: string, userId: string, role: string) {
  const note = await prisma.note.findUnique({
    where: { id: noteId },
    include: {
      fields: { orderBy: { sortOrder: 'asc' } },
      noteCategories: { include: { category: true } },
      trashedItem: true,
    },
  })
  if (!note) return null
  if (role !== 'admin' && note.userId !== userId) return null
  return note
}

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const note = await getNoteForUser(id, user.id, user.role)
  if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const result = {
    ...note,
    fields: note.fields.map((f) => {
      if (!f.isSensitive) return f
      try {
        return { ...f, fieldValue: decrypt(f.fieldValue) }
      } catch {
        return { ...f, fieldValue: f.fieldValue }
      }
    }),
  }
  return NextResponse.json({ note: result })
}

export async function PUT(req: NextRequest, { params }: Params) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const note = await getNoteForUser(id, user.id, user.role)
  if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { title, status, fields, categoryIds } = body

  // Update note + replace fields + replace categories in a transaction
  const updated = await prisma.$transaction(async (tx) => {
    if (fields !== undefined) {
      await tx.noteField.deleteMany({ where: { noteId: id } })
      await tx.noteField.createMany({
        data: fields.map(
          (f: { fieldKey: string; fieldValue: string; isSensitive: boolean; sortOrder?: number }) => ({
            noteId: id,
            fieldKey: f.fieldKey,
            fieldValue: f.isSensitive ? encrypt(f.fieldValue) : f.fieldValue,
            isSensitive: f.isSensitive,
            sortOrder: f.sortOrder ?? 0,
          })
        ),
      })
    }

    if (categoryIds !== undefined) {
      await tx.noteCategory.deleteMany({ where: { noteId: id } })
      await tx.noteCategory.createMany({
        data: categoryIds.map((cid: string) => ({ noteId: id, categoryId: cid })),
      })
    }

    return tx.note.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(status !== undefined ? { status } : {}),
      },
      include: {
        fields: { orderBy: { sortOrder: 'asc' } },
        noteCategories: { include: { category: true } },
        trashedItem: true,
      },
    })
  })

  const result = {
    ...updated,
    fields: updated.fields.map((f) => {
      if (!f.isSensitive) return f
      try {
        return { ...f, fieldValue: decrypt(f.fieldValue) }
      } catch {
        return { ...f, fieldValue: f.fieldValue }
      }
    }),
  }
  return NextResponse.json({ note: result })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const note = await getNoteForUser(id, user.id, user.role)
  if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Move to trash instead of permanent delete
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  // If already in trash, delete permanently
  if (note.trashedItem) {
    await prisma.note.delete({ where: { id } })
    return NextResponse.json({ ok: true, permanent: true })
  }

  await prisma.trashedItem.create({
    data: {
      noteId: id,
      deletedById: user.id,
      expiresAt,
    },
  })

  return NextResponse.json({ ok: true, permanent: false })
}
