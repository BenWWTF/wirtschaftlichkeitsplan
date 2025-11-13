'use client'

import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface SelectOption {
  value: string
  label: string
}

interface SelectFieldProps {
  label?: string
  placeholder?: string
  helperText?: string
  error?: string
  required?: boolean
  description?: string
  disabled?: boolean
  options: SelectOption[]
  value?: string
  onValueChange?: (value: string) => void
  name?: string
}

/**
 * SelectField Component
 *
 * A reusable select input field with label, helper text, and error support.
 *
 * @example
 * ```tsx
 * <SelectField
 *   label="Therapy Type"
 *   placeholder="Select a therapy"
 *   options={[
 *     { value: 'physio', label: 'Physiotherapy' },
 *     { value: 'logo', label: 'Speech Therapy' },
 *   ]}
 *   value={selected}
 *   onValueChange={setSelected}
 *   error={errors.type}
 *   required
 * />
 * ```
 */
export function SelectField({
  label,
  placeholder,
  helperText,
  error,
  required,
  description,
  disabled,
  options,
  value,
  onValueChange,
  name,
}: SelectFieldProps) {
  return (
    <div className="space-y-2 w-full">
      {label && (
        <Label
          htmlFor={name}
          className={cn(error && 'text-red-600')}
        >
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </Label>
      )}

      <Select value={value || ''} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger
          id={name}
          className={cn(
            error && 'border-red-600 focus-visible:ring-red-600'
          )}
        >
          <SelectValue placeholder={placeholder || 'Select an option'} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

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
