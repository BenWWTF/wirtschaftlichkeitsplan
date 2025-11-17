'use client'

import { useState, useEffect } from 'react'

/**
 * useMediaQuery Hook
 *
 * Detects if a media query matches the current viewport.
 * Useful for mobile detection, responsive rendering, and breakpoint-based logic.
 *
 * @param query - CSS media query string (e.g., '(max-width: 768px)')
 * @returns boolean - True if media query matches, false otherwise
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)')
 * if (isMobile) {
 *   return <MobileNav />
 * }
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)

    // Check if window is available (client-side only)
    if (typeof window === 'undefined') {
      return
    }

    // Create media query list
    const mediaQuery = window.matchMedia(query)

    // Set initial state
    setMatches(mediaQuery.matches)

    // Define listener function
    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches)
    }

    // Add listener using addEventListener (modern approach)
    mediaQuery.addEventListener('change', handleChange)

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [query])

  // Return false on server-side, actual value on client-side
  return isClient ? matches : false
}

/**
 * Common media query helper hooks for convenience
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)')
}

export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
}

export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)')
}
