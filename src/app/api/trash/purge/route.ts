import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

// This endpoint can be called by a cron job or admin to purge expired trash items
export async function POST() {
  const user = await getSessionUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const expired = await prisma.trashedItem.findMany({
    where: { expiresAt: { lt: new Date() } },
    select: { noteId: true },
  })

  const noteIds = expired.map((t) => t.noteId)

  if (noteIds.length > 0) {
    await prisma.note.deleteMany({ where: { id: { in: noteIds } } })
  }

  return NextResponse.json({ purged: noteIds.length })
}
