import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, Plus, Download, Upload, Eye, Pencil, Trash2,
  MoreHorizontal, GraduationCap,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { ConfirmDialog } from '@/shared/components/feedback/ConfirmDialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { StudentAvatar } from '../components/StudentAvatar'
import { StudentStatusBadge } from '../components/StudentStatusBadge'
import { GenderBadge } from '../components/GenderBadge'
import { MatriculeDisplay } from '../components/MatriculeDisplay'
import { StudentFormModal } from './StudentFormModal'
import { EnrollmentModal } from './EnrollmentModal'
import { ImportStudentsModal } from './ImportStudentsModal'
import {
  useStudents, useDeleteStudent, useExportStudents,
} from '../hooks/useStudents'
import type { StudentListItem, StudentStatus, Gender } from '../types/students.types'

const STATUS_OPTIONS: { value: StudentStatus | ''; label: string }[] = [
  { value: '', label: 'Tous les statuts' },
  { value: 'active', label: 'Actif' },
  { value: 'inactive', label: 'Inactif' },
  { value: 'transferred', label: 'Transféré' },
  { value: 'graduated', label: 'Diplômé' },
  { value: 'expelled', label: 'Exclu' },
]

const GENDER_OPTIONS: { value: Gender | ''; label: string }[] = [
  { value: '', label: 'Tous les genres' },
  { value: 'male', label: 'Masculin' },
  { value: 'female', label: 'Féminin' },
]

export function StudentsPage() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<StudentStatus | ''>('')
  const [filterGender, setFilterGender] = useState<Gender | ''>('')

  const [formOpen, setFormOpen] = useState(false)
  const [editStudent, setEditStudent] = useState<StudentListItem | null>(null)
  const [enrollTarget, setEnrollTarget] = useState<StudentListItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<StudentListItem | null>(null)
  const [importOpen, setImportOpen] = useState(false)

  const { data, isLoading } = useStudents({
    search: search || undefined,
    status: filterStatus || undefined,
    gender: filterGender || undefined,
  })

  const deleteMutation = useDeleteStudent()
  const exportMutation = useExportStudents()

  const students = data?.data ?? []
  const meta = data?.meta

  const handleEdit = (student: StudentListItem) => {
    setEditStudent(student)
    setFormOpen(true)
  }

  const handleDelete = (student: StudentListItem) => {
    setDeleteTarget(student)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    })
  }

  const handleExport = () => {
    exportMutation.mutate({
      search: search || undefined,
      status: filterStatus || undefined,
      gender: filterGender || undefined,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Élèves</h1>
          {meta && (
            <p className="text-sm text-gray-500">
              {meta.total} élève{meta.total > 1 ? 's' : ''} au total
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Upload className="mr-1.5 h-4 w-4" />
            Importer
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exportMutation.isPending}>
            <Download className="mr-1.5 h-4 w-4" />
            Exporter
          </Button>
          <Button size="sm" onClick={() => { setEditStudent(null); setFormOpen(true) }}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nouvel élève
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Rechercher par nom, prénom, matricule..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as StudentStatus | '')}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          value={filterGender}
          onChange={(e) => setFilterGender(e.target.value as Gender | '')}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {GENDER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingSpinner />
      ) : students.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="Aucun élève trouvé"
          description={search ? "Essayez avec d'autres termes de recherche." : 'Commencez par ajouter un élève.'}
          action={{
            label: 'Ajouter un élève',
            onClick: () => { setEditStudent(null); setFormOpen(true) },
          }}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Élève</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Matricule</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Classe</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Genre</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Âge</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Statut</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <StudentAvatar student={student} size="sm" />
                      <Link
                        to={`/school/students/${student.id}`}
                        className="font-medium text-gray-900 hover:text-indigo-600"
                      >
                        {student.full_name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <MatriculeDisplay matricule={student.matricule} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {student.current_classe_name ? (
                      <span>{student.current_classe_name}</span>
                    ) : (
                      <span className="text-gray-400 italic text-xs">Non inscrit</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <GenderBadge gender={student.gender.value} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">{student.age} ans</td>
                  <td className="px-4 py-3">
                    <StudentStatusBadge status={student.status.value} />
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
                          <Link to={`/school/students/${student.id}`}>
                            <Eye className="mr-2 h-3.5 w-3.5" />
                            Voir le dossier
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(student)}>
                          <Pencil className="mr-2 h-3.5 w-3.5" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEnrollTarget(student)}>
                          <GraduationCap className="mr-2 h-3.5 w-3.5" />
                          Inscrire
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(student)}
                          className="text-red-600 focus:text-red-700"
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <StudentFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditStudent(null) }}
        studentId={editStudent?.id}
      />

      {enrollTarget && (
        <EnrollmentModal
          open={!!enrollTarget}
          onClose={() => setEnrollTarget(null)}
          studentId={enrollTarget.id}
          studentName={enrollTarget.full_name}
        />
      )}

      <ImportStudentsModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}
        onConfirm={confirmDelete}
        title="Supprimer l'élève"
        description={`Supprimer ${deleteTarget?.full_name} ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  )
}
