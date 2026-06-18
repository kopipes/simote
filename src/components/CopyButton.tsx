'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface CopyButtonProps {
  value: string
  label?: string
  className?: string
  size?: 'sm' | 'md'
}

export function CopyButton({ value, label, className = '', size = 'sm' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea')
      el.value = value
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? 'Tersalin!' : `Salin${label ? ' ' + label : ''}`}
      aria-label={copied ? 'Tersalin' : `Salin${label ? ' ' + label : ''}`}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
        copied
          ? 'bg-green-100 text-green-600'
          : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
      } ${className}`}
    >
      {copied ? (
        <Check className={iconSize} />
      ) : (
        <Copy className={iconSize} />
      )}
      {label && <span>{copied ? 'Tersalin' : label}</span>}
    </button>
  )
}
