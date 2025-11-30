import { useEffect, useRef } from 'react'

/**
 * Configuration for touch target enforcement
 */
export interface TouchTargetConfig {
  /**
   * Minimum width in pixels (default: 44)
   */
  minWidth?: number

  /**
   * Minimum height in pixels (default: 44)
   */
  minHeight?: number

  /**
   * Whether to log warnings when target is too small (default: true in development)
   */
  warn?: boolean
}

const DEFAULT_MIN_SIZE = 44 // Apple's recommended minimum touch target

/**
 * Custom hook to ensure an element meets minimum touch target size requirements
 *
 * This hook enforces WCAG 2.1 Success Criterion 2.5.5 (Target Size) which recommends
 * a minimum touch target size of 44x44 CSS pixels for better accessibility and mobile UX.
 *
 * @param config - Configuration object for touch target requirements
 * @returns ref - Attach this ref to the element you want to validate
 *
 * @example
 * ```tsx
 * const buttonRef = useTouchTarget({ minWidth: 48, minHeight: 48 })
 * return <button ref={buttonRef}>Click me</button>
 * ```
 */
export function useTouchTarget<T extends HTMLElement = HTMLElement>(
  config: TouchTargetConfig = {}
) {
  const {
    minWidth = DEFAULT_MIN_SIZE,
    minHeight = DEFAULT_MIN_SIZE,
    warn = process.env.NODE_ENV === 'development',
  } = config

  const ref = useRef<T>(null)

  useEffect(() => {
    if (!ref.current || !warn) return

    const element = ref.current
    const rect = element.getBoundingClientRect()

    const actualWidth = rect.width
    const actualHeight = rect.height

    // Check if element meets minimum size requirements
    if (actualWidth < minWidth || actualHeight < minHeight) {
      console.warn(
        `Touch target too small: ${actualWidth.toFixed(1)}x${actualHeight.toFixed(1)}px ` +
          `(minimum: ${minWidth}x${minHeight}px)`,
        element
      )

      // Provide helpful suggestions
      const suggestions: string[] = []
      if (actualWidth < minWidth) {
        suggestions.push(`- Add min-w-[${minWidth}px] or increase padding/width`)
      }
      if (actualHeight < minHeight) {
        suggestions.push(`- Add min-h-[${minHeight}px] or increase padding/height`)
      }

      if (suggestions.length > 0) {
        console.warn('Suggestions to fix:', suggestions.join('\n'))
      }
    }
  }, [minWidth, minHeight, warn])

  return ref
}

/**
 * Utility function to get touch target size classes for Tailwind CSS
 *
 * @param size - Desired minimum size ('sm' = 44px, 'md' = 48px, 'lg' = 56px)
 * @returns Tailwind CSS classes for minimum width and height
 *
 * @example
 * ```tsx
 * <button className={getTouchTargetClasses('md')}>Click me</button>
 * // Returns: "min-w-[48px] min-h-[48px]"
 * ```
 */
export function getTouchTargetClasses(size: 'sm' | 'md' | 'lg' = 'sm'): string {
  const sizes = {
    sm: 'min-w-[44px] min-h-[44px]',
    md: 'min-w-[48px] min-h-[48px]',
    lg: 'min-w-[56px] min-h-[56px]',
  }

  return sizes[size]
}

/**
 * Utility function to wrap content with touch-friendly padding
 *
 * Ensures the interactive area meets minimum touch target size while
 * allowing the visual content to remain smaller.
 *
 * @param size - Desired minimum touch target size
 * @returns Tailwind CSS padding classes
 *
 * @example
 * ```tsx
 * <button className={getTouchPadding('sm')}>
 *   <Icon className="w-4 h-4" />
 * </button>
 * // Adds sufficient padding to make the entire button 44x44px
 * ```
 */
export function getTouchPadding(size: 'sm' | 'md' | 'lg' = 'sm'): string {
  const padding = {
    sm: 'p-3', // 12px padding → 24px + content
    md: 'p-4', // 16px padding → 32px + content
    lg: 'p-5', // 20px padding → 40px + content
  }

  return padding[size]
}

/**
 * Hook to ensure touch targets are properly sized in lists or grids
 *
 * This is useful for ensuring list items, grid cells, or other repeating
 * interactive elements maintain proper touch target sizes.
 *
 * @param minGap - Minimum gap between touch targets in pixels (default: 8)
 * @returns CSS custom properties for layout
 *
 * @example
 * ```tsx
 * const listStyles = useTouchTargetLayout()
 * return (
 *   <div style={listStyles}>
 *     <button>Item 1</button>
 *     <button>Item 2</button>
 *   </div>
 * )
 * ```
 */
export function useTouchTargetLayout(minGap = 8) {
  return {
    '--touch-target-gap': `${minGap}px`,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: `var(--touch-target-gap)`,
  }
}
