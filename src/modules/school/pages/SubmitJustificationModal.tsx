import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { useSubmitJustification } from '../hooks/useAttendance'

interface Props {
  open:         boolean
  onClose:      () => void
  enrollmentId: number
}

export function SubmitJustificationModal({ open, onClose, enrollmentId }: Props) {
  const [dateFrom,  setDateFrom]  = useState('')
  const [dateTo,    setDateTo]    = useState('')
  const [reason,    setReason]    = useState('')
  const [document,  setDocument]  = useState<File | null>(null)

  const submitMutation = useSubmitJustification()

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData()
    fd.append('enrollment_id', String(enrollmentId))
    fd.append('date_from',     dateFrom)
    fd.append('date_to',       dateTo)
    fd.append('reason',        reason)
    if (document) fd.append('document', document)

    submitMutation.mutate(fd, {
      onSuccess: () => {
        setDateFrom(''); setDateTo(''); setReason(''); setDocument(null)
        onClose()
      },
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">Soumettre une justification</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Date début</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Date fin</label>
              <input
                type="date"
                value={dateTo}
                min={dateFrom}
                onChange={(e) => setDateTo(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Motif</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              maxLength={500}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm resize-none"
              placeholder="Ex: Maladie — certificat médical joint"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Document justificatif (optionnel)</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setDocument(e.target.files?.[0] ?? null)}
              className="w-full text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            <p className="text-xs text-slate-400 mt-1">PDF, JPG ou PNG — max 5 Mo</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={submitMutation.isPending}>
              {submitMutation.isPending ? 'Envoi…' : 'Soumettre'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
