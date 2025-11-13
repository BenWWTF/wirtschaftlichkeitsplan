import { useEffect } from 'react'

/**
 * Hook for handling keyboard navigation in data-heavy interfaces
 *
 * Provides standardized keyboard shortcuts:
 * - Arrow Up/Down: Navigate between items
 * - Enter/Space: Activate current item
 * - Escape: Cancel/Close
 * - Tab: Navigate through interactive elements
 *
 * @param onNavigate Callback when arrow keys are pressed (direction: 'up' | 'down')
 * @param onSelect Callback when Enter or Space is pressed
 * @param onCancel Callback when Escape is pressed
 * @param enabled Whether the hook is active (default: true)
 */
export function useKeyboardNavigation({
  onNavigate,
  onSelect,
  onCancel,
  enabled = true
}: {
  onNavigate?: (direction: 'up' | 'down') => void
  onSelect?: () => void
  onCancel?: () => void
  enabled?: boolean
}) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Arrow Up
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        onNavigate?.('up')
      }
      // Arrow Down
      else if (event.key === 'ArrowDown') {
        event.preventDefault()
        onNavigate?.('down')
      }
      // Enter or Space
      else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        onSelect?.()
      }
      // Escape
      else if (event.key === 'Escape') {
        event.preventDefault()
        onCancel?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onNavigate, onSelect, onCancel, enabled])
}
