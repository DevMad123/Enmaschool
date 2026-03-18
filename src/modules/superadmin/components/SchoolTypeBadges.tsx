// ===== src/modules/superadmin/components/SchoolTypeBadges.tsx =====

interface SchoolTypeBadgesProps {
  has_maternelle: boolean
  has_primary: boolean
  has_college: boolean
  has_lycee: boolean
  size?: 'sm' | 'md'
}

const types = [
  {
    key: 'has_maternelle' as const,
    label: 'M',
    title: 'Maternelle',
    classes: 'bg-pink-100 text-pink-700 border-pink-200',
  },
  {
    key: 'has_primary' as const,
    label: 'P',
    title: 'Primaire',
    classes: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  {
    key: 'has_college' as const,
    label: 'C',
    title: 'Collège',
    classes: 'bg-violet-100 text-violet-700 border-violet-200',
  },
  {
    key: 'has_lycee' as const,
    label: 'L',
    title: 'Lycée',
    classes: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
]

export function SchoolTypeBadges({
  has_maternelle,
  has_primary,
  has_college,
  has_lycee,
  size = 'md',
}: SchoolTypeBadgesProps) {
  const values: Record<string, boolean> = {
    has_maternelle,
    has_primary,
    has_college,
    has_lycee,
  }

  return (
    <div className="flex gap-1 flex-wrap">
      {types.map(({ key, label, title, classes }) =>
        values[key] ? (
          <span
            key={key}
            title={title}
            className={`inline-flex items-center justify-center rounded border font-bold ${classes} ${
              size === 'sm' ? 'h-5 w-5 text-[10px]' : 'h-6 w-6 text-xs'
            }`}
          >
            {label}
          </span>
        ) : null,
      )}
    </div>
  )
}
