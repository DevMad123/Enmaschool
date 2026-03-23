import { useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Copy, Search, Users, DoorOpen, GraduationCap } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { ConfirmDialog } from '@/shared/components/feedback/ConfirmDialog'
import { useClasses, useDeleteClasse } from '../hooks/useClasses'
import { useSchoolStore } from '../store/schoolStore'
import { LevelCategoryBadge } from '../components/LevelCategoryBadge'
import { ClasseFormModal } from './ClasseFormModal'
import { BulkClasseModal } from './BulkClasseModal'
import type { Classe, ClasseFilters, LevelCategory } from '../types/school.types'

const CATEGORIES: { value: LevelCategory | ''; label: string }[] = [
  { value: '', label: 'Tous' },
  { value: 'maternelle', label: 'Maternelle' },
  { value: 'primaire', label: 'Primaire' },
  { value: 'college', label: 'Collège' },
  { value: 'lycee', label: 'Lycée' },
]

function ClasseCard({
  classe,
  onEdit,
  onDelete,
}: {
  classe: Classe
  onEdit: (c: Classe) => void
  onDelete: (c: Classe) => void
}) {
  const navigate = useNavigate()

  return (
    <div
      className="group relative rounded-lg border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(`/school/classes/${classe.id}`)}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{classe.display_name}</h3>
          {classe.level && (
            <LevelCategoryBadge category={classe.level.category.value} />
          )}
        </div>
        {classe.serie && (
          <span className="inline-flex items-center rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
            Série {classe.serie}
          </span>
        )}
      </div>

      <div className="space-y-1.5 text-sm text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-slate-600">Section :</span> {classe.section}
        </div>
        {classe.main_teacher && (
          <div className="flex items-center gap-1.5">
            <GraduationCap className="h-3.5 w-3.5" />
            {classe.main_teacher.full_name}
          </div>
        )}
        {classe.room && (
          <div className="flex items-center gap-1.5">
            <DoorOpen className="h-3.5 w-3.5" />
            {classe.room.name}
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          {classe.students_count ?? 0} / {classe.capacity}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(classe) }}
          className="text-xs font-medium text-slate-600 hover:text-slate-800"
        >
          Modifier
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(classe) }}
          className="text-xs font-medium text-red-600 hover:text-red-700"
        >
          Supprimer
        </button>
      </div>
    </div>
  )
}

export function ClassesPage() {
  const { currentYearId, selectedLevelCategory, setSelectedLevelCategory } = useSchoolStore()
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editClasse, setEditClasse] = useState<Classe | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Classe | null>(null)

  const filters: ClasseFilters = {
    academic_year_id: currentYearId ?? undefined,
    category: selectedLevelCategory ?? undefined,
    search: search || undefined,
    per_page: 100,
  }

  const { data, isLoading } = useClasses(filters)
  const deleteMutation = useDeleteClasse()

  const classes = data?.data ?? []

  const handleEdit = useCallback((c: Classe) => {
    setEditClasse(c)
    setFormOpen(true)
  }, [])

  const handleDelete = useCallback((c: Classe) => {
    setDeleteTarget(c)
  }, [])

  const confirmDelete = useCallback(() => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id, {
        onSuccess: () => setDeleteTarget(null),
      })
    }
  }, [deleteTarget, deleteMutation])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Classes</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestion des classes de votre établissement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setBulkOpen(true)}>
            <Copy className="mr-2 h-4 w-4" />
            Créer en masse
          </Button>
          <Button onClick={() => { setEditClasse(null); setFormOpen(true) }}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle classe
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Rechercher une classe..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedLevelCategory(cat.value as LevelCategory || null)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                (selectedLevelCategory ?? '') === cat.value
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : classes.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="Aucune classe"
          description="Commencez par créer vos classes pour cette année scolaire."
          action={{ label: 'Créer une classe', onClick: () => setFormOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {classes.map((classe) => (
            <ClasseCard
              key={classe.id}
              classe={classe}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <ClasseFormModal
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setEditClasse(null) }}
        classe={editClasse}
      />
      <BulkClasseModal open={bulkOpen} onOpenChange={setBulkOpen} />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Supprimer la classe"
        description={`Êtes-vous sûr de vouloir supprimer ${deleteTarget?.display_name} ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        onConfirm={confirmDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
