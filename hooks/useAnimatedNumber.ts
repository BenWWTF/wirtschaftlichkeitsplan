'use client'

import { useState, useEffect, useRef } from 'react'

interface UseAnimatedNumberOptions {
  /** Animation duration in ms (default: 800) */
  duration?: number
  /** Delay before starting in ms (default: 0) */
  delay?: number
  /** Decimal places (default: 2) */
  decimals?: number
  /** Whether to animate (default: true) */
  enabled?: boolean
}

/**
 * Hook that animates a number from its previous value to a new target.
 * Uses requestAnimationFrame for smooth 60fps animation with easeOutExpo.
 */
export function useAnimatedNumber(
  target: number,
  options: UseAnimatedNumberOptions = {}
) {
  const { duration = 800, delay = 0, decimals = 2, enabled = true } = options
  const [display, setDisplay] = useState(target)
  const prevRef = useRef(target)
  const frameRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const initialMount = useRef(true)

  useEffect(() => {
    if (!enabled) {
      setDisplay(target)
      prevRef.current = target
      return
    }

    const from = initialMount.current ? 0 : prevRef.current
    initialMount.current = false
    const to = target
    prevRef.current = target

    if (from === to) return

    const startAnimation = () => {
      startTimeRef.current = performance.now()

      const animate = (now: number) => {
        const elapsed = now - startTimeRef.current
        const progress = Math.min(elapsed / duration, 1)

        // easeOutExpo
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
        const current = from + (to - from) * eased

        setDisplay(Number(current.toFixed(decimals)))

        if (progress < 1) {
          frameRef.current = requestAnimationFrame(animate)
        }
      }

      frameRef.current = requestAnimationFrame(animate)
    }

    if (delay > 0) {
      const timeout = setTimeout(startAnimation, delay)
      return () => {
        clearTimeout(timeout)
        cancelAnimationFrame(frameRef.current)
      }
    } else {
      startAnimation()
    }

    return () => {
      cancelAnimationFrame(frameRef.current)
    }
  }, [target, duration, delay, decimals, enabled])

  return display
}
