import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText, Eye, Download, CheckCircle, Trash2, RefreshCw,
  BarChart3, BookOpen,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { useSchoolStore } from '../store/schoolStore'
import { useAcademicYears, useAcademicYearPeriods } from '../hooks/useAcademicYears'
import { useClasses } from '../hooks/useClasses'
import {
  useReportCards,
  useClassBulletinsStats,
  useInitiateClassReportCards,
  useGenerateForClass,
  usePublishForClass,
  useGenerateReportCard,
  usePublishReportCard,
  useDeleteReportCard,
  useDownloadReportCard,
} from '../hooks/useReportCards'
import { ReportCardStatusBadge } from '../components/ReportCardStatusBadge'
import { CouncilDecisionBadge } from '../components/CouncilDecisionBadge'
import { formatBulletinTitle } from '../lib/reportCardHelpers'
import type { ReportCard, ReportCardType } from '../types/reportCards.types'

export function ReportCardsPage() {
  const navigate     = useNavigate()
  const { currentYearId } = useSchoolStore()

  const [selectedYearId,   setSelectedYearId]   = useState<number | null>(null)
  const [selectedPeriodId, setSelectedPeriodId] = useState<number>(0)
  const [selectedClassId,  setSelectedClassId]  = useState<number>(0)
  const [typeFilter,       setTypeFilter]        = useState<ReportCardType | ''>('period')

  useEffect(() => {
    if (currentYearId && selectedYearId === null) setSelectedYearId(currentYearId)
  }, [currentYearId]) // eslint-disable-line react-hooks/exhaustive-deps

  const yearId = selectedYearId ?? 0

  const { data: yearsData }   = useAcademicYears()
  const years                 = yearsData?.data ?? []
  const { data: periodsData } = useAcademicYearPeriods(yearId)
  const periods               = periodsData?.data ?? []
  const { data: classesData } = useClasses({ academic_year_id: yearId || undefined })
  const classes               = classesData?.data ?? []

  // Stats de la classe sélectionnée
  const { data: statsData } = useClassBulletinsStats(
    selectedClassId || undefined,
    selectedPeriodId || undefined,
  )
  const stats = statsData?.data

  // Liste des bulletins
  const filters: Record<string, unknown> = {}
  if (selectedClassId)  filters.class_id  = selectedClassId
  if (selectedPeriodId) filters.period_id = selectedPeriodId
  if (yearId)           filters.year_id   = yearId
  if (typeFilter)       filters.type      = typeFilter

  const { data: rcData, isLoading } = useReportCards(
    Object.keys(filters).length > 0 ? filters : undefined,
  )
  const reportCards = rcData?.data ?? []

  // Mutations
  const initiateMutation = useInitiateClassReportCards()
  const genClassMutation = useGenerateForClass()
  const pubClassMutation = usePublishForClass()
  const genOneMutation   = useGenerateReportCard()
  const pubOneMutation   = usePublishReportCard()
  const deleteMutation   = useDeleteReportCard()
  const downloadMutation = useDownloadReportCard()

  const handleInitiateClass = () => {
    if (!selectedClassId) return
    initiateMutation.mutate({
      class_id:  selectedClassId,
      period_id: selectedPeriodId || undefined,
      type:      (typeFilter as ReportCardType) || 'period',
    })
  }

  const handleGenerateClass = () => {
    if (!selectedClassId) return
    genClassMutation.mutate({
      class_id:  selectedClassId,
      period_id: selectedPeriodId || undefined,
      type:      (typeFilter as ReportCardType) || 'period',
    })
  }

  const handlePublishClass = () => {
    if (!selectedClassId) return
    pubClassMutation.mutate({
      class_id:  selectedClassId,
      period_id: selectedPeriodId || undefined,
    })
  }

  const handleDownload = (rc: ReportCard) => {
    const period  = rc.period?.name ?? 'annuel'
    const student = rc.student?.matricule ?? `${rc.id}`
    downloadMutation.mutate({ id: rc.id, filename: `bulletin_${student}_${period}.pdf` })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulletins Scolaires</h1>
          <p className="mt-1 text-sm text-gray-500">Génération et gestion des bulletins PDF</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <select
          value={selectedYearId ?? ''}
          onChange={(e) => {
            setSelectedYearId(e.target.value ? Number(e.target.value) : null)
            setSelectedPeriodId(0)
            setSelectedClassId(0)
          }}
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Toutes les années</option>
          {years.map((y) => (
            <option key={y.id} value={y.id}>{y.name}</option>
          ))}
        </select>

        <select
          value={selectedPeriodId}
          onChange={(e) => setSelectedPeriodId(Number(e.target.value))}
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value={0}>Toutes les périodes</option>
          {periods.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(Number(e.target.value))}
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value={0}>Toutes les classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.display_name}</option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as ReportCardType | '')}
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Tous les types</option>
          <option value="period">Bulletin de période</option>
          <option value="annual">Bulletin annuel</option>
        </select>
      </div>

      {/* Actions en masse (si classe sélectionnée) */}
      {selectedClassId > 0 && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-indigo-900">Actions en masse</p>
              <p className="text-xs text-indigo-600 mt-0.5">
                Pour la classe sélectionnée ({selectedPeriodId ? 'période filtrée' : 'toutes périodes'})
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm" variant="outline"
                onClick={handleInitiateClass}
                disabled={initiateMutation.isPending}
              >
                <FileText className="mr-1.5 h-3.5 w-3.5" />
                Initier les bulletins
              </Button>
              <Button
                size="sm" variant="outline"
                onClick={handleGenerateClass}
                disabled={genClassMutation.isPending}
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Générer en masse
              </Button>
              <Button
                size="sm"
                onClick={handlePublishClass}
                disabled={pubClassMutation.isPending}
              >
                <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                Publier en masse
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stats (si classe sélectionnée) */}
      {stats && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              Avancement — {stats.classe.display_name}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { label: 'Total',     value: stats.total_students, color: 'text-gray-900' },
              { label: 'Brouillon', value: stats.draft,          color: 'text-gray-500' },
              { label: 'Générés',   value: stats.generated,      color: 'text-blue-600' },
              { label: 'Publiés',   value: stats.published,       color: 'text-green-600' },
              { label: 'Manquants', value: stats.missing,         color: 'text-red-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg bg-gray-50 p-3 text-center">
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
          {/* Barre de progression */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Taux de complétion</span>
              <span>{stats.completion_rate}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-indigo-500 transition-all"
                style={{ width: `${stats.completion_rate}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tableau */}
      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : reportCards.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Aucun bulletin"
          description="Aucun bulletin ne correspond à vos filtres. Sélectionnez une classe et une période, puis cliquez sur 'Initier les bulletins'."
        />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Élève</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Classe</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Période</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Moy.</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Rang</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Statut</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Décision</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reportCards.map((rc) => (
                <tr key={rc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {rc.student?.full_name ?? '—'}
                    </div>
                    <div className="text-xs text-gray-500">{rc.student?.matricule}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {rc.classe?.display_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {rc.period?.name ?? 'Annuel'}
                  </td>
                  <td className="px-4 py-3 text-center font-mono">
                    {rc.general_average !== null
                      ? `${Number(rc.general_average).toFixed(2)}/20`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {rc.general_rank && rc.class_size
                      ? `${rc.general_rank}${rc.general_rank === 1 ? 'er' : 'e'}/${rc.class_size}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <ReportCardStatusBadge status={rc.status.value} />
                  </td>
                  <td className="px-4 py-3">
                    {rc.council_decision
                      ? <CouncilDecisionBadge decision={rc.council_decision.value} />
                      : <span className="text-xs text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {/* Draft: éditer + générer */}
                      {rc.status.value === 'draft' && (
                        <>
                          <Button
                            size="sm" variant="ghost"
                            onClick={() => navigate(`/school/report-cards/${rc.id}/edit`)}
                          >
                            <BookOpen className="h-3.5 w-3.5 mr-1" />
                            Éditer
                          </Button>
                          <Button
                            size="sm" variant="ghost"
                            onClick={() => genOneMutation.mutate(rc.id)}
                            disabled={genOneMutation.isPending}
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm" variant="ghost"
                            className="text-red-400 hover:text-red-600"
                            onClick={() => deleteMutation.mutate(rc.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                      {/* Generated: voir + télécharger + publier + régénérer */}
                      {rc.status.value === 'generated' && (
                        <>
                          <Button
                            size="sm" variant="ghost"
                            onClick={() => navigate(`/school/report-cards/${rc.id}/edit`)}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Voir
                          </Button>
                          <Button
                            size="sm" variant="ghost"
                            onClick={() => handleDownload(rc)}
                          >
                            <Download className="h-3.5 w-3.5 mr-1" />
                            PDF
                          </Button>
                          <Button
                            size="sm" variant="ghost"
                            onClick={() => pubOneMutation.mutate(rc.id)}
                          >
                            <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                          </Button>
                          <Button
                            size="sm" variant="ghost"
                            onClick={() => genOneMutation.mutate(rc.id)}
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                      {/* Published: voir + télécharger (lecture seule) */}
                      {rc.status.value === 'published' && (
                        <>
                          <Button
                            size="sm" variant="ghost"
                            onClick={() => navigate(`/school/report-cards/${rc.id}/edit`)}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Voir
                          </Button>
                          <Button
                            size="sm" variant="ghost"
                            onClick={() => handleDownload(rc)}
                          >
                            <Download className="h-3.5 w-3.5 mr-1" />
                            PDF
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
