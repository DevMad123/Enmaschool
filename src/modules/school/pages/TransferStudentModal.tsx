import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowRight, LoaderCircle } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/shared/components/ui/dialog'
import { useTransferStudent } from '../hooks/useStudents'
import { useClasses } from '../hooks/useClasses'
import type { Enrollment } from '../types/students.types'

const transferSchema = z.object({
  new_classe_id: z.number({ error: 'Classe requise' }).min(1),
  note: z.string().max(500).optional(),
})

type TransferForm = z.infer<typeof transferSchema>

interface TransferStudentModalProps {
  open: boolean
  onClose: () => void
  enrollment: Enrollment
}

export function TransferStudentModal({ open, onClose, enrollment }: TransferStudentModalProps) {
  const { data: classesData } = useClasses({
    academic_year_id: enrollment.academic_year?.id,
  })

  const form = useForm<TransferForm>({
    resolver: zodResolver(transferSchema),
    defaultValues: { new_classe_id: undefined, note: '' },
  })

  const mutation = useTransferStudent()

  const classes = (classesData?.data ?? []).filter(
    (c) => c.id !== enrollment.classe?.id,
  )

  const watchedClasseId = form.watch('new_classe_id')
  const destClasse = classes.find((c) => c.id === watchedClasseId)

  const onSubmit = (values: TransferForm) => {
    mutation.mutate(
      { enrollmentId: enrollment.id, data: values },
      { onSuccess: onClose },
    )
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Transfert d'élève</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Résumé du transfert */}
          <div className="flex items-center justify-center gap-3 rounded-lg bg-gray-50 px-4 py-3 text-sm">
            <span className="font-medium text-gray-700">
              {enrollment.classe?.display_name ?? 'Classe actuelle'}
            </span>
            <ArrowRight className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="font-medium text-indigo-600">
              {destClasse?.display_name ?? '—'}
            </span>
          </div>

          {/* Classe de destination */}
          <div className="space-y-1">
            <Label>Classe de destination *</Label>
            <select
              {...form.register('new_classe_id', { valueAsNumber: true })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Sélectionner une classe</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.display_name}
                </option>
              ))}
            </select>
            {form.formState.errors.new_classe_id && (
              <p className="text-xs text-red-500">{form.formState.errors.new_classe_id.message}</p>
            )}
          </div>

          {/* Motif */}
          <div className="space-y-1">
            <Label>Motif du transfert</Label>
            <textarea
              {...form.register('note')}
              rows={3}
              placeholder="Ex: Demande des parents, rééquilibrage des effectifs..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Transfert...</>
              ) : (
                'Confirmer le transfert'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
