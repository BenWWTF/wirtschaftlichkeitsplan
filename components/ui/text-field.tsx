'use client'

import React, { useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { CheckCircle2, AlertCircle } from 'lucide-react'

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helperText?: string
  error?: string
  required?: boolean
  prefix?: string
  suffix?: string
  description?: string
  isDirty?: boolean
  isTouched?: boolean
  isValidating?: boolean
  onRealtimeValidation?: (value: string) => void | Promise<void>
}

/**
 * TextField Component
 *
 * A reusable text input field with label, helper text, and error support.
 *
 * @example
 * ```tsx
 * <TextField
 *   label="Email"
 *   placeholder="user@example.com"
 *   type="email"
 *   helperText="Enter your email address"
 *   error={formErrors.email}
 *   required
 * />
 * ```
 */
export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
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
      isDirty = false,
      isTouched = false,
      isValidating = false,
      onRealtimeValidation,
      onChange,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [isValidatingLocal, setIsValidatingLocal] = useState(false)

    const handleChange = useCallback(
      async (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange?.(e)

        if (onRealtimeValidation) {
          setIsValidatingLocal(true)
          try {
            await onRealtimeValidation(e.target.value)
          } finally {
            setIsValidatingLocal(false)
          }
        }
      },
      [onChange, onRealtimeValidation]
    )

    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        onBlur?.(e)
      },
      [onBlur]
    )

    const isValidatingState = isValidating || isValidatingLocal
    const showValidationIcon = isTouched && isDirty && !isValidatingState
    const hasError = error && isTouched
    const isValid = isDirty && isTouched && !error && !isValidatingState

    return (
      <div className="space-y-2 w-full">
        {label && (
          <Label
            htmlFor={props.id || props.name}
            className={cn(hasError && 'text-red-600')}
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
            disabled={disabled}
            className={cn(
              hasError && 'border-red-600 focus-visible:ring-red-600',
              isValid && 'border-green-500 focus-visible:ring-green-500',
              prefix && 'pl-8',
              suffix && 'pr-8',
              showValidationIcon && 'pr-10',
              className
            )}
            onChange={handleChange}
            onBlur={handleBlur}
            {...props}
          />

          {suffix && !showValidationIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm pointer-events-none">
              {suffix}
            </span>
          )}

          {/* Validation Icons */}
          {showValidationIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
              {isValid ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : hasError ? (
                <AlertCircle className="h-5 w-5 text-red-600" />
              ) : null}
            </div>
          )}

          {/* Loading indicator */}
          {isValidatingState && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-5 w-5 border-2 border-neutral-300 border-t-blue-500 rounded-full animate-spin" />
            </div>
          )}
        </div>

        {hasError && (
          <p className="text-sm text-red-600 font-medium flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
        )}

        {isValid && !error && (
          <p className="text-sm text-green-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            Looks good
          </p>
        )}

        {helperText && !error && !isValid && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {helperText}
          </p>
        )}

        {description && !error && !helperText && !isValid && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {description}
          </p>
        )}
      </div>
    )
  }
)

TextField.displayName = 'TextField'
