'use client'

import { ReactNode, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface DrawerPrimitiveProps {
  /** Whether drawer is open */
  isOpen: boolean
  /** Callback when drawer requests to close */
  onClose: () => void
  /** Drawer content */
  children: ReactNode
  /** CSS class */
  className?: string
}

/**
 * DrawerPrimitive Component
 *
 * Reusable bottom drawer component for mobile
 * Slides from bottom of screen
 *
 * Features:
 * - Smooth slide-up animation
 * - Dismissible (click outside, swipe down, escape key)
 * - Safe area padding for notched devices
 * - Dark mode support
 * - Mobile-only (hidden on desktop)
 * - Keyboard accessible (Escape to close)
 *
 * @example
 * <DrawerPrimitive
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 * >
 *   Drawer content here
 * </DrawerPrimitive>
 */
export function DrawerPrimitive({
  isOpen,
  onClose,
  children,
  className,
}: DrawerPrimitiveProps) {
  const drawerRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef<number>(0)
  const currentYRef = useRef<number>(0)

  // Handle keyboard (Escape to close)
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Handle swipe gesture to close
  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!drawerRef.current) return
    currentYRef.current = e.touches[0].clientY - startYRef.current
  }

  const handleTouchEnd = () => {
    // Close if swiped down more than 30% of drawer height
    if (drawerRef.current && currentYRef.current > 60) {
      onClose()
    }
    currentYRef.current = 0
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 md:hidden bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 md:hidden',
          'bg-white dark:bg-neutral-900',
          'rounded-t-lg border-t border-neutral-200 dark:border-neutral-800',
          'animate-[slideUp_200ms_ease-out]',
          'max-h-[70vh] overflow-y-auto',
          className
        )}
        role="dialog"
        aria-modal="true"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        }}
      >
        {/* Drag handle indicator */}
        <div className="flex justify-center py-2">
          <div className="w-12 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
        </div>

        {/* Content */}
        <div className="px-4 pb-4">
          {children}
        </div>
      </div>

      {/* Add slideUp animation keyframes */}
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  )
}
