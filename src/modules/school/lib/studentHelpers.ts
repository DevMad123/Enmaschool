// ===== src/modules/school/lib/studentHelpers.ts =====

import type { StudentStatus, Gender, EnrollmentStatus } from '../types/students.types'

export function getStudentStatusColor(status: StudentStatus): string {
  const map: Record<StudentStatus, string> = {
    active: 'green',
    inactive: 'gray',
    transferred: 'blue',
    graduated: 'purple',
    expelled: 'red',
  }
  return map[status] ?? 'gray'
}

export function getGenderLabel(gender: Gender): string {
  return gender === 'male' ? 'Masculin' : 'Féminin'
}

export function getGenderColor(gender: Gender): string {
  return gender === 'male' ? 'blue' : 'pink'
}

export function getGenderShort(gender: Gender): string {
  return gender === 'male' ? 'M' : 'F'
}

export function formatBirthDate(dateStr: string): string {
  // API retourne "15/05/2010", on s'assure du bon format
  if (!dateStr) return ''
  // Si format ISO (2010-05-15), convertir
  if (dateStr.includes('-') && dateStr.length === 10) {
    const [year, month, day] = dateStr.split('-')
    return `${day}/${month}/${year}`
  }
  return dateStr
}

export function calculateAge(birthDate: string): number {
  // Accepte "15/05/2010" ou "2010-05-15"
  let date: Date
  if (birthDate.includes('/')) {
    const [day, month, year] = birthDate.split('/')
    date = new Date(`${year}-${month}-${day}`)
  } else {
    date = new Date(birthDate)
  }
  const now = new Date()
  let age = now.getFullYear() - date.getFullYear()
  const m = now.getMonth() - date.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < date.getDate())) {
    age--
  }
  return age
}

export function generateAvatarInitials(fullName: string): string {
  // "KOUASSI Jean-Marc" → "KJ"
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
}

export function formatMatricule(matricule: string): string {
  // "2024PRI00042" → "2024-PRI-00042"
  if (!matricule || matricule.length < 8) return matricule
  const year = matricule.slice(0, 4)
  // On cherche où commencent les chiffres finaux
  const match = matricule.slice(4).match(/^([A-Z]+)(\d+)$/)
  if (!match) return matricule
  return `${year}-${match[1]}-${match[2]}`
}

export function getEnrollmentStatusColor(status: EnrollmentStatus): string {
  const map: Record<EnrollmentStatus, string> = {
    enrolled: 'green',
    transferred_in: 'blue',
    transferred_out: 'orange',
    withdrawn: 'red',
    completed: 'purple',
  }
  return map[status] ?? 'gray'
}

export function isEnrollmentActive(status: EnrollmentStatus): boolean {
  return status === 'enrolled' || status === 'transferred_in'
}
