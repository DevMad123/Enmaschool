import { useState } from 'react'
import { Megaphone, Plus, X } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'
import { AnnouncementCard } from '../components/AnnouncementCard'
import { useAnnouncements, useMarkAnnouncementRead, useMarkAllAnnouncementsRead, useCreateAnnouncement } from '../hooks/useMessaging'
import type { AnnouncementType } from '../types/messaging.types'

const TYPE_OPTIONS: Array<{ value: '' | AnnouncementType; label: string }> = [
  { value: '', label: 'Tous les types' },
  { value: 'general', label: 'Général' },
  { value: 'academic', label: 'Pédagogique' },
  { value: 'event', label: 'Événement' },
  { value: 'alert', label: 'Alerte' },
  { value: 'reminder', label: 'Rappel' },
]

export function AnnouncementsPage() {
  const [typeFilter, setTypeFilter] = useState<'' | AnnouncementType>('')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)

  const filters: Record<string, unknown> = {}
  if (typeFilter) filters.type = typeFilter
  if (unreadOnly) filters.is_read = false

  const { data, isLoading } = useAnnouncements(filters)
  const markRead = useMarkAnnouncementRead()
  const markAllRead = useMarkAllAnnouncementsRead()
  const announcements = data?.data ?? []

  const handleClick = (ann: any) => {
    setSelected(ann)
    if (!ann.is_read) markRead.mutate(ann.id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Annonces</h1>
          <p className="mt-1 text-sm text-gray-500">Communications officielles de l'établissement.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>
            Tout marquer lu
          </Button>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="mr-1 h-4 w-4" />Nouvelle annonce
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as '' | AnnouncementType)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
        >
          {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={unreadOnly} onChange={e => setUnreadOnly(e.target.checked)} className="rounded" />
          Non lues uniquement
        </label>
      </div>

      {/* List */}
      {isLoading ? (
        <LoadingSpinner />
      ) : announcements.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 p-12 text-center">
          <Megaphone className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-2 text-sm text-gray-400">Aucune annonce pour le moment.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {announcements.map(ann => (
            <AnnouncementCard key={ann.id} announcement={ann} onClick={() => handleClick(ann)} />
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelected(null)}>
          <div className="relative max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelected(null)} className="absolute right-4 top-4 rounded-full p-1 hover:bg-gray-100">
              <X className="h-5 w-5 text-gray-500" />
            </button>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium rounded-full px-2 py-0.5" style={{ backgroundColor: selected.type.color + '20', color: selected.type.color }}>
                {selected.type.label}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">{selected.title}</h2>
            <p className="mt-1 text-sm text-gray-400">
              Par {selected.created_by?.full_name ?? 'Administration'} •{' '}
              {selected.published_at ? new Date(selected.published_at).toLocaleDateString('fr-FR') : ''}
            </p>
            <div className="mt-4 text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{selected.body}</div>
          </div>
        </div>
      )}
    </div>
  )
}
