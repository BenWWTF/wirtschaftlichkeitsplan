'use client'

import { useEffect, useState } from 'react'

/**
 * useMediaQuery Hook
 *
 * Detects media query matches and updates in real-time
 * Includes debouncing to avoid excessive re-renders on resize
 *
 * @param query - CSS media query string (e.g., '(max-width: 768px)')
 * @returns Boolean indicating if the media query matches
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)')
 * const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)')
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    // Create media query list
    const mediaQueryList = window.matchMedia(query)

    // Set initial value
    setMatches(mediaQueryList.matches)

    // Debounce handler to avoid excessive re-renders
    let debounceTimer: NodeJS.Timeout | null = null

    const handleChange = (e: MediaQueryListEvent) => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }

      debounceTimer = setTimeout(() => {
        setMatches(e.matches)
      }, 50) // 50ms debounce
    }

    // Add listener
    mediaQueryList.addEventListener('change', handleChange)

    return () => {
      mediaQueryList.removeEventListener('change', handleChange)
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    }
  }, [query, isClient])

  return matches
}
