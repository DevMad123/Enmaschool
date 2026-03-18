import { useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { LoaderCircle } from 'lucide-react'
import { useSchoolLevels } from '../hooks/useSchoolLevels'
import { useAcademicYears } from '../hooks/useAcademicYears'
import { useBulkCreateClasses } from '../hooks/useClasses'
import { SectionMultiPicker } from '../components/SectionMultiPicker'
import { SerieSelect } from '../components/SerieSelect'
import { previewDisplayName } from '../lib/classeHelpers'
import type { LyceeSerie } from '../types/school.types'

const SERIE_VALUES: [LyceeSerie, ...LyceeSerie[]] = ['A', 'B', 'C', 'D', 'F1', 'F2', 'G1', 'G2', 'G3']

const bulkSchema = z.object({
  academic_year_id: z.number({ error: 'Année scolaire requise' }).min(1),
  school_level_id: z.number({ error: 'Niveau requis' }).min(1),
  serie: z.enum(SERIE_VALUES).nullable(),
  sections: z.array(z.string()).min(1, 'Sélectionnez au moins une section'),
  capacity: z.number().min(1).max(200),
})

type BulkFormValues = z.infer<typeof bulkSchema>

interface BulkClasseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BulkClasseModal({ open, onOpenChange }: BulkClasseModalProps) {
  const { data: levelsData } = useSchoolLevels()
  const { data: yearsData } = useAcademicYears()
  const bulkMutation = useBulkCreateClasses()

  const levels = levelsData?.data ?? []
  const years = yearsData?.data ?? []

  const form = useForm<BulkFormValues>({
    resolver: zodResolver(bulkSchema),
    defaultValues: {
      academic_year_id: undefined,
      school_level_id: undefined,
      serie: null,
      sections: [],
      capacity: 40,
    },
  })

  const watchedLevelId = form.watch('school_level_id')
  const watchedSerie = form.watch('serie')
  const watchedSections = form.watch('sections')

  const selectedLevel = useMemo(
    () => levels.find((l) => l.id === watchedLevelId),
    [levels, watchedLevelId],
  )

  useEffect(() => {
    if (selectedLevel && !selectedLevel.requires_serie) {
      form.setValue('serie', null)
    }
  }, [selectedLevel, form])

  useEffect(() => {
    if (open) {
      form.reset({
        academic_year_id: undefined,
        school_level_id: undefined,
        serie: null,
        sections: [],
        capacity: 40,
      })
    }
  }, [open, form])

  const previews = useMemo(() => {
    if (!selectedLevel || watchedSections.length === 0) return []
    return watchedSections.map((section) =>
      previewDisplayName(selectedLevel, section, watchedSerie as LyceeSerie | null),
    )
  }, [selectedLevel, watchedSections, watchedSerie])

  const onSubmit = (values: BulkFormValues) => {
    bulkMutation.mutate(
      {
        ...values,
        serie: selectedLevel?.requires_serie ? (values.serie as LyceeSerie) : null,
      },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer des classes en masse</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Année scolaire */}
          <div className="space-y-1.5">
            <Label>Année scolaire</Label>
            <Controller
              name="academic_year_id"
              control={form.control}
              render={({ field }) => (
                <select
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Choisir</option>
                  {years.map((y) => (
                    <option key={y.id} value={y.id}>{y.name}</option>
                  ))}
                </select>
              )}
            />
          </div>

          {/* Niveau */}
          <div className="space-y-1.5">
            <Label>Niveau</Label>
            <Controller
              name="school_level_id"
              control={form.control}
              render={({ field }) => (
                <select
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Choisir un niveau</option>
                  {levels.map((l) => (
                    <option key={l.id} value={l.id}>{l.label} ({l.short_label})</option>
                  ))}
                </select>
              )}
            />
          </div>

          {/* Série (conditionnel) */}
          {selectedLevel?.requires_serie && (
            <div className="space-y-1.5">
              <Label>Série</Label>
              <Controller
                name="serie"
                control={form.control}
                render={({ field }) => (
                  <SerieSelect
                    value={field.value as LyceeSerie | null}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
          )}

          {/* Sections */}
          <div className="space-y-1.5">
            <Label>Sections à créer</Label>
            <Controller
              name="sections"
              control={form.control}
              render={({ field }) => (
                <SectionMultiPicker selected={field.value} onChange={field.onChange} />
              )}
            />
            {form.formState.errors.sections && (
              <p className="text-xs text-red-500">{form.formState.errors.sections.message}</p>
            )}
          </div>

          {/* Capacité */}
          <div className="space-y-1.5">
            <Label>Capacité (appliquée à toutes)</Label>
            <Input
              type="number"
              min={1}
              max={200}
              {...form.register('capacity', { valueAsNumber: true })}
            />
          </div>

          {/* Preview */}
          {previews.length > 0 && (
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3">
              <p className="text-xs font-medium text-indigo-600 mb-2">
                {previews.length} classe(s) à créer :
              </p>
              <div className="flex flex-wrap gap-2">
                {previews.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center rounded-md bg-white px-2.5 py-1 text-sm font-semibold text-indigo-700 border border-indigo-200"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={bulkMutation.isPending}>
              Annuler
            </Button>
            <Button type="submit" disabled={bulkMutation.isPending}>
              {bulkMutation.isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              Créer {previews.length > 0 ? `(${previews.length})` : ''}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
