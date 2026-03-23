import { Check, Loader2, X } from 'lucide-react'

interface AutoSaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error'
}

export function AutoSaveIndicator({ status }: AutoSaveIndicatorProps) {
  if (status === 'idle') return null

  return (
    <div className="flex items-center gap-1 text-xs">
      {status === 'saving' && (
        <>
          <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
          <span className="text-gray-400">Enregistrement...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <Check className="h-3 w-3 text-green-500" />
          <span className="text-green-600">Enregistré</span>
        </>
      )}
      {status === 'error' && (
        <>
          <X className="h-3 w-3 text-red-500" />
          <span className="text-red-600">Erreur</span>
        </>
      )}
    </div>
  )
}
