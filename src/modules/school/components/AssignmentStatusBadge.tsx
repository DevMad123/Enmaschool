interface AssignmentStatusBadgeProps {
  isAssigned: boolean
}

export function AssignmentStatusBadge({ isAssigned }: AssignmentStatusBadgeProps) {
  if (isAssigned) {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200">
        Assigné
      </span>
    )
  }

  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-50 text-red-700 border border-red-200">
      Non assigné
    </span>
  )
}
