import { useState } from 'react'
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
import { useCreateUser } from '../hooks/useUsers'
import { useCreateTeacher } from '../hooks/useTeachers'
import { useSubjects } from '../hooks/useSubjects'

const schema = z.object({
  first_name: z.string().min(1, 'Prénom requis'),
  last_name: z.string().min(1, 'Nom requis'),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Minimum 8 caractères'),
  password_confirmation: z.string().min(1, 'Confirmation requise'),
  phone: z.string().optional(),
  subject_id: z.coerce.number().optional(),
  contract_type: z.enum(['permanent', 'contract', 'part_time', 'interim']).optional(),
  weekly_hours_max: z.coerce.number().min(1).max(40).optional(),
}).refine((d) => d.password === d.password_confirmation, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['password_confirmation'],
})

type FormValues = z.infer<typeof schema>

interface CreateTeacherModalProps {
  open: boolean
  onClose: () => void
}

export function CreateTeacherModal({ open, onClose }: CreateTeacherModalProps) {
  const [step, setStep] = useState<'user' | 'saving'>('user')

  const createUserMutation = useCreateUser()
  const createTeacherMutation = useCreateTeacher()
  const { data: subjectsData } = useSubjects()
  const subjects = subjectsData?.data ?? []

  const isPending = createUserMutation.isPending || createTeacherMutation.isPending

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      password_confirmation: '',
      phone: '',
      subject_id: undefined,
      contract_type: undefined,
      weekly_hours_max: 18,
    },
  })

  const onSubmit = async (values: FormValues) => {
    setStep('saving')

    // 1. Create user with teacher role
    const userRes = await createUserMutation.mutateAsync({
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email,
      password: values.password,
      password_confirmation: values.password_confirmation,
      phone: values.phone || undefined,
      role: 'teacher',
    }).catch(() => null)

    if (!userRes) {
      setStep('user')
      return
    }

    const selectedSubject = subjects.find((s) => s.id === values.subject_id)

    // 2. Create teacher profile linked to the user
    const teacherRes = await createTeacherMutation.mutateAsync({
      user_id: userRes.data.id,
      speciality: selectedSubject?.name || undefined,
      subject_ids: values.subject_id ? [values.subject_id] : [],
      primary_subject_id: values.subject_id || null,
      contract_type: values.contract_type,
      weekly_hours_max: values.weekly_hours_max,
    }).catch(() => null)

    if (teacherRes) handleClose()
    else setStep('user')
  }

  const handleClose = () => {
    form.reset()
    setStep('user')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un enseignant</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Prénom *</Label>
              <Input {...form.register('first_name')} placeholder="Jean" />
              {form.formState.errors.first_name && (
                <p className="text-xs text-red-500">{form.formState.errors.first_name.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Nom *</Label>
              <Input {...form.register('last_name')} placeholder="KOUASSI" />
              {form.formState.errors.last_name && (
                <p className="text-xs text-red-500">{form.formState.errors.last_name.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label>Email *</Label>
            <Input type="email" {...form.register('email')} placeholder="jean.kouassi@ecole.ci" />
            {form.formState.errors.email && (
              <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Téléphone</Label>
            <Input {...form.register('phone')} placeholder="0701234567" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Mot de passe *</Label>
              <Input type="password" {...form.register('password')} />
              {form.formState.errors.password && (
                <p className="text-xs text-red-500">{form.formState.errors.password.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Confirmation *</Label>
              <Input type="password" {...form.register('password_confirmation')} />
              {form.formState.errors.password_confirmation && (
                <p className="text-xs text-red-500">{form.formState.errors.password_confirmation.message}</p>
              )}
            </div>
          </div>

          <hr className="border-gray-100" />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Matière principale</Label>
              <select
                {...form.register('subject_id', { valueAsNumber: true })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Aucune</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Charge max (h/sem)</Label>
              <Input type="number" min={1} max={40} {...form.register('weekly_hours_max', { valueAsNumber: true })} />
            </div>
          </div>

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

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={handleClose}>Annuler</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />{step === 'saving' ? 'Création...' : 'Enregistrement...'}</>
              ) : (
                'Créer l\'enseignant'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
