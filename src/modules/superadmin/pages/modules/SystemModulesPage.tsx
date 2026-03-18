// ===== src/modules/superadmin/pages/modules/SystemModulesPage.tsx =====

import { useState, useMemo, useEffect } from 'react'
import {
  Puzzle,
  Shield,
  GraduationCap,
  CalendarCheck,
  CalendarClock,
  CreditCard,
  BookOpen,
  MessageSquare,
  BarChart3,
  Library,
  Bus,
  CheckCircle2,
  XCircle,
  LoaderCircle,
  Pencil,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { ConfirmDialog } from '@/shared/components/feedback/ConfirmDialog'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'
import { useSystemModules, useToggleSystemModule, useUpdateModule } from '../../hooks/useModules'
import type { SystemModule } from '../../types/module.types'

// ── Icon mapping ───────────────────────────────────────────────────────
const moduleIcons: Record<string, LucideIcon> = {
  grades: GraduationCap,
  attendance: CalendarCheck,
  timetable: CalendarClock,
  payments: CreditCard,
  elearning: BookOpen,
  messaging: MessageSquare,
  reports: BarChart3,
  library: Library,
  transport: Bus,
}

const schoolTypeLabels: Record<string, { label: string; color: string }> = {
  maternelle: { label: 'Maternelle', color: 'bg-pink-100 text-pink-700' },
  primary: { label: 'Primaire', color: 'bg-blue-100 text-blue-700' },
  college: { label: 'Collège', color: 'bg-violet-100 text-violet-700' },
  lycee: { label: 'Lycée', color: 'bg-emerald-100 text-emerald-700' },
}

// ── Module Card ────────────────────────────────────────────────────────
function ModuleCard({
  module,
  onToggle,
  onEdit,
  isToggling,
}: {
  module: SystemModule
  onToggle: (key: string, active: boolean) => void
  onEdit: (module: SystemModule) => void
  isToggling: boolean
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const Icon = moduleIcons[module.key] ?? Puzzle

  const handleToggle = () => {
    if (module.is_core) return
    if (module.is_active) {
      setConfirmOpen(true)
    } else {
      onToggle(module.key, true)
    }
  }

  return (
    <>
      <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
              <Icon className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {module.name}
              </h3>
              {module.is_core && (
                <Badge className="mt-0.5 bg-amber-100 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0">
                  <Shield className="mr-0.5 h-2.5 w-2.5" />
                  Core
                </Badge>
              )}
            </div>
          </div>

          {/* Toggle */}
          <button
            type="button"
            role="switch"
            aria-checked={module.is_active}
            disabled={module.is_core || isToggling}
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
              module.is_core
                ? 'cursor-not-allowed opacity-50'
                : ''
            } ${module.is_active ? 'bg-indigo-600' : 'bg-gray-200'}`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                module.is_active ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Description */}
        {module.description && (
          <p className="mt-3 text-xs text-gray-500 leading-relaxed">
            {module.description}
          </p>
        )}

        {/* Status badge */}
        <div className="mt-3 flex items-center gap-1.5">
          {module.is_active ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              <span className="text-xs text-green-600 font-medium">
                Actif sur la plateforme
              </span>
            </>
          ) : (
            <>
              <XCircle className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-xs text-gray-400 font-medium">
                Désactivé
              </span>
            </>
          )}
        </div>

        {/* Available for */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1.5">
            Disponible pour
          </p>
          <div className="flex flex-wrap gap-1">
            {module.available_for.map((type) => {
              const info = schoolTypeLabels[type]
              if (!info) return null
              return (
                <span
                  key={type}
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${info.color}`}
                >
                  {info.label}
                </span>
              )
            })}
          </div>
        </div>

        {/* Edit button */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => onEdit(module)}
          >
            <Pencil className="mr-1.5 h-3 w-3" />
            Modifier les types d'école
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Désactiver le module"
        description={`Désactiver "${module.name}" le rendra indisponible pour toutes les écoles. Les données existantes seront conservées.`}
        confirmLabel="Désactiver"
        onConfirm={() => {
          onToggle(module.key, false)
          setConfirmOpen(false)
        }}
        isLoading={isToggling}
        variant="warning"
      />
    </>
  )
}

// ── Edit Module Dialog ─────────────────────────────────────────────────
function EditModuleDialog({
  module,
  open,
  onOpenChange,
}: {
  module: SystemModule | null
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const updateMutation = useUpdateModule()
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    if (open && module) {
      setSelected([...module.available_for])
    }
  }, [open, module])

  const handleOpenChange = (v: boolean) => {
    onOpenChange(v)
  }

  const toggle = (type: string) => {
    setSelected((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    )
  }

  const handleSave = () => {
    if (!module) return
    updateMutation.mutate(
      { key: module.key, available_for: selected },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  if (!module) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier {module.name}</DialogTitle>
          <DialogDescription>
            Sélectionnez les types d'école pour lesquels ce module est disponible.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-4">
          {Object.entries(schoolTypeLabels).map(([key, { label, color }]) => {
            const checked = selected.includes(key)
            return (
              <label
                key={key}
                className={`flex items-center gap-2.5 rounded-lg border p-3 cursor-pointer transition-colors ${
                  checked
                    ? 'border-indigo-300 bg-indigo-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(key)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${color}`}
                >
                  {label}
                </span>
              </label>
            )
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending && (
              <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" />
            )}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────
export function SystemModulesPage() {
  const { data, isLoading } = useSystemModules()
  const toggleMutation = useToggleSystemModule()
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>(
    'all',
  )
  const [editModule, setEditModule] = useState<SystemModule | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const modules = data?.data ?? []

  const filteredModules = useMemo(() => {
    let result = modules
    if (filterType) {
      result = result.filter((m) => m.available_for.includes(filterType))
    }
    if (filterStatus === 'active') {
      result = result.filter((m) => m.is_active)
    } else if (filterStatus === 'inactive') {
      result = result.filter((m) => !m.is_active)
    }
    return result.sort((a, b) => a.order - b.order)
  }, [modules, filterType, filterStatus])

  const handleToggle = (key: string, is_active: boolean) => {
    toggleMutation.mutate({ key, is_active })
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Modules système</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gérez les modules disponibles au niveau de la plateforme
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Tous les types</option>
          {Object.entries(schoolTypeLabels).map(([key, { label }]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) =>
            setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')
          }
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="inactive">Inactifs</option>
        </select>
      </div>

      {/* Grid */}
      {filteredModules.length === 0 ? (
        <EmptyState
          icon={Puzzle}
          title="Aucun module"
          description="Aucun module ne correspond à vos filtres."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredModules.map((m) => (
            <ModuleCard
              key={m.key}
              module={m}
              onToggle={handleToggle}
              onEdit={(mod) => {
                setEditModule(mod)
                setEditDialogOpen(true)
              }}
              isToggling={
                toggleMutation.isPending &&
                toggleMutation.variables?.key === m.key
              }
            />
          ))}
        </div>
      )}

      <EditModuleDialog
        module={editModule}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </div>
  )
}
