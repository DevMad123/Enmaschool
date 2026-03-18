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
import { useCreateClasse, useUpdateClasse } from '../hooks/useClasses'
import { ClasseDisplayNamePreview } from '../components/ClasseDisplayNamePreview'
import { SerieSelect } from '../components/SerieSelect'
import { SectionSelect } from '../components/SectionSelect'
import type { Classe, ClasseFormData, LyceeSerie } from '../types/school.types'

const SERIE_VALUES: [LyceeSerie, ...LyceeSerie[]] = ['A', 'B', 'C', 'D', 'F1', 'F2', 'G1', 'G2', 'G3']

const classeSchema = z.object({
  academic_year_id: z.number({ error: 'Année scolaire requise' }).min(1),
  school_level_id: z.number({ error: 'Niveau requis' }).min(1),
  serie: z.enum(SERIE_VALUES).nullable(),
  section: z.string().min(1, 'La section est obligatoire'),
  capacity: z.number().min(1).max(200),
  main_teacher_id: z.number().min(1).nullable().optional(),
  room_id: z.number().min(1).nullable().optional(),
})

type FormValues = z.infer<typeof classeSchema>

interface ClasseFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classe?: Classe | null
}

export function ClasseFormModal({ open, onOpenChange, classe }: ClasseFormModalProps) {
  const isEdit = !!classe
  const { data: levelsData } = useSchoolLevels()
  const { data: yearsData } = useAcademicYears()
  const createMutation = useCreateClasse()
  const updateMutation = useUpdateClasse()

  const levels = levelsData?.data ?? []
  const years = yearsData?.data ?? []

  const form = useForm<FormValues>({
    resolver: zodResolver(classeSchema),
    defaultValues: {
      academic_year_id: classe?.academic_year_id,
      school_level_id: classe?.level?.id,
      serie: classe?.serie ?? null,
      section: classe?.section ?? '',
      capacity: classe?.capacity ?? 40,
      main_teacher_id: null,
      room_id: null,
    },
  })

  const watchedLevelId = form.watch('school_level_id')
  const watchedSerie = form.watch('serie')
  const watchedSection = form.watch('section')

  const selectedLevel = useMemo(
    () => levels.find((l) => l.id === watchedLevelId),
    [levels, watchedLevelId],
  )

  // Reset serie when level changes to a non-serie level
  useEffect(() => {
    if (selectedLevel && !selectedLevel.requires_serie) {
      form.setValue('serie', null)
    }
  }, [selectedLevel, form])

  // Reset form when modal opens with different classe
  useEffect(() => {
    if (open) {
      form.reset({
        academic_year_id: classe?.academic_year_id,
        school_level_id: classe?.level?.id,
        serie: classe?.serie ?? null,
        section: classe?.section ?? '',
        capacity: classe?.capacity ?? 40,
        main_teacher_id: null,
        room_id: null,
      })
    }
  }, [open, classe, form])

  const onSubmit = (values: FormValues) => {
    const payload: ClasseFormData = {
      ...values,
      serie: selectedLevel?.requires_serie ? (values.serie as LyceeSerie) : null,
    }

    if (isEdit && classe) {
      updateMutation.mutate(
        { id: classe.id, data: payload },
        { onSuccess: () => onOpenChange(false) },
      )
    } else {
      createMutation.mutate(payload, { onSuccess: () => onOpenChange(false) })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier la classe' : 'Nouvelle classe'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Preview */}
          <ClasseDisplayNamePreview
            level={selectedLevel}
            serie={watchedSerie as LyceeSerie | null}
            section={watchedSection}
          />

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
                    <option key={y.id} value={y.id}>
                      {y.name}
                    </option>
                  ))}
                </select>
              )}
            />
            {form.formState.errors.academic_year_id && (
              <p className="text-xs text-red-500">{form.formState.errors.academic_year_id.message}</p>
            )}
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
                    <option key={l.id} value={l.id}>
                      {l.label} ({l.short_label})
                    </option>
                  ))}
                </select>
              )}
            />
            {form.formState.errors.school_level_id && (
              <p className="text-xs text-red-500">{form.formState.errors.school_level_id.message}</p>
            )}
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
              {form.formState.errors.serie && (
                <p className="text-xs text-red-500">{form.formState.errors.serie.message}</p>
              )}
            </div>
          )}

          {/* Section */}
          <div className="space-y-1.5">
            <Label>Section</Label>
            <Controller
              name="section"
              control={form.control}
              render={({ field }) => (
                <SectionSelect value={field.value} onChange={field.onChange} />
              )}
            />
            {form.formState.errors.section && (
              <p className="text-xs text-red-500">{form.formState.errors.section.message}</p>
            )}
          </div>

          {/* Capacité */}
          <div className="space-y-1.5">
            <Label>Capacité</Label>
            <Input
              type="number"
              min={1}
              max={200}
              {...form.register('capacity', { valueAsNumber: true })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
