import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { LoaderCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/shared/components/ui/dialog'
import { useStudent, useCreateStudent, useUpdateStudent } from '../hooks/useStudents'
import type { Gender, BloodType, ParentRelationship } from '../types/students.types'
import type { ApiError } from '@/shared/types/api.types'

// ── Schémas par étape ──────────────────────────────────────────────────────

const step1Schema = z.object({
  last_name: z.string().min(1, 'Nom requis'),
  first_name: z.string().min(1, 'Prénom requis'),
  birth_date: z.string().min(1, 'Date requise'),
  birth_place: z.string().optional(),
  gender: z.enum(['male', 'female'] as [Gender, ...Gender[]], { error: 'Genre requis' }),
  nationality: z.string().optional(),
  birth_certificate_number: z.string().optional(),
})

const step2Schema = z.object({
  address: z.string().optional(),
  city: z.string().optional(),
  blood_type: z.string().nullable().optional(),
  previous_school: z.string().optional(),
  notes: z.string().optional(),
})

const step3Schema = z.object({
  parents: z.array(z.object({
    parent_id: z.number().optional(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    phone: z.string().optional(),
    gender: z.string().optional(),
    relationship: z.string().optional(),
    is_primary_contact: z.boolean().optional().transform((v) => v ?? false),
    can_pickup: z.boolean().optional().transform((v) => v ?? true),
  })).max(2).optional(),
})

const fullSchema = step1Schema.extend(step2Schema.shape).extend(step3Schema.shape)
type StudentForm = z.infer<typeof fullSchema>

// ── Constantes ─────────────────────────────────────────────────────────────

const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const RELATIONSHIPS: { value: ParentRelationship; label: string }[] = [
  { value: 'father', label: 'Père' },
  { value: 'mother', label: 'Mère' },
  { value: 'guardian', label: 'Tuteur/Tutrice' },
  { value: 'other', label: 'Autre' },
]

// ── Component ──────────────────────────────────────────────────────────────

interface StudentFormModalProps {
  open: boolean
  onClose: () => void
  studentId?: number
}

const STEPS = ['Identité', 'Coordonnées', 'Parents'] as const

export function StudentFormModal({ open, onClose, studentId }: StudentFormModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [showParent2, setShowParent2] = useState(false)
  const isEdit = !!studentId

  const { data: studentData } = useStudent(studentId ?? 0)
  const student = studentData?.data

  const createMutation = useCreateStudent()
  const updateMutation = useUpdateStudent()
  const isPending = createMutation.isPending || updateMutation.isPending

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<StudentForm>({
    resolver: zodResolver(fullSchema) as any,
    defaultValues: {
      last_name: '',
      first_name: '',
      birth_date: '',
      gender: undefined,
      nationality: 'Ivoirienne',
      birth_place: '',
      birth_certificate_number: '',
      address: '',
      city: '',
      blood_type: null,
      previous_school: '',
      notes: '',
      parents: [],
    },
  })

  // Pré-remplissage en mode édition
  useEffect(() => {
    if (student && open) {
      const [day, month, year] = (student.birth_date ?? '').split('/')
      form.reset({
        last_name: student.last_name,
        first_name: student.first_name,
        birth_date: day ? `${year}-${month}-${day}` : '',
        gender: student.gender.value,
        nationality: student.nationality,
        birth_place: student.birth_place ?? '',
        birth_certificate_number: student.birth_certificate_number ?? '',
        address: student.address ?? '',
        city: student.city ?? '',
        blood_type: student.blood_type?.value ?? null,
        previous_school: student.previous_school ?? '',
        notes: student.notes ?? '',
        parents: student.parents?.map((p) => ({
          parent_id: p.id,
          first_name: p.first_name,
          last_name: p.last_name,
          phone: p.phone ?? '',
          relationship: p.relationship.value,
          is_primary_contact: p.pivot?.is_primary_contact ?? false,
          can_pickup: p.pivot?.can_pickup ?? true,
        })) ?? [],
      })
      // Auto-open parent 2 section if editing and parent 2 exists
      if ((student.parents?.length ?? 0) > 1) setShowParent2(true)
    } else if (open && !student && !studentId) {
      form.reset()
      setCurrentStep(0)
      setShowParent2(false)
    }
  }, [student, open])

  const validateStep = async (): Promise<boolean> => {
    let fields: Array<keyof StudentForm> = []
    if (currentStep === 0) fields = ['last_name', 'first_name', 'birth_date', 'gender']
    if (currentStep === 1) fields = []
    if (currentStep === 2) fields = []

    const result = await form.trigger(fields)
    return result
  }

  const handleNext = async () => {
    const ok = await validateStep()
    if (ok && currentStep < STEPS.length - 1) {
      // setTimeout defers the step change to the next event loop tick,
      // preventing the in-flight click from firing on the newly rendered submit button.
      setTimeout(() => setCurrentStep((s) => s + 1), 0)
    }
  }

  const handlePrev = () => {
    setCurrentStep((s) => Math.max(0, s - 1))
  }

  const step0Fields = ['last_name', 'first_name', 'birth_date', 'gender', 'birth_place', 'nationality', 'birth_certificate_number']
  const step1Fields = ['address', 'city', 'blood_type', 'previous_school', 'notes']

  const handleMutationError = (error: ApiError) => {
    if (!error.errors) return
    let firstErrorStep = -1
    for (const [field, messages] of Object.entries(error.errors)) {
      form.setError(field as keyof StudentForm, { message: messages[0] })
      if (firstErrorStep < 0) {
        if (step0Fields.includes(field)) firstErrorStep = 0
        else if (step1Fields.includes(field)) firstErrorStep = 1
      }
    }
    if (firstErrorStep >= 0) setCurrentStep(firstErrorStep)
  }

  const onSubmit = (values: StudentForm) => {
    // Include parents that have at least a first_name or last_name filled
    // Convert empty-string select values to undefined so they don't reach the backend
    const parentPayload = (values.parents ?? [])
      .filter((p) => p.first_name?.trim() || p.last_name?.trim())
      .map((p) => ({
        ...p,
        relationship: (p.relationship || 'other') as ParentRelationship,
        gender: (p.gender || undefined) as Gender | undefined,
      }))

    const payload: Parameters<typeof createMutation.mutate>[0] = {
      last_name: values.last_name,
      first_name: values.first_name,
      birth_date: values.birth_date,
      gender: values.gender,
      birth_place: values.birth_place,
      nationality: values.nationality,
      birth_certificate_number: values.birth_certificate_number,
      address: values.address,
      city: values.city,
      blood_type: (values.blood_type as BloodType | null) || null,
      previous_school: values.previous_school,
      notes: values.notes,
      parents: parentPayload.length > 0 ? parentPayload : undefined,
    }

    console.log('Payload :', payload)
    console.log('Is Edit :', isEdit)
    console.log('Student Id :', studentId)

    if (isEdit && studentId) {
      updateMutation.mutate({ id: studentId, data: payload }, { onSuccess: handleClose, onError: handleMutationError })
    } else {
      createMutation.mutate(payload, { onSuccess: handleClose, onError: handleMutationError })
    }
  }

  const handleClose = () => {
    setCurrentStep(0)
    setShowParent2(false)
    form.reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier l\'élève' : 'Nouvel élève'}</DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-1">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  i < currentStep
                    ? 'bg-green-500 text-white'
                    : i === currentStep
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-400'
                }`}
              >
                {i + 1}
              </span>
              <span
                className={`text-xs ${i === currentStep ? 'font-medium text-indigo-700' : 'text-gray-400'}`}
              >
                {step}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`mx-2 h-px w-8 ${i < currentStep ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* ── Étape 1 : Identité ─── */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Nom *</Label>
                  <Input {...form.register('last_name')} placeholder="KOUASSI" />
                  {form.formState.errors.last_name && (
                    <p className="text-xs text-red-500">{form.formState.errors.last_name.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>Prénom *</Label>
                  <Input {...form.register('first_name')} placeholder="Jean-Marc" />
                  {form.formState.errors.first_name && (
                    <p className="text-xs text-red-500">{form.formState.errors.first_name.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Date de naissance *</Label>
                  <Input type="date" {...form.register('birth_date')} />
                  {form.formState.errors.birth_date && (
                    <p className="text-xs text-red-500">{form.formState.errors.birth_date.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>Genre *</Label>
                  <select
                    {...form.register('gender')}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="">Sélectionner</option>
                    <option value="male">Masculin</option>
                    <option value="female">Féminin</option>
                  </select>
                  {form.formState.errors.gender && (
                    <p className="text-xs text-red-500">{form.formState.errors.gender.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Lieu de naissance</Label>
                  <Input {...form.register('birth_place')} placeholder="Abidjan" />
                </div>
                <div className="space-y-1">
                  <Label>Nationalité</Label>
                  <Input {...form.register('nationality')} placeholder="Ivoirienne" />
                </div>
              </div>

              <div className="space-y-1">
                <Label>N° acte de naissance</Label>
                <Input {...form.register('birth_certificate_number')} />
              </div>
            </div>
          )}

          {/* ── Étape 2 : Coordonnées ─── */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Adresse</Label>
                  <Input {...form.register('address')} placeholder="Quartier Plateau" />
                  {form.formState.errors.address && (
                    <p className="text-xs text-red-500">{form.formState.errors.address.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>Ville</Label>
                  <Input {...form.register('city')} placeholder="Abidjan" />
                  {form.formState.errors.city && (
                    <p className="text-xs text-red-500">{form.formState.errors.city.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Label>Groupe sanguin</Label>
                <select
                  {...form.register('blood_type')}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Non renseigné</option>
                  {BLOOD_TYPES.map((bt) => (
                    <option key={bt} value={bt}>{bt}</option>
                  ))}
                </select>
                {form.formState.errors.blood_type && (
                  <p className="text-xs text-red-500">{form.formState.errors.blood_type.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label>École précédente</Label>
                <Input {...form.register('previous_school')} />
                {form.formState.errors.previous_school && (
                  <p className="text-xs text-red-500">{form.formState.errors.previous_school.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label>Notes internes</Label>
                <textarea
                  {...form.register('notes')}
                  rows={3}
                  placeholder="Informations internes (visible uniquement par les administrateurs)"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                {form.formState.errors.notes && (
                  <p className="text-xs text-red-500">{form.formState.errors.notes.message}</p>
                )}
              </div>
            </div>
          )}
          {/* ── Étape 3 : Parents ─── */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {/* Parent 1 — toujours visible */}
              <div className="rounded-lg border border-gray-200">
                <div className="px-4 py-3 text-sm font-medium text-gray-700 border-b border-gray-100 bg-gray-50">
                  Parent 1 <span className="text-xs text-gray-400 ml-1">(optionnel)</span>
                </div>
                <div className="px-4 py-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Prénom</Label>
                      <Input {...form.register('parents.0.first_name')} />
                    </div>
                    <div className="space-y-1">
                      <Label>Nom</Label>
                      <Input {...form.register('parents.0.last_name')} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Téléphone</Label>
                      <Input {...form.register('parents.0.phone')} placeholder="0701234567" />
                    </div>
                    <div className="space-y-1">
                      <Label>Relation</Label>
                      <select
                        {...form.register('parents.0.relationship')}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      >
                        <option value="">Sélectionner</option>
                        {RELATIONSHIPS.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                      <input type="checkbox" {...form.register('parents.0.is_primary_contact')} className="rounded" />
                      Contact principal
                    </label>
                    <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                      <input type="checkbox" {...form.register('parents.0.can_pickup')} className="rounded" defaultChecked />
                      Peut récupérer
                    </label>
                  </div>
                </div>
              </div>

              {/* Parent 2 — toujours rendu, visible/caché via CSS */}
              <div className="rounded-lg border border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowParent2((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  <span>Parent 2 <span className="text-xs text-gray-400 ml-1">(facultatif)</span></span>
                  <span className="text-gray-400 text-xs">{showParent2 ? '▲' : '▼'}</span>
                </button>
                <div className={showParent2 ? 'border-t border-gray-100 px-4 py-3 space-y-3' : 'hidden'}>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Prénom</Label>
                      <Input {...form.register('parents.1.first_name')} />
                    </div>
                    <div className="space-y-1">
                      <Label>Nom</Label>
                      <Input {...form.register('parents.1.last_name')} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Téléphone</Label>
                      <Input {...form.register('parents.1.phone')} placeholder="0701234567" />
                    </div>
                    <div className="space-y-1">
                      <Label>Relation</Label>
                      <select
                        {...form.register('parents.1.relationship')}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      >
                        <option value="">Sélectionner</option>
                        {RELATIONSHIPS.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                      <input type="checkbox" {...form.register('parents.1.is_primary_contact')} className="rounded" />
                      Contact principal
                    </label>
                    <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                      <input type="checkbox" {...form.register('parents.1.can_pickup')} className="rounded" defaultChecked />
                      Peut récupérer
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <div>
              {currentStep > 0 && (
                <Button type="button" variant="outline" onClick={handlePrev}>
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Précédent
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={handleClose}>
                Annuler
              </Button>
              {currentStep < STEPS.length - 1 ? (
                <Button type="button" onClick={handleNext}>
                  Suivant
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />{isEdit ? 'Mise à jour...' : 'Création...'}</>
                  ) : (
                    isEdit ? 'Sauvegarder' : 'Créer l\'élève'
                  )}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
