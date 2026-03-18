// ===== src/modules/school/pages/users/AcceptInvitationPage.tsx =====

import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { acceptInvitation } from '../../api/users.api'

const schema = z
  .object({
    first_name:            z.string().min(2, 'Prénom requis'),
    last_name:             z.string().min(2, 'Nom requis'),
    password:              z.string().min(8, 'Minimum 8 caractères'),
    password_confirmation: z.string(),
    phone:                 z.string().max(20).optional().or(z.literal('')),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['password_confirmation'],
  })

type FormValues = z.infer<typeof schema>

export function AcceptInvitationPage() {
  const [searchParams] = useSearchParams()
  const navigate        = useNavigate()
  const token           = searchParams.get('token') ?? ''
  const setAuth         = useAuthStore((s) => s.setAuth)
  const [showPwd, setShowPwd]     = useState(false)
  const [error, setError]         = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register, handleSubmit, formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-sm text-center">
          <XCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h1 className="text-xl font-semibold text-gray-900">Lien invalide</h1>
          <p className="mt-2 text-sm text-gray-500">
            Ce lien d'invitation est invalide ou a expiré.
          </p>
        </div>
      </div>
    )
  }

  const onSubmit = handleSubmit(async (values) => {
    setError('')
    setIsSubmitting(true)
    try {
      const res = await acceptInvitation({
        token,
        first_name:            values.first_name,
        last_name:             values.last_name,
        password:              values.password,
        password_confirmation: values.password_confirmation,
        phone:                 values.phone || undefined,
      })

      // Stocker le token Sanctum et rediriger
      setAuth({
        token:  res.data.token,
        user:   {
          id:         res.data.user.id,
          full_name:  res.data.user.full_name,
          first_name: res.data.user.first_name,
          last_name:  res.data.user.last_name,
          email:      res.data.user.email,
          role:       res.data.user.role.value,
          avatar_url: res.data.user.avatar_url,
        },
      })

      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      setError(err?.message ?? 'Une erreur est survenue.')
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600">
            <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c0 1.657 2.686 3 6 3s6-1.343 6-3v-5" />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Activez votre compte</h1>
            <p className="mt-1 text-sm text-gray-500">
              Complétez vos informations pour rejoindre l'équipe
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <XCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="first_name">Prénom</Label>
                <Input id="first_name" {...register('first_name')} />
                {errors.first_name && <p className="text-xs text-red-500">{errors.first_name.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="last_name">Nom</Label>
                <Input id="last_name" {...register('last_name')} />
                {errors.last_name && <p className="text-xs text-red-500">{errors.last_name.message}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Mot de passe</Label>
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
              <Label htmlFor="password_confirmation">Confirmation</Label>
              <Input
                id="password_confirmation"
                type={showPwd ? 'text' : 'password'}
                {...register('password_confirmation')}
              />
              {errors.password_confirmation && (
                <p className="text-xs text-red-500">{errors.password_confirmation.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="phone">Téléphone <span className="text-gray-400">(optionnel)</span></Label>
              <Input id="phone" type="tel" {...register('phone')} />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                'Activation…'
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Activer mon compte
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
