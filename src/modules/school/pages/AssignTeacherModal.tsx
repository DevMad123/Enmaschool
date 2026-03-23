import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertTriangle, LoaderCircle } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/shared/components/ui/dialog'
import { TeacherSearchSelect } from '../components/TeacherSearchSelect'
import { useAssignTeacher, useUpdateAssignment } from '../hooks/useTeachers'
import { useAcademicYears } from '../hooks/useAcademicYears'
import { useClasses } from '../hooks/useClasses'
import { useSubjects } from '../hooks/useSubjects'
import { useSchoolStore } from '../store/schoolStore'
import type { TeacherAssignment } from '../types/teachers.types'

const schema = z.object({
  teacher_id: z.number().optional(),
  class_id: z.number().optional(),
  subject_id: z.number().optional(),
  academic_year_id: z.number().optional(),
  hours_per_week: z.coerce.number().min(0.5).max(40).optional().nullable(),
  assigned_at: z.string().optional(),
  notes: z.string().max(500).optional(),
})

type FormValues = z.infer<typeof schema>

interface AssignTeacherModalProps {
  open: boolean
  onClose: () => void
  teacherId?: number   // pré-sélectionné si ouvert depuis le profil enseignant
  classeId?: number    // pré-sélectionné si ouvert depuis la page classe
  assignment?: TeacherAssignment  // mode édition
}

