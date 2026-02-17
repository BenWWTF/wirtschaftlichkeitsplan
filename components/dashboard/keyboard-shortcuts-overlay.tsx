'use client'

import { useEffect, useState } from 'react'
import { Keyboard } from 'lucide-react'

/**
 * Keyboard Shortcuts Overlay Component
 *
 * Features:
 * - Press `?` to toggle overlay (ignores input/textarea focus)
 * - Glass morphism design matching command palette
 * - 2-column responsive grid layout
 * - Animated fade + scale transitions
 * - Close on Escape or overlay click
 * - German labels throughout
 *
 * Usage:
 * <KeyboardShortcutsOverlay />
 *
 * Integration:
 * Add to dashboard layout after CommandPalette component
 */

interface Shortcut {
  keys: string[]
  description: string
  platform?: 'mac' | 'windows' | 'both'
}

const SHORTCUTS: Shortcut[] = [
  {
    keys: ['Cmd', 'K'],
    description: 'Befehlspalette',
    platform: 'mac',
  },
  {
    keys: ['Ctrl', 'K'],
    description: 'Befehlspalette',
    platform: 'windows',
  },
  {
    keys: ['?'],
    description: 'Tastenkürzel anzeigen',
  },
  {
    keys: ['1', '-', '9'],
    description: 'Schnellnavigation (Seiten)',
  },
  {
    keys: ['Esc'],
    description: 'Dialog schließen',
  },
]

// Detect platform
const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0

export function KeyboardShortcutsOverlay() {
  const [isOpen, setIsOpen] = useState(false)

  // Toggle overlay with ? key (but not when typing in inputs/textareas)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input field
      const target = e.target as HTMLElement
      const isInputField =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      // Only trigger ? shortcut when NOT in an input field
      if (e.key === '?' && !isInputField) {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }

      // Close on Escape when overlay is open
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Close overlay when clicking outside
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false)
    }
  }

  // Filter shortcuts by platform
  const visibleShortcuts = SHORTCUTS.filter(
    (shortcut) =>
      !shortcut.platform ||
      shortcut.platform === 'both' ||
      (isMac && shortcut.platform === 'mac') ||
      (!isMac && shortcut.platform === 'windows')
  )

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="keyboard-shortcuts-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-in fade-in duration-200"
      onClick={handleOverlayClick}
    >
      {/* Glass overlay - matches command palette */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Glass dialog - matches command palette design */}
      <div className="relative w-full max-w-2xl bg-white/90 backdrop-blur-xl dark:bg-neutral-900/90 rounded-2xl shadow-2xl border border-white/20 dark:border-white/5 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-neutral-200/50 dark:border-neutral-800/50">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent-500/10 text-accent-700 dark:text-accent-300">
            <Keyboard className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h2
              id="keyboard-shortcuts-title"
              className="text-lg font-semibold text-neutral-900 dark:text-neutral-100"
            >
              Tastenkürzel
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Häufig verwendete Tastenkombinationen
            </p>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700">
            ESC
          </kbd>
        </div>

        {/* Shortcuts Grid - 2 columns on desktop, 1 on mobile */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleShortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg bg-neutral-50/50 dark:bg-neutral-800/30 border border-neutral-200/50 dark:border-neutral-700/50 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-colors"
              >
                {/* Keyboard keys */}
                <div className="flex items-center gap-1.5">
                  {shortcut.keys.map((key, keyIndex) => (
                    <span key={keyIndex} className="flex items-center gap-1.5">
                      <kbd className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1.5 text-sm font-semibold text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 rounded-md border border-neutral-300 dark:border-neutral-700 shadow-sm">
                        {key}
                      </kbd>
                      {/* Show + between keys, but not after the last key */}
                      {keyIndex < shortcut.keys.length - 1 && (
                        <span className="text-neutral-400 dark:text-neutral-500 text-sm font-medium">
                          +
                        </span>
                      )}
                    </span>
                  ))}
                </div>

                {/* Description */}
                <span className="text-sm text-neutral-600 dark:text-neutral-400 text-right flex-shrink-0">
                  {shortcut.description}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-6 py-3 text-xs text-neutral-500 dark:text-neutral-400 border-t border-neutral-200/50 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-900/50">
          <span>
            Drücken Sie{' '}
            <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700">
              ?
            </kbd>{' '}
            um diese Übersicht zu öffnen
          </span>
          <span className="hidden sm:inline">
            <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700">
              ESC
            </kbd>{' '}
            zum Schließen
          </span>
        </div>
      </div>
    </div>
  )
}
