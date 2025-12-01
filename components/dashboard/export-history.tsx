'use client'

import React, { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Download,
  Trash2,
  RotateCw,
  FileText,
  Calendar,
  Clock,
  Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

export interface ExportHistoryItem {
  id: string
  export_type: string
  export_format: string
  file_name: string
  file_size?: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error_message?: string
  sent_via_email: boolean
  created_at: string
  expires_at: string
}

interface ExportHistoryProps {
  items?: ExportHistoryItem[]
  isLoading?: boolean
  onDelete?: (id: string) => Promise<void>
  onDownload?: (id: string) => Promise<void>
  onRetry?: (id: string) => Promise<void>
}

export function ExportHistory({
  items = [],
  isLoading = false,
  onDelete,
  onDownload,
  onRetry
}: ExportHistoryProps) {
  const [selectedItem, setSelectedItem] = useState<ExportHistoryItem | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Ausstehend' },
      processing: { color: 'bg-blue-100 text-blue-800', label: 'Wird verarbeitet' },
      completed: { color: 'bg-green-100 text-green-800', label: 'Abgeschlossen' },
      failed: { color: 'bg-red-100 text-red-800', label: 'Fehlgeschlagen' }
    }

    const config = statusConfig[status] || statusConfig.pending
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const getFormatIcon = (format: string) => {
    const icons: Record<string, string> = {
      pdf: '📄',
      xlsx: '📊',
      csv: '📋',
      zip: '🗂️'
    }
    return icons[format] || '📦'
  }

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '-'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleDelete = async (id: string) => {
    if (!onDelete) return

    try {
      setActionLoading(id)
      await onDelete(id)
      toast.success('Export gelöscht')
    } catch (error) {
      toast.error('Fehler beim Löschen des Exports')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDownload = async (id: string) => {
    if (!onDownload) return

    try {
      setActionLoading(id)
      await onDownload(id)
      toast.success('Download gestartet')
    } catch (error) {
      toast.error('Fehler beim Herunterladen')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRetry = async (id: string) => {
    if (!onRetry) return

    try {
      setActionLoading(id)
      await onRetry(id)
      toast.success('Export wird wiederholt')
    } catch (error) {
      toast.error('Fehler beim Wiederholen des Exports')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Export-Verlauf</h2>
        <span className="text-sm text-muted-foreground">
          {items.length} Export{items.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-2 opacity-40" />
          <p>Keine Exporte vorhanden</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Typ</TableHead>
                <TableHead>Dateiname</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Größe</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Erstellt</TableHead>
                <TableHead>Verfällt</TableHead>
                <TableHead>Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.id} className="hover:bg-accent/50">
                  <TableCell className="font-medium">{item.export_type}</TableCell>
                  <TableCell className="max-w-xs truncate">{item.file_name}</TableCell>
                  <TableCell>
                    <span className="text-lg">{getFormatIcon(item.export_format)}</span>
                    {item.export_format.toUpperCase()}
                  </TableCell>
                  <TableCell>{formatFileSize(item.file_size)}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(item.created_at), 'dd.MM.yy', { locale: de })}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.expires_at ? format(new Date(item.expires_at), 'dd.MM.yy', { locale: de }) : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {item.status === 'completed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(item.id)}
                          disabled={actionLoading === item.id}
                          title="Herunterladen"
                        >
                          {actionLoading === item.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                      {item.status === 'failed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRetry(item.id)}
                          disabled={actionLoading === item.id}
                          title="Erneut versuchen"
                        >
                          {actionLoading === item.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RotateCw className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        disabled={actionLoading === item.id}
                        title="Löschen"
                      >
                        {actionLoading === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 text-destructive" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedItem(item)}
                        title="Details"
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Details Dialog */}
      {selectedItem && (
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Export-Details</DialogTitle>
              <DialogDescription>Detaillierte Informationen zum Export</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Exporttyp</p>
                  <p className="font-medium">{selectedItem.export_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Format</p>
                  <p className="font-medium">{selectedItem.export_format.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div>{getStatusBadge(selectedItem.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dateigröße</p>
                  <p className="font-medium">{formatFileSize(selectedItem.file_size)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Dateiname</p>
                  <p className="font-medium break-all">{selectedItem.file_name}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Erstellt am</p>
                  <p className="font-medium">
                    {format(new Date(selectedItem.created_at), 'dd.MM.yyyy HH:mm:ss', { locale: de })}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Verfällt am</p>
                  <p className="font-medium">
                    {selectedItem.expires_at
                      ? format(new Date(selectedItem.expires_at), 'dd.MM.yyyy', { locale: de })
                      : 'Nie'}
                  </p>
                </div>
                {selectedItem.sent_via_email && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Per E-Mail versendet</p>
                    <p className="font-medium">Ja</p>
                  </div>
                )}
                {selectedItem.error_message && (
                  <div className="col-span-2 bg-red-50 dark:bg-red-950 p-3 rounded text-sm">
                    <p className="text-red-800 dark:text-red-200">{selectedItem.error_message}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setSelectedItem(null)}>
                  Schließen
                </Button>
                {selectedItem.status === 'completed' && (
                  <Button onClick={() => handleDownload(selectedItem.id)}>
                    <Download className="w-4 h-4 mr-2" />
                    Herunterladen
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
