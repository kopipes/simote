import { FileText, Terminal, KeyRound, Zap } from 'lucide-react'

export const NOTE_TYPE_CONFIG = {
  note: { label: 'Catatan', icon: FileText, color: 'bg-blue-100 text-blue-600' },
  ssh: { label: 'SSH', icon: Terminal, color: 'bg-orange-100 text-orange-600' },
  login: { label: 'Login', icon: KeyRound, color: 'bg-purple-100 text-purple-600' },
  api: { label: 'API', icon: Zap, color: 'bg-teal-100 text-teal-600' },
} as const

export const CATEGORY_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#06b6d4', '#64748b', '#78716c',
]

export const VALID_NOTE_TYPES = ['note', 'ssh', 'login', 'api'] as const
export type NoteType = typeof VALID_NOTE_TYPES[number]

export function getNoteField(
  fields: { fieldKey: string; fieldValue: string }[],
  key: string
): string {
  return fields.find((f) => f.fieldKey === key)?.fieldValue || ''
}
