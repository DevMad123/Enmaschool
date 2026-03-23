import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Pencil, Plus, AlertTriangle, Briefcase, BookOpen, BarChart2, Info, Settings2,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'
import { ContractTypeBadge } from '../components/ContractTypeBadge'
import { SubjectTagList } from '../components/SubjectTagList'
import { WorkloadGauge } from '../components/WorkloadGauge'
import { TeacherProfileModal } from './TeacherProfileModal'
import { AssignTeacherModal } from './AssignTeacherModal'
import { useTeacher, useTeacherWorkload } from '../hooks/useTeachers'
import type { TeacherAssignment } from '../types/teachers.types'
import { useAcademicYears } from '../hooks/useAcademicYears'
import { useSchoolStore } from '../store/schoolStore'

const TABS = [
  { key: 'profile', label: 'Profil', icon: BookOpen },
  { key: 'assignments', label: 'Affectations', icon: Briefcase },
  { key: 'workload', label: 'Charge horaire', icon: BarChart2 },
  { key: 'info', label: 'Informations', icon: Info },
] as const

type Tab = (typeof TABS)[number]['key']

export function TeacherDetailPage() {
  const { id } = useParams<{ id: string }>()
  const teacherId = Number(id)
  const { currentYearId } = useSchoolStore()

  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [profileOpen, setProfileOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<TeacherAssignment | null>(null)

  const { data, isLoading, isError } = useTeacher(teacherId)
  const teacher = data?.data

  const { data: yearsData } = useAcademicYears()
  const years = yearsData?.data ?? []
  // Use currentYearId from store, fall back to first available year if store not initialized
  const effectiveYearId = currentYearId ?? years[0]?.id ?? 0

  const { data: workloadData } = useTeacherWorkload(teacherId, effectiveYearId)
  const workload = workloadData?.data

  const currentYearName = years.find((y) => y.id === effectiveYearId)?.name

  if (isLoading) return <LoadingSpinner />
  if (isError || !teacher) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Enseignant introuvable.</p>
        <Link to="/school/teachers" className="mt-2 text-indigo-600 text-sm hover:underline">
          Retour à la liste
        </Link>
      </div>
    )
  }

  const primarySubjectId = teacher.primary_subject?.id

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <Link
        to="/school/teachers"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux enseignants
      </Link>

      {/* Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={teacher.avatar_url ?? undefined}
              alt={teacher.full_name}
              className="h-16 w-16 rounded-full object-cover bg-indigo-100"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{teacher.full_name}</h1>
                {teacher.contract_type && (
                  <ContractTypeBadge type={teacher.contract_type.value} />
                )}
                {!teacher.is_active && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Inactif</span>
                )}
              </div>
              {teacher.employee_number && (
                <p className="mt-0.5 text-sm text-gray-400 font-mono">{teacher.employee_number}</p>
              )}
              {teacher.speciality && (
                <p className="mt-1 text-sm text-gray-600">{teacher.speciality}</p>
              )}
              {teacher.diploma && (
                <p className="text-sm text-gray-400">{teacher.diploma}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setProfileOpen(true)}>
              <Pencil className="mr-1.5 h-4 w-4" />
              Modifier
            </Button>
            <Button size="sm" onClick={() => setAssignOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Affecter
            </Button>
          </div>
        </div>

        {/* Overload warning */}
        {teacher.is_overloaded && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Charge horaire dépassée ({teacher.weekly_hours}h / {teacher.weekly_hours_max}h max)
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Matières enseignées
              </h3>
              <SubjectTagList
                subjects={teacher.subjects ?? []}
                primarySubjectId={primarySubjectId}
              />
              {(teacher.subjects ?? []).length === 0 && (
                <p className="text-sm text-gray-400">Aucune matière assignée</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-700">
                Affectations {currentYearName ? `— ${currentYearName}` : ''}
              </h3>
              <Button size="sm" onClick={() => setAssignOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" />
                Nouvelle affectation
              </Button>
            </div>

            {(teacher.assignments ?? []).filter((a) => a.is_active).length === 0 ? (
              <p className="text-center py-8 text-gray-400 text-sm">
                Aucune affectation pour cette année
              </p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Classe</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Matière</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">H/sem</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(teacher.assignments ?? []).filter((a) => a.is_active).map((a) => (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{a.classe?.display_name ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{a.subject?.name ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-500">
                          {a.hours_per_week != null ? `${a.hours_per_week}h` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => setEditingAssignment(a)}
                          >
                            <Settings2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {workload && (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Charge totale</p>
                <WorkloadGauge
                  current={workload.total_hours}
                  max={workload.max_hours}
                  size="md"
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'workload' && workload && (
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Détail de la charge
            </h3>
            <WorkloadGauge
              current={workload.total_hours}
              max={workload.max_hours}
              size="lg"
            />

            {workload.is_overloaded && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
                <AlertTriangle className="h-4 w-4" />
                Dépasse la limite de {workload.max_hours}h/sem
                ({workload.overload_hours}h de dépassement)
              </div>
            )}

            <div className="mt-4 space-y-2">
              {workload.assignments.map((a, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                  <div>
                    <span className="font-medium text-gray-700">{a.classe}</span>
                    <span className="text-gray-400 mx-1">·</span>
                    <span className="text-gray-500">{a.subject}</span>
                  </div>
                  <span className="text-gray-600 tabular-nums">{a.hours}h</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'workload' && !workload && (
          <p className="text-center py-8 text-gray-400 text-sm">
            Sélectionnez une année pour voir la charge horaire
          </p>
        )}

        {activeTab === 'info' && (
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Informations administratives
            </h3>
            <dl className="space-y-3">
              <InfoRow label="N° Employé" value={teacher.employee_number} />
              <InfoRow label="Type de contrat" value={teacher.contract_type?.label} />
              <InfoRow label="Charge max" value={teacher.weekly_hours_max ? `${teacher.weekly_hours_max}h/semaine` : undefined} />
              <InfoRow label="Date d'embauche" value={teacher.hire_date ?? undefined} />
              <InfoRow label="Diplôme" value={teacher.diploma ?? undefined} />
              <InfoRow label="Email" value={teacher.email} />
              <InfoRow label="Téléphone" value={teacher.phone ?? undefined} />
            </dl>
          </div>
        )}
      </div>

      {/* Modals */}
      <TeacherProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        teacherId={teacherId}
      />
      <AssignTeacherModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        teacherId={teacherId}
      />
      <AssignTeacherModal
        open={!!editingAssignment}
        onClose={() => setEditingAssignment(null)}
        assignment={editingAssignment ?? undefined}
      />
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div>
      <dt className="text-xs text-gray-400">{label}</dt>
      <dd className="text-sm text-gray-900">{value}</dd>
    </div>
  )
}
