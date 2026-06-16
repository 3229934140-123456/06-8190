import { useState, useMemo } from 'react'
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import EmptyState from './EmptyState'

export interface Column<T> {
  key: keyof T | string
  title: string
  render?: (row: T) => React.ReactNode
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  headerAlign?: 'left' | 'center' | 'right'
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  pageSize?: number
  showPagination?: boolean
  emptyTitle?: string
  emptyDescription?: string
  className?: string
  rowKey?: keyof T | ((row: T) => string)
  onRowClick?: (row: T) => void
}

type SortDirection = 'asc' | 'desc' | null

export default function DataTable<T>({
  columns,
  data,
  pageSize = 10,
  showPagination = true,
  emptyTitle = '暂无数据',
  emptyDescription = '当前没有可显示的数据',
  className,
  rowKey,
  onRowClick
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return data

    return [...data].sort((a, b) => {
      const key = sortKey as keyof T
      const aValue = a[key]
      const bValue = b[key]

      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }

      const aStr = String(aValue)
      const bStr = String(bValue)
      return sortDirection === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr)
    })
  }, [data, sortKey, sortDirection])

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize))
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedData.slice(start, start + pageSize)
  }, [sortedData, currentPage, pageSize])

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') setSortDirection('desc')
      else if (sortDirection === 'desc') {
        setSortDirection(null)
        setSortKey(null)
      }
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const getRowKey = (row: T, index: number): string => {
    if (!rowKey) return String(index)
    if (typeof rowKey === 'function') return rowKey(row)
    return String(row[rowKey])
  }

  if (data.length === 0) {
    return (
      <div className={cn('glass-card p-8', className)}>
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </div>
    )
  }

  return (
    <div className={cn('glass-card overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-700 bg-dark-800/50">
              {columns.map((column) => {
                const key = String(column.key)
                const isSorted = sortKey === key
                const isSortable = column.sortable

                return (
                  <th
                    key={key}
                    className={cn(
                      'px-4 py-3 text-xs font-semibold uppercase tracking-wider',
                      column.headerAlign === 'center' && 'text-center',
                      column.headerAlign === 'right' && 'text-right',
                      !column.headerAlign && 'text-left',
                      isSortable && 'cursor-pointer select-none hover:bg-dark-700/30 transition-colors duration-200',
                      'text-slate-400'
                    )}
                    style={{ width: column.width }}
                    onClick={() => isSortable && handleSort(key)}
                  >
                    <span
                      className={cn(
                        'inline-flex items-center gap-1',
                        column.headerAlign === 'center' && 'justify-center',
                        column.headerAlign === 'right' && 'justify-end',
                        'w-full'
                      )}
                    >
                      {column.title}
                      {isSortable && (
                        <span className="text-slate-500">
                          {isSorted && sortDirection === 'asc' && <ChevronUp className="h-3.5 w-3.5 text-primary-400" />}
                          {isSorted && sortDirection === 'desc' && <ChevronDown className="h-3.5 w-3.5 text-primary-400" />}
                          {!isSorted && <ChevronsUpDown className="h-3.5 w-3.5" />}
                        </span>
                      )}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-700/50">
            {paginatedData.map((row, rowIndex) => (
              <tr
                key={getRowKey(row, rowIndex)}
                className={cn(
                  'transition-all duration-200',
                  onRowClick && 'cursor-pointer',
                  'hover:bg-dark-700/40'
                )}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((column, colIndex) => {
                  const key = String(column.key)
                  const value = row[column.key as keyof T]

                  return (
                    <td
                      key={`${key}-${colIndex}`}
                      className={cn(
                        'px-4 py-3.5 text-sm',
                        column.align === 'center' && 'text-center',
                        column.align === 'right' && 'text-right',
                        !column.align && 'text-left',
                        'text-slate-300'
                      )}
                    >
                      {column.render ? column.render(row) : (value as React.ReactNode)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-dark-700 px-4 py-3">
          <div className="text-sm text-slate-400">
            共 <span className="font-medium text-slate-200">{sortedData.length}</span> 条记录，
            第 <span className="font-medium text-slate-200">{currentPage}</span> /{' '}
            <span className="font-medium text-slate-200">{totalPages}</span> 页
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200',
                currentPage === 1
                  ? 'cursor-not-allowed border-dark-700 bg-dark-800 text-slate-600'
                  : 'border-dark-700 bg-dark-800 text-slate-400 hover:border-primary-500/50 hover:bg-dark-700 hover:text-white'
              )}
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200',
                currentPage === 1
                  ? 'cursor-not-allowed border-dark-700 bg-dark-800 text-slate-600'
                  : 'border-dark-700 bg-dark-800 text-slate-400 hover:border-primary-500/50 hover:bg-dark-700 hover:text-white'
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="mx-1 flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      'flex h-8 min-w-[32px] items-center justify-center rounded-lg border px-2 text-sm font-medium transition-all duration-200',
                      currentPage === pageNum
                        ? 'border-primary-500 bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                        : 'border-dark-700 bg-dark-800 text-slate-400 hover:border-primary-500/50 hover:bg-dark-700 hover:text-white'
                    )}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200',
                currentPage === totalPages
                  ? 'cursor-not-allowed border-dark-700 bg-dark-800 text-slate-600'
                  : 'border-dark-700 bg-dark-800 text-slate-400 hover:border-primary-500/50 hover:bg-dark-700 hover:text-white'
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200',
                currentPage === totalPages
                  ? 'cursor-not-allowed border-dark-700 bg-dark-800 text-slate-600'
                  : 'border-dark-700 bg-dark-800 text-slate-400 hover:border-primary-500/50 hover:bg-dark-700 hover:text-white'
              )}
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
