import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, Eye, Pencil, MoreHorizontal, UserPlus, UserCheck, UserX,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { WorkloadBar } from '../components/WorkloadBar'
import { ContractTypeBadge } from '../components/ContractTypeBadge'
import { SubjectTagList } from '../components/SubjectTagList'
import { TeacherProfileModal } from './TeacherProfileModal'
import { CreateTeacherModal } from './CreateTeacherModal'
import { useTeachers, useTeacherStats, useToggleTeacher } from '../hooks/useTeachers'
import { useSchoolStore } from '../store/schoolStore'
import type { TeacherListItem, ContractType } from '../types/teachers.types'

const CONTRACT_OPTIONS: { value: ContractType | ''; label: string }[] = [
  { value: '', label: 'Tous les contrats' },
  { value: 'permanent', label: 'Titulaire' },
  { value: 'contract', label: 'Contractuel' },
  { value: 'part_time', label: 'Temps partiel' },
  { value: 'interim', label: 'Intérimaire' },
]

export function TeachersPage() {
  const { currentYearId } = useSchoolStore()

  const [search, setSearch] = useState('')
  const [filterContract, setFilterContract] = useState<ContractType | ''>('')
  const [filterActive, setFilterActive] = useState<string>('')

  const [profileTarget, setProfileTarget] = useState<TeacherListItem | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const { data, isLoading } = useTeachers({
    search: search || undefined,
    contract_type: filterContract || undefined,
    is_active: filterActive !== '' ? filterActive === 'true' : undefined,
    academic_year_id: currentYearId ?? undefined,
  })

  const { data: statsData } = useTeacherStats(currentYearId ?? 0)
  const stats = statsData?.data

  const teachers = data?.data ?? []
  const meta = data?.meta

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enseignants</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
            {meta && <span>{meta.total} enseignant{meta.total > 1 ? 's' : ''}</span>}
            {stats && (
              <>
                {stats.without_assignment > 0 && (
                  <span className="text-orange-600">
                    {stats.without_assignment} sans affectation
                  </span>
                )}
                {stats.overloaded > 0 && (
                  <span className="text-red-600">
                    {stats.overloaded} surchargé{stats.overloaded > 1 ? 's' : ''}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <UserPlus className="mr-1.5 h-4 w-4" />
          Ajouter un enseignant
        </Button>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Rechercher par nom, email, n° employé..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <select
          value={filterContract}
          onChange={(e) => setFilterContract(e.target.value as ContractType | '')}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {CONTRACT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Tous les statuts</option>
          <option value="true">Actifs</option>
          <option value="false">Inactifs</option>
        </select>
      </div>

      {/* Tableau */}
      {isLoading ? (
        <LoadingSpinner />
      ) : teachers.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="Aucun enseignant trouvé"
          description={search ? "Essayez avec d'autres termes." : 'Commencez par ajouter un enseignant.'}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Enseignant</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">N° Employé</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Matières</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Charge</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Contrat</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {teachers.map((teacher) => (
                <TeacherRow
                  key={teacher.id}
                  teacher={teacher}
                  onEditProfile={() => setProfileTarget(teacher)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {profileTarget && (
        <TeacherProfileModal
          open={!!profileTarget}
          onClose={() => setProfileTarget(null)}
          teacherId={profileTarget.id}
        />
      )}
      <CreateTeacherModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}

function TeacherRow({
  teacher,
  onEditProfile,
}: {
  teacher: TeacherListItem
  onEditProfile: () => void
}) {
  const toggleMutation = useToggleTeacher()

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <img
            src={teacher.avatar_url ?? undefined}
            alt={teacher.full_name}
            className="h-8 w-8 rounded-full object-cover bg-indigo-100"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <Link
                to={`/school/teachers/${teacher.id}`}
                className="font-medium text-gray-900 hover:text-indigo-600"
              >
                {teacher.full_name}
              </Link>
              {!teacher.is_active && (
                <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">Inactif</span>
              )}
            </div>
            {teacher.speciality && (
              <p className="text-xs text-gray-400">{teacher.speciality}</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-gray-500 text-xs font-mono">
        {teacher.employee_number ?? '—'}
      </td>
      <td className="px-4 py-3">
        <SubjectTagList subjects={teacher.subjects ?? []} max={3} />
      </td>
      <td className="px-4 py-3 min-w-[140px]">
        <WorkloadBar
          current={teacher.weekly_hours ?? 0}
          max={teacher.weekly_hours_max ?? 20}
          compact
        />
      </td>
      <td className="px-4 py-3">
        {teacher.contract_type ? (
          <ContractTypeBadge type={teacher.contract_type.value} />
        ) : (
          <span className="text-gray-400 text-xs italic">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/school/teachers/${teacher.id}`}>
                <Eye className="mr-2 h-3.5 w-3.5" />
                Voir le profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEditProfile}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Modifier le profil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => toggleMutation.mutate(teacher.id)}
              disabled={toggleMutation.isPending}
            >
              {teacher.is_active ? (
                <><UserX className="mr-2 h-3.5 w-3.5" />Désactiver</>
              ) : (
                <><UserCheck className="mr-2 h-3.5 w-3.5" />Activer</>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  )
}
