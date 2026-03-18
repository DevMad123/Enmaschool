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
import { useRooms, useCreateRoom, useUpdateRoom, useDeleteRoom } from '../hooks/useRooms'
import type { Room, RoomFormData, RoomType } from '../types/school.types'

const ROOM_TYPES: { value: RoomType; label: string }[] = [
  { value: 'classroom', label: 'Salle de classe' },
  { value: 'lab', label: 'Laboratoire' },
  { value: 'gym', label: 'Gymnase' },
  { value: 'library', label: 'Bibliothèque' },
  { value: 'amphitheater', label: 'Amphithéâtre' },
  { value: 'other', label: 'Autre' },
]

const ROOM_TYPE_VALUES = ROOM_TYPES.map((t) => t.value) as [RoomType, ...RoomType[]]

const roomSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  code: z.string().nullable().optional(),
  type: z.enum(ROOM_TYPE_VALUES, { error: 'Type invalide' }),
  capacity: z.number().min(1).max(500),
  floor: z.string().nullable().optional(),
  building: z.string().nullable().optional(),
})

type RoomForm = z.infer<typeof roomSchema>

export function RoomsPage() {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<RoomType | ''>('')
  const [formOpen, setFormOpen] = useState(false)
  const [editRoom, setEditRoom] = useState<Room | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null)

  const { data, isLoading } = useRooms({
    search: search || undefined,
    type: filterType || undefined,
  })
  const createMutation = useCreateRoom()
  const updateMutation = useUpdateRoom()
  const deleteMutation = useDeleteRoom()

  const rooms = data?.data ?? []

  const form = useForm<RoomForm>({
    resolver: zodResolver(roomSchema),
    defaultValues: { name: '', code: null, type: 'classroom', capacity: 40, floor: null, building: null },
  })

  const openCreate = () => {
    setEditRoom(null)
    form.reset({ name: '', code: null, type: 'classroom', capacity: 40, floor: null, building: null })
    setFormOpen(true)
  }

  const openEdit = (r: Room) => {
    setEditRoom(r)
    form.reset({
      name: r.name,
      code: r.code,
      type: r.type.value,
      capacity: r.capacity,
      floor: r.floor,
      building: r.building,
    })
    setFormOpen(true)
  }

  const onSubmit = (values: RoomForm) => {
    const payload = values as unknown as RoomFormData
    if (editRoom) {
      updateMutation.mutate(
        { id: editRoom.id, data: payload },
        { onSuccess: () => { setFormOpen(false); setEditRoom(null) } },
      )
    } else {
      createMutation.mutate(payload, { onSuccess: () => setFormOpen(false) })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Salles</h1>
          <p className="text-sm text-slate-500 mt-1">Gestion des salles et espaces</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Nouvelle salle
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterType('')}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${!filterType ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Tous
          </button>
          {ROOM_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setFilterType(t.value)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${filterType === t.value ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {rooms.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="Aucune salle"
          description="Ajoutez vos premières salles."
          action={{ label: 'Ajouter', onClick: openCreate }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rooms.map((room) => (
            <div key={room.id} className="group rounded-lg border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-slate-900">{room.name}</h3>
                  {room.code && <p className="text-xs text-slate-500">{room.code}</p>}
                </div>
                <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {room.type.label}
                </span>
              </div>
              <div className="text-xs text-slate-500 space-y-1 mb-3">
                <p>Capacité : {room.capacity}</p>
                {room.building && <p>Bâtiment : {room.building}</p>}
                {room.floor && <p>Étage : {room.floor}</p>}
              </div>
              {room.equipment && Object.keys(room.equipment).length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {Object.entries(room.equipment)
                    .filter(([, v]) => v)
                    .map(([k]) => (
                      <span key={k} className="inline-flex rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700">
                        {k}
                      </span>
                    ))}
                </div>
              )}
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(room)} className="text-xs text-slate-600 hover:text-indigo-600">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setDeleteTarget(room)} className="text-xs text-slate-600 hover:text-red-600">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editRoom ? 'Modifier la salle' : 'Nouvelle salle'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nom</Label>
                <Input {...form.register('name')} placeholder="Salle 101" />
              </div>
              <div className="space-y-1.5">
                <Label>Code</Label>
                <Input {...form.register('code')} placeholder="S101" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <select
                  {...form.register('type')}
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {ROOM_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Capacité</Label>
                <Input type="number" min={1} {...form.register('capacity', { valueAsNumber: true })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Bâtiment</Label>
                <Input {...form.register('building')} placeholder="Bâtiment A" />
              </div>
              <div className="space-y-1.5">
                <Label>Étage</Label>
                <Input {...form.register('floor')} placeholder="RDC" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                {editRoom ? 'Modifier' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Supprimer la salle"
        description={`Supprimer ${deleteTarget?.name} ?`}
        confirmLabel="Supprimer"
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) }) }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
