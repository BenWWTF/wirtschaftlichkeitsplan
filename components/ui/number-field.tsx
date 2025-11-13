'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface NumberFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  helperText?: string
  error?: string
  required?: boolean
  prefix?: string
  suffix?: string
  description?: string
  step?: number | string
  min?: number | string
  max?: number | string
}

/**
 * NumberField Component
 *
 * A specialized input for numeric values with validation and formatting.
 *
 * @example
 * ```tsx
 * <NumberField
 *   label="Price"
 *   placeholder="0.00"
 *   suffix="€"
 *   step={0.01}
 *   min={0}
 *   error={errors.price}
 *   required
 * />
 * ```
 */
export const NumberField = React.forwardRef<HTMLInputElement, NumberFieldProps>(
  (
    {
      label,
      helperText,
      error,
      required,
      prefix,
      suffix,
      description,
      className,
      disabled,
      step,
      min,
      max,
      ...props
    },
    ref
  ) => {
    return (
      <div className="space-y-2 w-full">
        {label && (
          <Label
            htmlFor={props.id || props.name}
            className={cn(error && 'text-red-600')}
          >
            {label}
            {required && <span className="text-red-600 ml-1">*</span>}
          </Label>
        )}

        <div className="relative">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm pointer-events-none">
              {prefix}
            </span>
          )}

          <Input
            ref={ref}
            type="number"
            step={step}
            min={min}
            max={max}
            disabled={disabled}
            className={cn(
              error && 'border-red-600 focus-visible:ring-red-600',
              prefix && 'pl-8',
              suffix && 'pr-8',
              className
            )}
            {...props}
          />

          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm pointer-events-none">
              {suffix}
            </span>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 font-medium">{error}</p>
        )}

        {helperText && !error && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {helperText}
          </p>
        )}

        {description && !error && !helperText && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {description}
          </p>
        )}
      </div>
    )
  }
)

NumberField.displayName = 'NumberField'
