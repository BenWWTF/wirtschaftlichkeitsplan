'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Home,
  Pill,
  Receipt,
  Calendar,
  CalendarRange,
  BarChart3,
  FileText,
  Calculator,
  Settings,
  Plus,
  Download,
  Camera,
  Search,
  LucideIcon,
} from 'lucide-react'

// Command definition types
interface Command {
  id: string
  label: string
  description: string
  icon: string
  group: string
  href?: string
  action?: string
}

interface CommandPaletteProps {
  onAction?: (action: string) => void
}

// Icon map for dynamic icon rendering
const ICON_MAP: Record<string, LucideIcon> = {
  Home,
  Pill,
  Receipt,
  Calendar,
  CalendarRange,
  BarChart3,
  FileText,
  Calculator,
  Settings,
  Plus,
  Download,
  Camera,
  Search,
}

// Available commands
const COMMANDS: Command[] = [
  // Navigation
  {
    id: 'nav-dashboard',
    label: 'Übersicht',
    description: 'Dashboard anzeigen',
    icon: 'Home',
    href: '/dashboard',
    group: 'Navigation',
  },
  {
    id: 'nav-therapien',
    label: 'Therapiearten / Honorarnoten',
    description: 'Therapien verwalten',
    icon: 'Pill',
    href: '/dashboard/therapien',
    group: 'Navigation',
  },
  {
    id: 'nav-ausgaben',
    label: 'Ausgaben',
    description: 'Ausgaben verwalten',
    icon: 'Receipt',
    href: '/dashboard/ausgaben',
    group: 'Navigation',
  },
  {
    id: 'nav-planung',
    label: 'Monatliche Planung',
    description: 'Monatsplanung bearbeiten',
    icon: 'Calendar',
    href: '/dashboard/planung',
    group: 'Navigation',
  },
  {
    id: 'nav-planung-jahr',
    label: 'Jährliche Planung',
    description: 'Jahresübersicht anzeigen',
    icon: 'CalendarRange',
    href: '/dashboard/planung-jaehrlich',
    group: 'Navigation',
  },
  {
    id: 'nav-ergebnisse',
    label: 'Ergebnisse',
    description: 'Monatsergebnisse anzeigen',
    icon: 'BarChart3',
    href: '/dashboard/ergebnisse',
    group: 'Navigation',
  },
  {
    id: 'nav-berichte',
    label: 'Geschäftsberichte',
    description: 'Berichte einsehen',
    icon: 'FileText',
    href: '/dashboard/berichte',
    group: 'Navigation',
  },
  {
    id: 'nav-steuer',
    label: 'Steuerprognose',
    description: 'Steuerberechnung aufrufen',
    icon: 'Calculator',
    href: '/dashboard/steuerprognose',
    group: 'Navigation',
  },
  {
    id: 'nav-settings',
    label: 'Einstellungen',
    description: 'Einstellungen ändern',
    icon: 'Settings',
    href: '/dashboard/einstellungen',
    group: 'Navigation',
  },
  // Actions
  {
    id: 'action-new-expense',
    label: 'Neue Ausgabe',
    description: 'Ausgabe schnell erfassen',
    icon: 'Plus',
    action: 'new-expense',
    group: 'Aktionen',
  },
  {
    id: 'action-export',
    label: 'Ausgaben exportieren',
    description: 'ZIP-Export erstellen',
    icon: 'Download',
    action: 'export',
    group: 'Aktionen',
  },
  {
    id: 'action-scan',
    label: 'Rechnung scannen',
    description: 'OCR Rechnungserkennung',
    icon: 'Camera',
    action: 'scan-bill',
    group: 'Aktionen',
  },
]

export function CommandPalette({ onAction }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Fuzzy search - filter commands by label and description
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return COMMANDS

    const searchTerm = query.toLowerCase().trim()
    return COMMANDS.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(searchTerm) ||
        cmd.description.toLowerCase().includes(searchTerm)
    )
  }, [query])

  // Group filtered commands
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {}
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.group]) {
        groups[cmd.group] = []
      }
      groups[cmd.group].push(cmd)
    })
    return groups
  }, [filteredCommands])

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [filteredCommands])

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Keyboard navigation within command palette
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        setQuery('')
        setSelectedIndex(0)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          handleSelect(filteredCommands[selectedIndex])
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filteredCommands, selectedIndex])

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && isOpen) {
      const selectedElement = listRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      )
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        })
      }
    }
  }, [selectedIndex, isOpen])

  const handleSelect = (command: Command) => {
    if (command.href) {
      router.push(command.href)
    } else if (command.action && onAction) {
      onAction(command.action)
    }

    // Close and reset
    setIsOpen(false)
    setQuery('')
    setSelectedIndex(0)
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false)
      setQuery('')
      setSelectedIndex(0)
    }
  }

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="command-palette-title"
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4 animate-in fade-in duration-200"
      onClick={handleOverlayClick}
    >
      {/* Glass overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Glass dialog */}
      <div className="relative w-full max-w-lg bg-white/90 backdrop-blur-xl dark:bg-neutral-900/90 dark:backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-white/5 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-200/50 dark:border-neutral-800/50">
          <Search className="w-5 h-5 text-neutral-400 dark:text-neutral-500 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suchen oder navigieren..."
            className="flex-1 bg-transparent border-none outline-none text-base text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
            aria-label="Suchen oder navigieren"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700">
            ESC
          </kbd>
        </div>

        {/* Results list */}
        <div
          ref={listRef}
          className="max-h-[400px] overflow-y-auto overscroll-contain"
        >
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-neutral-500 dark:text-neutral-400">
              Keine Ergebnisse gefunden
            </div>
          ) : (
            <div className="py-2">
              {Object.entries(groupedCommands).map(([group, commands]) => (
                <div key={group}>
                  {/* Group header */}
                  <div className="px-4 py-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    {group}
                  </div>

                  {/* Group commands */}
                  {commands.map((command, index) => {
                    const globalIndex = filteredCommands.indexOf(command)
                    const isSelected = globalIndex === selectedIndex
                    const Icon = ICON_MAP[command.icon]

                    return (
                      <button
                        key={command.id}
                        data-index={globalIndex}
                        onClick={() => handleSelect(command)}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                          isSelected
                            ? 'bg-accent-500/10 text-neutral-900 dark:text-neutral-100'
                            : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50'
                        }`}
                      >
                        {/* Icon */}
                        {Icon && (
                          <div
                            className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                              isSelected
                                ? 'bg-accent-500/20 text-accent-700 dark:text-accent-300'
                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                        )}

                        {/* Label and description */}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {command.label}
                          </div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                            {command.description}
                          </div>
                        </div>

                        {/* Keyboard hint for selected item */}
                        {isSelected && (
                          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700">
                            ↵
                          </kbd>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center justify-between gap-2 px-4 py-2 text-xs text-neutral-500 dark:text-neutral-400 border-t border-neutral-200/50 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline">
              <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700">
                ↑↓
              </kbd>{' '}
              navigieren
            </span>
            <span className="hidden sm:inline">
              <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700">
                ↵
              </kbd>{' '}
              auswählen
            </span>
          </div>
          <span className="hidden sm:inline">
            <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700">
              ESC
            </kbd>{' '}
            schließen
          </span>
        </div>
      </div>
    </div>
  )
}
