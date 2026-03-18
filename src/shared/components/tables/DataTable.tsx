// ===== src/shared/components/tables/DataTable.tsx =====

import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
  type PaginationState,
  type OnChangeFn,
} from '@tanstack/react-table'
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────
interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  isLoading?: boolean
  pagination?: PaginationState
  onPaginationChange?: OnChangeFn<PaginationState>
  pageCount?: number
  manualPagination?: boolean
  rowSelection?: RowSelectionState
  onRowSelectionChange?: OnChangeFn<RowSelectionState>
  enableRowSelection?: boolean
  emptyIcon?: React.ReactNode
  emptyTitle?: string
  emptyDescription?: string
  bulkActions?: React.ReactNode
}

// ── Skeleton row ───────────────────────────────────────────────────────
function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-gray-100">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 w-full max-w-[160px] animate-pulse rounded bg-gray-200" />
        </td>
      ))}
    </tr>
  )
}

// ── DataTable ──────────────────────────────────────────────────────────
export function DataTable<TData>({
  columns,
  data,
  isLoading = false,
  pagination,
  onPaginationChange,
  pageCount,
  manualPagination = false,
  rowSelection,
  onRowSelectionChange,
  enableRowSelection = false,
  emptyTitle = 'Aucun résultat',
  emptyDescription = 'Aucune donnée à afficher.',
  bulkActions,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [internalPagination, setInternalPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [internalRowSelection, setInternalRowSelection] =
    useState<RowSelectionState>({})

  const paginationState = pagination ?? internalPagination
  const rowSelectionState = rowSelection ?? internalRowSelection

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination: paginationState,
      rowSelection: rowSelectionState,
    },
    onSortingChange: setSorting,
    onPaginationChange: onPaginationChange ?? setInternalPagination,
    onRowSelectionChange: onRowSelectionChange ?? setInternalRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: manualPagination ? undefined : getPaginationRowModel(),
    manualPagination,
    pageCount: pageCount ?? -1,
    enableRowSelection,
  })

  const selectedCount = Object.keys(rowSelectionState).filter(
    (k) => rowSelectionState[k],
  ).length

  return (
    <div className="space-y-3">
      {/* Bulk actions bar */}
      {enableRowSelection && selectedCount > 0 && bulkActions && (
        <div className="flex items-center gap-3 rounded-lg bg-indigo-50 px-4 py-2.5 text-sm">
          <span className="font-medium text-indigo-700">
            {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
          </span>
          <div className="ml-auto flex items-center gap-2">{bulkActions}</div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-gray-200 bg-gray-50/60">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn(
                      'px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500',
                      header.column.getCanSort() && 'cursor-pointer select-none',
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                      {header.column.getCanSort() &&
                        (header.column.getIsSorted() === 'asc' ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : header.column.getIsSorted() === 'desc' ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronsUpDown className="h-3.5 w-3.5 text-gray-300" />
                        ))}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <SkeletonRow key={i} cols={columns.length} />
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-16 text-center"
                >
                  <p className="text-sm font-medium text-gray-900">
                    {emptyTitle}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {emptyDescription}
                  </p>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    'border-b border-gray-100 transition-colors hover:bg-gray-50/50',
                    row.getIsSelected() && 'bg-indigo-50/40',
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {(manualPagination || data.length > paginationState.pageSize) && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-gray-500">
            Page {paginationState.pageIndex + 1}
            {table.getPageCount() > 0 && ` sur ${table.getPageCount()}`}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
