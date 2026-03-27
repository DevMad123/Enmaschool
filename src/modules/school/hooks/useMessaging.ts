import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import type { ApiError } from '@/shared/types/api.types'
import { toast } from '@/shared/lib/toast'
import { conversationsApi, announcementsApi, notificationsApi, usersSearchApi } from '../api/messaging.api'
import type { Message, AppNotification, Announcement } from '../types/messaging.types'

// ── User search (for messaging) ───────────────────────────────────────────────

export function useUserSearch(q: string) {
  return useQuery({
    queryKey: ['users-search', q],
    queryFn: () => usersSearchApi.search(q).then(r => r.data.data),
    enabled: q.trim().length >= 2,
    staleTime: 30_000,
  })
}

// ── Conversations ────────────────────────────────────────────────────────────

export function useConversations(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['conversations', filters],
    queryFn: () => conversationsApi.getAll(filters).then(r => r.data),
    staleTime: 30_000,
  })
}

export function useConversationMessages(convId: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: ['messages', convId],
    queryFn: ({ pageParam = 1 }) =>
      conversationsApi.getMessages(convId, { page: pageParam as number }).then(r => r.data),
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) =>
      lastPage.meta?.current_page < lastPage.meta?.last_page
        ? lastPage.meta.current_page + 1
        : undefined,
    enabled: !!convId && enabled,
  })
}

export function useCreateConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => conversationsApi.create(data).then(r => r.data.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
    onError: (error: any) => toast.error(error?.message ?? 'Erreur'),
  })
}

export function useSendMessage(convId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) => conversationsApi.sendMessage(convId, formData).then(r => r.data.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['messages', convId] })
      void queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
    onError: (error: any) => toast.error(error?.message ?? 'Erreur envoi message'),
  })
}

export function useMarkConversationRead(convId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => conversationsApi.markRead(convId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['unread-counts'] })
      void queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

// ── Annonces ─────────────────────────────────────────────────────────────────

export function useAnnouncements(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['announcements', filters],
    queryFn: () => announcementsApi.getAll(filters).then(r => r.data),
  })
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) => announcementsApi.create(formData).then(r => r.data.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['announcements'] })
      toast.success('Annonce créée')
    },
    onError: (error: any) => toast.error(error?.message ?? 'Erreur'),
  })
}

export function usePublishAnnouncement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => announcementsApi.publish(id).then(r => r.data.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['announcements'] })
      toast.success('Annonce publiée')
    },
    onError: (error: any) => toast.error(error?.message ?? 'Erreur'),
  })
}

export function useMarkAnnouncementRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => announcementsApi.markRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['announcements'] })
      void queryClient.invalidateQueries({ queryKey: ['unread-counts'] })
    },
  })
}

export function useMarkAllAnnouncementsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => announcementsApi.markAllRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['announcements'] })
      void queryClient.invalidateQueries({ queryKey: ['unread-counts'] })
    },
  })
}

// ── Notifications ─────────────────────────────────────────────────────────────

export function useNotifications(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['notifications', filters],
    queryFn: () => notificationsApi.getAll(filters).then(r => r.data),
  })
}

export function useUnreadCounts() {
  return useQuery({
    queryKey: ['unread-counts'],
    queryFn: () => conversationsApi.getUnreadCounts().then(r => r.data.data),
    staleTime: 10_000,
    refetchInterval: 30_000,
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
      void queryClient.invalidateQueries({ queryKey: ['unread-counts'] })
    },
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
      void queryClient.invalidateQueries({ queryKey: ['unread-counts'] })
    },
  })
}

export function useDeleteNotification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationsApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

// ── WebSocket hooks (Reverb) ─────────────────────────────────────────────────

export function useConversationChannel(convId: string, onNewMessage?: (msg: Message) => void) {
  const queryClient = useQueryClient()
  useEffect(() => {
    if (!convId) return
    let channel: any
    import('@/shared/lib/echo').then(({ echo }) => {
      channel = echo.private(`conversation.${convId}`)
        .listen('MessageSent', (data: Message) => {
          void queryClient.invalidateQueries({ queryKey: ['messages', convId] })
          void queryClient.invalidateQueries({ queryKey: ['conversations'] })
          onNewMessage?.(data)
        })
        .listen('MessageEdited', () => {
          void queryClient.invalidateQueries({ queryKey: ['messages', convId] })
        })
        .listen('MessageDeleted', () => {
          void queryClient.invalidateQueries({ queryKey: ['messages', convId] })
        })
    })
    return () => { channel?.stopListening('MessageSent'); channel?.stopListening('MessageEdited'); channel?.stopListening('MessageDeleted') }
  }, [convId, queryClient])
}

export function useNotificationsChannel(userId: number) {
  const queryClient = useQueryClient()
  useEffect(() => {
    if (!userId) return
    let channel: any
    import('@/shared/lib/echo').then(({ echo }) => {
      channel = echo.private(`user.${userId}.notifications`)
        .listen('NotificationReceived', (data: AppNotification) => {
          void queryClient.invalidateQueries({ queryKey: ['notifications'] })
          void queryClient.invalidateQueries({ queryKey: ['unread-counts'] })
          toast(`🔔 ${data.title}`)
        })
    })
    return () => { channel?.stopListening('NotificationReceived') }
  }, [userId, queryClient])
}

export function useAnnouncementsChannel(tenantId: string) {
  const queryClient = useQueryClient()
  useEffect(() => {
    if (!tenantId) return
    let channel: any
    import('@/shared/lib/echo').then(({ echo }) => {
      channel = echo.channel(`announcements.${tenantId}`)
        .listen('AnnouncementPublished', () => {
          void queryClient.invalidateQueries({ queryKey: ['announcements'] })
          void queryClient.invalidateQueries({ queryKey: ['unread-counts'] })
        })
    })
    return () => { channel?.stopListening('AnnouncementPublished') }
  }, [tenantId, queryClient])
}
