import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Search, Pencil, Trash2, LoaderCircle } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/shared/components/ui/dialog'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { ConfirmDialog } from '@/shared/components/feedback/ConfirmDialog'
import { useSubjects, useCreateSubject, useUpdateSubject, useDeleteSubject } from '../hooks/useSubjects'
import type { Subject, SubjectFormData, SubjectCategory } from '../types/school.types'

const CATEGORY_OPTIONS: { value: SubjectCategory; label: string }[] = [
  { value: 'litteraire', label: 'Littéraire' },
  { value: 'scientifique', label: 'Scientifique' },
  { value: 'technique', label: 'Technique' },
  { value: 'artistique', label: 'Artistique' },
  { value: 'sportif', label: 'Sportif' },
]

const CATEGORY_VALUES = CATEGORY_OPTIONS.map((c) => c.value) as [SubjectCategory, ...SubjectCategory[]]

const subjectSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  code: z.string().min(1, 'Code requis'),
  coefficient: z.number().min(0.1).max(99.9).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur invalide').optional(),
  category: z.enum(CATEGORY_VALUES).nullable().optional(),
})

type SubjectForm = z.infer<typeof subjectSchema>

export function SubjectsPage() {
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editSubject, setEditSubject] = useState<Subject | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null)

  const { data, isLoading } = useSubjects({ search: search || undefined })
  const createMutation = useCreateSubject()
  const updateMutation = useUpdateSubject()
  const deleteMutation = useDeleteSubject()

  const subjects = data?.data ?? []

  const form = useForm<SubjectForm>({
    resolver: zodResolver(subjectSchema),
    defaultValues: { name: '', code: '', coefficient: 1, color: '#6366f1', category: null },
  })

  const openCreate = () => {
    setEditSubject(null)
    form.reset({ name: '', code: '', coefficient: 1, color: '#6366f1', category: null })
    setFormOpen(true)
  }

  const openEdit = (s: Subject) => {
    setEditSubject(s)
    form.reset({
      name: s.name,
      code: s.code,
      coefficient: s.coefficient,
      color: s.color,
      category: s.category?.value ?? null,
    })
    setFormOpen(true)
  }

  const onSubmit = (values: SubjectForm) => {
    const payload = { ...values, category: values.category || null } as SubjectFormData
    if (editSubject) {
      updateMutation.mutate(
        { id: editSubject.id, data: payload },
        { onSuccess: () => { setFormOpen(false); setEditSubject(null) } },
      )
    } else {
      createMutation.mutate(payload, { onSuccess: () => { setFormOpen(false) } })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Matières</h1>
          <p className="text-sm text-slate-500 mt-1">Gestion des matières enseignées</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Nouvelle matière
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {subjects.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="Aucune matière"
          description="Ajoutez vos premières matières."
          action={{ label: 'Ajouter', onClick: openCreate }}
        />
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Matière</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Code</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">Coef.</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Catégorie</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjects.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <span className="inline-block h-2.5 w-2.5 rounded-full mr-2" style={{ backgroundColor: s.color }} />
                    {s.name}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{s.code}</td>
                  <td className="px-4 py-3 text-right text-slate-900">{s.coefficient}</td>
                  <td className="px-4 py-3 text-slate-500">{s.category?.label ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(s)} className="text-slate-400 hover:text-indigo-600 mr-2">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => setDeleteTarget(s)} className="text-slate-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editSubject ? 'Modifier la matière' : 'Nouvelle matière'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nom</Label>
              <Input {...form.register('name')} placeholder="Mathématiques" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Code</Label>
                <Input {...form.register('code')} placeholder="MATH" />
              </div>
              <div className="space-y-1.5">
                <Label>Coefficient</Label>
                <Input type="number" step="0.5" min={0.1} {...form.register('coefficient', { valueAsNumber: true })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Couleur</Label>
                <Input type="color" {...form.register('color')} className="h-9 p-1" />
              </div>
              <div className="space-y-1.5">
                <Label>Catégorie</Label>
                <select
                  {...form.register('category')}
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Aucune</option>
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                {editSubject ? 'Modifier' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Supprimer la matière"
        description={`Supprimer ${deleteTarget?.name} ?`}
        confirmLabel="Supprimer"
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) }) }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
