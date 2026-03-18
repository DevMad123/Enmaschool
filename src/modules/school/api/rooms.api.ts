// ===== src/modules/school/api/rooms.api.ts =====

import api from '@/shared/lib/axios'
import type { ApiSuccess, PaginatedResponse } from '@/shared/types/api.types'
import type { Room, RoomFormData, RoomFilters } from '../types/school.types'

export async function getRooms(params?: RoomFilters): Promise<PaginatedResponse<Room>> {
  const { data } = await api.get<PaginatedResponse<Room>>('/api/school/rooms', { params })
  return data
}

export async function getRoom(id: number): Promise<ApiSuccess<Room>> {
  const { data } = await api.get<ApiSuccess<Room>>(`/api/school/rooms/${id}`)
  return data
}

export async function createRoom(payload: RoomFormData): Promise<ApiSuccess<Room>> {
  const { data } = await api.post<ApiSuccess<Room>>('/api/school/rooms', payload)
  return data
}

export async function updateRoom(
  id: number,
  payload: Partial<RoomFormData>,
): Promise<ApiSuccess<Room>> {
  const { data } = await api.put<ApiSuccess<Room>>(`/api/school/rooms/${id}`, payload)
  return data
}

export async function deleteRoom(id: number): Promise<ApiSuccess<null>> {
  const { data } = await api.delete<ApiSuccess<null>>(`/api/school/rooms/${id}`)
  return data
}
