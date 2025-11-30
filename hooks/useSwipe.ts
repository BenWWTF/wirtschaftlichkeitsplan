import { useEffect, useRef, useState } from 'react'

export interface SwipeConfig {
  /**
   * Minimum distance in pixels to trigger a swipe (default: 50)
   */
  threshold?: number

  /**
   * Minimum velocity in pixels/ms to trigger a swipe (default: 0.3)
   */
  velocity?: number

  /**
   * Maximum time in ms for a swipe gesture (default: 300)
   */
  maxTime?: number

  /**
   * Callback when swipe left is detected
   */
  onSwipeLeft?: () => void

  /**
   * Callback when swipe right is detected
   */
  onSwipeRight?: () => void

  /**
   * Callback when swipe up is detected
   */
  onSwipeUp?: () => void

  /**
   * Callback when swipe down is detected
   */
  onSwipeDown?: () => void

  /**
   * Whether to prevent default touch behavior
   */
  preventDefault?: boolean
}

interface TouchPoint {
  x: number
  y: number
  time: number
}

/**
 * Custom hook for detecting swipe gestures on touch devices
 *
 * @param config - Configuration object with swipe callbacks and thresholds
 * @returns ref - Attach this ref to the element you want to detect swipes on
 *
 * @example
 * ```tsx
 * const swipeRef = useSwipe({
 *   onSwipeLeft: () => console.log('Swiped left'),
 *   onSwipeRight: () => console.log('Swiped right'),
 *   threshold: 50,
 * })
 *
 * return <div ref={swipeRef}>Swipe me!</div>
 * ```
 */
export function useSwipe<T extends HTMLElement = HTMLElement>(
  config: SwipeConfig = {}
) {
  const {
    threshold = 50,
    velocity = 0.3,
    maxTime = 300,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    preventDefault = false,
  } = config

  const ref = useRef<T>(null)
  const startPoint = useRef<TouchPoint | null>(null)
  const [isSwiping, setIsSwiping] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const handleTouchStart = (e: TouchEvent) => {
      if (preventDefault) {
        e.preventDefault()
      }

      const touch = e.touches[0]
      startPoint.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      }
      setIsSwiping(true)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (preventDefault && startPoint.current) {
        e.preventDefault()
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!startPoint.current) return

      const touch = e.changedTouches[0]
      const endPoint: TouchPoint = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      }

      const deltaX = endPoint.x - startPoint.current.x
      const deltaY = endPoint.y - startPoint.current.y
      const deltaTime = endPoint.time - startPoint.current.time

      // Calculate absolute distances
      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)

      // Calculate velocity (pixels per millisecond)
      const velocityX = absX / deltaTime
      const velocityY = absY / deltaTime

      // Check if swipe meets threshold and time requirements
      const isValidSwipe = deltaTime <= maxTime

      if (isValidSwipe) {
        // Horizontal swipe
        if (absX > absY && absX > threshold && velocityX > velocity) {
          if (deltaX > 0) {
            // Swipe right
            onSwipeRight?.()

            // Trigger haptic feedback on iOS if available
            if ('vibrate' in navigator) {
              navigator.vibrate(10)
            }
          } else {
            // Swipe left
            onSwipeLeft?.()

            // Trigger haptic feedback on iOS if available
            if ('vibrate' in navigator) {
              navigator.vibrate(10)
            }
          }
        }
        // Vertical swipe
        else if (absY > absX && absY > threshold && velocityY > velocity) {
          if (deltaY > 0) {
            // Swipe down
            onSwipeDown?.()

            // Trigger haptic feedback on iOS if available
            if ('vibrate' in navigator) {
              navigator.vibrate(10)
            }
          } else {
            // Swipe up
            onSwipeUp?.()

            // Trigger haptic feedback on iOS if available
            if ('vibrate' in navigator) {
              navigator.vibrate(10)
            }
          }
        }
      }

      // Reset
      startPoint.current = null
      setIsSwiping(false)
    }

    const handleTouchCancel = () => {
      startPoint.current = null
      setIsSwiping(false)
    }

    // Add event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: !preventDefault })
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefault })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })
    element.addEventListener('touchcancel', handleTouchCancel, { passive: true })

    // Cleanup
    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchcancel', handleTouchCancel)
    }
  }, [
    threshold,
    velocity,
    maxTime,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    preventDefault,
  ])

  return { ref, isSwiping }
}
