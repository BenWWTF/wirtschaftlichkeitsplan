'use client'

import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export interface Column<T> {
  key: string
  header: string
  cell?: (value: any, row: T) => React.ReactNode
  className?: string
  headerClassName?: string
  align?: 'left' | 'center' | 'right'
  width?: string | number
}

interface ResponsiveTableProps<T> {
  data: T[]
  columns: Column<T>[]
  rowKey: (row: T, index: number) => string | number
  className?: string
  rowClassName?: string
  emptyState?: React.ReactNode
  loading?: boolean
  striped?: boolean
}

/**
 * ResponsiveTable Component
 *
 * A flexible table component with responsive behavior and customizable columns.
 *
 * @example
 * ```tsx
 * <ResponsiveTable
 *   data={items}
 *   columns={[
 *     { key: 'name', header: 'Name', width: 200 },
 *     { key: 'email', header: 'Email' },
 *     { key: 'actions', header: 'Actions', align: 'center' }
 *   ]}
 *   rowKey={(item) => item.id}
 * />
 * ```
 */
export function ResponsiveTable<T>({
  data,
  columns,
  rowKey,
  className,
  rowClassName,
  emptyState,
  loading,
  striped,
}: ResponsiveTableProps<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      emptyState || (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No data available</p>
        </div>
      )
    )
  }

  return (
    <div className={cn('rounded-lg border border-border overflow-hidden', className)}>
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="border-border hover:bg-transparent">
            {columns.map((column) => (
              <TableHead
                key={column.key}
                style={{ width: column.width ? `${column.width}px` : undefined }}
                className={cn(
                  column.headerClassName,
                  column.align === 'center' && 'text-center',
                  column.align === 'right' && 'text-right',
                  'font-semibold'
                )}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow
              key={rowKey(row, index)}
              className={cn(
                'border-border hover:bg-muted/50',
                striped && index % 2 !== 0 && 'bg-muted/30',
                rowClassName
              )}
            >
              {columns.map((column) => {
                const value = (row as any)[column.key]
                return (
                  <TableCell
                    key={`${rowKey(row, index)}-${column.key}`}
                    className={cn(
                      column.className,
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right'
                    )}
                  >
                    {column.cell ? column.cell(value, row) : value}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
