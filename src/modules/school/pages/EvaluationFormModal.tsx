import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { LoaderCircle } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/shared/components/ui/dialog'
import { EvaluationTypeBadge } from '../components/EvaluationTypeBadge'
import { useCreateEvaluation, useUpdateEvaluation } from '../hooks/useGrades'
import type { Evaluation, EvaluationType } from '../types/grades.types'
import { EVALUATION_TYPE_LABELS, EVALUATION_TYPE_COLORS } from '../types/grades.types'

const schema = z.object({
  title:       z.string().min(1).max(200),
  type:        z.string(),
  date:        z.string(),
  max_score:   z.coerce.number().min(1).max(100),
  coefficient: z.coerce.number().min(0.5).max(5.0),
  description: z.string().max(1000).optional().nullable(),
})

type FormValues = z.infer<typeof schema>

const DEFAULT_COEFFICIENTS: Record<EvaluationType, number> = {
  dc: 1.0, dm: 0.5, composition: 2.0,
  exam: 3.0, interrogation: 0.5, tp: 1.0, other: 1.0,
}

interface EvaluationFormModalProps {
  open: boolean
  onClose: () => void
  classeId: number
  subjectId: number
  periodId: number
  academicYearId: number
  evaluation?: Evaluation | null
}

export function EvaluationFormModal({
  open,
  onClose,
  classeId,
  subjectId,
  periodId,
  academicYearId,
  evaluation,
}: EvaluationFormModalProps) {
  const isEdit = !!evaluation

  const createMutation = useCreateEvaluation()
  const updateMutation = useUpdateEvaluation()
  const isPending = createMutation.isPending || updateMutation.isPending

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      title:       '',
      type:        'dc',
      date:        new Date().toISOString().split('T')[0],
      max_score:   20,
      coefficient: 1.0,
      description: '',
    },
  })

  const watchedType = form.watch('type') as EvaluationType

  useEffect(() => {
    if (evaluation && open) {
      form.reset({
        title:       evaluation.title,
        type:        evaluation.type.value,
        date:        evaluation.date,
        max_score:   evaluation.max_score,
        coefficient: evaluation.coefficient,
        description: evaluation.description ?? '',
      })
    } else if (!evaluation && open) {
      form.reset({
        title:       '',
        type:        'dc',
        date:        new Date().toISOString().split('T')[0],
        max_score:   20,
        coefficient: 1.0,
        description: '',
      })
    }
  }, [evaluation, open])

  // Auto-fill coefficient when type changes (new eval only)
  useEffect(() => {
    if (!isEdit) {
      form.setValue('coefficient', DEFAULT_COEFFICIENTS[watchedType] ?? 1.0)
    }
  }, [watchedType, isEdit])

  const handleClose = () => {
    form.reset()
    onClose()
  }

  const onSubmit = (values: FormValues) => {
    if (isEdit && evaluation) {
      updateMutation.mutate(
        { id: evaluation.id, data: { ...values, type: values.type as EvaluationType, description: values.description ?? undefined } },
        { onSuccess: handleClose },
      )
    } else {
      createMutation.mutate(
        {
          ...values,
          type:             values.type as EvaluationType,
          class_id:         classeId,
          subject_id:       subjectId,
          period_id:        periodId,
          academic_year_id: academicYearId,
          description:      values.description ?? undefined,
        },
        { onSuccess: handleClose },
      )
    }
  }

  const evalTypes = Object.keys(EVALUATION_TYPE_LABELS) as EvaluationType[]

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier l\'évaluation' : 'Nouvelle évaluation'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Titre */}
          <div className="space-y-1">
            <Label>Titre *</Label>
            <Input {...form.register('title')} placeholder="ex: DC1 Mathématiques" />
            {form.formState.errors.title && (
              <p className="text-xs text-red-500">{form.formState.errors.title.message}</p>
            )}
          </div>

          {/* Type */}
          <div className="space-y-1">
            <Label>Type *</Label>
            <div className="flex flex-wrap gap-2">
              {evalTypes.map((t) => {
                const isSelected = watchedType === t
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => form.setValue('type', t)}
                    className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors
                      ${isSelected ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <EvaluationTypeBadge type={t} color={EVALUATION_TYPE_COLORS[t]} />
                    <span className="text-gray-600">{EVALUATION_TYPE_LABELS[t]}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Date + Barème */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Date *</Label>
              <Input type="date" {...form.register('date')} />
            </div>
            <div className="space-y-1">
              <Label>Barème *</Label>
              <Input
                type="number"
                step="1"
                min="1"
                max="100"
                {...form.register('max_score', { valueAsNumber: true })}
                placeholder="20"
              />
            </div>
          </div>

          {/* Coefficient */}
          <div className="space-y-1">
            <Label>Coefficient</Label>
            <Input
              type="number"
              step="0.5"
              min="0.5"
              max="5"
              {...form.register('coefficient', { valueAsNumber: true })}
            />
            <p className="text-xs text-gray-400">
              Poids de l'évaluation dans la moyenne de la matière
            </p>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label>Description</Label>
            <textarea
              {...form.register('description')}
              rows={2}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Instructions ou remarques..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={handleClose}>Annuler</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />{isEdit ? 'Mise à jour...' : 'Création...'}</>
              ) : (
                isEdit ? 'Mettre à jour' : 'Créer l\'évaluation'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
