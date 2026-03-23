import { useState, useCallback, useRef, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Save, RefreshCw, Download, Eye,
  AlertTriangle, CheckCircle, Lock,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'
import { ReportCardStatusBadge } from '../components/ReportCardStatusBadge'
import { CouncilDecisionBadge } from '../components/CouncilDecisionBadge'
import {
  useReportCard,
  useUpdateCouncil,
  useSaveAppreciations,
  useGenerateReportCard,
  usePublishReportCard,
  useDownloadReportCard,
} from '../hooks/useReportCards'
import { formatBulletinTitle } from '../lib/reportCardHelpers'
import type {
  CouncilDecision,
  HonorMention,
  AppreciationEntry,
} from '../types/reportCards.types'

const QUICK_APPRECIATIONS = [
  'Excellent travail, continue ainsi',
  'Très bon travail',
  'Bon travail',
  'Assez bien',
  'Peut mieux faire',
  'Des efforts à fournir',
  'Travail insuffisant',
]

const DECISIONS: Array<{ value: CouncilDecision; label: string }> = [
  { value: 'pass',        label: 'Admis(e) en classe supérieure' },
  { value: 'repeat',      label: 'Redouble' },
  { value: 'conditional', label: 'Passage conditionnel' },
  { value: 'transfer',    label: 'Orienté(e)' },
  { value: 'excluded',    label: 'Exclu(e)' },
  { value: 'honor',       label: 'Admis(e) avec mention' },
]

const MENTIONS: Array<{ value: HonorMention; label: string }> = [
  { value: 'encouragements', label: 'Encouragements' },
  { value: 'compliments',    label: 'Compliments' },
  { value: 'felicitations',  label: 'Félicitations' },
]

export function ReportCardEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const rcId = Number(id)

  const { data: rcData, isLoading } = useReportCard(rcId)
  const rc = rcData?.data

  // Appréciations locales (une par matière)
  const [appreciations, setAppreciations] = useState<Record<number, string>>({})
  const [activeSubjectId, setActiveSubjectId] = useState<number | null>(null)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Données conseil
  const [generalAppreciation, setGeneralAppreciation] = useState('')
  const [councilDecision,     setCouncilDecision]     = useState<CouncilDecision | ''>('')
  const [honorMention,        setHonorMention]        = useState<HonorMention | ''>('')
  const [absJustified,        setAbsJustified]        = useState(0)
  const [absUnjustified,      setAbsUnjustified]      = useState(0)

  // Initialiser depuis les données chargées
  useEffect(() => {
    if (!rc) return
    setGeneralAppreciation(rc.general_appreciation ?? '')
    setCouncilDecision((rc.council_decision?.value as CouncilDecision) ?? '')
    setHonorMention((rc.honor_mention?.value as HonorMention) ?? '')
    setAbsJustified(rc.absences_justified)
    setAbsUnjustified(rc.absences_unjustified)

    // Charger les appréciations existantes
    if (rc.appreciations) {
      const map: Record<number, string> = {}
      rc.appreciations.forEach((a) => {
        if (a.subject?.id) map[a.subject.id] = a.appreciation
      })
      setAppreciations(map)
    }
  }, [rc?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const saveMutation     = useSaveAppreciations()
  const councilMutation  = useUpdateCouncil()
  const genMutation      = useGenerateReportCard()
  const pubMutation      = usePublishReportCard()
  const downloadMutation = useDownloadReportCard()

  const isReadOnly = rc ? !rc.is_editable : true

  // Auto-save des appréciations (debounce 2s)
  const triggerAutoSave = useCallback((entries: AppreciationEntry[]) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      if (rcId && entries.length > 0 && !isReadOnly) {
        saveMutation.mutate({ id: rcId, appreciations: entries })
      }
    }, 2000)
  }, [rcId, isReadOnly, saveMutation])

  const handleAppreciationChange = (subjectId: number, value: string) => {
    const updated = { ...appreciations, [subjectId]: value }
    setAppreciations(updated)
    const entries: AppreciationEntry[] = Object.entries(updated)
      .filter(([, v]) => v.trim())
      .map(([k, v]) => ({ subject_id: Number(k), appreciation: v }))
    triggerAutoSave(entries)
  }

  const handleQuickInsert = (text: string) => {
    if (!activeSubjectId) return
    handleAppreciationChange(activeSubjectId, text)
  }

  const handleSaveCouncil = () => {
    councilMutation.mutate({
      id: rcId,
      data: {
        general_appreciation:  generalAppreciation || undefined,
        council_decision:      councilDecision || null,
        honor_mention:         (councilDecision === 'honor' && honorMention) ? honorMention : null,
        absences_justified:    absJustified,
        absences_unjustified:  absUnjustified,
      },
    })
  }

  const handleSaveAll = () => {
    // Sauvegarder appréciations
    const entries: AppreciationEntry[] = Object.entries(appreciations)
      .filter(([, v]) => v.trim())
      .map(([k, v]) => ({ subject_id: Number(k), appreciation: v }))
    if (entries.length > 0) {
      saveMutation.mutate({ id: rcId, appreciations: entries })
    }
    handleSaveCouncil()
  }

  const handleGenerate = () => genMutation.mutate(rcId)

  const handleDownload = () => {
    if (!rc) return
    const period  = rc.period?.name ?? 'annuel'
    const student = rc.student?.matricule ?? `${rcId}`
    downloadMutation.mutate({ id: rcId, filename: `bulletin_${student}_${period}.pdf` })
  }

  if (isLoading) return <LoadingSpinner fullScreen />
  if (!rc) return <p className="p-8 text-gray-500">Bulletin introuvable.</p>

  // Extraire les matières depuis les appréciations ou bulletin_data
  const subjectList = rc.appreciations?.map((a) => a.subject).filter(Boolean) ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/school/report-cards"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Bulletins
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-lg font-semibold text-gray-900">
          {formatBulletinTitle(rc)}
        </h1>
        <ReportCardStatusBadge status={rc.status.value} />
        {isReadOnly && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            <Lock className="h-3 w-3" /> Lecture seule
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* ── Colonne gauche : Appréciations (60%) ─────────────────── */}
        <div className="lg:col-span-3 space-y-4">
          {/* Raccourcis */}
          {!isReadOnly && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="mb-2 text-xs font-medium text-gray-600">Raccourcis :</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_APPRECIATIONS.map((text) => (
                  <button
                    key={text}
                    type="button"
                    onClick={() => handleQuickInsert(text)}
                    className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                    disabled={!activeSubjectId}
                  >
                    {text}
                  </button>
                ))}
              </div>
              {!activeSubjectId && (
                <p className="mt-1 text-xs text-gray-400 italic">
                  Cliquez dans un champ d'appréciation pour activer les raccourcis.
                </p>
              )}
            </div>
          )}

          {/* Tableau des appréciations */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Matière</th>
                  <th className="w-16 px-3 py-3 text-center font-medium text-gray-600">Coeff</th>
                  <th className="w-20 px-3 py-3 text-center font-medium text-gray-600">Moy.</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Appréciation
                    <span className="ml-1 text-xs font-normal text-gray-400">(max 300)</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subjectList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">
                      Chargez le bulletin pour voir les matières.
                    </td>
                  </tr>
                ) : (
                  subjectList.map((subject) => {
                    if (!subject) return null
                    const appre = rc.appreciations?.find((a) => a.subject?.id === subject.id)
                    return (
                      <tr key={subject.id}>
                        <td className="px-4 py-2">
                          <span className="font-medium text-gray-900">{subject.name}</span>
                          {subject.code && (
                            <span className="ml-1.5 text-xs text-gray-400">{subject.code}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center text-gray-600">
                          {subject.coefficient ?? '—'}
                        </td>
                        <td className="px-3 py-2 text-center font-mono text-gray-700">—</td>
                        <td className="px-4 py-2">
                          {isReadOnly ? (
                            <p className="text-sm text-gray-600 italic">
                              {appreciations[subject.id] || appre?.appreciation || '—'}
                            </p>
                          ) : (
                            <div>
                              <textarea
                                rows={2}
                                maxLength={300}
                                value={appreciations[subject.id] ?? appre?.appreciation ?? ''}
                                onChange={(e) => handleAppreciationChange(subject.id, e.target.value)}
                                onFocus={() => setActiveSubjectId(subject.id)}
                                placeholder="Appréciation…"
                                className="w-full resize-none rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                              />
                              <p className="text-right text-xs text-gray-400">
                                {(appreciations[subject.id] ?? appre?.appreciation ?? '').length}/300
                              </p>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Colonne droite : Infos & Décision (40%) ──────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Card élève */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-900">Élève</h3>
            <div className="space-y-1 text-sm text-gray-700">
              <div className="flex justify-between">
                <span className="text-gray-500">Nom</span>
                <span className="font-medium">{rc.student?.full_name ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Matricule</span>
                <span className="font-mono text-xs">{rc.student?.matricule ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Classe</span>
                <span>{rc.classe?.display_name ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Moyenne</span>
                <span className="font-medium text-indigo-700">
                  {rc.general_average !== null ? `${Number(rc.general_average).toFixed(2)}/20` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Rang</span>
                <span>
                  {rc.general_rank && rc.class_size
                    ? `${rc.general_rank}/${rc.class_size}`
                    : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Card absences */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-900">Absences</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">Justifiées (h)</label>
                <input
                  type="number" min={0}
                  value={absJustified}
                  onChange={(e) => setAbsJustified(Number(e.target.value))}
                  disabled={isReadOnly}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Non justifiées (h)</label>
                <input
                  type="number" min={0}
                  value={absUnjustified}
                  onChange={(e) => setAbsUnjustified(Number(e.target.value))}
                  disabled={isReadOnly}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Card décision */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Décision du conseil</h3>

            <div>
              <label className="text-xs text-gray-500">Appréciation générale (max 500)</label>
              <textarea
                rows={3}
                maxLength={500}
                value={generalAppreciation}
                onChange={(e) => setGeneralAppreciation(e.target.value)}
                disabled={isReadOnly}
                placeholder="Appréciation générale du conseil de classe…"
                className="mt-1 w-full resize-none rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-50 disabled:text-gray-500"
              />
              <p className="text-right text-xs text-gray-400">
                {generalAppreciation.length}/500
              </p>
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1.5">Décision</label>
              <div className="space-y-1.5">
                {DECISIONS.map((d) => (
                  <label
                    key={d.value}
                    className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                      councilDecision === d.value
                        ? 'border-indigo-400 bg-indigo-50 text-indigo-800'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    } ${isReadOnly ? 'cursor-not-allowed opacity-60' : ''}`}
                  >
                    <input
                      type="radio"
                      name="council_decision"
                      value={d.value}
                      checked={councilDecision === d.value}
                      onChange={() => !isReadOnly && setCouncilDecision(d.value)}
                      disabled={isReadOnly}
                      className="sr-only"
                    />
                    {d.label}
                  </label>
                ))}
              </div>
            </div>

            {councilDecision === 'honor' && (
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Mention</label>
                <div className="flex gap-2 flex-wrap">
                  {MENTIONS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => !isReadOnly && setHonorMention(m.value)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        honorMention === m.value
                          ? 'border-purple-400 bg-purple-100 text-purple-800'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Boutons d'action */}
          {!isReadOnly && (
            <div className="flex flex-col gap-2">
              <Button onClick={handleSaveAll} disabled={saveMutation.isPending || councilMutation.isPending}>
                <Save className="mr-1.5 h-4 w-4" />
                {saveMutation.isPending || councilMutation.isPending ? 'Sauvegarde…' : 'Sauvegarder'}
              </Button>
              <Button
                variant="outline"
                onClick={handleGenerate}
                disabled={genMutation.isPending}
              >
                <RefreshCw className="mr-1.5 h-4 w-4" />
                {genMutation.isPending ? 'Génération…' : 'Générer le PDF'}
              </Button>
            </div>
          )}

          {rc.has_pdf && (
            <Button variant="outline" onClick={handleDownload} className="w-full">
              <Download className="mr-1.5 h-4 w-4" />
              Télécharger le PDF
            </Button>
          )}

          {rc.has_pdf && rc.status.value === 'generated' && !isReadOnly && (
            <Button
              className="w-full"
              onClick={() => pubMutation.mutate(rcId)}
              disabled={pubMutation.isPending}
            >
              <CheckCircle className="mr-1.5 h-4 w-4" />
              {pubMutation.isPending ? 'Publication…' : 'Publier le bulletin'}
            </Button>
          )}

          {rc.is_editable === false && rc.status.value !== 'published' && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-800">
                Ce bulletin n'est plus modifiable.
              </p>
            </div>
          )}

          {rc.status.value === 'published' && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3">
              <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
              <div>
                <p className="text-xs font-medium text-green-800">Bulletin publié</p>
                {rc.published_at && (
                  <p className="text-xs text-green-600">Le {rc.published_at}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
