// ===== src/modules/school/components/users/PermissionMatrix.tsx =====

import type { AvailablePermissions } from '../../types/users.types'

interface PermissionMatrixProps {
  permissions: AvailablePermissions
  selected: string[]
  onChange: (selected: string[]) => void
  readonly?: boolean
}

export function PermissionMatrix({
  permissions,
  selected,
  onChange,
  readonly = false,
}: PermissionMatrixProps) {
  const toggle = (permission: string) => {
    if (readonly) return
    if (selected.includes(permission)) {
      onChange(selected.filter((p) => p !== permission))
    } else {
      onChange([...selected, permission])
    }
  }

  return (
    <div className="space-y-3">
      {Object.values(permissions).map((module) => (
        <div
          key={module.key}
          className="rounded-lg border border-gray-200 bg-white p-4"
        >
          <p className="mb-3 text-sm font-semibold text-gray-800">{module.label}</p>
          <div className="flex flex-wrap gap-3">
            {module.actions.map((action) => {
              const checked = selected.includes(action.permission)
              return (
                <label
                  key={action.key}
                  className={`flex cursor-pointer items-center gap-2 text-sm ${
                    readonly ? 'cursor-default' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(action.permission)}
                    disabled={readonly}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className={checked ? 'text-gray-900' : 'text-gray-500'}>
                    {action.label}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
