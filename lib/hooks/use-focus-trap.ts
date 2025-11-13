import { useEffect, useRef } from 'react'

/**
 * Hook for implementing focus traps in modals, dialogs, and other overlays
 *
 * A focus trap keeps keyboard focus within a specific element (e.g., a modal)
 * preventing users from accidentally interacting with elements behind it.
 *
 * Features:
 * - Traps focus within the provided element
 * - Handles Tab/Shift+Tab to cycle through focusable elements
 * - Automatically restores focus to the previously focused element when trap closes
 * - Supports disabling the trap
 *
 * @param enabled Whether the focus trap is active
 * @returns Ref to attach to the container element
 */
export function useFocusTrap(enabled = true) {
  const containerRef = useRef<HTMLDivElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!enabled || !containerRef.current) return

    // Store the previously focused element
    previouslyFocusedRef.current = document.activeElement as HTMLElement

    // Query for all focusable elements
    const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    if (focusableElements.length === 0) return

    const firstFocusableElement = focusableElements[0]
    const lastFocusableElement = focusableElements[focusableElements.length - 1]

    // Focus the first focusable element
    firstFocusableElement.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle Tab key
      if (event.key !== 'Tab') return

      // If Shift+Tab is pressed on the first element, focus the last element
      if (event.shiftKey) {
        if (document.activeElement === firstFocusableElement) {
          event.preventDefault()
          lastFocusableElement.focus()
        }
      }
      // If Tab is pressed on the last element, focus the first element
      else {
        if (document.activeElement === lastFocusableElement) {
          event.preventDefault()
          firstFocusableElement.focus()
        }
      }
    }

    containerRef.current?.addEventListener('keydown', handleKeyDown)

    return () => {
      containerRef.current?.removeEventListener('keydown', handleKeyDown)
      // Restore focus to the previously focused element
      if (previouslyFocusedRef.current && previouslyFocusedRef.current !== document.activeElement) {
        previouslyFocusedRef.current.focus()
      }
    }
  }, [enabled])

  return containerRef
}
