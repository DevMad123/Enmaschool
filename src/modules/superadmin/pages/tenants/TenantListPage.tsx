// ===== src/modules/superadmin/pages/tenants/TenantListPage.tsx =====

import { useState, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import {
  Plus,
  Download,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  MoreHorizontal,
  Eye,
  Pencil,
  Puzzle,
  CheckCircle,
  PauseCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { TenantStatusBadge } from '../../components/TenantStatusBadge'
import { SchoolTypeBadges } from '../../components/SchoolTypeBadges'
import { useTenants, useActivateTenant, useSuspendTenant, useDeleteTenant } from '../../hooks/useTenants'
import type { Tenant, TenantFilters, TenantStatus } from '../../types/tenant.types'

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ── Columns ────────────────────────────────────────────────────────────────────
function useColumns(
  onActivate: (id: string) => void,
  onSuspend: (id: string) => void,
  onDelete: (id: string) => void,
): ColumnDef<Tenant>[] {
  return useMemo(
    () => [
      {
        id: 'name',
        header: 'École',
        accessorFn: (row) => row.name,
        cell: ({ row }) => {
          const t = row.original
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                {t.name[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">
                  {t.name}
                </p>
                <p className="text-xs text-slate-400">{t.slug}</p>
              </div>
            </div>
          )
        },
      },
      {
        id: 'types',
        header: 'Types',
        enableSorting: false,
        cell: ({ row }) => (
          <SchoolTypeBadges
            has_maternelle={row.original.has_maternelle}
            has_primary={row.original.has_primary}
            has_college={row.original.has_college}
            has_lycee={row.original.has_lycee}
            size="sm"
          />
        ),
      },
      {
        id: 'plan',
        header: 'Plan',
        accessorFn: (row) => row.plan?.name ?? '—',
        cell: ({ row }) => (
          <span className="text-sm text-slate-700">
            {row.original.plan?.name ?? (
              <span className="text-slate-400">—</span>
            )}
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Statut',
        accessorFn: (row) => row.status,
        cell: ({ row }) => <TenantStatusBadge status={row.original.status} size="sm" />,
      },
      {
        id: 'trial',
        header: 'Essai',
        accessorFn: (row) => row.trial_days_left,
        cell: ({ row }) => {
          const t = row.original
          if (!t.is_on_trial || t.trial_days_left === null) return <span className="text-slate-300">—</span>
          return (
            <span
              className={`text-xs font-semibold ${
                t.trial_days_left <= 5 ? 'text-red-600' : 'text-amber-600'
              }`}
            >
              {t.trial_days_left}j
            </span>
          )
        },
      },
      {
        id: 'created_at',
        header: 'Inscription',
        accessorFn: (row) => row.created_at,
        cell: ({ row }) => (
          <span className="text-xs text-slate-500">
            {formatDate(row.original.created_at)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => {
          const t = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem asChild>
                  <Link to={`/admin/tenants/${t.id}`} className="flex items-center gap-2">
                    <Eye className="h-4 w-4" /> Voir
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={`/admin/tenants/${t.id}/edit`} className="flex items-center gap-2">
                    <Pencil className="h-4 w-4" /> Modifier
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={`/admin/tenants/${t.id}/modules`} className="flex items-center gap-2">
                    <Puzzle className="h-4 w-4" /> Modules
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {t.status !== 'active' && (
                  <DropdownMenuItem
                    className="text-green-700 focus:text-green-700"
                    onClick={() => onActivate(t.id)}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" /> Activer
                  </DropdownMenuItem>
                )}
                {t.status === 'active' || t.status === 'trial' ? (
                  <DropdownMenuItem
                    className="text-amber-700 focus:text-amber-700"
                    onClick={() => onSuspend(t.id)}
                  >
                    <PauseCircle className="mr-2 h-4 w-4" /> Suspendre
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={() => onDelete(t.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [onActivate, onSuspend, onDelete],
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────
export function TenantListPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<TenantFilters>({ page: 1, per_page: 20 })
  const [sorting, setSorting] = useState<SortingState>([])
  const [searchInput, setSearchInput] = useState('')

  const { data, isLoading, isFetching } = useTenants(filters)
  const { mutate: activate } = useActivateTenant()
  const { mutate: suspend } = useSuspendTenant()
  const { mutate: deleteTenant } = useDeleteTenant()

  const handleActivate = useCallback((id: string) => activate(id), [activate])
  const handleSuspend = useCallback(
    (id: string) => suspend({ id, data: { reason: 'Suspension depuis admin' } }),
    [suspend],
  )
  const handleDelete = useCallback(
    (id: string) => {
      if (window.confirm('Supprimer cette école ? Cette action est irréversible.')) {
        deleteTenant(id)
      }
    },
    [deleteTenant],
  )

  const columns = useColumns(handleActivate, handleSuspend, handleDelete)

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: data?.meta?.last_page ?? -1,
  })

  // Debounced search: update filters after 400ms
  const applySearch = useCallback((value: string) => {
    setFilters((f) => ({ ...f, search: value || undefined, page: 1 }))
  }, [])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setSearchInput(v)
    clearTimeout((window as unknown as Record<string, unknown>)._searchTimer as number)
    ;(window as unknown as Record<string, number>)._searchTimer = window.setTimeout(
      () => applySearch(v),
      400,
    )
  }

  const meta = data?.meta

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-slate-900">Écoles</h2>
          {meta && (
            <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
              {meta.total}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/tenants/create')}>
            <Download className="h-4 w-4" />
            Exporter
          </Button>
          <Button size="sm" onClick={() => navigate('/admin/tenants/create')}>
            <Plus className="h-4 w-4" />
            Nouvelle école
          </Button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Rechercher (nom, slug, email)…"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Status filter */}
        <select
          value={filters.status ?? ''}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              status: (e.target.value as TenantStatus) || undefined,
              page: 1,
            }))
          }
          className="rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">Tous statuts</option>
          <option value="trial">Essai</option>
          <option value="active">Actif</option>
          <option value="suspended">Suspendu</option>
          <option value="cancelled">Annulé</option>
        </select>

        {/* School type filter */}
        <select
          value={
            filters.has_maternelle ? 'maternelle'
            : filters.has_primary ? 'primary'
            : filters.has_college ? 'college'
            : filters.has_lycee ? 'lycee'
            : ''
          }
          onChange={(e) => {
            const val = e.target.value
            setFilters((f) => ({
              ...f,
              has_maternelle: val === 'maternelle' || undefined,
              has_primary: val === 'primary' || undefined,
              has_college: val === 'college' || undefined,
              has_lycee: val === 'lycee' || undefined,
              page: 1,
            }))
          }}
          className="rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">Type d&apos;école</option>
          <option value="maternelle">Maternelle</option>
          <option value="primary">Primaire</option>
          <option value="college">Collège</option>
          <option value="lycee">Lycée</option>
        </select>

        {isFetching && !isLoading && (
          <LoaderCircle className="h-4 w-4 animate-spin text-indigo-500" />
        )}
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-slate-100 bg-slate-50">
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={`flex items-center gap-1 ${
                            header.column.getCanSort() ? 'cursor-pointer select-none' : ''
                          }`}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <span className="text-slate-300">
                              {header.column.getIsSorted() === 'asc' ? (
                                <ChevronUp className="h-3.5 w-3.5 text-indigo-500" />
                              ) : header.column.getIsSorted() === 'desc' ? (
                                <ChevronDown className="h-3.5 w-3.5 text-indigo-500" />
                              ) : (
                                <ChevronsUpDown className="h-3.5 w-3.5" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading
                ? [...Array(8)].map((_, i) => (
                    <tr key={i}>
                      {columns.map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-5 animate-pulse rounded bg-slate-100" />
                        </td>
                      ))}
                    </tr>
                  ))
                : table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
              {!isLoading && (data?.data ?? []).length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 text-center text-sm text-slate-400"
                  >
                    Aucune école trouvée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <p className="text-xs text-slate-500">
              {meta.from ?? 0}–{meta.to ?? 0} sur {meta.total} écoles
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={!data?.links?.prev}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-2 text-xs text-slate-600">
                {meta.current_page} / {meta.last_page}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={!data?.links?.next}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
