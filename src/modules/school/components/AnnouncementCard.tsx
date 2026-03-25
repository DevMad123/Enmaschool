import type { Announcement } from '../types/messaging.types'

interface Props { announcement: Announcement; onClick: () => void }

export function AnnouncementCard({ announcement, onClick }: Props) {
  const PRIORITY_COLORS: Record<string, string> = {
    urgent: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    normal: 'bg-blue-100 text-blue-700 border-blue-200',
    low: 'bg-gray-100 text-gray-600 border-gray-200',
  }

  const wordPreview = (text: string, words = 25) =>
    text.split(/\s+/).slice(0, words).join(' ') + (text.split(/\s+/).length > words ? '…' : '')

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-xl border p-5 shadow-sm transition-all hover:shadow-md ${!announcement.is_read ? 'border-indigo-200 bg-indigo-50' : 'border-gray-200 bg-white'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ backgroundColor: announcement.type.color + '20', color: announcement.type.color }}
          >
            {announcement.type.label}
          </span>
          {announcement.priority.value !== 'normal' && announcement.priority.value !== 'low' && (
            <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[announcement.priority.value] ?? ''}`}>
              {announcement.priority.label}
            </span>
          )}
        </div>
        {!announcement.is_read && <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-500 mt-1" />}
      </div>
      <h3 className={`mt-2 font-semibold ${!announcement.is_read ? 'text-gray-900' : 'text-gray-800'}`}>
        {announcement.title}
      </h3>
      <p className="mt-1 text-sm text-gray-500">{wordPreview(announcement.body)}</p>
      <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
        <span>{announcement.created_by?.full_name ?? 'Administration'}</span>
        <span>{announcement.published_at ? new Date(announcement.published_at).toLocaleDateString('fr-FR') : ''}</span>
      </div>
    </div>
  )
}
