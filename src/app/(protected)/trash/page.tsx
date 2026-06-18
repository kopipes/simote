'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2, RotateCcw, CheckSquare, Square, MinusSquare } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { api, Note } from '@/lib/api'
import { NoteCard } from '@/components/NoteCard'
import { ConfirmDialog } from '@/components/ConfirmDialog'

export default function TrashPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)

  // Selection state
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [selectMode, setSelectMode] = useState(false)

  // Confirm dialogs
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmNote, setConfirmNote] = useState<Note | null>(null)
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading, router])

  const fetchTrashed = useCallback(async () => {
    setLoading(true)
    try {
      const { notes } = await api.getNotes({ trashed: 'true' })
      setNotes(notes)
    } catch {} finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) fetchTrashed()
  }, [user, fetchTrashed])

  // Exit select mode when no notes
  useEffect(() => {
    if (notes.length === 0) {
      setSelectMode(false)
      setSelected(new Set())
    }
  }, [notes.length])

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selected.size === notes.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(notes.map((n) => n.id)))
    }
  }

  async function handleRestore(note: Note) {
    await api.restoreNote(note.id)
    setNotes((prev) => prev.filter((n) => n.id !== note.id))
    setSelected((prev) => { const next = new Set(prev); next.delete(note.id); return next })
  }

  function handleDelete(note: Note) {
    setConfirmNote(note)
    setConfirmOpen(true)
  }

  async function confirmDelete() {
    if (!confirmNote) return
    await api.deleteNote(confirmNote.id)
    setNotes((prev) => prev.filter((n) => n.id !== confirmNote.id))
    setSelected((prev) => { const next = new Set(prev); next.delete(confirmNote.id); return next })
    setConfirmOpen(false)
    setConfirmNote(null)
  }

  async function handleBulkDelete() {
    setBulkDeleting(true)
    try {
      await Promise.all(Array.from(selected).map((id) => api.deleteNote(id)))
      setNotes((prev) => prev.filter((n) => !selected.has(n.id)))
      setSelected(new Set())
      setSelectMode(false)
    } finally {
      setBulkDeleting(false)
      setConfirmBulkOpen(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  const allSelected = notes.length > 0 && selected.size === notes.length
  const someSelected = selected.size > 0 && !allSelected

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors" aria-label="Kembali">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-gray-500" />
            <h1 className="font-semibold text-gray-900">Trash</h1>
            {notes.length > 0 && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{notes.length}</span>
            )}
          </div>
          <span className="text-sm text-gray-400 hidden sm:inline">· Otomatis dihapus setelah 30 hari</span>

          {notes.length > 0 && (
            <div className="ml-auto flex items-center gap-2">
              {selectMode ? (
                <>
                  {/* Select all toggle */}
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    {allSelected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-500" />
                    ) : someSelected ? (
                      <MinusSquare className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">
                      {allSelected ? 'Batal Pilih Semua' : 'Pilih Semua'}
                    </span>
                  </button>

                  {selected.size > 0 && (
                    <button
                      type="button"
                      onClick={() => setConfirmBulkOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Hapus ({selected.size})
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => { setSelectMode(false); setSelected(new Set()) }}
                    className="px-3 py-1.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    Batal
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectMode(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors"
                >
                  <CheckSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">Pilih</span>
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <Trash2 className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 text-sm">Trash kosong</p>
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            {notes.map((note) => (
              <div key={note.id} className="relative">
                {selectMode && (
                  <button
                    type="button"
                    onClick={() => toggleSelect(note.id)}
                    className="absolute top-3 left-3 z-10 p-0.5 rounded-lg bg-white shadow-sm border border-gray-200"
                    aria-label={selected.has(note.id) ? 'Batalkan pilihan' : 'Pilih'}
                  >
                    {selected.has(note.id) ? (
                      <CheckSquare className="w-5 h-5 text-indigo-500" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                )}
                <div
                  className={`transition-all ${
                    selectMode && selected.has(note.id)
                      ? 'ring-2 ring-indigo-400 rounded-2xl'
                      : ''
                  }`}
                  onClick={selectMode ? () => toggleSelect(note.id) : undefined}
                >
                  <NoteCard
                    note={note}
                    isTrashed
                    onRestore={selectMode ? undefined : handleRestore}
                    onDelete={selectMode ? undefined : handleDelete}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Single delete confirm */}
      <ConfirmDialog
        open={confirmOpen}
        title="Hapus Permanen?"
        message={`"${confirmNote?.title}" akan dihapus selamanya dan tidak bisa dipulihkan.`}
        confirmLabel="Hapus Permanen"
        danger
        onConfirm={confirmDelete}
        onCancel={() => { setConfirmOpen(false); setConfirmNote(null) }}
      />

      {/* Bulk delete confirm */}
      <ConfirmDialog
        open={confirmBulkOpen}
        title="Hapus Semua yang Dipilih?"
        message={`${selected.size} item akan dihapus permanen dan tidak bisa dipulihkan.`}
        confirmLabel={bulkDeleting ? 'Menghapus...' : `Hapus ${selected.size} Item`}
        danger
        onConfirm={handleBulkDelete}
        onCancel={() => setConfirmBulkOpen(false)}
      />
    </div>
  )
}
