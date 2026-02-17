'use client'

import { useState, useEffect, useRef, type RefObject } from 'react'

interface UseInViewOptions {
  /** IntersectionObserver threshold (default: 0.1) */
  threshold?: number
  /** Root margin (default: '0px') */
  rootMargin?: string
  /** Only trigger once (default: true) */
  once?: boolean
}

/**
 * Hook that detects when an element enters the viewport.
 * Returns a ref to attach and a boolean indicating visibility.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: UseInViewOptions = {}
): [RefObject<T | null>, boolean] {
  const { threshold = 0.1, rootMargin = '0px', once = true } = options
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          if (once) {
            observer.unobserve(element)
          }
        } else if (!once) {
          setInView(false)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [threshold, rootMargin, once])

  return [ref, inView]
}
