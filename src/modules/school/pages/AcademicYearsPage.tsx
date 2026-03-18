import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Play, Lock, Trash2, CalendarDays, LoaderCircle } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/shared/components/ui/dialog'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { ConfirmDialog } from '@/shared/components/feedback/ConfirmDialog'
import {
  useAcademicYears,
  useCreateAcademicYear,
  useActivateAcademicYear,
  useCloseAcademicYear,
  useDeleteAcademicYear,
} from '../hooks/useAcademicYears'
import { useSchoolStore } from '../store/schoolStore'
import type { AcademicYear, AcademicYearFormData } from '../types/school.types'

const yearSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  start_date: z.string().min(1, 'Date de début requise'),
  end_date: z.string().min(1, 'Date de fin requise'),
  period_type: z.enum(['trimestre', 'semestre']),
  passing_average: z.number().min(0).max(20).optional(),
})

type YearFormValues = z.infer<typeof yearSchema>

function YearCard({
  year,
  isCurrent,
  onActivate,
  onClose,
  onDelete,
  onSelect,
}: {
  year: AcademicYear
  isCurrent: boolean
  onActivate: () => void
  onClose: () => void
  onDelete: () => void
  onSelect: () => void
}) {
  const statusColors: Record<string, string> = {
    draft: 'bg-amber-50 text-amber-700 border-amber-200',
    active: 'bg-green-50 text-green-700 border-green-200',
    closed: 'bg-slate-50 text-slate-500 border-slate-200',
  }

  return (
    <div
      className={`rounded-lg border p-5 transition-shadow hover:shadow-md cursor-pointer ${
        isCurrent ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-slate-200'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{year.name}</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {year.start_date} — {year.end_date}
          </p>
        </div>
        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColors[year.status.value]}`}>
          {year.status.label}
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
        <span>{year.period_type.label}</span>
        <span className="text-slate-300">|</span>
        <span>Moyenne : {year.passing_average}/20</span>
      </div>

      {/* Period timeline */}
      {year.periods && year.periods.length > 0 && (
        <div className="flex gap-1 mb-4">
          {year.periods.map((p) => (
            <div
              key={p.id}
              className={`flex-1 h-2 rounded-full ${
                p.is_current ? 'bg-indigo-500' : p.is_closed ? 'bg-slate-300' : 'bg-slate-200'
              }`}
              title={p.name}
            />
          ))}
        </div>
      )}

      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        {year.status.value === 'draft' && (
          <>
            <Button size="sm" variant="outline" onClick={onActivate}>
              <Play className="mr-1 h-3 w-3" /> Activer
            </Button>
            <Button size="sm" variant="outline" className="text-red-600" onClick={onDelete}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </>
        )}
        {year.status.value === 'active' && (
          <Button size="sm" variant="outline" onClick={onClose}>
            <Lock className="mr-1 h-3 w-3" /> Clôturer
          </Button>
        )}
      </div>
    </div>
  )
}

export function AcademicYearsPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AcademicYear | null>(null)
  const { currentYearId, setCurrentYearId } = useSchoolStore()

  const { data, isLoading } = useAcademicYears()
  const createMutation = useCreateAcademicYear()
  const activateMutation = useActivateAcademicYear()
  const closeMutation = useCloseAcademicYear()
  const deleteMutation = useDeleteAcademicYear()

  const years = data?.data ?? []

  const form = useForm<YearFormValues>({
    resolver: zodResolver(yearSchema),
    defaultValues: {
      name: '',
      start_date: '',
      end_date: '',
      period_type: 'trimestre',
      passing_average: 10,
    },
  })

  const onSubmit = (values: YearFormValues) => {
    createMutation.mutate(values as AcademicYearFormData, {
      onSuccess: () => { setFormOpen(false); form.reset() },
    })
  }

  if (isLoading) {
    return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Années scolaires</h1>
          <p className="text-sm text-slate-500 mt-1">Gestion des années et périodes académiques</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nouvelle année
        </Button>
      </div>

      {years.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Aucune année scolaire"
          description="Créez votre première année scolaire pour commencer."
          action={{ label: 'Créer une année', onClick: () => setFormOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {years.map((year) => (
            <YearCard
              key={year.id}
              year={year}
              isCurrent={currentYearId === year.id}
              onActivate={() => activateMutation.mutate(year.id)}
              onClose={() => closeMutation.mutate(year.id)}
              onDelete={() => setDeleteTarget(year)}
              onSelect={() => setCurrentYearId(year.id)}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvelle année scolaire</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nom</Label>
              <Input placeholder="2025-2026" {...form.register('name')} />
              {form.formState.errors.name && <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date début</Label>
                <Input type="date" {...form.register('start_date')} />
              </div>
              <div className="space-y-1.5">
                <Label>Date fin</Label>
                <Input type="date" {...form.register('end_date')} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Type de période</Label>
              <Controller
                name="period_type"
                control={form.control}
                render={({ field }) => (
                  <select
                    value={field.value}
                    onChange={field.onChange}
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="trimestre">Trimestre (3 périodes)</option>
                    <option value="semestre">Semestre (2 périodes)</option>
                  </select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Moyenne de passage (/20)</Label>
              <Input type="number" step="0.5" min={0} max={20} {...form.register('passing_average', { valueAsNumber: true })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                Créer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Supprimer l'année scolaire"
        description={`Supprimer ${deleteTarget?.name} ? Cette action supprimera aussi toutes les périodes associées.`}
        confirmLabel="Supprimer"
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) }) }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
