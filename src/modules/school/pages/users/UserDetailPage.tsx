// ===== src/modules/school/pages/users/UserDetailPage.tsx =====

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, KeyRound } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { useUser, useUserPermissions } from '../../hooks/useUsers'
import { UserAvatar } from '../../components/users/UserAvatar'
import { UserRoleBadge } from '../../components/users/UserRoleBadge'
import { UserStatusBadge } from '../../components/users/UserStatusBadge'
import { ResetPasswordModal } from '../../components/users/ResetPasswordModal'

type Tab = 'profile' | 'security' | 'permissions'

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Jamais'
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function UserDetailPage() {
  const { id }     = useParams<{ id: string }>()
  const navigate   = useNavigate()
  const userId     = Number(id)
  const [tab, setTab] = useState<Tab>('profile')
  const [resetOpen, setResetOpen] = useState(false)

  const { data: userData, isLoading } = useUser(userId)
  const { data: permData }            = useUserPermissions(userId)

  if (isLoading) return <LoadingSpinner fullScreen />
  if (!userData?.data) return <EmptyState icon={ArrowLeft} title="Utilisateur introuvable" description="" />

  const user  = userData.data
  const perms = permData?.data

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </button>

      {/* Header user */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <UserAvatar user={user} size="lg" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">{user.full_name}</h1>
            <p className="text-sm text-gray-500">{user.email}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <UserRoleBadge role={user.role.value} />
              <UserStatusBadge status={user.status.value} />
            </div>
          </div>
        </div>
        {user.can?.edit && (
          <Button variant="outline" size="sm" onClick={() => setResetOpen(true)}>
            <KeyRound className="mr-2 h-4 w-4" />
            Réinitialiser MDP
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(['profile', 'security', 'permissions'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {{ profile: 'Profil', security: 'Sécurité', permissions: 'Permissions' }[t]}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'profile' && (
        <div className="grid gap-4 rounded-xl border border-gray-200 bg-white p-6 sm:grid-cols-2">
          <InfoRow label="Prénom" value={user.first_name} />
          <InfoRow label="Nom" value={user.last_name} />
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Téléphone" value={user.phone ?? '—'} />
          <InfoRow label="Rôle" value={user.role.label} />
          <InfoRow label="Statut" value={user.status.label} />
          <InfoRow label="Membre depuis" value={timeAgo(user.created_at)} />
        </div>
      )}

      {tab === 'security' && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <InfoRow label="Dernière connexion" value={timeAgo(user.last_login_at)} />
          <p className="text-xs text-gray-400">
            Pour modifier le mot de passe, utilisez le bouton "Réinitialiser MDP" en haut de la page.
          </p>
        </div>
      )}

      {tab === 'permissions' && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          {perms ? (
            <>
              <p className="text-sm text-gray-500">
                Permissions effectives ({perms.all_permissions.length}) via le rôle{' '}
                <span className="font-medium text-gray-900">{perms.role.label}</span>.
                Pour les modifier, rendez-vous sur la page{' '}
                <button
                  type="button"
                  className="text-indigo-600 hover:underline"
                  onClick={() => navigate('/school/roles-permissions')}
                >
                  Rôles & Permissions
                </button>.
              </p>
              <div className="space-y-3">
                {Object.entries(perms.permissions_by_module).map(([module, actions]) => (
                  <div key={module} className="rounded-lg bg-gray-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                      {module}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {actions.map((a) => (
                        <span
                          key={a}
                          className="inline-flex items-center rounded-full bg-white border border-gray-200 px-2.5 py-0.5 text-xs text-gray-700"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400">Chargement des permissions…</p>
          )}
        </div>
      )}

      {resetOpen && (
        <ResetPasswordModal open={resetOpen} onOpenChange={setResetOpen} user={user} />
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-sm text-gray-900">{value}</p>
    </div>
  )
}
