// ===== src/modules/school/components/users/InviteUserModal.tsx =====

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Check, Copy } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { useInviteUser } from '../../hooks/useUsers'
import { STAFF_ROLES, USER_ROLE_LABELS, type UserRole, type UserInvitation } from '../../types/users.types'

const STAFF_ROLE_VALUES = STAFF_ROLES as [UserRole, ...UserRole[]]

const schema = z.object({
  email: z.string().email('Email invalide'),
  role:  z.enum(STAFF_ROLE_VALUES, { error: 'Rôle requis' }),
})

type FormValues = z.infer<typeof schema>

interface InviteUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InviteUserModal({ open, onOpenChange }: InviteUserModalProps) {
  const inviteMutation = useInviteUser()
  const [invitation, setInvitation] = useState<UserInvitation | null>(null)
  const [copied, setCopied] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', role: 'teacher' },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      const res = await inviteMutation.mutateAsync(values)
      setInvitation(res.data)
    } catch {
      // handled by hook
    }
  })

  const handleCopy = async () => {
    if (!invitation?.invitation_link) return
    await navigator.clipboard.writeText(invitation.invitation_link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    setInvitation(null)
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Inviter un utilisateur</DialogTitle>
        </DialogHeader>

        {!invitation ? (
          <>
            <form onSubmit={onSubmit} className="space-y-4 py-2">
              <div className="space-y-1">
                <Label htmlFor="invite-email">Email</Label>
                <Input id="invite-email" type="email" {...register('email')} placeholder="jean@ecole.ci" />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="invite-role">Rôle à assigner</Label>
                <select
                  id="invite-role"
                  {...register('role')}
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {STAFF_ROLES.filter((r) => r !== 'school_admin').map((r) => (
                    <option key={r} value={r}>
                      {USER_ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>
            </form>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Annuler</Button>
              <Button onClick={onSubmit} disabled={inviteMutation.isPending}>
                {inviteMutation.isPending ? 'Envoi…' : 'Envoyer l\'invitation'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="space-y-4 py-2">
            {/* Succès */}
            <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3">
              <Check className="h-5 w-5 text-green-600" />
              <p className="text-sm font-medium text-green-800">
                Invitation envoyée à {invitation.email}
              </p>
            </div>

            {/* Lien d'invitation */}
            {invitation.invitation_link && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="mb-2 text-xs font-medium text-gray-600">
                  Lien d'invitation (valable 72h) :
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded bg-white px-2 py-1 text-xs text-gray-800 border border-gray-200">
                    {invitation.invitation_link}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="shrink-0 rounded-md p-1.5 text-gray-500 hover:bg-gray-200 transition-colors"
                    title="Copier"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button onClick={handleClose}>Fermer</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
