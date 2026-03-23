import { useState, useRef } from 'react'
import { Upload, FileDown, CheckCircle, XCircle, LoaderCircle } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/shared/components/ui/dialog'
import { useImportStudents, useDownloadImportTemplate } from '../hooks/useStudents'
import { useAcademicYears } from '../hooks/useAcademicYears'
import { useClasses } from '../hooks/useClasses'
import { useSchoolStore } from '../store/schoolStore'
import type { ImportResult } from '../types/students.types'

interface ImportStudentsModalProps {
  open: boolean
  onClose: () => void
}

export function ImportStudentsModal({ open, onClose }: ImportStudentsModalProps) {
  const { currentYearId } = useSchoolStore()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [file, setFile] = useState<File | null>(null)
  const [yearId, setYearId] = useState<number>(currentYearId ?? 0)
  const [classeId, setClasseId] = useState<number>(0)
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: yearsData } = useAcademicYears()
  const { data: classesData } = useClasses({ academic_year_id: yearId || undefined })

  const importMutation = useImportStudents()
  const templateMutation = useDownloadImportTemplate()

  const years = yearsData?.data ?? []
  const classes = (classesData?.data ?? []).filter((c) => !yearId || c.academic_year_id === yearId)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    if (f) setStep(2)
  }

  const handleImport = () => {
    if (!file || !classeId || !yearId) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('classe_id', String(classeId))
    formData.append('academic_year_id', String(yearId))

    importMutation.mutate(formData, {
      onSuccess: (res) => {
        setResult(res.data)
        setStep(3)
      },
    })
  }

  const handleClose = () => {
    setStep(1)
    setFile(null)
    setResult(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importer des élèves (CSV / Excel)</DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-1">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                  step >= s ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'
                }`}
              >
                {s}
              </span>
              <span className={step >= s ? 'text-indigo-700 font-medium' : ''}>
                {s === 1 ? 'Template' : s === 2 ? 'Upload' : 'Résultat'}
              </span>
              {s < 3 && <span className="text-gray-300">→</span>}
            </div>
          ))}
        </div>

        {/* Étape 1 : Template */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Téléchargez le modèle CSV, remplissez-le et importez-le.
            </p>

            <Button
              variant="outline"
              onClick={() => templateMutation.mutate()}
              disabled={templateMutation.isPending}
              className="w-full"
            >
              <FileDown className="mr-2 h-4 w-4" />
              {templateMutation.isPending ? 'Téléchargement...' : 'Télécharger le modèle CSV'}
            </Button>

            <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-500">
              <p className="font-medium text-gray-700 mb-1">Colonnes attendues :</p>
              <p>last_name*, first_name*, birth_date* (JJ/MM/AAAA), gender* (M/F),</p>
              <p>birth_place, nationality, birth_cert_number, address, city,</p>
              <p>previous_school, parent1_first_name, parent1_last_name, parent1_phone*, parent1_relation</p>
            </div>

            <div
              onClick={() => fileRef.current?.click()}
              className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-8 text-center hover:border-indigo-400 hover:bg-indigo-50/20 transition-colors"
            >
              <Upload className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">Cliquez ou glissez votre fichier ici</p>
              <p className="text-xs text-gray-400">CSV, XLSX, XLS — max 10 Mo</p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
        )}

        {/* Étape 2 : Config + Import */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
              <CheckCircle className="h-4 w-4 shrink-0" />
              Fichier : {file?.name}
            </div>

            <div className="space-y-1">
              <Label>Année scolaire *</Label>
              <select
                value={yearId}
                onChange={(e) => setYearId(Number(e.target.value))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value={0}>Sélectionner...</option>
                {years.map((y) => (
                  <option key={y.id} value={y.id}>{y.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label>Classe *</Label>
              <select
                value={classeId}
                onChange={(e) => setClasseId(Number(e.target.value))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value={0}>Sélectionner...</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.display_name}</option>
                ))}
              </select>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(1)}>
                Retour
              </Button>
              <Button
                onClick={handleImport}
                disabled={!file || !classeId || !yearId || importMutation.isPending}
              >
                {importMutation.isPending ? (
                  <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Import en cours...</>
                ) : (
                  'Importer'
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Étape 3 : Résultat */}
        {step === 3 && result && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <Stat label="Créés" value={result.created} color="green" />
              <Stat label="Ignorés" value={result.skipped} color="orange" />
              <Stat label="Erreurs" value={result.errors.length} color="red" />
            </div>

            {result.errors.length > 0 && (
              <div className="max-h-48 overflow-y-auto rounded-md border border-red-100 bg-red-50 p-3 space-y-1">
                {result.errors.map((err, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-red-700">
                    <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>Ligne {err.row} — {err.field} : {err.message}</span>
                  </div>
                ))}
              </div>
            )}

            <DialogFooter>
              <Button onClick={handleClose}>Fermer</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  const bg = color === 'green' ? 'bg-green-50 text-green-700' : color === 'orange' ? 'bg-orange-50 text-orange-700' : 'bg-red-50 text-red-700'
  return (
    <div className={`rounded-lg p-3 ${bg}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium">{label}</p>
    </div>
  )
}
