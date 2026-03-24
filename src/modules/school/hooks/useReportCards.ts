import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApiError } from '@/shared/types/api.types'
import { toast } from '@/shared/lib/toast'
import type {
  ReportCardFilters,
  CouncilFormData,
  AppreciationEntry,
  ReportCardType,
  InitiateClassPayload,
} from '../types/reportCards.types'
import { reportCardsApi } from '../api/reportCards.api'
import { downloadBlobAsPdf } from '../lib/reportCardHelpers'

// ── Query Keys ─────────────────────────────────────────────────────────────

export const reportCardKeys = {
  all:        ['report-cards'] as const,
  lists:      () => [...reportCardKeys.all, 'list'] as const,
  list:       (f?: ReportCardFilters) => [...reportCardKeys.lists(), f] as const,
  detail:     (id: number) => [...reportCardKeys.all, 'detail', id] as const,
  stats:      (classeId: number, periodId?: number) =>
    [...reportCardKeys.all, 'stats', classeId, periodId] as const,
}

// ── Queries ────────────────────────────────────────────────────────────────

export function useReportCards(filters?: ReportCardFilters) {
  return useQuery({
    queryKey: reportCardKeys.list(filters),
    queryFn:  () => reportCardsApi.getAll(filters).then((r) => r.data),
  })
}

export function useReportCard(id: number | undefined) {
  return useQuery({
    queryKey: reportCardKeys.detail(id!),
    queryFn:  () => reportCardsApi.getOne(id!).then((r) => r.data.data),
    enabled:  !!id,
  })
}

export function useClassBulletinsStats(classeId: number | undefined, periodId?: number) {
  return useQuery({
    queryKey: reportCardKeys.stats(classeId!, periodId),
    queryFn:  () => reportCardsApi.getClassStats(classeId!, periodId).then((r) => r.data),
    enabled:  !!classeId,
  })
}

// ── Mutations ──────────────────────────────────────────────────────────────

export function useInitiateReportCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: reportCardsApi.initiate,
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: reportCardKeys.lists() })
      toast.success('Bulletin initialisé.')
    },
    onError: (e: ApiError) => toast.error(e.response?.data?.message ?? 'Erreur'),
  })
}

export function useInitiateClassReportCards() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: InitiateClassPayload) => reportCardsApi.initiateForClass(data),
    onSuccess:  (res) => {
      qc.invalidateQueries({ queryKey: reportCardKeys.lists() })
      qc.invalidateQueries({ queryKey: reportCardKeys.all })
      toast.success(`${res.data.data?.created ?? 0} bulletin(s) créé(s).`)
    },
    onError: (e: ApiError) => toast.error(e.response?.data?.message ?? 'Erreur'),
  })
}

export function useUpdateCouncil() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CouncilFormData }) =>
      reportCardsApi.updateCouncil(id, data),
    onSuccess: (res, { id }) => {
      qc.invalidateQueries({ queryKey: reportCardKeys.detail(id) })
      toast.success('Données du conseil sauvegardées.')
    },
    onError: (e: ApiError) => toast.error(e.response?.data?.message ?? 'Erreur'),
  })
}

export function useSaveAppreciations() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, appreciations }: { id: number; appreciations: AppreciationEntry[] }) =>
      reportCardsApi.saveAppreciations(id, appreciations),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: reportCardKeys.detail(id) })
    },
    onError: (e: ApiError) => toast.error(e.response?.data?.message ?? 'Erreur'),
  })
}

export function useGenerateReportCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => reportCardsApi.generate(id),
    onSuccess: (res) => {
      const rc = res.data.data
      if (rc) qc.invalidateQueries({ queryKey: reportCardKeys.detail(rc.id) })
      qc.invalidateQueries({ queryKey: reportCardKeys.lists() })
      toast.success('PDF généré avec succès.')
    },
    onError: (e: ApiError) => toast.error(e.response?.data?.message ?? 'Erreur'),
  })
}

export function useGenerateForClass() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: InitiateClassPayload) => reportCardsApi.generateForClass(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: reportCardKeys.all })
      toast.success(res.data.data?.message ?? 'Génération lancée.')
    },
    onError: (e: ApiError) => toast.error(e.response?.data?.message ?? 'Erreur'),
  })
}

export function usePublishReportCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => reportCardsApi.publish(id),
    onSuccess: (res) => {
      const rc = res.data.data
      if (rc) qc.invalidateQueries({ queryKey: reportCardKeys.detail(rc.id) })
      qc.invalidateQueries({ queryKey: reportCardKeys.lists() })
      toast.success('Bulletin publié.')
    },
    onError: (e: ApiError) => toast.error(e.response?.data?.message ?? 'Erreur'),
  })
}

export function usePublishForClass() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { class_id: number; period_id?: number }) =>
      reportCardsApi.publishForClass(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: reportCardKeys.all })
      const count = res.data.data?.published ?? 0
      toast.success(`${count} bulletin(s) publié(s).`)
    },
    onError: (e: ApiError) => toast.error(e.response?.data?.message ?? 'Erreur'),
  })
}

export function useDownloadReportCard() {
  return useMutation({
    mutationFn: async ({ id, filename }: { id: number; filename: string }) => {
      const res = await reportCardsApi.download(id)
      downloadBlobAsPdf(res.data as Blob, filename)
    },
    onError: (e: ApiError) => toast.error(e.response?.data?.message ?? 'Erreur téléchargement'),
  })
}

export function useDeleteReportCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => reportCardsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reportCardKeys.lists() })
      toast.success('Bulletin supprimé.')
    },
    onError: (e: ApiError) => toast.error(e.response?.data?.message ?? 'Erreur'),
  })
}
