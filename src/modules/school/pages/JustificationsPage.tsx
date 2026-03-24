import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Check, X, ClipboardCheck, BarChart2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'
import { useJustifications, useReviewJustification, useDeleteJustification } from '../hooks/useAttendance'
import { JustificationStatusBadge } from '../components/JustificationStatusBadge'
import type { AbsenceJustification, JustificationStatus } from '../types/attendance.types'

type StatusFilter = 'all' | JustificationStatus

export function JustificationsPage() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [reviewingId,  setReviewingId]  = useState<number | null>(null)
  const [rejectNote,   setRejectNote]   = useState('')

  const filters: Record<string, unknown> = {}
  if (statusFilter !== 'all') filters.status = statusFilter

  const { data, isLoading } = useJustifications(filters)
  const justifications      = data?.data ?? []

  const reviewMutation = useReviewJustification()
  const deleteMutation = useDeleteJustification()

  const handleApprove = (j: AbsenceJustification) => {
    reviewMutation.mutate({ id: j.id, data: { action: 'approve' } })
  }

  const handleReject = (j: AbsenceJustification) => {
    if (!rejectNote.trim()) return
    reviewMutation.mutate(
      { id: j.id, data: { action: 'reject', review_note: rejectNote } },
      { onSuccess: () => { setReviewingId(null); setRejectNote('') } }
    )
  }

  const tabs: { label: string; value: StatusFilter }[] = [
    { label: 'Toutes',      value: 'all' },
    { label: 'En attente',  value: 'pending' },
    { label: 'Approuvées',  value: 'approved' },
    { label: 'Rejetées',    value: 'rejected' },
  ]

  const TABS = [
    { path: '/school/attendance/sheet',          label: "Feuille d'appel", Icon: ClipboardCheck },
    { path: '/school/attendance',                label: 'Statistiques',     Icon: BarChart2 },
    { path: '/school/attendance/justifications', label: 'Justifications',   Icon: FileText },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
          <FileText className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Justifications d'absence</h1>
          <p className="text-sm text-slate-500">Validation des justificatifs soumis</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1 w-fit">
        {TABS.map(({ path, label, Icon }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              path === '/school/attendance/justifications'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : justifications.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center">
          <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Aucune justification trouvée.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Élève</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Période</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Motif</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Statut</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Soumis le</th>
                <th className="px-4 py-3 text-xs font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {justifications.map((j: AbsenceJustification) => (
                <>
                  <tr key={j.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {j.enrollment?.student?.full_name ?? '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {j.date_from} → {j.date_to}
                      <div className="text-xs text-slate-400">{j.days_count} jour{j.days_count > 1 ? 's' : ''}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 max-w-[220px]">
                      <span className="line-clamp-2">{j.reason}</span>
                      {j.document_url && (
                        <a href={j.document_url} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline">
                          Voir le document
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <JustificationStatusBadge status={j.status.value} />
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{j.created_at}</td>
                    <td className="px-4 py-3">
                      {j.status.value === 'pending' && (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-green-700 border-green-200 hover:bg-green-50 h-7 text-xs"
                            onClick={() => handleApprove(j)}
                            disabled={reviewMutation.isPending}
                          >
                            <Check className="h-3 w-3" />
                            Approuver
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-red-600 border-red-200 hover:bg-red-50 h-7 text-xs"
                            onClick={() => setReviewingId(reviewingId === j.id ? null : j.id)}
                          >
                            <X className="h-3 w-3" />
                            Rejeter
                          </Button>
                        </div>
                      )}
                      {j.status.value !== 'pending' && j.review_note && (
                        <span className="text-xs text-slate-500 italic">{j.review_note}</span>
                      )}
                    </td>
                  </tr>
                  {/* Reject inline form */}
                  {reviewingId === j.id && (
                    <tr key={`reject-${j.id}`} className="bg-red-50">
                      <td colSpan={6} className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={rejectNote}
                            onChange={(e) => setRejectNote(e.target.value)}
                            placeholder="Motif du rejet (obligatoire)…"
                            className="flex-1 rounded border border-red-200 px-3 py-1.5 text-sm"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-700 border-red-300 hover:bg-red-100"
                            onClick={() => handleReject(j)}
                            disabled={!rejectNote.trim() || reviewMutation.isPending}
                          >
                            Confirmer le rejet
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setReviewingId(null); setRejectNote('') }}>
                            Annuler
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
