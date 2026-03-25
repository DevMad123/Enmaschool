import api from '@/shared/lib/axios'
import type { ApiSuccess, PaginatedResponse } from '@/shared/types/api.types'
import type { Announcement, AppNotification, Conversation, Message, UnreadCounts } from '../types/messaging.types'

const BASE = '/api/school'

export const conversationsApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Conversation>>(`${BASE}/conversations`, { params }),
  getOne: (id: string) =>
    api.get<ApiSuccess<Conversation>>(`${BASE}/conversations/${id}`),
  create: (data: Record<string, unknown>) =>
    api.post<ApiSuccess<Conversation>>(`${BASE}/conversations`, data),
  getMessages: (id: string, params?: { page?: number }) =>
    api.get<PaginatedResponse<Message>>(`${BASE}/conversations/${id}/messages`, { params }),
  sendMessage: (id: string, formData: FormData) =>
    api.post<ApiSuccess<Message>>(`${BASE}/conversations/${id}/messages`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  editMessage: (convId: string, msgId: string, body: string) =>
    api.put(`${BASE}/conversations/${convId}/messages/${msgId}`, { body }),
  deleteMessage: (convId: string, msgId: string) =>
    api.delete(`${BASE}/conversations/${convId}/messages/${msgId}`),
  markRead: (id: string) =>
    api.post(`${BASE}/conversations/${id}/read`),
  getUnreadCounts: () =>
    api.get<ApiSuccess<UnreadCounts>>(`${BASE}/messaging/unread-counts`),
}

export const announcementsApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Announcement>>(`${BASE}/announcements`, { params }),
  getOne: (id: number) =>
    api.get<ApiSuccess<Announcement>>(`${BASE}/announcements/${id}`),
  create: (formData: FormData) =>
    api.post<ApiSuccess<Announcement>>(`${BASE}/announcements`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id: number, data: Partial<Announcement>) =>
    api.put<ApiSuccess<Announcement>>(`${BASE}/announcements/${id}`, data),
  publish: (id: number) =>
    api.post<ApiSuccess<Announcement>>(`${BASE}/announcements/${id}/publish`),
  delete: (id: number) =>
    api.delete(`${BASE}/announcements/${id}`),
  markRead: (id: number) =>
    api.post(`${BASE}/announcements/${id}/read`),
  markAllRead: () =>
    api.post<ApiSuccess<{ marked: number }>>(`${BASE}/announcements/read-all`),
}

export const notificationsApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<AppNotification>>(`${BASE}/notifications`, { params }),
  markRead: (id: string) =>
    api.post(`${BASE}/notifications/${id}/read`),
  markAllRead: () =>
    api.post<ApiSuccess<{ marked: number }>>(`${BASE}/notifications/read-all`),
  delete: (id: string) =>
    api.delete(`${BASE}/notifications/${id}`),
}
