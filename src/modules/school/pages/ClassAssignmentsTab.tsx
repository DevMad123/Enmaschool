import { useState } from 'react'
import { RefreshCw, X, UserCheck } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'
import { AssignmentStatusBadge } from '../components/AssignmentStatusBadge'
import { AssignTeacherModal } from './AssignTeacherModal'
import { useClasseAssignments, useUnassignTeacher } from '../hooks/useTeachers'
import { useSchoolStore } from '../store/schoolStore'
import type { TeacherAssignment } from '../types/teachers.types'
import type { Subject } from '../types/school.types'
import { ConfirmDialog } from '@/shared/components/feedback/ConfirmDialog'

interface ClassAssignmentsTabProps {
  classeId: number
}

export function ClassAssignmentsTab({ classeId }: ClassAssignmentsTabProps) {
  const { currentYearId } = useSchoolStore()
  const [assignTarget, setAssignTarget] = useState<{ subject?: Subject; assignment?: TeacherAssignment } | null>(null)
  const [unassignTarget, setUnassignTarget] = useState<TeacherAssignment | null>(null)

  const { data, isLoading } = useClasseAssignments(classeId, currentYearId ?? 0)
  const unassignMutation = useUnassignTeacher()

  if (isLoading) return <LoadingSpinner />

  if (!currentYearId) {
    return (
      <p className="text-center py-8 text-sm text-gray-400">
        Aucune année scolaire active sélectionnée.
      </p>
    )
  }

  const assignments = data?.data

  if (!assignments) {
    return (
      <p className="text-center py-8 text-sm text-gray-400">
        Données unavailable.
      </p>
    )
  }

  const { total_subjects, assigned_subjects, completion_rate } = assignments

  const completionColor =
    completion_rate === 100
      ? 'bg-green-500'
      : completion_rate >= 75
        ? 'bg-blue-500'
        : completion_rate >= 50
          ? 'bg-orange-400'
          : 'bg-red-500'

  return (
    <div className="space-y-4">
      {/* Résumé */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-700">
            Taux de complétion : {assigned_subjects}/{total_subjects} matières assignées
          </p>
          <span className="text-sm font-semibold text-gray-600">{completion_rate}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${completionColor}`}
            style={{ width: `${completion_rate}%` }}
          />
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Matière</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Coeff</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">H/sem</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Enseignant</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Statut</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {assignments.assignments.map((item, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {item.subject?.name ?? '—'}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {item.subject?.coefficient ?? '—'}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {item.assignment?.hours_per_week != null
                    ? `${item.assignment.hours_per_week}h`
                    : item.subject?.pivot_is_active !== undefined
                      ? '—'
                      : '—'}
                </td>
                <td className="px-4 py-3">
                  {item.teacher ? (
                    <div className="flex items-center gap-2">
                      <img
                        src={item.teacher.avatar_url ?? undefined}
                        alt={item.teacher.full_name}
                        className="h-6 w-6 rounded-full object-cover bg-indigo-100"
                      />
                      <span className="text-gray-700">{item.teacher.full_name}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400 italic text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <AssignmentStatusBadge isAssigned={item.is_assigned} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {item.is_assigned && item.assignment ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => setAssignTarget({ subject: item.subject, assignment: item.assignment ?? undefined })}
                        >
                          <RefreshCw className="mr-1 h-3 w-3" />
                          Changer
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                          onClick={() => setUnassignTarget(item.assignment ?? null)}
                        >
                          <X className="mr-1 h-3 w-3" />
                          Retirer
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => setAssignTarget({ subject: item.subject })}
                      >
                        <UserCheck className="mr-1 h-3 w-3" />
                        Assigner
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {assignTarget !== null && (
        <AssignTeacherModal
          open={true}
          onClose={() => setAssignTarget(null)}
          classeId={classeId}
        />
      )}

      <ConfirmDialog
        open={!!unassignTarget}
        onOpenChange={(v) => { if (!v) setUnassignTarget(null) }}
        onConfirm={() => {
          if (!unassignTarget) return
          unassignMutation.mutate(unassignTarget.id, {
            onSuccess: () => setUnassignTarget(null),
          })
        }}
        title="Retirer l'affectation"
        description="Retirer cet enseignant de la matière ? L'historique sera conservé."
        confirmLabel="Retirer"
        isLoading={unassignMutation.isPending}
        variant="danger"
      />
    </div>
  )
}
