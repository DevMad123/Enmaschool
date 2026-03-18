// ===== src/modules/superadmin/pages/tenants/CreateTenantPage.tsx =====

import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Eye, EyeOff, Check } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Stepper } from '@/shared/components/ui/Stepper'
import { useCreateTenant } from '../../hooks/useTenants'
import { usePlans } from '../../hooks/usePlans'
import type { CreateTenantDTO } from '../../types/tenant.types'

// ── Zod schema ── ──────────────────────────────────────────────────────────────
const wizardSchema = z
  .object({
    // Step 1: École
    name: z.string().min(2, 'Minimum 2 caractères'),
    slug: z.string().min(2, 'Minimum 2 caractères').regex(/^[a-z0-9-]+$/, 'Lettres minuscules, chiffres et tirets uniquement'),
    // Step 2: Types
    has_maternelle: z.boolean(),
    has_primary: z.boolean(),
    has_college: z.boolean(),
    has_lycee: z.boolean(),
    // Step 1: Contact (optional)
    profile: z.object({
      country: z.string().length(2, 'Code pays requis (ex: CI, MA)'),
      city: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email('Email invalide').optional().or(z.literal('')),
      address: z.string().optional(),
      timezone: z.string().min(1),
      language: z.string().min(1),
      currency: z.string().min(1),
    }),
    // Step 3: Plan
    plan_id: z.number().optional(),
    // Step 4: Admin account
    admin_first_name: z.string().min(1, 'Requis'),
    admin_last_name: z.string().min(1, 'Requis'),
    admin_email: z.string().email('Email invalide'),
    admin_password: z.string().min(8, 'Minimum 8 caractères'),
    admin_password_confirmation: z.string(),
  })
  .superRefine((v, ctx) => {
    if (!v.has_maternelle && !v.has_primary && !v.has_college && !v.has_lycee) {
      ctx.addIssue({
        path: ['has_primary'],
        code: z.ZodIssueCode.custom,
        message: 'Sélectionnez au moins un type d\'établissement',
      })
    }
    if (v.admin_password !== v.admin_password_confirmation) {
      ctx.addIssue({
        path: ['admin_password_confirmation'],
        code: z.ZodIssueCode.custom,
        message: 'Les mots de passe ne correspondent pas',
      })
    }
  })

type WizardForm = z.infer<typeof wizardSchema>

// ── Step config ────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Informations' },
  { id: 2, label: 'Types' },
  { id: 3, label: 'Plan' },
  { id: 4, label: 'Administrateur' },
]

const STEP_FIELDS: Record<number, (keyof WizardForm)[]> = {
  1: ['name', 'slug', 'profile'],
  2: ['has_primary', 'has_college', 'has_lycee', 'has_maternelle'],
  3: [],
  4: ['admin_first_name', 'admin_last_name', 'admin_email', 'admin_password', 'admin_password_confirmation'],
}

// ── Slug generator ─────────────────────────────────────────────────────────────
function toSlug(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

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

// ── Step 1: Informations ───────────────────────────────────────────────────────
function Step1({ form }: { form: ReturnType<typeof useForm<WizardForm>> }) {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = form
  const nameValue = watch('name')
  const slugValue = watch('slug')
  const [slugManual, setSlugManual] = useState(false)

  useEffect(() => {
    if (!slugManual && nameValue) {
      setValue('slug', toSlug(nameValue), { shouldValidate: true })
    }
  }, [nameValue, slugManual, setValue])

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nom de l'école" error={errors.name?.message} required>
          <Input
            {...register('name')}
            placeholder="Ex: Collège Saint-Michel"
            className={errors.name ? 'border-red-300' : ''}
          />
        </Field>
        <Field label="Slug (identifiant unique)" error={errors.slug?.message} required>
          <Input
            {...register('slug', {
              onChange: () => setSlugManual(true),
            })}
            placeholder="ex: college-saint-michel"
            className={errors.slug ? 'border-red-300' : ''}
          />
          <p className="text-xs text-slate-400">
            Utilisé pour le sous-domaine: <strong>{slugValue || 'slug'}</strong>.enmaschool.com
          </p>
        </Field>
      </div>

      <hr className="border-slate-100" />
      <h4 className="text-sm font-semibold text-slate-700">Informations de contact</h4>

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
          <Input
            {...register('profile.email')}
            type="email"
            placeholder="contact@ecole.com"
          />
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
            defaultValue="Africa/Casablanca"
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
            defaultValue="fr"
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
            defaultValue="MAD"
          >
            <option value="MAD">MAD</option>
            <option value="XOF">XOF</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </select>
        </Field>
      </div>
    </div>
  )
}

