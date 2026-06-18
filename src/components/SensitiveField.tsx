'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { CopyButton } from './CopyButton'

interface SensitiveFieldProps {
  label: string
  value: string
  copyLabel?: string
}

export function SensitiveField({ label, value, copyLabel }: SensitiveFieldProps) {
  const [revealed, setRevealed] = useState(false)

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-24 shrink-0 font-medium">{label}</span>
      <div className="flex-1 min-w-0 flex items-center gap-1.5">
        <span
          className={`flex-1 min-w-0 truncate text-sm font-mono ${
            revealed ? 'text-gray-800' : 'text-gray-400 tracking-widest'
          }`}
        >
          {revealed ? value : '••••••••'}
        </span>
        <button
          type="button"
          onClick={() => setRevealed((r) => !r)}
          title={revealed ? 'Sembunyikan' : 'Tampilkan'}
          aria-label={revealed ? 'Sembunyikan' : 'Tampilkan'}
          className="shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
        <CopyButton value={value} label={copyLabel} />
      </div>
    </div>
  )
}

interface PlainFieldProps {
  label: string
  value: string
  copyLabel?: string
  mono?: boolean
}

export function PlainField({ label, value, copyLabel, mono }: PlainFieldProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-24 shrink-0 font-medium">{label}</span>
      <div className="flex-1 min-w-0 flex items-center gap-1.5">
        <span className={`flex-1 min-w-0 truncate text-sm ${mono ? 'font-mono' : ''} text-gray-800`}>
          {value}
        </span>
        {copyLabel && <CopyButton value={value} label={copyLabel} />}
      </div>
    </div>
  )
}
