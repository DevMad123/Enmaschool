import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { formatMatricule } from '../lib/studentHelpers'
import { cn } from '@/shared/lib/utils'
import { copyToClipboard } from '@/shared/lib/clipboard'

interface MatriculeDisplayProps {
  matricule: string
  className?: string
}

export function MatriculeDisplay({ matricule, className }: MatriculeDisplayProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try { await copyToClipboard(matricule) } catch { /* silent */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <code className="rounded bg-gray-100 px-2 py-0.5 text-sm font-mono text-gray-700">
        {formatMatricule(matricule)}
      </code>
      <button
        onClick={handleCopy}
        className="rounded p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
        title="Copier le matricule"
        type="button"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </span>
  )
}
