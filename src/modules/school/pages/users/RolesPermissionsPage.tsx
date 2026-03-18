// ===== src/modules/school/pages/users/RolesPermissionsPage.tsx =====

import { useState, useEffect } from 'react'
import { Shield, CheckCircle2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'
import { useRolesPermissions, useAvailablePermissions, useUpdateRolePermissions } from '../../hooks/useUsers'
import { PermissionMatrix } from '../../components/users/PermissionMatrix'
import { USER_ROLE_LABELS, type UserRole } from '../../types/users.types'

const EDITABLE_ROLES: UserRole[] = ['director', 'teacher', 'accountant', 'staff']

export function RolesPermissionsPage() {
  const [activeRole, setActiveRole] = useState<UserRole>('director')
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])

  const { data: rolesData, isLoading: rolesLoading } = useRolesPermissions()
  const { data: availableData, isLoading: availLoading } = useAvailablePermissions()
  const updateMutation = useUpdateRolePermissions()

  const roles        = rolesData?.data ?? []
  const available    = availableData?.data ?? {}
  const activeData   = roles.find((r) => r.name === activeRole)

  // Sync selected permissions when tab changes
  useEffect(() => {
    if (activeData) {
      const flat = Object.entries(activeData.permissions_by_module).flatMap(
        ([module, actions]) => actions.map((a) => `${module}.${a}`),
      )
      setSelectedPermissions(flat)
    }
  }, [activeRole, activeData])

  const handleSave = () => {
    updateMutation.mutate({ roleName: activeRole, permissions: selectedPermissions })
  }

  const handleReset = () => {
    if (activeData) {
      const flat = Object.entries(activeData.permissions_by_module).flatMap(
        ([module, actions]) => actions.map((a) => `${module}.${a}`),
      )
      setSelectedPermissions(flat)
    }
  }

  if (rolesLoading || availLoading) return <LoadingSpinner fullScreen />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rôles & Permissions</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configurez les permissions de chaque rôle
        </p>
      </div>

      {/* Tabs rôles */}
      <div className="flex gap-1 border-b border-gray-200">
        {/* school_admin — lecture seule */}
        <button
          type="button"
          onClick={() => setActiveRole('school_admin')}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeRole === 'school_admin'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Administrateur
        </button>

        {EDITABLE_ROLES.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => setActiveRole(role)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeRole === role
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {USER_ROLE_LABELS[role]}
          </button>
        ))}
      </div>

      {activeRole === 'school_admin' ? (
        /* school_admin : lecture seule */
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50 py-12">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
            <Shield className="h-6 w-6 text-indigo-600" />
          </div>
          <p className="text-sm font-semibold text-indigo-800">Accès complet</p>
          <p className="text-xs text-indigo-600">
            L'administrateur a accès à toutes les fonctionnalités sans restriction.
          </p>
        </div>
      ) : (
        <>
          {/* Matrice */}
          <PermissionMatrix
            permissions={available}
            selected={selectedPermissions}
            onChange={setSelectedPermissions}
          />

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-gray-200 pt-4">
            <Button variant="outline" onClick={handleReset} disabled={updateMutation.isPending}>
              Restaurer les valeurs
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                'Enregistrement…'
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Sauvegarder
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
