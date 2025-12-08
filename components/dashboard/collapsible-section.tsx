'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CollapsibleSectionProps {
  /** Section title */
  title: string
  /** Section content */
  children: React.ReactNode
  /** Initially expanded? */
  defaultOpen?: boolean
  /** CSS class */
  className?: string
}

/**
 * CollapsibleSection Component
 *
 * Expandable/collapsible section with smooth height animation
 * Perfect for mobile card details
 *
 * Features:
 * - Smooth height transitions
 * - Icon rotation animation
 * - Keyboard accessible (space/enter to toggle)
 * - ARIA labels for screen readers
 * - Dark mode support
 *
 * @example
 * <CollapsibleSection title="More Details">
 *   <p>Details content here</p>
 * </CollapsibleSection>
 */
export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  className,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [height, setHeight] = useState<number>(0)
  const contentRef = useRef<HTMLDivElement>(null)

  // Update height when content changes
  useEffect(() => {
    if (isOpen && contentRef.current) {
      setHeight(contentRef.current.scrollHeight)
    } else {
      setHeight(0)
    }
  }, [isOpen])

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      handleToggle()
    }
  }

  return (
    <div className={cn('border border-neutral-200 dark:border-neutral-800 rounded', className)}>
      {/* Header Button */}
      <button
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={cn(
          'w-full flex items-center gap-3 p-3',
          'text-sm font-medium',
          'text-neutral-900 dark:text-neutral-100',
          'hover:bg-neutral-50 dark:hover:bg-neutral-900/50',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600',
          'transition-colors'
        )}
        aria-expanded={isOpen}
        aria-controls={`section-content-${title.replace(/\s+/g, '-')}`}
      >
        {/* Chevron Icon with rotation */}
        <ChevronDown
          className={cn(
            'w-4 h-4 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
          aria-hidden="true"
        />
        <span>{title}</span>
      </button>

      {/* Content - Animated */}
      <div
        id={`section-content-${title.replace(/\s+/g, '-')}`}
        ref={contentRef}
        style={{
          maxHeight: `${height}px`,
          overflow: 'hidden',
          transition: 'max-height 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div className="px-3 py-2 border-t border-neutral-200 dark:border-neutral-800 text-sm text-neutral-700 dark:text-neutral-300">
          {children}
        </div>
      </div>
    </div>
  )
}
