'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onConfirm: () => void | Promise<void>
  isLoading?: boolean
  variant?: 'default' | 'destructive'
  confirmText?: string
  cancelText?: string
}

/**
 * ConfirmDialog Component
 *
 * A confirmation dialog for destructive actions like delete operations.
 *
 * @example
 * ```tsx
 * <ConfirmDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Delete Item?"
 *   description="This action cannot be undone."
 *   onConfirm={() => deleteItem()}
 *   variant="destructive"
 *   confirmText="Delete"
 *   cancelText="Cancel"
 * />
 * ```
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  isLoading = false,
  variant = 'default',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    const result = onConfirm()
    if (result instanceof Promise) {
      result.finally(() => {
        onOpenChange(false)
      })
    } else {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            variant={variant === 'destructive' ? 'destructive' : 'default'}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
