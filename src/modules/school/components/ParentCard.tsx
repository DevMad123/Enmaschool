import { Phone, Mail, Shield, User, Users, Trash2, Pencil } from 'lucide-react'
import type { ParentWithPivot } from '../types/students.types'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'

const RELATIONSHIP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  father: User,
  mother: User,
  guardian: Shield,
  other: Users,
}

interface ParentCardProps {
  parent: ParentWithPivot
  onEdit?: (parent: ParentWithPivot) => void
  onRemove?: (parent: ParentWithPivot) => void
  readOnly?: boolean
  className?: string
}

export function ParentCard({ parent, onEdit, onRemove, readOnly = false, className }: ParentCardProps) {
  const Icon = RELATIONSHIP_ICONS[parent.relationship.value] ?? User

  return (
    <div
      className={cn(
        'rounded-lg border bg-white p-4 shadow-sm',
        parent.pivot?.is_primary_contact && 'border-indigo-200 bg-indigo-50/30',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{parent.full_name}</p>
            <p className="text-sm text-gray-500">{parent.relationship.label}</p>
          </div>
        </div>

        {!readOnly && (
          <div className="flex gap-1">
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={() => onEdit(parent)} className="h-7 w-7 p-0">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            {onRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(parent)}
                className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 space-y-1">
        {parent.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span>{parent.phone}</span>
            {parent.phone_secondary && <span className="text-gray-400">/ {parent.phone_secondary}</span>}
          </div>
        )}
        {parent.email && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span>{parent.email}</span>
          </div>
        )}
        {parent.profession && (
          <p className="text-xs text-gray-500">{parent.profession}</p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {parent.pivot?.is_primary_contact && (
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
            Contact principal
          </span>
        )}
        {parent.pivot?.can_pickup && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            Peut récupérer
          </span>
        )}
        {parent.is_emergency_contact && (
          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
            Urgence
          </span>
        )}
      </div>
    </div>
  )
}
