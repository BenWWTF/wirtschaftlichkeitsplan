'use client'

import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useInView } from '@/hooks/useInView'

interface AnimatedSectionProps {
  children: ReactNode
  delay?: number
  animation?: 'fade-up' | 'fade-in' | 'scale-in' | 'slide-left' | 'slide-right'
  className?: string
}

export function AnimatedSection({
  children,
  delay = 0,
  animation = 'fade-up',
  className,
}: AnimatedSectionProps) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.1, once: true })

  const hiddenClasses: Record<string, string> = {
    'fade-up': 'translate-y-4 opacity-0',
    'fade-in': 'opacity-0',
    'scale-in': 'scale-95 opacity-0',
    'slide-left': '-translate-x-6 opacity-0',
    'slide-right': 'translate-x-6 opacity-0',
  }

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-out',
        inView ? 'translate-y-0 translate-x-0 scale-100 opacity-100' : hiddenClasses[animation],
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

interface StaggeredChildrenProps {
  children: ReactNode[]
  staggerDelay?: number
  initialDelay?: number
  animation?: AnimatedSectionProps['animation']
  className?: string
  childClassName?: string
}

export function StaggeredChildren({
  children,
  staggerDelay = 75,
  initialDelay = 0,
  animation = 'fade-up',
  className,
  childClassName,
}: StaggeredChildrenProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <AnimatedSection
          key={index}
          delay={initialDelay + index * staggerDelay}
          animation={animation}
          className={childClassName}
        >
          {child}
        </AnimatedSection>
      ))}
    </div>
  )
}
