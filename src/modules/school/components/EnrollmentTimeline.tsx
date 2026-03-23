import { cn } from '@/shared/lib/utils'
import { getEnrollmentStatusColor } from '../lib/studentHelpers'
import type { Enrollment } from '../types/students.types'

const STATUS_COLOR_CLASSES: Record<string, string> = {
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
  gray: 'bg-gray-400',
}

interface EnrollmentTimelineProps {
  enrollments: Enrollment[]
  className?: string
}

export function EnrollmentTimeline({ enrollments, className }: EnrollmentTimelineProps) {
  if (enrollments.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-8">
        Aucune inscription enregistrée
      </p>
    )
  }

  const sorted = [...enrollments].sort((a, b) => {
    const yearA = a.academic_year?.name ?? ''
    const yearB = b.academic_year?.name ?? ''
    return yearB.localeCompare(yearA)
  })

  return (
    <ol className={cn('relative border-l border-gray-200 pl-6 space-y-6', className)}>
      {sorted.map((enrollment) => {
        const statusColor = getEnrollmentStatusColor(enrollment.status.value)
        const dotClass = STATUS_COLOR_CLASSES[statusColor] ?? STATUS_COLOR_CLASSES.gray

        return (
          <li key={enrollment.id} className="relative">
            <span
              className={cn(
                'absolute -left-[1.6rem] flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white',
                dotClass,
              )}
            />
            <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {enrollment.classe?.display_name ?? 'Classe inconnue'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {enrollment.academic_year?.name ?? '—'}
                    {enrollment.enrollment_number && (
                      <span className="ml-2 text-gray-400">• N° {enrollment.enrollment_number}</span>
                    )}
                  </p>
                </div>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-medium',
                    `bg-${statusColor}-100 text-${statusColor}-700`,
                  )}
                  style={{
                    backgroundColor: `var(--color-${statusColor}-100, #f3f4f6)`,
                    color: `var(--color-${statusColor}-700, #374151)`,
                  }}
                >
                  {enrollment.status.label}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Inscrit le {enrollment.enrollment_date}
              </p>
              {enrollment.transfer_note && (
                <p className="mt-1 text-xs text-gray-500 italic">
                  Note : {enrollment.transfer_note}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
