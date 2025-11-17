'use client'

import * as React from 'react'
import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface DrawerProps {
  /**
   * Whether the drawer is open
   */
  open: boolean

  /**
   * Callback when the drawer should close
   */
  onOpenChange: (open: boolean) => void

  /**
   * Drawer content
   */
  children: React.ReactNode

  /**
   * Optional drawer title
   */
  title?: string

  /**
   * Optional drawer description
   */
  description?: string

  /**
   * Position: 'bottom' or 'right'
   */
  position?: 'bottom' | 'right'

  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * Drawer Component
 *
 * Bottom sheet (mobile) or side drawer (desktop) component
 * that slides in from bottom on mobile, right on desktop.
 *
 * Features:
 * - Smooth slide animation
 * - Backdrop click to close
 * - Escape key support
 * - Configurable position
 * - Dark mode support
 * - Keyboard accessible
 */
export function Drawer({
  open,
  onOpenChange,
  children,
  title,
  description,
  position = 'bottom',
  className,
}: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [dragStart, setDragStart] = React.useState(0)
  const contentRef = useRef<HTMLDivElement>(null)

  // Handle escape key
  useEffect(() => {
    if (!open) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [open, onOpenChange])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [open])

  // Handle drag to close (bottom drawer only)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (position !== 'bottom') return
    setIsDragging(true)
    setDragStart(e.touches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !contentRef.current) return

    const delta = e.touches[0].clientY - dragStart
    if (delta > 0) {
      contentRef.current.style.transform = `translateY(${delta}px)`
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging || !contentRef.current) return

    const delta = e.changedTouches[0].clientY - dragStart
    contentRef.current.style.transform = ''
    setIsDragging(false)

    // Close if dragged more than 100px down
    if (delta > 100) {
      onOpenChange(false)
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-200"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={cn(
          'fixed z-50 transition-all duration-300 ease-out',
          position === 'bottom'
            ? 'bottom-0 left-0 right-0 max-h-[90vh] rounded-t-lg'
            : 'right-0 top-0 bottom-0 w-96 max-w-[90vw]',
          'bg-white dark:bg-neutral-900',
          'border-t border-neutral-200 dark:border-accent-700/20',
          position === 'right' && 'border-l border-t-0',
          className
        )}
      >
        {/* Drag handle (bottom drawer only) */}
        {position === 'bottom' && (
          <div
            className="flex justify-center py-2 px-4 border-b border-neutral-100 dark:border-accent-700/10 cursor-grab active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="h-1 w-12 rounded-full bg-neutral-300 dark:bg-neutral-700" />
          </div>
        )}

        {/* Content wrapper with drag support */}
        <div
          ref={contentRef}
          className={cn(
            'transition-transform duration-200',
            position === 'bottom' ? 'overflow-y-auto max-h-[calc(90vh-40px)]' : 'overflow-y-auto h-full'
          )}
        >
          {/* Header */}
          {(title || description) && (
            <div className="flex items-start justify-between px-4 py-4 border-b border-neutral-100 dark:border-accent-700/10 sticky top-0 bg-white dark:bg-neutral-900 z-10">
              <div className="flex-1">
                {title && <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">{title}</h2>}
                {description && <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{description}</p>}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="ml-2 p-2 h-auto w-auto"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Drawer body */}
          <div className="px-4 py-4">{children}</div>
        </div>
      </div>
    </>
  )
}
