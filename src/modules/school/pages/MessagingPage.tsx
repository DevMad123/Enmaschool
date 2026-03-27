import { useState, useRef, useEffect } from 'react'
import { MessageSquare, Plus, Search, X, Check } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'
import { ConversationItem } from '../components/ConversationItem'
import { useConversations, useConversationMessages, useSendMessage, useMarkConversationRead, useCreateConversation, useConversationChannel, useUserSearch } from '../hooks/useMessaging'
import type { UserSearchResult } from '../api/messaging.api'
import type { Conversation } from '../types/messaging.types'

export function MessagingPage() {
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)

  const { data: convsData, isLoading } = useConversations()
  const conversations: Conversation[] = convsData?.data ?? []

  const filtered = conversations.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  )

  const activeConv = conversations.find(c => c.id === activeConvId) ?? null

  return (
    <div className="flex h-[calc(100vh-120px)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Left sidebar */}
      <div className="flex w-80 shrink-0 flex-col border-r border-gray-200">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 className="font-semibold text-gray-900">Messages</h2>
          <Button size="sm" variant="outline" onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="px-3 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="Rechercher..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
          {isLoading ? (
            <div className="p-4"><LoadingSpinner /></div>
          ) : filtered.length === 0 ? (
            <p className="p-4 text-center text-sm text-gray-400">Aucune conversation</p>
          ) : (
            filtered.map(conv => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                isActive={conv.id === activeConvId}
                onClick={() => setActiveConvId(conv.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Right: chat area */}
      <div className="flex-1">
        {activeConvId && activeConv ? (
          <ChatWindow conv={activeConv} convId={activeConvId} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-gray-400">
            <MessageSquare className="h-12 w-12 text-gray-200" />
            <p className="mt-3 text-sm">Sélectionnez une conversation</p>
            <p className="text-xs mt-1">ou créez-en une nouvelle</p>
          </div>
        )}
      </div>

      {/* New conversation modal */}
      {showNew && <NewConversationModal onClose={() => setShowNew(false)} />}
    </div>
  )
}

// ── Chat Window ──────────────────────────────────────────────────────────────

function ChatWindow({ conv, convId }: { conv: Conversation; convId: string }) {
  const [body, setBody] = useState('')
  const { data: messagesData, isLoading } = useConversationMessages(convId)
  const sendMessage = useSendMessage(convId)
  const markRead = useMarkConversationRead(convId)

  useConversationChannel(convId)

  // Mark as read when opening
  useState(() => { markRead.mutate() })

  const pages = messagesData?.pages ?? []
  const messages = pages.flatMap((p: any) => p.data ?? []).reverse()

  const handleSend = () => {
    if (!body.trim()) return
    const fd = new FormData()
    fd.append('body', body)
    fd.append('type', 'text')
    sendMessage.mutate(fd, { onSuccess: () => setBody('') })
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500 text-sm font-bold text-white">
          {conv.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-sm text-gray-900">{conv.name}</p>
          {conv.type.value === 'group' && (
            <p className="text-xs text-gray-400">{conv.participants_count} membres</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <LoadingSpinner />
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-gray-400 mt-8">Démarrez la conversation…</p>
        ) : (
          messages.map((msg: any) => (
            <MessageBubble key={msg.id} message={msg} showSender={conv.type.value === 'group'} />
          ))
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex items-end gap-2">
          <textarea
            rows={1}
            className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="Écrivez un message…"
            value={body}
            onChange={e => setBody(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          />
          <Button size="sm" onClick={handleSend} disabled={!body.trim() || sendMessage.isPending}>
            Envoyer
          </Button>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ message, showSender }: { message: any; showSender?: boolean }) {
  const isMine = message.is_mine
  const isSystem = message.type?.value === 'system'
  const isDeleted = message.is_deleted

  if (isSystem) {
    return (
      <div className="text-center">
        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{message.body}</span>
      </div>
    )
  }

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] rounded-2xl px-3 py-2 ${isMine ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
        {showSender && message.sender?.full_name && (
          <p className={`mb-1 text-xs font-semibold ${isMine ? 'text-indigo-200' : 'text-indigo-500'}`}>
            {message.sender.full_name}
          </p>
        )}
        <p className={`text-sm ${isDeleted ? 'italic opacity-60' : ''}`}>{message.body}</p>
        <div className={`mt-1 flex items-center gap-1 text-[10px] ${isMine ? 'text-indigo-200' : 'text-gray-400'}`}>
          <span>{new Date(message.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
          {message.is_edited && <span>· modifié</span>}
        </div>
      </div>
    </div>
  )
}

// ── User Search Picker ────────────────────────────────────────────────────────

function UserPicker({
  selected,
  onSelect,
  onRemove,
  multiple = false,
  placeholder = 'Rechercher par nom, prénom ou email…',
}: {
  selected: UserSearchResult[]
  onSelect: (user: UserSearchResult) => void
  onRemove: (id: number) => void
  multiple?: boolean
  placeholder?: string
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { data: results = [], isFetching } = useUserSearch(query)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isSelected = (id: number) => selected.some(u => u.id === id)

  const roleLabel: Record<string, string> = {
    school_admin: 'Admin',
    director: 'Directeur',
    teacher: 'Enseignant',
    accountant: 'Comptable',
    staff: 'Personnel',
  }

  return (
    <div ref={ref} className="relative">
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selected.map(u => (
            <span key={u.id} className="flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
              {u.full_name}
              <button type="button" onClick={() => onRemove(u.id)} className="ml-0.5 rounded-full hover:bg-indigo-200">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      {(multiple || selected.length === 0) && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder={placeholder}
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
          />
          {isFetching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <LoadingSpinner size="sm" />
            </div>
          )}
        </div>
      )}

      {/* Dropdown */}
      {open && query.trim().length >= 2 && (
        <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
          {results.length === 0 && !isFetching ? (
            <p className="p-3 text-center text-sm text-gray-400">Aucun résultat</p>
          ) : (
            <ul className="max-h-52 overflow-y-auto divide-y divide-gray-50">
              {results.map(user => (
                <li key={user.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-indigo-50 transition-colors"
                    onClick={() => {
                      onSelect(user)
                      if (!multiple) { setQuery(''); setOpen(false) }
                      else setQuery('')
                    }}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white">
                      {user.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.full_name}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                    {user.role && (
                      <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
                        {roleLabel[user.role] ?? user.role}
                      </span>
                    )}
                    {isSelected(user.id) && <Check className="h-4 w-4 shrink-0 text-indigo-500" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

// ── New Conversation Modal ─────────────────────────────────────────────────────

function NewConversationModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'direct' | 'group'>('direct')
  const [selectedUsers, setSelectedUsers] = useState<UserSearchResult[]>([])
  const [groupName, setGroupName] = useState('')
  const createConv = useCreateConversation()

  const handleSelect = (user: UserSearchResult) => {
    if (tab === 'direct') {
      setSelectedUsers([user])
    } else if (!selectedUsers.some(u => u.id === user.id)) {
      setSelectedUsers(prev => [...prev, user])
    }
  }

  const handleRemove = (id: number) => setSelectedUsers(prev => prev.filter(u => u.id !== id))

  const handleCreate = () => {
    const userIds = selectedUsers.map(u => u.id)
    if (tab === 'direct' && userIds.length === 1) {
      createConv.mutate({ type: 'direct', user_ids: userIds }, { onSuccess: onClose })
    } else if (tab === 'group' && groupName.trim() && userIds.length > 0) {
      createConv.mutate({ type: 'group', name: groupName.trim(), user_ids: userIds }, { onSuccess: onClose })
    }
  }

  const canCreate = tab === 'direct'
    ? selectedUsers.length === 1
    : selectedUsers.length > 0 && groupName.trim().length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Nouvelle conversation</h3>
          <button onClick={onClose} className="rounded p-1 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex gap-2 mb-4">
          {(['direct', 'group'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setSelectedUsers([]) }}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${tab === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {t === 'direct' ? '💬 Direct' : '👥 Groupe'}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {tab === 'group' && (
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="Nom du groupe"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
            />
          )}
          <UserPicker
            selected={selectedUsers}
            onSelect={handleSelect}
            onRemove={handleRemove}
            multiple={tab === 'group'}
            placeholder={tab === 'direct' ? 'Rechercher un destinataire…' : 'Ajouter des membres…'}
          />
        </div>

        <Button className="mt-5 w-full" onClick={handleCreate} disabled={!canCreate || createConv.isPending}>
          {createConv.isPending ? 'Création…' : 'Créer la conversation'}
        </Button>
      </div>
    </div>
  )
}
