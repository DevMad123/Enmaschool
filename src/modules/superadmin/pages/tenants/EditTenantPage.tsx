// ===== src/modules/superadmin/pages/tenants/EditTenantPage.tsx =====

import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Check } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'
import { useTenant, useUpdateTenant } from '../../hooks/useTenants'
import type { UpdateTenantDTO } from '../../types/tenant.types'

// ── Zod schema ─────────────────────────────────────────────────────────────────
const editSchema = z.object({
  name: z.string().min(2, 'Minimum 2 caractères'),
  has_maternelle: z.boolean(),
  has_primary: z.boolean(),
  has_college: z.boolean(),
  has_lycee: z.boolean(),
  profile: z.object({
    country: z.string().length(2, 'Code pays requis'),
    city: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('Email invalide').optional().or(z.literal('')),
    address: z.string().optional(),
    timezone: z.string().min(1),
    language: z.string().min(1),
    currency: z.string().min(1),
  }),
}).refine(
  (v) => v.has_maternelle || v.has_primary || v.has_college || v.has_lycee,
  { path: ['has_primary'], message: "Sélectionnez au moins un type d'établissement" },
)

type EditForm = z.infer<typeof editSchema>

// ── Field wrapper ──────────────────────────────────────────────────────────────
function Field({
  label,
  error,
  required,
  children,
}: {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <Label className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ── School type card ───────────────────────────────────────────────────────────
const schoolTypes = [
  { key: 'has_maternelle' as const, label: 'Maternelle', abbr: 'M', desc: 'Enfants de 3 à 6 ans' },
  { key: 'has_primary' as const, label: 'Primaire', abbr: 'P', desc: 'CP au CE5 (6-12 ans)' },
  { key: 'has_college' as const, label: 'Collège', abbr: 'C', desc: '6ème à 3ème (12-15 ans)' },
  { key: 'has_lycee' as const, label: 'Lycée', abbr: 'L', desc: '2nde à Terminale (15-18 ans)' },
]

// ── Main page ──────────────────────────────────────────────────────────────────
export function EditTenantPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: tenantRes, isLoading } = useTenant(id ?? '')
  const { mutate: update, isPending } = useUpdateTenant()

  const tenant = tenantRes?.data

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<EditForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(editSchema) as any,
  })

  // Populate form once tenant data loads
  useEffect(() => {
    if (tenant) {
      reset({
        name: tenant.name,
        has_maternelle: tenant.has_maternelle,
        has_primary: tenant.has_primary,
        has_college: tenant.has_college,
        has_lycee: tenant.has_lycee,
        profile: {
          country: tenant.profile?.country ?? 'CI',
          city: tenant.profile?.city ?? '',
          phone: tenant.profile?.phone ?? '',
          email: tenant.profile?.email ?? '',
          address: tenant.profile?.address ?? '',
          timezone: tenant.profile?.timezone ?? 'Africa/Abidjan',
          language: tenant.profile?.language ?? 'fr',
          currency: tenant.profile?.currency ?? 'XOF',
        },
      })
    }
  }, [tenant, reset])

  const onSubmit = handleSubmit((data) => {
    if (!id) return
    const dto: UpdateTenantDTO = {
      name: data.name,
      has_maternelle: data.has_maternelle,
      has_primary: data.has_primary,
      has_college: data.has_college,
      has_lycee: data.has_lycee,
      profile: data.profile,
    }
    update(
      { id, data: dto },
      { onSuccess: () => navigate(`/admin/tenants/${id}`) },
    )
  })

  if (isLoading || !tenant) {
    return <LoadingSpinner fullScreen />
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to={`/admin/tenants/${id}`}>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Modifier {tenant.name}</h1>
          <p className="text-sm text-slate-400">Slug : {tenant.slug}</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-8">
        {/* Info */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
          <h3 className="text-base font-semibold text-slate-900">Informations générales</h3>

          <Field label="Nom de l'école" error={errors.name?.message} required>
            <Input {...register('name')} placeholder="Ex: Collège Saint-Michel" />
          </Field>
        </div>

        {/* School types */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
          <h3 className="text-base font-semibold text-slate-900">Types d'établissement</h3>
          {errors.has_primary?.message && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {errors.has_primary.message}
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {schoolTypes.map(({ key, label, abbr, desc }) => {
              const active = watch(key)
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setValue(key, !active, { shouldValidate: true })}
                  className={`flex items-center gap-3 rounded-xl border-2 px-5 py-4 text-left transition-all ${
                    active
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-base font-bold ${
                      active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {abbr}
                  </div>
                  <div>
                    <p className={`font-semibold ${active ? 'text-indigo-900' : 'text-slate-700'}`}>
                      {label}
                    </p>
                    <p className="text-xs text-slate-400">{desc}</p>
                  </div>
                  {active && <Check className="ml-auto h-5 w-5 text-indigo-600" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Profile / Contact */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
          <h3 className="text-base font-semibold text-slate-900">Coordonnées</h3>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Pays" error={(errors.profile as any)?.country?.message} required>
              <select
                {...register('profile.country')}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="CI">Côte d&apos;Ivoire</option>
                <option value="MA">Maroc</option>
                <option value="SN">Sénégal</option>
                <option value="CM">Cameroun</option>
                <option value="TN">Tunisie</option>
                <option value="DZ">Algérie</option>
                <option value="ML">Mali</option>
                <option value="BF">Burkina Faso</option>
                <option value="GN">Guinée</option>
                <option value="BJ">Bénin</option>
                <option value="TG">Togo</option>
                <option value="NE">Niger</option>
                <option value="CD">Congo (RDC)</option>
                <option value="MG">Madagascar</option>
                <option value="FR">France</option>
              </select>
            </Field>
            <Field label="Ville" error={(errors.profile as any)?.city?.message}>
              <Input {...register('profile.city')} placeholder="Ex: Casablanca" />
            </Field>
            <Field label="Téléphone" error={(errors.profile as any)?.phone?.message}>
              <Input {...register('profile.phone')} placeholder="+212 600 000000" />
            </Field>
            <Field label="Email de contact" error={(errors.profile as any)?.email?.message}>
              <Input {...register('profile.email')} type="email" placeholder="contact@ecole.com" />
            </Field>
            <Field label="Adresse" error={(errors.profile as any)?.address?.message}>
              <Input {...register('profile.address')} placeholder="Adresse complète" />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Fuseau horaire" required>
              <select
                {...register('profile.timezone')}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="Africa/Casablanca">Africa/Casablanca</option>
                <option value="Africa/Abidjan">Africa/Abidjan</option>
                <option value="Africa/Dakar">Africa/Dakar</option>
                <option value="Africa/Lagos">Africa/Lagos</option>
                <option value="Africa/Nairobi">Africa/Nairobi</option>
                <option value="Europe/Paris">Europe/Paris</option>
              </select>
            </Field>
            <Field label="Langue" required>
              <select
                {...register('profile.language')}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="fr">Français</option>
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
            </Field>
            <Field label="Devise" required>
              <select
                {...register('profile.currency')}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="MAD">MAD</option>
                <option value="XOF">XOF</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </Field>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link to={`/admin/tenants/${id}`}>
            <Button type="button" variant="outline">Annuler</Button>
          </Link>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Enregistrement…' : 'Enregistrer les modifications'}
          </Button>
        </div>
      </form>
    </div>
  )
}
