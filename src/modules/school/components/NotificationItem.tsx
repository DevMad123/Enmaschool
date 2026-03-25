import { X } from 'lucide-react'
import type { AppNotification } from '../types/messaging.types'

interface Props {
  notification: AppNotification
  onRead: (id: string) => void
  onDelete: (id: string) => void
}

export function NotificationItem({ notification, onRead, onDelete }: Props) {
  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "À l'instant"
    if (mins < 60) return `Il y a ${mins} min`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `Il y a ${hours}h`
    return `Il y a ${Math.floor(hours / 24)}j`
  }

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${!notification.is_read ? 'bg-indigo-50' : ''}`}
      onClick={() => { onRead(notification.id); if (notification.action_url) window.location.href = notification.action_url }}
    >
      <div
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-sm"
        style={{ backgroundColor: notification.color ?? '#6366f1' }}
      >
        {notification.icon?.charAt(0) ?? '🔔'}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm ${!notification.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
          {notification.title}
        </p>
        {notification.body && <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{notification.body}</p>}
        <p className="mt-1 text-xs text-gray-400">{timeAgo(notification.created_at)}</p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(notification.id) }}
        className="shrink-0 rounded p-0.5 text-gray-300 hover:text-gray-500"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
