'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Plus, Search, LogOut, Trash2, Settings, ChevronDown,
  KeyRound, FolderOpen, X, Menu, Shield
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { api, Note, Category, CreateNoteInput } from '@/lib/api'
import { NoteCard } from '@/components/NoteCard'
import { NoteModal } from '@/components/NoteModal'
import { CategoryModal } from '@/components/CategoryModal'
import { ConfirmDialog } from '@/components/ConfirmDialog'

export default function DashboardPage() {
  const { user, logout, loading: authLoading } = useAuth()
  const router = useRouter()

  const [notes, setNotes] = useState<Note[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [query, setQuery] = useState('')
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const [activeType, setActiveType] = useState<string>('')
  const [activeStatus, setActiveStatus] = useState<string>('')
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Modals
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [catModalOpen, setCatModalOpen] = useState(false)
  const [editingCat, setEditingCat] = useState<Category | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmNote, setConfirmNote] = useState<Note | null>(null)

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading, router])

  const fetchCategories = useCallback(async () => {
    try {
      const { categories } = await api.getCategories()
      setCategories(categories)
    } catch {}
  }, [])

  const fetchNotes = useCallback(async (q: string, categoryId: string | null, type: string, status: string) => {
    setLoadingNotes(true)
    try {
      const params: Record<string, string> = {}
      if (q) params.q = q
      if (categoryId) params.categoryId = categoryId
      if (type) params.type = type
      if (status) params.status = status
      const { notes } = await api.getNotes(params)
      setNotes(notes)
    } catch (e) {
      console.error('fetchNotes error:', e)
      setNotes([])
    } finally {
      setLoadingNotes(false)
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchCategories()
      fetchNotes('', null, '', '')
    }
  }, [user, fetchCategories, fetchNotes])

  // Debounced search
  function handleSearch(val: string) {
    setQuery(val)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      fetchNotes(val, activeCategoryId, activeType, activeStatus)
    }, 250)
  }

  function applyFilter(categoryId: string | null, type: string, status: string) {
    setActiveCategoryId(categoryId)
    setActiveType(type)
    setActiveStatus(status)
    fetchNotes(query, categoryId, type, status)
    setSidebarOpen(false)
  }

  async function handleSaveNote(data: CreateNoteInput, id?: string) {
    if (id) {
      const { note } = await api.updateNote(id, data)
      setNotes((prev) => prev.map((n) => (n.id === id ? note : n)))
    } else {
      const { note } = await api.createNote(data)
      setNotes((prev) => [note, ...prev])
    }
    fetchCategories()
  }

  async function handleDeleteNote(note: Note) {
    setConfirmNote(note)
    setConfirmOpen(true)
  }

  async function confirmDelete() {
    if (!confirmNote) return
    await api.deleteNote(confirmNote.id)
    setNotes((prev) => prev.filter((n) => n.id !== confirmNote.id))
    setConfirmOpen(false)
    setConfirmNote(null)
  }

  async function handleToggleStatus(note: Note) {
    const newStatus = note.status === 'active' ? 'invalid' : 'active'
    const { note: updated } = await api.updateNote(note.id, { status: newStatus })
    setNotes((prev) => prev.map((n) => (n.id === note.id ? updated : n)))
  }

  async function handleSaveCategory(name: string, colorHex: string, id?: string) {
    if (id) {
      const { category } = await api.updateCategory(id, { name, colorHex })
      setCategories((prev) => prev.map((c) => (c.id === id ? category : c)))
    } else {
      const { category } = await api.createCategory(name, colorHex)
      setCategories((prev) => [...prev, category])
    }
  }

  async function handleDeleteCategory(id: string) {
    await api.deleteCategory(id)
    setCategories((prev) => prev.filter((c) => c.id !== id))
    if (activeCategoryId === id) applyFilter(null, activeType, activeStatus)
  }

  async function handleLogout() {
    await logout()
    router.push('/login')
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  const activeCategory = categories.find((c) => c.id === activeCategoryId)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 flex flex-col
        transition-transform duration-200 ease-in-out
        ${ sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0' }
      `}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-500 rounded-xl flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">Simote</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {/* All notes */}
          <button
            type="button"
            onClick={() => applyFilter(null, '', '')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors ${
              !activeCategoryId && !activeType
                ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FolderOpen className="w-4 h-4 shrink-0" />
            <span>Semua Catatan</span>
            <span className="ml-auto text-xs text-gray-400">{notes.length}</span>
          </button>

          {/* Type filters */}
          <div className="pt-2">
            <p className="px-3 text-xs font-medium text-gray-400 mb-1">Tipe</p>
            {[{ type: 'login', label: 'Login & Password' }, { type: 'ssh', label: 'SSH' }, { type: 'note', label: 'Catatan' }].map((t) => (
              <button
                key={t.type}
                type="button"
                onClick={() => applyFilter(null, t.type, activeStatus)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors ${
                  activeType === t.type ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Categories */}
          <div className="pt-2">
            <div className="flex items-center justify-between px-3 mb-1">
              <p className="text-xs font-medium text-gray-400">Kategori</p>
              <button
                type="button"
                onClick={() => { setEditingCat(null); setCatModalOpen(true) }}
                className="text-gray-400 hover:text-indigo-500 transition-colors"
                aria-label="Tambah kategori"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {categories.map((cat) => (
              <div key={cat.id} className="group flex items-center">
                <button
                  type="button"
                  onClick={() => applyFilter(cat.id, '', activeStatus)}
                  className={`flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors ${
                    activeCategoryId === cat.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.colorHex }}
                  />
                  <span className="truncate">{cat.name}</span>
                  <span className="ml-auto text-xs text-gray-400">{cat._count?.noteCategories ?? 0}</span>
                </button>
                <div className="hidden group-hover:flex gap-0.5 pr-2">
                  <button
                    type="button"
                    onClick={() => { setEditingCat(cat); setCatModalOpen(true) }}
                    className="p-1 rounded text-gray-400 hover:text-gray-600"
                    aria-label="Edit"
                  >
                    <Settings className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-1 rounded text-gray-400 hover:text-red-500"
                    aria-label="Hapus"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-gray-100 space-y-1">
          <Link
            href="/trash"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Trash
          </Link>
          {user.role === 'admin' && (
            <Link
              href="/admin"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Shield className="w-4 h-4" />
              Admin Panel
            </Link>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          {/* Mobile menu */}
          <button
            type="button"
            className="lg:hidden p-2 rounded-xl text-gray-400 hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
            aria-label="Buka menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Cari catatan, SSH, login..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Add note */}
          <button
            type="button"
            onClick={() => { setEditingNote(null); setNoteModalOpen(true) }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-xl transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Catatan Baru</span>
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Active filter indicator */}
          {(activeCategory || activeType || activeStatus) && (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {activeCategory && (
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: activeCategory.colorHex + '22', color: activeCategory.colorHex }}
                >
                  {activeCategory.name}
                  <button onClick={() => applyFilter(null, activeType, activeStatus)} aria-label="Hapus filter">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {activeType && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                  {activeType}
                  <button onClick={() => applyFilter(activeCategoryId, '', activeStatus)} aria-label="Hapus filter">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Notes grid */}
          {loadingNotes ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <KeyRound className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">
                {query ? `Tidak ada hasil untuk "${query}"` : 'Belum ada catatan. Tambah yang pertama!'}
              </p>
              {!query && (
                <button
                  type="button"
                  onClick={() => { setEditingNote(null); setNoteModalOpen(true) }}
                  className="mt-4 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  + Catatan Baru
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
              {notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={(n) => { setEditingNote(n); setNoteModalOpen(true) }}
                  onDelete={handleDeleteNote}
                  onToggleStatus={handleToggleStatus}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <NoteModal
        open={noteModalOpen}
        note={editingNote}
        categories={categories}
        onClose={() => setNoteModalOpen(false)}
        onSave={handleSaveNote}
      />
      <CategoryModal
        open={catModalOpen}
        category={editingCat}
        onClose={() => setCatModalOpen(false)}
        onSave={handleSaveCategory}
      />
      <ConfirmDialog
        open={confirmOpen}
        title="Pindah ke Trash?"
        message={`"${confirmNote?.title}" akan dipindah ke trash dan otomatis dihapus setelah 30 hari.`}
        confirmLabel="Pindah ke Trash"
        danger
        onConfirm={confirmDelete}
        onCancel={() => { setConfirmOpen(false); setConfirmNote(null) }}
      />
    </div>
  )
}
