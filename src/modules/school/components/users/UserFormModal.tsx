// ===== src/modules/school/components/users/UserFormModal.tsx =====

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { useCreateUser, useUpdateUser } from '../../hooks/useUsers'
import { STAFF_ROLES, USER_ROLE_LABELS, type UserRole, type SchoolUser } from '../../types/users.types'

const STAFF_ROLE_VALUES = STAFF_ROLES as [UserRole, ...UserRole[]]

const userSchema = z
  .object({
    first_name:            z.string().min(2, 'Prénom requis'),
    last_name:             z.string().min(2, 'Nom requis'),
    email:                 z.string().email('Email invalide'),
    password:              z.string().min(8, 'Minimum 8 caractères').optional().or(z.literal('')),
    password_confirmation: z.string().optional().or(z.literal('')),
    role:                  z.enum(STAFF_ROLE_VALUES, { error: 'Rôle requis' }),
    phone:                 z.string().max(20).optional().or(z.literal('')),
  })
  .refine(
    (data) => !data.password || data.password === data.password_confirmation,
    { message: 'Les mots de passe ne correspondent pas', path: ['password_confirmation'] },
  )

type FormValues = z.infer<typeof userSchema>

interface UserFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: SchoolUser | null
}

export function UserFormModal({ open, onOpenChange, user }: UserFormModalProps) {
  const isEdit = !!user
  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser()
  const [showPwd, setShowPwd] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      first_name: user?.first_name ?? '',
      last_name:  user?.last_name ?? '',
      email:      user?.email ?? '',
      role:       user?.role?.value ?? 'teacher',
      phone:      user?.phone ?? '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        first_name: user?.first_name ?? '',
        last_name:  user?.last_name ?? '',
        email:      user?.email ?? '',
        role:       user?.role?.value ?? 'teacher',
        phone:      user?.phone ?? '',
        password:   '',
        password_confirmation: '',
      })
    }
  }, [open, user, reset])

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      ...values,
      password:              values.password || undefined,
      password_confirmation: values.password_confirmation || undefined,
      phone:                 values.phone || undefined,
    }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: user.id, data: payload })
      } else {
        await createMutation.mutateAsync(payload as any)
      }
      onOpenChange(false)
    } catch {
      // handled by hook
    }
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier l\'utilisateur' : 'Créer un utilisateur'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 py-2">
          {/* Prénom + Nom */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="first_name">Prénom</Label>
              <Input id="first_name" {...register('first_name')} />
              {errors.first_name && (
                <p className="text-xs text-red-500">{errors.first_name.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="last_name">Nom</Label>
              <Input id="last_name" {...register('last_name')} />
              {errors.last_name && (
                <p className="text-xs text-red-500">{errors.last_name.message}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          {/* Mot de passe */}
          <div className="space-y-1">
            <Label htmlFor="password">
              Mot de passe {isEdit && <span className="text-gray-400">(laisser vide pour ne pas modifier)</span>}
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPwd ? 'text' : 'password'}
                {...register('password')}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="password_confirmation">Confirmation du mot de passe</Label>
            <Input
              id="password_confirmation"
              type={showPwd ? 'text' : 'password'}
              {...register('password_confirmation')}
            />
            {errors.password_confirmation && (
              <p className="text-xs text-red-500">{errors.password_confirmation.message}</p>
            )}
          </div>

          {/* Rôle */}
          <div className="space-y-1">
            <Label htmlFor="role">Rôle</Label>
            <select
              id="role"
              {...register('role')}
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r}>
                  {USER_ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            {errors.role && <p className="text-xs text-red-500">{errors.role.message}</p>}
          </div>

          {/* Téléphone */}
          <div className="space-y-1">
            <Label htmlFor="phone">Téléphone <span className="text-gray-400">(optionnel)</span></Label>
            <Input id="phone" type="tel" {...register('phone')} />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Annuler
          </Button>
          <Button onClick={onSubmit} disabled={isPending || isSubmitting}>
            {isPending ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
