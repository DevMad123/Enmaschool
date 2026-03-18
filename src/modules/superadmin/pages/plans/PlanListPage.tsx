// ===== src/modules/superadmin/pages/plans/PlanListPage.tsx =====

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Pencil, Trash2, Users, HardDrive, Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { usePlans, useCreatePlan, useUpdatePlan, useDeletePlan } from '../../hooks/usePlans'
import { useSystemModules } from '../../hooks/useModules'
import type { Plan, CreatePlanDTO } from '../../types/plan.types'

// ── Schema ─────────────────────────────────────────────────────────────────────
const planSchema = z.object({
  name: z.string().min(2, 'Minimum 2 caractères'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Minuscules, chiffres et tirets'),
  price_monthly: z.coerce.number().min(0, 'Requis'),
  price_yearly: z.coerce.number().min(0, 'Requis'),
  trial_days: z.coerce.number().min(0),
  max_students: z.coerce.number().nullable().optional(),
  max_teachers: z.coerce.number().nullable().optional(),
  max_storage_gb: z.coerce.number().min(1, '1 GB minimum'),
  is_active: z.boolean(),
  modules: z.array(z.string()),
})

type PlanForm = z.infer<typeof planSchema>

// ── Helpers ────────────────────────────────────────────────────────────────────
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

function formatPrice(n: number) {
  return n.toLocaleString('fr-FR')
}

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

// ── Plan form modal ────────────────────────────────────────────────────────────
function PlanFormModal({
  open,
  onClose,
  initialPlan,
}: {
  open: boolean
  onClose: () => void
  initialPlan?: Plan
}) {
  const isEdit = !!initialPlan
  const { mutate: createPlan, isPending: creating } = useCreatePlan()
  const { mutate: updatePlan, isPending: updating } = useUpdatePlan()
  const { data: modulesData } = useSystemModules()
  const allModules = modulesData?.data ?? []

  const defaultValues: PlanForm = initialPlan
    ? {
        name: initialPlan.name,
        slug: initialPlan.slug,
        price_monthly: initialPlan.price_monthly,
        price_yearly: initialPlan.price_yearly,
        trial_days: initialPlan.trial_days,
        max_students: initialPlan.max_students ?? undefined,
        max_teachers: initialPlan.max_teachers ?? undefined,
        max_storage_gb: initialPlan.max_storage_gb,
        is_active: initialPlan.is_active,
        modules: initialPlan.modules?.filter((m) => m.is_enabled).map((m) => m.key) ?? [],
      }
    : {
        name: '',
        slug: '',
        price_monthly: 0,
        price_yearly: 0,
        trial_days: 14,
        max_students: undefined,
        max_teachers: undefined,
        max_storage_gb: 5,
        is_active: true,
        modules: [],
      }

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<PlanForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(planSchema) as any,
    defaultValues,
  })

  // Reset form when switching between create/edit
  useEffect(() => {
    if (open) {
      reset(defaultValues)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialPlan?.id])

  const nameValue = watch('name')
  const selectedModules = watch('modules')

  // Auto-generate slug from name (create mode only)
  const handleNameBlur = () => {
    if (!isEdit && nameValue) {
      setValue('slug', toSlug(nameValue), { shouldValidate: true })
    }
  }

  const toggleModule = (key: string) => {
    const current = selectedModules ?? []
    const next = current.includes(key)
      ? current.filter((k) => k !== key)
      : [...current, key]
    setValue('modules', next)
  }

  const onSubmit = handleSubmit((data) => {
    const dto: CreatePlanDTO = {
      name: data.name,
      slug: data.slug,
      price_monthly: data.price_monthly,
      price_yearly: data.price_yearly,
      trial_days: data.trial_days,
      max_students: data.max_students ?? null,
      max_teachers: data.max_teachers ?? null,
      max_storage_gb: data.max_storage_gb,
      is_active: data.is_active,
      modules: data.modules,
    }

    if (isEdit) {
      updatePlan(
        { id: initialPlan!.id, data: dto },
        { onSuccess: () => { reset(); onClose() } },
      )
    } else {
      createPlan(dto, { onSuccess: () => { reset(); onClose() } })
    }
  })

  const isPending = creating || updating

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier le plan' : 'Créer un plan'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5 pt-2">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Nom du plan" error={errors.name?.message} required>
              <Input
                {...register('name')}
                placeholder="Ex: Pro, Starter, Enterprise"
                onBlur={handleNameBlur}
              />
            </Field>
            <Field label="Slug" error={errors.slug?.message} required>
              <Input {...register('slug')} placeholder="ex: pro-plan" />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Prix mensuel (FCFA)" error={errors.price_monthly?.message} required>
              <Input {...register('price_monthly')} type="number" min="0" placeholder="0" />
            </Field>
            <Field label="Prix annuel (FCFA)" error={errors.price_yearly?.message} required>
              <Input {...register('price_yearly')} type="number" min="0" placeholder="0" />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Jours d'essai" error={errors.trial_days?.message}>
              <Input {...register('trial_days')} type="number" min="0" placeholder="14" />
            </Field>
            <Field label="Max élèves (∞ si vide)" error={errors.max_students?.message}>
              <Input {...register('max_students')} type="number" min="0" placeholder="Illimité" />
            </Field>
            <Field label="Max enseignants (∞ si vide)" error={errors.max_teachers?.message}>
              <Input {...register('max_teachers')} type="number" min="0" placeholder="Illimité" />
            </Field>
          </div>

          <Field label="Stockage max (GB)" error={errors.max_storage_gb?.message} required>
            <Input {...register('max_storage_gb')} type="number" min="1" placeholder="5" className="max-w-[200px]" />
          </Field>

          {/* Module selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              Modules inclus
            </Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {allModules.filter((m) => m.is_active).map((mod) => {
                const checked = selectedModules?.includes(mod.key) ?? false
                return (
                  <label
                    key={mod.key}
                    className={`flex items-center gap-2 rounded-lg border p-2.5 cursor-pointer transition-colors text-sm ${
                      checked
                        ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleModule(mod.key)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    {mod.name}
                  </label>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              role="checkbox"
              aria-checked={watch('is_active')}
              onClick={() => setValue('is_active', !watch('is_active'))}
              className={`relative flex h-6 w-11 items-center rounded-full transition-colors ${
                watch('is_active') ? 'bg-indigo-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  watch('is_active') ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
            <Label className="cursor-pointer select-none text-sm text-slate-700">
              Plan actif (visible à l&apos;assignation)
            </Label>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button type="button" variant="outline" onClick={() => { reset(); onClose() }}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Créer le plan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Plan card ──────────────────────────────────────────────────────────────────
function PlanCard({
  plan,
  onEdit,
}: {
  plan: Plan
  onEdit: (plan: Plan) => void
}) {
  const { mutate: deletePlan, isPending: deleting } = useDeletePlan()
  const [expanded, setExpanded] = useState(false)

  const handleDelete = () => {
    if (!window.confirm(`Supprimer le plan "${plan.name}" ?`)) return
    deletePlan(plan.id)
  }

  const activeModules = plan.modules?.filter((m) => m.is_enabled) ?? []

  return (
    <div
      className={`rounded-xl border-2 bg-white shadow-sm transition-all ${
        plan.is_active ? 'border-slate-200' : 'border-dashed border-slate-200 opacity-70'
      }`}
    >
      {/* Header */}
      <div className="p-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
              {!plan.is_active && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                  Inactif
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">{plan.slug}</p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => onEdit(plan)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-red-500 hover:bg-red-50"
              disabled={deleting}
              onClick={handleDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Pricing */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-400">Mensuel</p>
            <p className="text-lg font-bold text-slate-900">
              {formatPrice(plan.price_monthly)}
              <span className="text-xs font-normal text-slate-400"> FCFA</span>
            </p>
          </div>
          <div className="rounded-lg bg-indigo-50 p-3">
            <p className="text-xs text-indigo-500">Annuel</p>
            <p className="text-lg font-bold text-indigo-700">
              {formatPrice(plan.price_yearly)}
              <span className="text-xs font-normal text-indigo-400"> FCFA</span>
            </p>
          </div>
        </div>

        {/* Limits */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-lg bg-slate-50 px-2 py-2">
            <Users className="mx-auto mb-0.5 h-3.5 w-3.5 text-slate-400" />
            <div className="font-semibold text-slate-700">
              {plan.max_students ?? '∞'}
            </div>
            <div className="text-slate-400">Élèves</div>
          </div>
          <div className="rounded-lg bg-slate-50 px-2 py-2">
            <Users className="mx-auto mb-0.5 h-3.5 w-3.5 text-slate-400" />
            <div className="font-semibold text-slate-700">
              {plan.max_teachers ?? '∞'}
            </div>
            <div className="text-slate-400">Enseignants</div>
          </div>
          <div className="rounded-lg bg-slate-50 px-2 py-2">
            <HardDrive className="mx-auto mb-0.5 h-3.5 w-3.5 text-slate-400" />
            <div className="font-semibold text-slate-700">
              {plan.max_storage_gb} GB
            </div>
            <div className="text-slate-400">Stockage</div>
          </div>
        </div>

        {/* Trial + tenants count */}
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          {plan.trial_days > 0 ? (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700 border border-amber-100">
              {plan.trial_days}j d&apos;essai gratuit
            </span>
          ) : (
            <span className="text-slate-400">Pas d&apos;essai gratuit</span>
          )}
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {plan.tenants_count} école{plan.tenants_count !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Features + modules - expandable */}
      {((plan.features && plan.features.length > 0) || activeModules.length > 0) && (
        <div className="border-t border-slate-100">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex w-full items-center justify-between px-5 py-3 text-xs font-medium text-slate-500 hover:bg-slate-50"
          >
            <span>
              {activeModules.length} module{activeModules.length !== 1 ? 's' : ''} inclus
              {plan.features?.length > 0 && ` · ${plan.features.length} fonctionnalité${plan.features.length !== 1 ? 's' : ''}`}
            </span>
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>

          {expanded && (
            <div className="border-t border-slate-50 px-5 pb-4 pt-3 space-y-4">
              {plan.features && plan.features.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-slate-500">
                    Fonctionnalités
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {plan.features.map((f) => (
                      <span
                        key={f}
                        className="flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs text-green-700 border border-green-100"
                      >
                        <Check className="h-2.5 w-2.5" /> {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {plan.modules && plan.modules.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-slate-500">Modules</p>
                  <div className="flex flex-wrap gap-1.5">
                    {plan.modules.map((m) => (
                      <span
                        key={m.key}
                        className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs border ${
                          m.is_enabled
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                            : 'bg-slate-50 text-slate-400 border-slate-100 line-through'
                        }`}
                      >
                        {m.is_enabled ? (
                          <Check className="h-2.5 w-2.5" />
                        ) : (
                          <X className="h-2.5 w-2.5" />
                        )}
                        {m.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export function PlanListPage() {
  const { data: plansRes, isLoading } = usePlans()
  const plans = plansRes?.data ?? []

  const [modalOpen, setModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | undefined>()

  const openCreate = () => {
    setEditingPlan(undefined)
    setModalOpen(true)
  }

  const openEdit = (plan: Plan) => {
    setEditingPlan(plan)
    setModalOpen(true)
  }

  const activePlans = plans.filter((p) => p.is_active)
  const inactivePlans = plans.filter((p) => !p.is_active)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Plans &amp; Tarification</h2>
          <p className="text-sm text-slate-400">
            {plans.length} plan{plans.length !== 1 ? 's' : ''} configuré{plans.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nouveau plan
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && plans.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
          <p className="mb-4 text-slate-400">Aucun plan configuré</p>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Créer le premier plan
          </Button>
        </div>
      )}

      {/* Active plans */}
      {activePlans.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-700">
            Plans actifs ({activePlans.length})
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {activePlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} onEdit={openEdit} />
            ))}
          </div>
        </div>
      )}

      {/* Inactive plans */}
      {inactivePlans.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-500">
            Plans inactifs ({inactivePlans.length})
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {inactivePlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} onEdit={openEdit} />
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      <PlanFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialPlan={editingPlan}
      />
    </div>
  )
}
