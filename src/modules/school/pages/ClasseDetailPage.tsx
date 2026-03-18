import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, BookOpen, Users, Clock } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'
import { useClasse, useClasseSubjects } from '../hooks/useClasses'
import { LevelCategoryBadge } from '../components/LevelCategoryBadge'
import type { Subject } from '../types/school.types'

type Tab = 'info' | 'subjects' | 'students' | 'timetable'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'info', label: 'Informations', icon: BookOpen },
  { id: 'subjects', label: 'Matières', icon: BookOpen },
  { id: 'students', label: 'Élèves', icon: Users },
  { id: 'timetable', label: 'Emploi du temps', icon: Clock },
]

function TabInfo({ classe }: { classe: NonNullable<ReturnType<typeof useClasse>['data']>['data'] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
        <h3 className="font-semibold text-slate-900">Informations générales</h3>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Nom</dt>
            <dd className="font-medium text-slate-900">{classe.display_name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Niveau</dt>
            <dd>{classe.level && <LevelCategoryBadge category={classe.level.category.value} />}</dd>
          </div>
          {classe.serie && (
            <div className="flex justify-between">
              <dt className="text-slate-500">Série</dt>
              <dd className="font-medium text-slate-900">{classe.serie}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-slate-500">Section</dt>
            <dd className="font-medium text-slate-900">{classe.section}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Capacité</dt>
            <dd className="font-medium text-slate-900">{classe.capacity} places</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
        <h3 className="font-semibold text-slate-900">Affectations</h3>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Professeur principal</dt>
            <dd className="font-medium text-slate-900">
              {classe.main_teacher?.full_name ?? '—'}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Salle</dt>
            <dd className="font-medium text-slate-900">
              {classe.room?.name ?? '—'}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Matières</dt>
            <dd className="font-medium text-slate-900">{classe.subjects_count ?? 0}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Élèves</dt>
            <dd className="font-medium text-slate-900">{classe.students_count ?? 0}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

function TabSubjects({ classeId }: { classeId: number }) {
  const { data, isLoading } = useClasseSubjects(classeId)
  const subjects: Subject[] = data?.data ?? []

  if (isLoading) return <LoadingSpinner />

  if (subjects.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Aucune matière assignée à cette classe.
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Matière</th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Code</th>
            <th className="px-4 py-3 text-right font-medium text-slate-600">Coefficient</th>
            <th className="px-4 py-3 text-right font-medium text-slate-600">H/sem</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {subjects.map((s) => (
            <tr key={s.id}>
              <td className="px-4 py-3 font-medium text-slate-900">
                <span className="inline-block h-2.5 w-2.5 rounded-full mr-2" style={{ backgroundColor: s.color }} />
                {s.name}
              </td>
              <td className="px-4 py-3 text-slate-500">{s.code}</td>
              <td className="px-4 py-3 text-right text-slate-900">
                {s.effective_coefficient ?? s.coefficient}
              </td>
              <td className="px-4 py-3 text-right text-slate-500">
                {s.hours_per_week ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TabPlaceholder({ label }: { label: string }) {
  return (
    <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center">
      <p className="text-sm text-slate-500">Disponible en {label}</p>
    </div>
  )
}

export function ClasseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<Tab>('info')
  const { data, isLoading } = useClasse(Number(id))

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const classe = data?.data
  if (!classe) {
    return <p className="text-sm text-slate-500 py-10 text-center">Classe introuvable.</p>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/school/classes">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" /> Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{classe.display_name}</h1>
          <div className="flex items-center gap-2 mt-1">
            {classe.level && <LevelCategoryBadge category={classe.level.category.value} />}
            {classe.serie && (
              <span className="text-xs font-medium text-violet-700 bg-violet-50 rounded-full px-2 py-0.5">
                Série {classe.serie}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'info' && <TabInfo classe={classe} />}
      {activeTab === 'subjects' && <TabSubjects classeId={classe.id} />}
      {activeTab === 'students' && <TabPlaceholder label="Phase 4" />}
      {activeTab === 'timetable' && <TabPlaceholder label="Phase 8" />}
    </div>
  )
}
