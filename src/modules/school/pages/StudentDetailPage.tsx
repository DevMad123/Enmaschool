import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Pencil, GraduationCap, Lock,
  Calendar, MapPin, Droplets, School,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'
import { StudentAvatar } from '../components/StudentAvatar'
import { StudentStatusBadge } from '../components/StudentStatusBadge'
import { MatriculeDisplay } from '../components/MatriculeDisplay'
import { GenderBadge } from '../components/GenderBadge'
import { ParentCard } from '../components/ParentCard'
import { EnrollmentTimeline } from '../components/EnrollmentTimeline'
import { StudentFormModal } from './StudentFormModal'
import { EnrollmentModal } from './EnrollmentModal'
import { useStudent } from '../hooks/useStudents'
import { StudentAttendanceTab } from './StudentAttendanceTab'
import { StudentPaymentTab } from './StudentPaymentTab'

const TABS = [
  { key: 'dossier', label: 'Dossier' },
  { key: 'inscriptions', label: 'Inscriptions' },
  { key: 'parents', label: 'Parents' },
  { key: 'notes', label: 'Notes' },
  { key: 'presences', label: 'Présences' },
  { key: 'paiements', label: 'Paiements' },
] as const

type Tab = (typeof TABS)[number]['key']

export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const studentId = Number(id)

  const [activeTab, setActiveTab] = useState<Tab>('dossier')
  const [editOpen, setEditOpen] = useState(false)
  const [enrollOpen, setEnrollOpen] = useState(false)

  const { data, isLoading, isError } = useStudent(studentId)
  const student = data?.data

  if (isLoading) return <LoadingSpinner />
  if (isError || !student) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Élève introuvable.</p>
        <Link to="/school/students" className="mt-2 text-indigo-600 text-sm hover:underline">
          Retour à la liste
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <Link
        to="/school/students"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux élèves
      </Link>

      {/* Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <StudentAvatar student={student} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{student.full_name}</h1>
                <GenderBadge gender={student.gender.value} />
              </div>
              <div className="mt-1 flex items-center gap-2">
                <MatriculeDisplay matricule={student.matricule} />
                <StudentStatusBadge status={student.status.value} />
              </div>
              {student.current_enrollment?.classe && (
                <p className="mt-1 text-sm text-gray-500">
                  <GraduationCap className="inline mr-1 h-4 w-4" />
                  {student.current_enrollment.classe.display_name}
                  {student.current_enrollment.enrollment_number && (
                    <span className="ml-2 text-gray-400">
                      • N° {student.current_enrollment.enrollment_number}
                    </span>
                  )}
                </p>
              )}
              {!student.current_enrollment && (
                <p className="mt-1 text-sm text-orange-600">
                  Cet élève n'est pas inscrit pour l'année en cours
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-1.5 h-4 w-4" />
              Modifier
            </Button>
            <Button size="sm" onClick={() => setEnrollOpen(true)}>
              <GraduationCap className="mr-1.5 h-4 w-4" />
              Inscrire
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'dossier' && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Identité */}
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Identité
              </h3>
              <dl className="space-y-3">
                <Row icon={<Calendar className="h-4 w-4" />} label="Date de naissance" value={student.birth_date} />
                <Row icon={<MapPin className="h-4 w-4" />} label="Lieu de naissance" value={student.birth_place} />
                <Row label="Nationalité" value={student.nationality} />
                <Row label="N° acte de naissance" value={student.birth_certificate_number} />
                {student.blood_type && (
                  <Row icon={<Droplets className="h-4 w-4" />} label="Groupe sanguin" value={student.blood_type.label} />
                )}
              </dl>
            </div>

            {/* Coordonnées */}
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Coordonnées
              </h3>
              <dl className="space-y-3">
                <Row icon={<MapPin className="h-4 w-4" />} label="Adresse" value={student.address} />
                <Row label="Ville" value={student.city} />
              </dl>
            </div>

            {/* Scolarité */}
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Scolarité
              </h3>
              <dl className="space-y-3">
                <Row icon={<School className="h-4 w-4" />} label="École précédente" value={student.previous_school} />
                <Row label="Première inscription" value={student.first_enrollment_year?.toString()} />
                {student.notes && <Row label="Notes internes" value={student.notes} />}
              </dl>
            </div>
          </div>
        )}

        {activeTab === 'inscriptions' && (
          <EnrollmentTimeline enrollments={student.enrollments ?? []} />
        )}

        {activeTab === 'parents' && (
          <div className="space-y-4">
            {student.parents && student.parents.length > 0 ? (
              student.parents.map((parent) => (
                <ParentCard key={parent.id} parent={parent} readOnly />
              ))
            ) : (
              <p className="text-center py-8 text-gray-500">Aucun parent enregistré</p>
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <Placeholder title="Notes & Bulletins" phase="Phase 6" />
        )}
        {activeTab === 'presences' && (
          <StudentAttendanceTab
            enrollmentId={student.current_enrollment?.id ?? 0}
          />
        )}
        {activeTab === 'paiements' && (
          <StudentPaymentTab
            enrollmentId={student.current_enrollment?.id ?? 0}
          />
        )}
      </div>

      {/* Modals */}
      <StudentFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        studentId={studentId}
      />
      <EnrollmentModal
        open={enrollOpen}
        onClose={() => setEnrollOpen(false)}
        studentId={studentId}
        studentName={student.full_name}
      />
    </div>
  )
}

function Row({
  label,
  value,
  icon,
}: {
  label: string
  value?: string | null
  icon?: React.ReactNode
}) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2">
      {icon && <span className="mt-0.5 text-gray-400 shrink-0">{icon}</span>}
      <div>
        <dt className="text-xs text-gray-400">{label}</dt>
        <dd className="text-sm text-gray-900">{value}</dd>
      </div>
    </div>
  )
}

function Placeholder({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-12 text-center">
      <Lock className="mx-auto h-8 w-8 text-gray-300" />
      <h3 className="mt-3 font-medium text-gray-500">{title}</h3>
      <p className="text-sm text-gray-400">Disponible en {phase}</p>
    </div>
  )
}
