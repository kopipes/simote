'use client'

import { useState } from 'react'
import { MoreVertical, Terminal, KeyRound, FileText, Trash2, RotateCcw, Zap } from 'lucide-react'
import { Note } from '@/lib/api'
import { SensitiveField, PlainField } from './SensitiveField'
import { CopyButton } from './CopyButton'
import { NoteDetailModal } from './NoteDetailModal'

interface NoteCardProps {
  note: Note
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

export function NoteCard({ note, onEdit, onDelete, onToggleStatus, onRestore, isTrashed }: NoteCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)

  const config = TYPE_CONFIG[note.type] || TYPE_CONFIG.note
  const Icon = config.icon
  const isInvalid = note.status === 'invalid'

  const getField = (key: string) => note.fields.find((f) => f.fieldKey === key)?.fieldValue || ''

  // Calculate days remaining for trashed items
  const daysRemaining = note.trashedItem
    ? Math.max(0, Math.ceil((new Date(note.trashedItem.expiresAt).getTime() - Date.now()) / 86400000))
    : null

  return (
    <>
    <NoteDetailModal
      note={detailOpen ? note : null}
      onClose={() => setDetailOpen(false)}
      onEdit={onEdit}
      onDelete={onDelete}
      onToggleStatus={onToggleStatus}
      onRestore={onRestore}
      isTrashed={isTrashed}
    />
    <div
      className={`bg-white rounded-2xl border transition-all cursor-pointer ${
        isInvalid ? 'border-gray-200 opacity-70' : 'border-gray-200 hover:border-indigo-200 hover:shadow-sm'
      }`}
      onClick={() => setDetailOpen(true)}
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-4 pb-3">
        <div className={`p-2 rounded-xl shrink-0 ${config.color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`font-semibold text-gray-900 text-sm leading-tight ${
              isInvalid ? 'line-through text-gray-400' : ''
            }`}>
              {note.title}
            </h3>
            {isInvalid && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium bg-red-100 text-red-600">
                Invalid
              </span>
            )}
            {isTrashed && daysRemaining !== null && (
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium ${
                daysRemaining <= 3 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
              }`}>
                {daysRemaining}h lagi
              </span>
            )}
          </div>
          {/* Categories */}
          {note.noteCategories.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {note.noteCategories.map(({ category }) => (
                <span
                  key={category.id}
                  className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium"
                  style={{ backgroundColor: category.colorHex + '22', color: category.colorHex }}
                >
                  {category.name}
                </span>
              ))}
            </div>
          )}
        </div>
        {/* Menu */}
        {!isTrashed && (
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o) }}
              aria-label="Opsi"
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <>
                   <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(false) }} />
                <div className="absolute right-0 top-8 z-20 bg-white rounded-xl border border-gray-200 shadow-lg py-1 min-w-[160px]">
                  {onEdit && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(note) }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </button>
                  )}
                  {onToggleStatus && note.type !== 'note' && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onToggleStatus(note) }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {isInvalid ? 'Tandai Aktif Kembali' : 'Tandai Invalid'}
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(note) }}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Pindah ke Trash
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
        {isTrashed && (
          <div className="flex gap-1 shrink-0">
            {onRestore && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRestore(note) }}
                title="Restore"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restore
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete(note) }}
                title="Hapus permanen"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Fields */}
      <div className="px-4 pb-4 space-y-2">
        {note.type === 'login' && (
          <>
            {getField('username') && (
              <PlainField label="Username" value={getField('username')} copyLabel="Username" />
            )}
            {getField('password') && (
              <SensitiveField label="Password" value={getField('password')} copyLabel="Pass" />
            )}
            {getField('url') && (
              <PlainField label="URL" value={getField('url')} />
            )}
            {/* Copy both */}
            {getField('username') && getField('password') && (
              <div className="pt-1">
                <CopyButton
                  value={`${getField('username')}\n${getField('password')}`}
                  label="Copy Keduanya"
                  size="sm"
                />
              </div>
            )}
          </>
        )}

        {note.type === 'ssh' && (
          <>
            {getField('host') && (
              <PlainField
                label="Host"
                value={`${getField('host')}${getField('port') ? ':' + getField('port') : ''}`}
                copyLabel="Host"
                mono
              />
            )}
            {getField('username') && (
              <PlainField label="Username" value={getField('username')} copyLabel="User" mono />
            )}
            {getField('password') && (
              <SensitiveField label="Password" value={getField('password')} copyLabel="Pass" />
            )}
            {getField('privateKey') && (
              <SensitiveField label="Private Key" value={getField('privateKey')} copyLabel="Key" />
            )}
            {getField('privateKeyUrl') && (
              <PlainField label="Key Path" value={getField('privateKeyUrl')} copyLabel="Path" mono />
            )}
            {/* SSH command */}
            {getField('host') && getField('username') && (
              <div className="pt-1">
                <CopyButton
                  value={`ssh ${getField('username')}@${getField('host')}${getField('port') && getField('port') !== '22' ? ' -p ' + getField('port') : ''}`}
                  label="Copy Command"
                  size="sm"
                />
              </div>
            )}
          </>
        )}

        {note.type === 'note' && (
          <>
            {getField('content') && (
              <p className={`text-sm text-gray-600 line-clamp-3 ${isInvalid ? 'line-through' : ''}`}>
                {getField('content')}
              </p>
            )}
          </>
        )}

        {note.type === 'api' && (
          <>
            {getField('baseUrl') && (
              <PlainField label="Base URL" value={getField('baseUrl')} copyLabel="URL" mono />
            )}
            {getField('apiKey') && (
              <SensitiveField label="API Key" value={getField('apiKey')} copyLabel="Key" />
            )}
            {getField('model') && (
              <PlainField label="Model" value={getField('model')} copyLabel="Model" />
            )}
            {getField('baseUrl') && getField('apiKey') && (
              <div className="pt-1">
                <CopyButton
                  value={`${getField('baseUrl')}\n${getField('apiKey')}`}
                  label="Copy Keduanya"
                  size="sm"
                />
              </div>
            )}
          </>
        )}

        {/* OTP / extra notes */}
        {getField('notes') && note.type !== 'note' && (
          <PlainField label="Catatan" value={getField('notes')} />
        )}
      </div>
    </div>
    </>
  )
}
