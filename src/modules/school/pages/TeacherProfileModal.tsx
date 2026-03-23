import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Star, X, LoaderCircle } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/shared/components/ui/dialog'
import { useTeacher, useUpdateTeacher, useTeacherSubjects, useSyncTeacherSubjects } from '../hooks/useTeachers'
import { useSubjects } from '../hooks/useSubjects'

const schema = z.object({
  speciality: z.string().optional(),
  diploma: z.string().optional(),
  contract_type: z.enum(['permanent', 'contract', 'part_time', 'interim']).optional(),
  weekly_hours_max: z.coerce.number().min(1).max(40).optional(),
  hire_date: z.string().optional().nullable(),
  biography: z.string().max(1000).optional(),
  subject_ids: z.array(z.number()).optional(),
  primary_subject_id: z.number().nullable().optional(),
})

type FormValues = z.infer<typeof schema>

interface TeacherProfileModalProps {
  open: boolean
  onClose: () => void
  teacherId: number
}

export function TeacherProfileModal({ open, onClose, teacherId }: TeacherProfileModalProps) {
  const { data: teacherData } = useTeacher(teacherId)
  const teacher = teacherData?.data

  const { data: subjectsData } = useTeacherSubjects(teacherId)
  const { data: allSubjectsData } = useSubjects()
  const allSubjects = allSubjectsData?.data ?? []

  const updateMutation = useUpdateTeacher()
  const syncSubjectsMutation = useSyncTeacherSubjects()

  const isPending = updateMutation.isPending || syncSubjectsMutation.isPending

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      speciality: '',
      diploma: '',
      contract_type: undefined,
      weekly_hours_max: 18,
      hire_date: null,
      biography: '',
      subject_ids: [],
      primary_subject_id: null,
    },
  })

  useEffect(() => {
    if (teacher && open) {
      form.reset({
        speciality: teacher.speciality ?? '',
        diploma: teacher.diploma ?? '',
        contract_type: teacher.contract_type?.value as FormValues['contract_type'],
        weekly_hours_max: teacher.weekly_hours_max,
        hire_date: teacher.hire_date ?? null,
        biography: teacher.biography ?? '',
        subject_ids: (subjectsData?.data ?? []).map((s) => s.id),
        primary_subject_id: teacher.primary_subject?.id ?? null,
      })
    }
  }, [teacher, open, subjectsData])

  const onSubmit = async (values: FormValues) => {
    const { subject_ids, primary_subject_id, ...profileData } = values

    await updateMutation.mutateAsync({ id: teacherId, data: profileData })

    if (subject_ids !== undefined) {
      await syncSubjectsMutation.mutateAsync({
        id: teacherId,
        data: { subject_ids, primary_subject_id: primary_subject_id ?? null },
      })
    }

    onClose()
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  const watchedSubjectIds = form.watch('subject_ids') ?? []
  const watchedPrimaryId = form.watch('primary_subject_id')

  const toggleSubject = (subjectId: number) => {
    const current = watchedSubjectIds
    if (current.includes(subjectId)) {
      form.setValue('subject_ids', current.filter((id) => id !== subjectId))
      if (watchedPrimaryId === subjectId) {
        form.setValue('primary_subject_id', null)
      }
    } else {
      form.setValue('subject_ids', [...current, subjectId])
    }
  }

  const togglePrimary = (subjectId: number) => {
    form.setValue(
      'primary_subject_id',
      watchedPrimaryId === subjectId ? null : subjectId,
    )
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Profil pédagogique</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Infos pédagogiques */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Spécialité</Label>
              <Input {...form.register('speciality')} placeholder="Mathématiques" />
            </div>
            <div className="space-y-1">
              <Label>Diplôme</Label>
              <Input {...form.register('diploma')} placeholder="Master CAPES" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Type de contrat</Label>
              <select
                {...form.register('contract_type')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Sélectionner</option>
                <option value="permanent">Titulaire</option>
                <option value="contract">Contractuel</option>
                <option value="part_time">Temps partiel</option>
                <option value="interim">Intérimaire</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Charge max (h/sem)</Label>
              <Input
                type="number"
                min={1}
                max={40}
                {...form.register('weekly_hours_max', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Date d'embauche</Label>
            <Input type="date" {...form.register('hire_date')} />
          </div>

          {/* Matières */}
          <div className="space-y-2">
            <Label>Matières enseignées</Label>
            <p className="text-xs text-gray-400">
              Cliquez pour sélectionner — étoile pour définir la principale
            </p>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto rounded-md border border-gray-200 p-2">
              {allSubjects.map((subject) => {
                const isSelected = watchedSubjectIds.includes(subject.id)
                const isPrimary = watchedPrimaryId === subject.id

                return (
                  <div key={subject.id} className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => toggleSubject(subject.id)}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium border transition-colors ${
                        isSelected
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                          : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {subject.name}
                    </button>
                    {isSelected && (
                      <button
                        type="button"
                        onClick={() => togglePrimary(subject.id)}
                        className="p-0.5 rounded"
                        title="Définir comme principale"
                      >
                        <Star
                          className={`h-3.5 w-3.5 ${
                            isPrimary ? 'fill-amber-400 text-amber-400' : 'text-gray-300 hover:text-amber-300'
                          }`}
                        />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Selected preview */}
            {watchedSubjectIds.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {watchedSubjectIds.map((sid) => {
                  const s = allSubjects.find((s) => s.id === sid)
                  return s ? (
                    <span
                      key={sid}
                      className="inline-flex items-center gap-1 rounded-full bg-indigo-100 text-indigo-700 px-2 py-0.5 text-xs"
                    >
                      {watchedPrimaryId === sid && (
                        <Star className="h-2.5 w-2.5 fill-indigo-400 text-indigo-400" />
                      )}
                      {s.name}
                      <button
                        type="button"
                        onClick={() => toggleSubject(sid)}
                        className="hover:text-indigo-900"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ) : null
                })}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Enregistrement...</>
              ) : (
                'Sauvegarder'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
