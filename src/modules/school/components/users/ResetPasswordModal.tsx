// ===== src/modules/school/components/users/ResetPasswordModal.tsx =====

import { useState } from 'react'
import { AlertTriangle, Copy, Check } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { useResetPassword } from '../../hooks/useUsers'
import type { SchoolUser } from '../../types/users.types'

interface ResetPasswordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: SchoolUser
}

export function ResetPasswordModal({ open, onOpenChange, user }: ResetPasswordModalProps) {
  const resetMutation = useResetPassword()
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleReset = async () => {
    try {
      const res = await resetMutation.mutateAsync(user.id)
      setTempPassword(res.data.temporary_password)
    } catch {
      // handled by hook
    }
  }

  const handleCopy = async () => {
    if (!tempPassword) return
    await navigator.clipboard.writeText(tempPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    setTempPassword(null)
    setCopied(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
        </DialogHeader>

        {!tempPassword ? (
          <>
            <p className="text-sm text-gray-600 py-2">
              Réinitialiser le mot de passe de{' '}
              <span className="font-semibold">{user.full_name}</span> ?
              Un mot de passe temporaire sera généré et les sessions actives seront invalidées.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Annuler</Button>
              <Button
                variant="destructive"
                onClick={handleReset}
                disabled={resetMutation.isPending}
              >
                {resetMutation.isPending ? 'Génération…' : 'Réinitialiser'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-3 border border-amber-200">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
              <p className="text-sm font-medium text-amber-800">
                Mot de passe temporaire généré
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
              <code className="flex-1 text-center text-lg font-mono font-semibold tracking-widest text-gray-900">
                {tempPassword}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 rounded-md p-1.5 text-gray-500 hover:bg-gray-200 transition-colors"
                title="Copier"
              >
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Communiquez ce mot de passe à l'utilisateur. Il ne sera plus visible après fermeture.
            </p>

            <DialogFooter>
              <Button onClick={handleClose}>J'ai noté, Fermer</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
