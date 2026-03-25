import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Copy, ArrowLeft } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'
import { FeeScheduleGrid } from '../components/FeeScheduleGrid'
import {
  useFeeTypes, useCreateFeeType, useUpdateFeeType, useDeleteFeeType,
  useFeeSchedules, useBulkSetFeeSchedules, useCopyFeeSchedules,
} from '../hooks/usePayments'
import { useAcademicYears } from '../hooks/useAcademicYears'
import { useSchoolLevels } from '../hooks/useSchoolLevels'
import type { FeeType } from '../types/payments.types'

export function FeeConfigPage() {
  const navigate = useNavigate()
  const [yearId, setYearId]       = useState<number>(0)
  const [editFee, setEditFee]     = useState<FeeType | null>(null)
  const [showForm, setShowForm]   = useState(false)
  const [fromYear, setFromYear]   = useState<number>(0)

  const { data: yearsData }     = useAcademicYears()
  const years = yearsData?.data ?? []
  const { data: levelsRaw }     = useSchoolLevels()
  const { data: feeTypes = [], isLoading: loadingTypes } = useFeeTypes({ active_only: false })
  const { data: schedules = [], isLoading: loadingSchedules } = useFeeSchedules(yearId)

  // SchoolLevel.category est { value, label, color } — on le normalise pour FeeScheduleGrid
  const levels = (levelsRaw?.data?.data ?? []).map((l: any) => ({
    id:       l.id,
    label:    l.label,
    category: typeof l.category === 'object' ? l.category.value : l.category,
  }))

  const createFeeType  = useCreateFeeType()
  const updateFeeType  = useUpdateFeeType()
  const deleteFeeType  = useDeleteFeeType()
  const bulkSetSchedule = useBulkSetFeeSchedules()
  const copySchedules  = useCopyFeeSchedules()

  const selectedYear = years.find((y: { id: number }) => y.id === yearId)

  // Formulaire type de frais (simplifié)
  const [form, setForm] = useState({
    name: '', code: '', is_mandatory: true, is_recurring: true, applies_to: 'all', order: 0,
  })

  const handleSaveFeeType = () => {
    if (editFee) {
      updateFeeType.mutate({ id: editFee.id, data: form }, { onSuccess: () => { setEditFee(null); setShowForm(false) } })
    } else {
      createFeeType.mutate(form, { onSuccess: () => setShowForm(false) })
    }
  }

  const handleGridSave = (cells: Array<{ feeTypeId: number; levelCategory: string | null; amount: number }>) => {
    if (!yearId) return
    const schedulePayload = cells.map((c) => ({
      fee_type_id: c.feeTypeId,
      school_level_id: c.levelCategory ? (levels as Array<{ id: number; category: string }>).find((l) => l.category === c.levelCategory)?.id ?? null : null,
      amount: c.amount,
    }))
    bulkSetSchedule.mutate({ academic_year_id: yearId, schedules: schedulePayload })
  }

  return (
    <div className="space-y-8">
      <div>
        <button
          onClick={() => navigate('/school/payments')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux paiements
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Configuration des frais</h1>
        <p className="mt-1 text-sm text-gray-500">Gérez les types de frais et la grille tarifaire annuelle.</p>
      </div>

      {/* ── Section 1 : Types de frais ── */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="font-semibold text-gray-900">Types de frais</h2>
          <Button size="sm" onClick={() => { setEditFee(null); setForm({ name: '', code: '', is_mandatory: true, is_recurring: true, applies_to: 'all', order: 0 }); setShowForm(true) }}>
            <Plus className="mr-1 h-4 w-4" />Nouveau type
          </Button>
        </div>

        {showForm && (
          <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Nom</label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Code</label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm uppercase"
                  value={form.code}
                  onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Applicable à</label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                  value={form.applies_to}
                  onChange={(e) => setForm((p) => ({ ...p, applies_to: e.target.value }))}
                >
                  {['all', 'maternelle', 'primaire', 'college', 'lycee'].map((v) => (
                    <option key={v} value={v}>{v === 'all' ? 'Tous' : v}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3 flex gap-3">
              <label className="flex items-center gap-1.5 text-sm">
                <input type="checkbox" checked={form.is_mandatory} onChange={(e) => setForm((p) => ({ ...p, is_mandatory: e.target.checked }))} />
                Obligatoire
              </label>
              <label className="flex items-center gap-1.5 text-sm">
                <input type="checkbox" checked={form.is_recurring} onChange={(e) => setForm((p) => ({ ...p, is_recurring: e.target.checked }))} />
                Récurrent
              </label>
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={handleSaveFeeType} disabled={!form.name || !form.code}>
                {editFee ? 'Mettre à jour' : 'Créer'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
            </div>
          </div>
        )}

        {loadingTypes ? (
          <div className="p-6"><LoadingSpinner /></div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Nom', 'Code', 'Applicable à', 'Obligatoire', 'Récurrent', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(feeTypes as FeeType[]).map((ft) => (
                <tr key={ft.id} className={`hover:bg-gray-50 ${!ft.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-medium">{ft.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{ft.code}</td>
                  <td className="px-4 py-3">{ft.applies_to.label}</td>
                  <td className="px-4 py-3">{ft.is_mandatory ? '✓' : '—'}</td>
                  <td className="px-4 py-3">{ft.is_recurring ? '✓' : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => { setEditFee(ft); setForm({ name: ft.name, code: ft.code, is_mandatory: ft.is_mandatory, is_recurring: ft.is_recurring, applies_to: ft.applies_to.value, order: ft.order }); setShowForm(true) }} className="rounded p-1 hover:bg-gray-100">
                        <Pencil className="h-3.5 w-3.5 text-gray-500" />
                      </button>
                      <button onClick={() => deleteFeeType.mutate(ft.id)} className="rounded p-1 hover:bg-red-50">
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ── Section 2 : Grille tarifaire ── */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-6 py-4">
          <h2 className="font-semibold text-gray-900">Grille tarifaire</h2>
          <div className="flex flex-wrap items-center gap-3">
            <select
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
              value={yearId}
              onChange={(e) => setYearId(Number(e.target.value))}
            >
              <option value={0}>Sélectionner une année</option>
              {(years as Array<{ id: number; name: string; is_current: boolean }>).map((y) => (
                <option key={y.id} value={y.id}>{y.name}{y.is_current ? ' (en cours)' : ''}</option>
              ))}
            </select>
            {yearId > 0 && (
              <div className="flex items-center gap-2">
                <select
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                  value={fromYear}
                  onChange={(e) => setFromYear(Number(e.target.value))}
                >
                  <option value={0}>Copier depuis…</option>
                  {(years as Array<{ id: number; name: string }>).filter((y) => y.id !== yearId).map((y) => (
                    <option key={y.id} value={y.id}>{y.name}</option>
                  ))}
                </select>
                {fromYear > 0 && (
                  <Button size="sm" variant="outline" onClick={() => copySchedules.mutate({ fromYearId: fromYear, toYearId: yearId })}>
                    <Copy className="mr-1 h-3.5 w-3.5" />Copier
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          {!yearId ? (
            <p className="text-center text-sm text-gray-400">Sélectionnez une année scolaire pour voir la grille tarifaire.</p>
          ) : loadingSchedules ? (
            <LoadingSpinner />
          ) : (
            <FeeScheduleGrid
              schedules={schedules as any[]}
              feeTypes={feeTypes as FeeType[]}
              levels={levels as Array<{ id: number; category: string; label: string }>}
              onUpdate={handleGridSave}
            />
          )}
        </div>
      </section>
    </div>
  )
}
