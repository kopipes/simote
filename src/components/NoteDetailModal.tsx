'use client'

import { useState } from 'react'
import { X, Terminal, KeyRound, FileText, MoreVertical, Trash2, RotateCcw, Pencil, Zap } from 'lucide-react'
import { Note } from '@/lib/api'
import { SensitiveField, PlainField } from './SensitiveField'
import { CopyButton } from './CopyButton'

interface NoteDetailModalProps {
  note: Note | null
  onClose: () => void
  onEdit?: (note: Note) => void
  onDelete?: (note: Note) => void
  onToggleStatus?: (note: Note) => void
  onRestore?: (note: Note) => void
  isTrashed?: boolean
}

const TYPE_CONFIG = {
  note: { label: 'Catatan', icon: FileText, color: 'bg-blue-100 text-blue-600' },
  ssh: { label: 'SSH', icon: Terminal, color: 'bg-orange-100 text-orange-600' },
  login: { label: 'Login', icon: KeyRound, color: 'bg-purple-100 text-purple-600' },
  api: { label: 'API', icon: Zap, color: 'bg-teal-100 text-teal-600' },
}

export function NoteDetailModal({
  note,
  onClose,
  onEdit,
  onDelete,
  onToggleStatus,
  onRestore,
  isTrashed,
}: NoteDetailModalProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  if (!note) return null

  const config = TYPE_CONFIG[note.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.note
  const Icon = config.icon
  const isInvalid = note.status === 'invalid'

  const getField = (key: string) => note.fields.find((f) => f.fieldKey === key)?.fieldValue || ''

  const daysRemaining = note.trashedItem
    ? Math.max(0, Math.ceil((new Date(note.trashedItem.expiresAt).getTime() - Date.now()) / 86400000))
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full sm:w-auto sm:min-w-[32rem] sm:max-w-[90vw] lg:max-w-[70vw] xl:max-w-[60vw] bg-white sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start gap-3 p-4 border-b border-gray-100">
          <div className={`p-2.5 rounded-xl shrink-0 ${config.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className={`font-semibold text-gray-900 text-base leading-tight ${
                isInvalid ? 'line-through text-gray-400' : ''
              }`}>
                {note.title}
              </h2>
              {isInvalid && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium bg-red-100 text-red-600">
                  Invalid
                </span>
              )}
              {isTrashed && daysRemaining !== null && (
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium ${
                  daysRemaining <= 3 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                }`}>
                  {daysRemaining} hari lagi
                </span>
              )}
            </div>
            {/* Categories */}
            {note.noteCategories.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {note.noteCategories.map(({ category }) => (
                  <span
                    key={category.id}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ backgroundColor: category.colorHex + '22', color: category.colorHex }}
                  >
                    {category.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {!isTrashed && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  aria-label="Opsi"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-9 z-20 bg-white rounded-xl border border-gray-200 shadow-lg py-1 min-w-[170px]">
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => { setMenuOpen(false); onEdit(note); onClose() }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                      )}
                      {onToggleStatus && note.type !== 'note' && (
                        <button
                          type="button"
                          onClick={() => { setMenuOpen(false); onToggleStatus(note) }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          {isInvalid ? 'Tandai Aktif Kembali' : 'Tandai Invalid'}
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => { setMenuOpen(false); onDelete(note); onClose() }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Pindah ke Trash
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
            {isTrashed && (
              <>
                {onRestore && (
                  <button
                    type="button"
                    onClick={() => { onRestore(note); onClose() }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Restore
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => { onDelete(note); onClose() }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {note.type === 'login' && (
            <>
              {getField('username') && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Username</p>
                  <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                    <span className="flex-1 text-sm text-gray-800 font-mono break-all">{getField('username')}</span>
                    <CopyButton value={getField('username')} />
                  </div>
                </div>
              )}
              {getField('password') && (
                <ExpandedSensitiveField label="Password" value={getField('password')} />
              )}
              {getField('url') && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">URL</p>
                  <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                    <a
                      href={getField('url').startsWith('http') ? getField('url') : `https://${getField('url')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-sm text-indigo-600 hover:underline break-all"
                    >
                      {getField('url')}
                    </a>
                    <CopyButton value={getField('url')} />
                  </div>
                </div>
              )}
              {getField('notes') && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Catatan</p>
                  <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{getField('notes')}</p>
                  </div>
                </div>
              )}
              {getField('username') && getField('password') && (
                <div className="pt-1">
                  <CopyButton
                    value={`${getField('username')}\n${getField('password')}`}
                    label="Copy Keduanya"
                    size="md"
                  />
                </div>
              )}
            </>
          )}

          {note.type === 'ssh' && (
            <>
              {getField('host') && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Host / IP</p>
                  <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                    <span className="flex-1 text-sm text-gray-800 font-mono">
                      {getField('host')}{getField('port') ? `:${getField('port')}` : ''}
                    </span>
                    <CopyButton value={getField('host')} />
                  </div>
                </div>
              )}
              {getField('username') && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Username</p>
                  <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                    <span className="flex-1 text-sm text-gray-800 font-mono">{getField('username')}</span>
                    <CopyButton value={getField('username')} />
                  </div>
                </div>
              )}
              {getField('password') && (
                <ExpandedSensitiveField label="Password" value={getField('password')} />
              )}
              {getField('privateKey') && (
                <ExpandedSensitiveField label="Private Key" value={getField('privateKey')} multiline />
              )}
              {getField('privateKeyUrl') && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">URL / Path Key File</p>
                  <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                    <span className="flex-1 text-sm text-gray-800 font-mono break-all">{getField('privateKeyUrl')}</span>
                    <CopyButton value={getField('privateKeyUrl')} />
                  </div>
                </div>
              )}
              {getField('passphrase') && (
                <ExpandedSensitiveField label="Passphrase" value={getField('passphrase')} />
              )}
              {getField('host') && getField('username') && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">SSH Command</p>
                  <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                    <span className="flex-1 text-sm text-gray-800 font-mono break-all">
                      ssh {getField('username')}@{getField('host')}{getField('port') && getField('port') !== '22' ? ` -p ${getField('port')}` : ''}
                    </span>
                    <CopyButton value={`ssh ${getField('username')}@${getField('host')}${getField('port') && getField('port') !== '22' ? ' -p ' + getField('port') : ''}`} />
                  </div>
                </div>
              )}
              {getField('notes') && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Catatan</p>
                  <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{getField('notes')}</p>
                  </div>
                </div>
              )}
            </>
          )}

          {note.type === 'api' && (
            <>
              {getField('baseUrl') && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Base URL</p>
                  <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                    <span className="flex-1 text-sm text-gray-800 font-mono break-all">{getField('baseUrl')}</span>
                    <CopyButton value={getField('baseUrl')} />
                  </div>
                </div>
              )}
              {getField('apiKey') && (
                <ExpandedSensitiveField label="API Key" value={getField('apiKey')} />
              )}
              {getField('model') && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Model</p>
                  <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                    <span className="flex-1 text-sm text-gray-800 font-mono">{getField('model')}</span>
                    <CopyButton value={getField('model')} />
                  </div>
                </div>
              )}
              {getField('baseUrl') && getField('apiKey') && (
                <div className="pt-1">
                  <CopyButton
                    value={`${getField('baseUrl')}\n${getField('apiKey')}`}
                    label="Copy Keduanya"
                    size="md"
                  />
                </div>
              )}
              {getField('notes') && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Catatan</p>
                  <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{getField('notes')}</p>
                  </div>
                </div>
              )}
            </>
          )}

          {note.type === 'note' && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Isi Catatan</p>
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <p className={`text-sm text-gray-700 whitespace-pre-wrap leading-relaxed ${
                  isInvalid ? 'line-through' : ''
                }`}>
                  {getField('content') || <span className="text-gray-400 italic">Tidak ada isi</span>}
                </p>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="pt-2 border-t border-gray-100 flex gap-4 text-xs text-gray-400">
            <span>Dibuat: {new Date(note.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <span>Diubah: {new Date(note.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Expanded sensitive field with larger display
function ExpandedSensitiveField({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  const [revealed, setRevealed] = useState(false)

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
          >
            {revealed ? 'Sembunyikan' : 'Tampilkan'}
          </button>
          <CopyButton value={value} />
        </div>
      </div>
      <div className="bg-gray-50 rounded-xl px-3 py-2.5">
        {revealed ? (
          <p className={`text-sm text-gray-800 font-mono break-all ${multiline ? 'whitespace-pre-wrap' : ''}`}>
            {value}
          </p>
        ) : (
          <p className="text-sm text-gray-400 tracking-widest select-none">
            {multiline ? '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022 (Private Key)' : '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
          </p>
        )}
      </div>
    </div>
  )
}
