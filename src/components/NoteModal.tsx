'use client'

import { useState, useEffect, FormEvent } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { Note, Category, CreateNoteInput } from '@/lib/api'

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#06b6d4', '#64748b', '#78716c',
]

interface NoteModalProps {
  open: boolean
  note?: Note | null
  categories: Category[]
  onClose: () => void
  onSave: (data: CreateNoteInput, id?: string) => Promise<void>
}

type NoteType = 'note' | 'ssh' | 'login' | 'api'

const DEFAULT_FIELDS: Record<NoteType, { fieldKey: string; label: string; isSensitive: boolean; placeholder?: string; multiline?: boolean }[]> = {
  note: [
    { fieldKey: 'content', label: 'Isi Catatan', isSensitive: false, multiline: true, placeholder: 'Tulis catatan di sini...' },
  ],
  login: [
    { fieldKey: 'username', label: 'Username / Email', isSensitive: false, placeholder: 'username atau email' },
    { fieldKey: 'password', label: 'Password', isSensitive: true, placeholder: 'Password' },
    { fieldKey: 'url', label: 'URL (opsional)', isSensitive: false, placeholder: 'https://...' },
    { fieldKey: 'notes', label: 'Catatan (opsional)', isSensitive: false, placeholder: 'OTP backup code, dll' },
  ],
  ssh: [
    { fieldKey: 'host', label: 'Host / IP', isSensitive: false, placeholder: '192.168.1.1 atau example.com' },
    { fieldKey: 'port', label: 'Port', isSensitive: false, placeholder: '22' },
    { fieldKey: 'username', label: 'Username', isSensitive: false, placeholder: 'root' },
    { fieldKey: 'password', label: 'Password', isSensitive: true, placeholder: 'Password (jika pakai password)' },
    { fieldKey: 'privateKey', label: 'Private Key', isSensitive: true, multiline: true, placeholder: '-----BEGIN RSA PRIVATE KEY-----\n...' },
    { fieldKey: 'privateKeyUrl', label: 'URL / Path Key File (opsional)', isSensitive: false, placeholder: '/home/user/.ssh/id_rsa atau https://...' },
    { fieldKey: 'passphrase', label: 'Passphrase', isSensitive: true, placeholder: 'Passphrase (jika ada)' },
    { fieldKey: 'notes', label: 'Catatan (opsional)', isSensitive: false, placeholder: 'Catatan tambahan' },
  ],
  api: [
    { fieldKey: 'baseUrl', label: 'Base URL', isSensitive: false, placeholder: 'https://api.example.com/v1' },
    { fieldKey: 'apiKey', label: 'API Key', isSensitive: true, placeholder: 'sk-...' },
    { fieldKey: 'model', label: 'Model (opsional)', isSensitive: false, placeholder: 'gpt-4o, claude-3-5-sonnet, dll' },
    { fieldKey: 'notes', label: 'Catatan (opsional)', isSensitive: false, placeholder: 'Rate limit, dokumentasi, dll' },
  ],
}

export function NoteModal({ open, note, categories, onClose, onSave }: NoteModalProps) {
  const [type, setType] = useState<NoteType>('login')
  const [title, setTitle] = useState('')
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isEdit = !!note

  useEffect(() => {
    if (!open) return
    if (note) {
      setType(note.type as NoteType)
      setTitle(note.title)
      const vals: Record<string, string> = {}
      note.fields.forEach((f) => { vals[f.fieldKey] = f.fieldValue })
      setFieldValues(vals)
      setSelectedCategories(note.noteCategories.map((nc) => nc.categoryId))
    } else {
      setType('login')
      setTitle('')
      setFieldValues({})
      setSelectedCategories([])
    }
    setError('')
  }, [open, note])

  function toggleCategory(id: string) {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!title.trim()) { setError('Judul wajib diisi'); return }

    const fieldDefs = DEFAULT_FIELDS[type]
    const fields = fieldDefs
      .filter((f) => fieldValues[f.fieldKey]?.trim())
      .map((f, i) => ({
        fieldKey: f.fieldKey,
        fieldValue: fieldValues[f.fieldKey]?.trim() || '',
        isSensitive: f.isSensitive,
        sortOrder: i,
      }))

    setLoading(true)
    try {
      await onSave(
        { type, title: title.trim(), fields, categoryIds: selectedCategories },
        note?.id
      )
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  const fieldDefs = DEFAULT_FIELDS[type]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg bg-white sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {isEdit ? 'Edit Catatan' : 'Catatan Baru'}
          </h2>
          <button type="button" onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors" aria-label="Tutup">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Type selector (only for new notes) */}
            {!isEdit && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Tipe</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['login', 'ssh', 'api', 'note'] as NoteType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`py-2 rounded-xl text-sm font-medium border transition-all ${
                        type === t
                          ? 'bg-indigo-500 text-white border-indigo-500'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      {t === 'login' ? 'Login' : t === 'ssh' ? 'SSH' : t === 'api' ? 'API' : 'Catatan'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Judul / Label</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder={type === 'ssh' ? 'Server Production' : type === 'login' ? 'Akun cPanel' : type === 'api' ? 'OpenAI, Anthropic, Cloudflare AI...' : 'Judul catatan'}
              />
            </div>

            {/* Fields */}
            {fieldDefs.map((field) => (
              <div key={field.fieldKey}>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">{field.label}</label>
                {field.multiline ? (
                  <textarea
                    value={fieldValues[field.fieldKey] || ''}
                    onChange={(e) => setFieldValues((v) => ({ ...v, [field.fieldKey]: e.target.value }))}
                    rows={field.fieldKey === 'privateKey' ? 8 : field.fieldKey === 'content' ? 10 : 3}
                    className={`w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y ${field.isSensitive || field.fieldKey === 'privateKey' ? 'font-mono' : ''}`}
                    placeholder={field.placeholder}
                  />
                ) : (
                  <input
                    type={field.isSensitive ? 'text' : 'text'}
                    value={fieldValues[field.fieldKey] || ''}
                    onChange={(e) => setFieldValues((v) => ({ ...v, [field.fieldKey]: e.target.value }))}
                    className={`w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      field.isSensitive ? 'font-mono' : ''
                    }`}
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}

            {/* Categories */}
            {categories.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Kategori</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all`}
                      style={
                        selectedCategories.includes(cat.id)
                          ? { backgroundColor: cat.colorHex, color: '#fff', borderColor: cat.colorHex }
                          : { backgroundColor: cat.colorHex + '22', color: cat.colorHex, borderColor: cat.colorHex + '44' }
                      }
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white text-sm font-medium transition-colors"
            >
              {loading ? 'Menyimpan...' : isEdit ? 'Simpan' : 'Tambah'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