// ── Step 2: School types ───────────────────────────────────────────────────────
function Step2({ form }: { form: ReturnType<typeof useForm<WizardForm>> }) {
  const {
    watch,
    setValue,
    formState: { errors },
  } = form

  const has_maternelle = watch('has_maternelle')
  const has_primary = watch('has_primary')
  const has_college = watch('has_college')
  const has_lycee = watch('has_lycee')

  const types = [
    { key: 'has_maternelle' as const, label: 'Maternelle', color: 'pink', abbr: 'M' },
    { key: 'has_primary' as const, label: 'Primaire', color: 'blue', abbr: 'P' },
    { key: 'has_college' as const, label: 'Collège', color: 'violet', abbr: 'C' },
    { key: 'has_lycee' as const, label: 'Lycée', color: 'emerald', abbr: 'L' },
  ]

  const values = { has_maternelle, has_primary, has_college, has_lycee }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm text-slate-600">
          Sélectionnez les niveaux d&apos;enseignement proposés par cet établissement.
          <span className="text-red-500">*</span>
        </p>
        {errors.has_primary?.message && (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {errors.has_primary.message}
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {types.map(({ key, label, abbr }) => (
          <button
            key={key}
            type="button"
            onClick={() => setValue(key, !values[key], { shouldValidate: true })}
            className={`flex items-center gap-3 rounded-xl border-2 px-5 py-4 text-left transition-all ${
              values[key]
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-base font-bold ${
                values[key]
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {abbr}
            </div>
            <div>
              <p className={`font-semibold ${values[key] ? 'text-indigo-900' : 'text-slate-700'}`}>
                {label}
              </p>
              <p className="text-xs text-slate-400">
                {key === 'has_maternelle' && 'Enfants de 3 à 6 ans'}
                {key === 'has_primary' && 'CP au CE5 (6-12 ans)'}
                {key === 'has_college' && '6ème à 3ème (12-15 ans)'}
                {key === 'has_lycee' && '2nde à Terminale (15-18 ans)'}
              </p>
            </div>
            {values[key] && (
              <Check className="ml-auto h-5 w-5 text-indigo-600" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Step 3: Plan ───────────────────────────────────────────────────────────────
function Step3({ form }: { form: ReturnType<typeof useForm<WizardForm>> }) {
  const { watch, setValue } = form
  const { data: plansRes, isLoading } = usePlans()
  const plans = plansRes?.data ?? []
  const selectedPlan = watch('plan_id')

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Sélectionnez un plan pour cet établissement. Vous pouvez l&apos;assigner plus tard.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {/* No plan option */}
        <button
          type="button"
          onClick={() => setValue('plan_id', undefined)}
          className={`rounded-xl border-2 p-4 text-left transition-all ${
            selectedPlan === undefined
              ? 'border-slate-600 bg-slate-50'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="mb-2 text-sm font-semibold text-slate-600">Aucun plan</div>
          <p className="text-xs text-slate-400">
            L&apos;école existera sans abonnement actif.
          </p>
          {selectedPlan === undefined && (
            <Check className="mt-2 h-4 w-4 text-slate-600" />
          )}
        </button>

        {plans.map((plan) => (
          <button
            key={plan.id}
            type="button"
            onClick={() => setValue('plan_id', plan.id)}
            className={`rounded-xl border-2 p-4 text-left transition-all ${
              selectedPlan === plan.id
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="font-semibold text-slate-900">{plan.name}</span>
              {!plan.is_active && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-400">
                  Inactif
                </span>
              )}
            </div>
            <div className="mb-2 text-sm font-bold text-indigo-600">
              {plan.price_monthly.toLocaleString('fr-FR')} FCFA
              <span className="text-xs font-normal text-slate-400">/mois</span>
            </div>
            {plan.trial_days > 0 && (
              <p className="text-xs text-amber-600">
                {plan.trial_days} jours d&apos;essai gratuit
              </p>
            )}
            {plan.max_students && (
              <p className="text-xs text-slate-400">
                jusqu&apos;à {plan.max_students} élèves
              </p>
            )}
            {selectedPlan === plan.id && (
              <Check className="mt-2 h-4 w-4 text-indigo-600" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Step 4: Admin account ──────────────────────────────────────────────────────
function Step4({ form }: { form: ReturnType<typeof useForm<WizardForm>> }) {
  const {
    register,
    formState: { errors },
  } = form
  const [showPwd, setShowPwd] = useState(false)

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Ces informations seront utilisées pour créer le compte administrateur principal de l&apos;école.
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Prénom" error={errors.admin_first_name?.message} required>
          <Input
            {...register('admin_first_name')}
            placeholder="Prénom"
            className={errors.admin_first_name ? 'border-red-300' : ''}
          />
        </Field>
        <Field label="Nom" error={errors.admin_last_name?.message} required>
          <Input
            {...register('admin_last_name')}
            placeholder="Nom de famille"
            className={errors.admin_last_name ? 'border-red-300' : ''}
          />
        </Field>
      </div>

      <Field label="Email administrateur" error={errors.admin_email?.message} required>
        <Input
          {...register('admin_email')}
          type="email"
          placeholder="admin@ecole.com"
          className={errors.admin_email ? 'border-red-300' : ''}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Mot de passe" error={errors.admin_password?.message} required>
          <div className="relative">
            <Input
              {...register('admin_password')}
              type={showPwd ? 'text' : 'password'}
              placeholder="Min. 8 caractères"
              className={`pr-10 ${errors.admin_password ? 'border-red-300' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
            >
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <Field
          label="Confirmer le mot de passe"
          error={errors.admin_password_confirmation?.message}
          required
        >
          <Input
            {...register('admin_password_confirmation')}
            type={showPwd ? 'text' : 'password'}
            placeholder="Répéter le mot de passe"
            className={errors.admin_password_confirmation ? 'border-red-300' : ''}
          />
        </Field>
      </div>
    </div>
  )
}

// ── Summary card ───────────────────────────────────────────────────────────────
function SummaryCard({ form }: { form: ReturnType<typeof useForm<WizardForm>> }) {
  const v = form.getValues()
  const { data: plansRes } = usePlans()
  const plan = plansRes?.data?.find((p) => p.id === v.plan_id)

  const schoolTypes = [
    v.has_maternelle && 'Maternelle',
    v.has_primary && 'Primaire',
    v.has_college && 'Collège',
    v.has_lycee && 'Lycée',
  ].filter(Boolean)

  const rows: [string, string][] = [
    ['Nom de l\'école', v.name],
    ['Slug', v.slug],
    ['Niveaux', schoolTypes.join(', ')],
    ['Pays', v.profile.country],
    ['Plan', plan?.name ?? 'Aucun'],
    ['Administrateur', `${v.admin_first_name} ${v.admin_last_name}`],
    ['Email admin', v.admin_email],
  ]

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-3">
        <p className="font-semibold text-slate-900">Récapitulatif</p>
      </div>
      <dl className="divide-y divide-slate-100">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between px-5 py-2.5">
            <dt className="text-sm text-slate-500">{label}</dt>
            <dd className="text-sm font-medium text-slate-900">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export function CreateTenantPage() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const { mutate: createTenant, isPending } = useCreateTenant()

  const form = useForm<WizardForm>({
    resolver: zodResolver(wizardSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      slug: '',
      has_maternelle: false,
      has_primary: false,
      has_college: false,
      has_lycee: false,
      plan_id: undefined,
      profile: {
        country: 'CI',
        city: '',
        phone: '',
        email: '',
        address: '',
        timezone: 'Africa/Casablanca',
        language: 'fr',
        currency: 'MAD',
      },
      admin_first_name: '',
      admin_last_name: '',
      admin_email: '',
      admin_password: '',
      admin_password_confirmation: '',
    },
  })

  const validateAndNext = useCallback(async () => {
    const fields = STEP_FIELDS[currentStep]
    const valid = await form.trigger(fields as any)
    if (valid) setCurrentStep((s) => s + 1)
  }, [currentStep, form])

  const onSubmit = form.handleSubmit((data) => {
    const dto: CreateTenantDTO = {
      name: data.name,
      slug: data.slug,
      has_maternelle: data.has_maternelle,
      has_primary: data.has_primary,
      has_college: data.has_college,
      has_lycee: data.has_lycee,
      plan_id: data.plan_id,
      profile: data.profile,
      admin_first_name: data.admin_first_name,
      admin_last_name: data.admin_last_name,
      admin_email: data.admin_email,
      admin_password: data.admin_password,
      admin_password_confirmation: data.admin_password_confirmation,
    }
    createTenant(dto, { onSuccess: () => navigate('/admin/tenants') })
  })

  const stepperSteps = STEPS.map((s) => ({ id: s.id, label: s.label }))

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link to="/admin/tenants">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Créer une école</h2>
          <p className="text-sm text-slate-400">Étape {currentStep} sur {STEPS.length}</p>
        </div>
      </div>

      {/* Stepper */}
      <Stepper steps={stepperSteps} currentStep={currentStep} />

      {/* Card */}
      <form onSubmit={onSubmit}>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-5 text-base font-semibold text-slate-900">
            {STEPS[currentStep - 1].label}
          </h3>

          {currentStep === 1 && <Step1 form={form} />}
          {currentStep === 2 && <Step2 form={form} />}
          {currentStep === 3 && <Step3 form={form} />}
          {currentStep === 4 && (
            <div className="space-y-6">
              <Step4 form={form} />
              <SummaryCard form={form} />
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div className="mt-4 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (currentStep === 1) navigate('/admin/tenants')
              else setCurrentStep((s) => s - 1)
            }}
          >
            {currentStep === 1 ? 'Annuler' : 'Précédent'}
          </Button>

          {currentStep < STEPS.length ? (
            <Button type="button" onClick={validateAndNext}>
              Suivant
            </Button>
          ) : (
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Création…' : 'Créer l\'école'}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