export function AssignTeacherModal({ open, onClose, teacherId, classeId, assignment }: AssignTeacherModalProps) {
  const isEdit = !!assignment
  const { currentYearId } = useSchoolStore()
  const [warning, setWarning] = useState<string | null>(null)

  const { data: yearsData } = useAcademicYears()
  const years = yearsData?.data ?? []

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      teacher_id: teacherId ?? undefined,
      class_id: classeId ?? undefined,
      subject_id: undefined,
      academic_year_id: currentYearId ?? 0,
      hours_per_week: null,
      assigned_at: '',
      notes: '',
    },
  })

  // Pré-remplissage en mode édition
  useEffect(() => {
    if (assignment && open) {
      // API returns assigned_at in DD/MM/YYYY — convert to YYYY-MM-DD for <input type="date">
      const toIsoDate = (s: string | null | undefined): string => {
        if (!s) return ''
        const [d, m, y] = s.split('/')
        return d && m && y ? `${y}-${m}-${d}` : ''
      }
      form.reset({
        teacher_id: assignment.teacher?.id ?? teacherId,
        class_id: assignment.classe?.id,
        subject_id: assignment.subject?.id,
        academic_year_id: assignment.academic_year?.id ?? currentYearId ?? 0,
        hours_per_week: assignment.hours_per_week ?? null,
        assigned_at: toIsoDate(assignment.assigned_at),
        notes: assignment.notes ?? '',
      })
    } else if (!assignment && open) {
      form.reset({
        teacher_id: teacherId ?? undefined,
        class_id: classeId ?? undefined,
        subject_id: undefined,
        academic_year_id: currentYearId ?? 0,
        hours_per_week: null,
        assigned_at: '',
        notes: '',
      })
      setWarning(null)
    }
  }, [assignment, open])

  const watchedYearId = form.watch('academic_year_id') ?? 0

  const { data: classesData } = useClasses({ academic_year_id: watchedYearId || undefined })
  const { data: subjectsData } = useSubjects()

  const classes = classesData?.data ?? []
  const subjects = subjectsData?.data ?? []

  const assignMutation = useAssignTeacher()
  const updateMutation = useUpdateAssignment()
  const isPending = assignMutation.isPending || updateMutation.isPending

  const onSubmit = (values: FormValues) => {
    if (isEdit) {
      updateMutation.mutate(
        {
          id: assignment!.id,
          data: {
            hours_per_week: values.hours_per_week ?? null,
            notes: values.notes || undefined,
            assigned_at: values.assigned_at || undefined,
          },
        },
        { onSuccess: handleClose },
      )
    } else {
      if (!values.teacher_id || !values.class_id || !values.subject_id) return

      assignMutation.mutate(
        {
          teacher_id: values.teacher_id,
          class_id: values.class_id,
          subject_id: values.subject_id,
          academic_year_id: values.academic_year_id ?? 0,
          hours_per_week: values.hours_per_week ?? undefined,
          assigned_at: values.assigned_at || undefined,
          notes: values.notes || undefined,
        },
        {
          onSuccess: (res) => {
            if (res.data.warning) {
              setWarning(res.data.warning)
            } else {
              handleClose()
            }
          },
        },
      )
    }
  }

  const handleClose = () => {
    setWarning(null)
    form.reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier l\'affectation' : 'Affecter un enseignant'}</DialogTitle>
        </DialogHeader>

        {warning && (
          <div className="flex items-start gap-2 rounded-lg bg-orange-50 border border-orange-200 px-4 py-3 text-sm text-orange-700">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Attention</p>
              <p>{warning}</p>
            </div>
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {isEdit ? (
            /* Mode édition : infos en lecture seule */
            <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 space-y-1 text-sm">
              <div className="flex gap-2">
                <span className="text-gray-400 w-20">Classe</span>
                <span className="font-medium text-gray-700">{assignment!.classe?.display_name ?? '—'}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-400 w-20">Matière</span>
                <span className="font-medium text-gray-700">{assignment!.subject?.name ?? '—'}</span>
              </div>
              {assignment!.teacher && (
                <div className="flex gap-2">
                  <span className="text-gray-400 w-20">Enseignant</span>
                  <span className="font-medium text-gray-700">{assignment!.teacher.full_name}</span>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Année scolaire */}
              <div className="space-y-1">
                <Label>Année scolaire *</Label>
                <select
                  {...form.register('academic_year_id', { valueAsNumber: true })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  {years.map((y) => (
                    <option key={y.id} value={y.id}>{y.name}</option>
                  ))}
                </select>
              </div>

              {/* Classe */}
              <div className="space-y-1">
                <Label>Classe *</Label>
                <select
                  {...form.register('class_id', { valueAsNumber: true })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value={0}>Sélectionner une classe...</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.display_name}</option>
                  ))}
                </select>
                {form.formState.errors.class_id && (
                  <p className="text-xs text-red-500">{form.formState.errors.class_id.message}</p>
                )}
              </div>

              {/* Matière */}
              <div className="space-y-1">
                <Label>Matière *</Label>
                <select
                  {...form.register('subject_id', { valueAsNumber: true })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value={0}>Sélectionner une matière...</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {form.formState.errors.subject_id && (
                  <p className="text-xs text-red-500">{form.formState.errors.subject_id.message}</p>
                )}
              </div>

              {/* Enseignant */}
              {!teacherId && (
                <div className="space-y-1">
                  <Label>Enseignant *</Label>
                  <TeacherSearchSelect
                    value={form.watch('teacher_id') ?? null}
                    onChange={(id) => form.setValue('teacher_id', id ?? undefined)}
                    yearId={watchedYearId}
                  />
                  {form.formState.errors.teacher_id && (
                    <p className="text-xs text-red-500">{form.formState.errors.teacher_id.message}</p>
                  )}
                </div>
              )}
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Heures/semaine</Label>
              <Input
                type="number"
                step="0.5"
                min="0.5"
                max="40"
                {...form.register('hours_per_week', { valueAsNumber: true })}
                placeholder="ex: 4"
              />
            </div>
            <div className="space-y-1">
              <Label>Date d'affectation</Label>
              <Input type="date" {...form.register('assigned_at')} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Notes</Label>
            <textarea
              {...form.register('notes')}
              rows={2}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Informations complémentaires..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />{isEdit ? 'Mise à jour...' : 'Affectation...'}</>
              ) : isEdit ? (
                'Enregistrer'
              ) : warning ? (
                'Confirmer quand même'
              ) : (
                'Affecter'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
