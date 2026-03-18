// ===== src/modules/superadmin/components/ModuleToggle.tsx =====

import { useState } from 'react'
import { Shield, AlertCircle } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import type { TenantModule } from '../types/module.types'

interface ModuleToggleProps {
  module: TenantModule
  isEnabled: boolean
  isCore: boolean
  onToggle: (moduleKey: string, enable: boolean, reason?: string) => void
  loading?: boolean
}

export function ModuleToggle({
  module,
  isEnabled,
  isCore,
  onToggle,
  loading = false,
}: ModuleToggleProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState('')

  const handleToggle = () => {
    if (isCore) return
    if (isEnabled) {
      // Disabling requires a reason
      setReason('')
      setReasonError('')
      setConfirmOpen(true)
    } else {
      onToggle(module.module_key, true)
    }
  }

  const handleConfirmDisable = () => {
    if (!reason.trim()) {
      setReasonError('La raison est obligatoire')
      return
    }
    onToggle(module.module_key, false, reason.trim())
    setConfirmOpen(false)
  }

  const sourceLabel = module.in_plan
    ? 'Plan'
    : module.has_override
      ? 'Override'
      : null

  return (
    <>
      <div
        className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
          isCore
            ? 'border-slate-200 bg-slate-50'
            : isEnabled
              ? 'border-indigo-100 bg-indigo-50/30'
              : 'border-slate-200 bg-white'
        }`}
      >
        {/* Left: icon + info */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              isEnabled ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'
            }`}
          >
            <Shield className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-medium text-slate-900">
                {module.module_name}
              </span>
              {isCore && (
                <span className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                  CORE
                </span>
              )}
              {sourceLabel && (
                <span
                  className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${
                    sourceLabel === 'Plan'
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
                      : 'border-amber-200 bg-amber-50 text-amber-600'
                  }`}
                >
                  {sourceLabel.toUpperCase()}
                </span>
              )}
            </div>
            {module.override_reason && (
              <p className="mt-0.5 text-xs text-amber-600 truncate">
                {module.override_reason}
              </p>
            )}
          </div>
        </div>

        {/* Right: toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={isEnabled}
          disabled={isCore || loading}
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
            isEnabled ? 'bg-indigo-600' : 'bg-slate-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform ${
              isEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Confirm disable dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            <DialogTitle className="text-center">
              Désactiver le module
            </DialogTitle>
            <DialogDescription className="text-center">
              Vous allez désactiver le module{' '}
              <strong>{module.module_name}</strong>. Cette action peut
              affecter les utilisateurs de l&apos;école.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Raison <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                if (e.target.value.trim()) setReasonError('')
              }}
              rows={3}
              placeholder="Expliquez pourquoi vous désactivez ce module..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {reasonError && (
              <p className="mt-1 text-xs text-red-500">{reasonError}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleConfirmDisable}>
              Désactiver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
