import type { Conversation } from '../types/messaging.types'
import { UnreadBadge } from './UnreadBadge'

interface Props { conv: Conversation; isActive: boolean; onClick: () => void }

function timeLabel(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Hier'
  if (diffDays < 7) return d.toLocaleDateString('fr-FR', { weekday: 'short' })
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export function ConversationItem({ conv, isActive, onClick }: Props) {
  const isGroup = conv.type.value === 'group'
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-3 text-left rounded-xl transition-colors ${isActive ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-gray-50'}`}
    >
      {/* Avatar */}
      <div className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${isGroup ? 'bg-purple-500' : 'bg-indigo-500'}`}>
        {conv.avatar
          ? <img src={conv.avatar} alt={conv.name} className="h-10 w-10 rounded-full object-cover" />
          : <span>{initials(conv.name ?? 'C')}</span>
        }
      </div>
      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className={`text-sm truncate ${conv.unread_count > 0 ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
            {conv.name}
          </span>
          <span className="ml-2 shrink-0 text-xs text-gray-400">{timeLabel(conv.last_message_at)}</span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-xs text-gray-500 truncate max-w-[180px]">
            {conv.last_message_preview ?? (isGroup ? `${conv.participants_count} membres` : '')}
          </span>
          {conv.unread_count > 0 && <UnreadBadge count={conv.unread_count} />}
        </div>
      </div>
    </button>
  )
}
