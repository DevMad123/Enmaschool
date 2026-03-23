import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { GraduationCap, LoaderCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import { Input } from '@/shared/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/shared/components/ui/dialog'
import { useEnrollStudent } from '../hooks/useStudents'
import { useAcademicYears } from '../hooks/useAcademicYears'
import { useClasses } from '../hooks/useClasses'
import { useSchoolStore } from '../store/schoolStore'

const enrollSchema = z.object({
  academic_year_id: z.number({ error: 'Année scolaire requise' }).min(1),
  classe_id: z.number({ error: 'Classe requise' }).min(1),
  enrollment_date: z.string().min(1, 'Date requise'),
})

type EnrollForm = z.infer<typeof enrollSchema>

interface EnrollmentModalProps {
  open: boolean
  onClose: () => void
  studentId: number
  studentName: string
}

export function EnrollmentModal({ open, onClose, studentId, studentName }: EnrollmentModalProps) {
  const { currentYearId } = useSchoolStore()

  const { data: yearsData } = useAcademicYears()
  const { data: classesData } = useClasses()

  const form = useForm<EnrollForm>({
    resolver: zodResolver(enrollSchema),
    defaultValues: {
      academic_year_id: currentYearId ?? undefined,
      classe_id: undefined,
      enrollment_date: new Date().toISOString().slice(0, 10),
    },
  })

  const mutation = useEnrollStudent()

  const watchedYearId = form.watch('academic_year_id')
  const watchedClasseId = form.watch('classe_id')

  const years = yearsData?.data ?? []
  const classes = (classesData?.data ?? []).filter(
    (c) => !watchedYearId || c.academic_year_id === watchedYearId,
  )

  const selectedClasse = classes.find((c) => c.id === watchedClasseId)
  const enrolledCount = 0 // À enrichir avec le count de l'API
  const capacity = selectedClasse?.capacity ?? 40
  const fillRatio = capacity > 0 ? enrolledCount / capacity : 0
  const nearlyFull = fillRatio >= 0.9

  useEffect(() => {
    if (open) {
      form.reset({
        academic_year_id: currentYearId ?? undefined,
        classe_id: undefined,
        enrollment_date: new Date().toISOString().slice(0, 10),
      })
    }
  }, [open, currentYearId])

  const onSubmit = (values: EnrollForm) => {
    mutation.mutate(
      { ...values, student_id: studentId },
      { onSuccess: onClose },
    )
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-indigo-500" />
            Inscrire {studentName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Année scolaire */}
          <div className="space-y-1">
            <Label>Année scolaire *</Label>
            <select
              {...form.register('academic_year_id', { valueAsNumber: true })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Sélectionner une année</option>
              {years.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name} {y.status.value === 'active' ? '(Active)' : ''}
                </option>
              ))}
            </select>
            {form.formState.errors.academic_year_id && (
              <p className="text-xs text-red-500">{form.formState.errors.academic_year_id.message}</p>
            )}
          </div>

          {/* Classe */}
          <div className="space-y-1">
            <Label>Classe *</Label>
            <select
              {...form.register('classe_id', { valueAsNumber: true })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Sélectionner une classe</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.display_name} (capacité: {c.capacity})
                </option>
              ))}
            </select>
            {form.formState.errors.classe_id && (
              <p className="text-xs text-red-500">{form.formState.errors.classe_id.message}</p>
            )}
          </div>

          {/* Alerte capacité */}
          {nearlyFull && selectedClasse && (
            <div className="flex items-center gap-2 rounded-md bg-orange-50 px-3 py-2 text-sm text-orange-700">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Cette classe est presque complète ({enrolledCount}/{capacity} places)
            </div>
          )}

          {/* Date d'inscription */}
          <div className="space-y-1">
            <Label>Date d'inscription *</Label>
            <Input type="date" {...form.register('enrollment_date')} />
            {form.formState.errors.enrollment_date && (
              <p className="text-xs text-red-500">{form.formState.errors.enrollment_date.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Inscription...</>
              ) : (
                'Inscrire'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
