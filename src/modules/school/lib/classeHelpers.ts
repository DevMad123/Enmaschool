// ===== src/modules/school/lib/classeHelpers.ts =====

import type { SchoolLevel, LevelCategory, LyceeSerie } from '../types/school.types'

/**
 * Generate a preview of the display_name before saving.
 *
 * With serie:   "{short_label} {serie}{section}" → "Tle C1", "1ère A2", "2nde A1"
 * Without serie: "{label} {section}"              → "6ème 1", "CM1 A", "PS B"
 */
export function previewDisplayName(
  level: Pick<SchoolLevel, 'requires_serie' | 'short_label' | 'label'>,
  section: string,
  serie?: LyceeSerie | null,
): string {
  if (level.requires_serie && serie) {
    return `${level.short_label} ${serie}${section}`
  }
  return `${level.label} ${section}`
}

/**
 * Check if a level requires a serie (lycée: 2nde, 1ère, Terminale).
 */
export function levelRequiresSerie(level: SchoolLevel): boolean {
  return level.requires_serie
}

/**
 * Get French label for a level category.
 */
export function getLevelCategoryLabel(category: LevelCategory): string {
  const labels: Record<LevelCategory, string> = {
    maternelle: 'Maternelle',
    primaire: 'Primaire',
    college: 'Collège',
    lycee: 'Lycée',
  }
  return labels[category]
}

/**
 * Get lucide-react icon name for a level category.
 */
export function getLevelCategoryIcon(category: LevelCategory): string {
  const icons: Record<LevelCategory, string> = {
    maternelle: 'Baby',
    primaire: 'BookOpen',
    college: 'GraduationCap',
    lycee: 'School',
  }
  return icons[category]
}

/**
 * Get CSS color for a level category.
 */
export function getLevelCategoryColor(category: LevelCategory): string {
  const colors: Record<LevelCategory, string> = {
    maternelle: '#ec4899',
    primaire: '#3b82f6',
    college: '#22c55e',
    lycee: '#8b5cf6',
  }
  return colors[category]
}
