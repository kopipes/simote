'use client'

import { useState, useEffect, FormEvent } from 'react'
import { X } from 'lucide-react'
import { Category } from '@/lib/api'
import { CATEGORY_COLORS } from '@/lib/constants'

interface CategoryModalProps {
  open: boolean
  category?: Category | null
  onClose: () => void
  onSave: (name: string, colorHex: string, id?: string) => Promise<void>
}

export function CategoryModal({ open, category, onClose, onSave }: CategoryModalProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(CATEGORY_COLORS[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    if (category) {
      setName(category.name)
      setColor(category.colorHex)
    } else {
      setName('')
      setColor(CATEGORY_COLORS[0])
    }
    setError('')
  }, [open, category])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Nama kategori wajib diisi'); return }
    setLoading(true)
    try {
      await onSave(name.trim(), color, category?.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-sm bg-white rounded-2xl shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {category ? 'Edit Kategori' : 'Kategori Baru'}
          </h2>
          <button type="button" onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100" aria-label="Tutup">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Nama Kategori</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Nama kategori"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Warna</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
          {/* Preview */}
          <div className="flex items-center gap-2">
            <span
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: color + '22', color }}
            >
              {name || 'Preview'}
            </span>
          </div>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
          )}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white text-sm font-medium"
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
