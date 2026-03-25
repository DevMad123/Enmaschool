import { useState } from 'react'
import { X, CheckCheck, Bell } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'
import { NotificationItem } from '../components/NotificationItem'
import { useNotifications, useMarkAllNotificationsRead, useMarkNotificationRead, useDeleteNotification } from '../hooks/useMessaging'

interface Props { onClose: () => void }

export function NotificationCenter({ onClose }: Props) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const { data, isLoading } = useNotifications(filter === 'unread' ? { is_read: false } : {})
  const markAll = useMarkAllNotificationsRead()
  const markOne = useMarkNotificationRead()
  const deleteOne = useDeleteNotification()
  const notifications = data?.data ?? []

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-gray-500" />
          <h2 className="font-semibold text-gray-900">Notifications</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
            <CheckCheck className="h-4 w-4 mr-1" />Tout lire
          </Button>
          <button onClick={onClose} className="rounded p-1 hover:bg-gray-100">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>
      {/* Filters */}
      <div className="flex gap-1 border-b border-gray-100 px-4 py-2">
        {(['all', 'unread'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${filter === f ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}>
            {f === 'all' ? 'Toutes' : 'Non lues'}
          </button>
        ))}
      </div>
      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-6"><LoadingSpinner /></div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm text-gray-400">Aucune notification</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map(n => (
              <NotificationItem key={n.id} notification={n}
                onRead={(id) => markOne.mutate(id)}
                onDelete={(id) => deleteOne.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
