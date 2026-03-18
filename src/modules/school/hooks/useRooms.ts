// ===== src/modules/school/hooks/useRooms.ts =====

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApiError } from '@/shared/types/api.types'
import { toast } from '@/shared/lib/toast'
import type { RoomFormData, RoomFilters } from '../types/school.types'
import { getRooms, getRoom, createRoom, updateRoom, deleteRoom } from '../api/rooms.api'

export const roomKeys = {
  all: ['rooms'] as const,
  lists: () => [...roomKeys.all, 'list'] as const,
  list: (filters?: RoomFilters) => [...roomKeys.lists(), filters] as const,
  details: () => [...roomKeys.all, 'detail'] as const,
  detail: (id: number) => [...roomKeys.details(), id] as const,
}

export function useRooms(filters?: RoomFilters) {
  return useQuery({
    queryKey: roomKeys.list(filters),
    queryFn: () => getRooms(filters),
  })
}

export function useRoom(id: number) {
  return useQuery({
    queryKey: roomKeys.detail(id),
    queryFn: () => getRoom(id),
    enabled: !!id,
  })
}

export function useCreateRoom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: RoomFormData) => createRoom(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roomKeys.lists() })
      toast.success('Salle créée avec succès')
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateRoom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<RoomFormData> }) =>
      updateRoom(id, data),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: roomKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: roomKeys.lists() })
      toast.success('Salle mise à jour')
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteRoom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteRoom(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roomKeys.lists() })
      toast.success('Salle supprimée')
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}
