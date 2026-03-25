export type ConversationType = 'direct' | 'group'
export type MessageType = 'text' | 'file' | 'image' | 'system'
export type AnnouncementType = 'general' | 'academic' | 'event' | 'alert' | 'reminder'
export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent'

export const ANNOUNCEMENT_TYPE_LABELS: Record<AnnouncementType, string> = {
  general: 'Général', academic: 'Pédagogique', event: 'Événement',
  alert: 'Alerte', reminder: 'Rappel',
}
export const ANNOUNCEMENT_PRIORITY_COLORS: Record<AnnouncementPriority, string> = {
  low: '#9ca3af', normal: '#3b82f6', high: '#f97316', urgent: '#ef4444',
}

export interface ConversationParticipant {
  id: number
  full_name: string
  avatar_url: string | null
  role: { value: string; label: string }
}

export interface Conversation {
  id: string
  type: { value: ConversationType; label: string }
  name: string
  avatar: string | null
  is_archived: boolean
  last_message_at: string | null
  last_message_preview: string | null
  unread_count: number
  participants_count: number
  participants: ConversationParticipant[]
  last_message?: Message | null
  created_at: string
}

export interface MessageAttachment {
  path: string | null
  name: string | null
  size: number | null
  url: string | null
}

export interface Message {
  id: string
  body: string
  type: { value: MessageType; label: string }
  is_edited: boolean
  is_deleted: boolean
  edited_at: string | null
  created_at: string
  attachment: MessageAttachment | null
  reply_to: { id: string; body: string; sender: { id: number; full_name: string } } | null
  sender: { id: number; full_name: string; avatar_url: string | null; role: { value: string; label: string } } | null
  is_mine: boolean
  read_by_count: number
}

export interface Announcement {
  id: number
  title: string
  body: string
  type: { value: AnnouncementType; label: string; icon: string; color: string }
  priority: { value: AnnouncementPriority; label: string; color: string }
  target_roles: string[]
  is_published: boolean
  is_expired: boolean
  is_scheduled: boolean
  publish_at: string | null
  expires_at: string | null
  published_at: string | null
  attachment_url: string | null
  is_read: boolean
  read_count: number
  created_by?: { id: number; full_name: string }
  created_at: string
}

export interface AppNotification {
  id: string
  type: string
  title: string
  body: string | null
  data: Record<string, unknown> | null
  action_url: string | null
  icon: string | null
  color: string | null
  is_read: boolean
  read_at: string | null
  created_at: string
}

export interface UnreadCounts {
  messages: number
  notifications: number
  announcements: number
  total: number
}

export interface SendMessageData {
  body?: string
  type?: MessageType
  reply_to_id?: string
  attachment?: File
}
