'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { Input } from '@/components/ui/input'
import { getFilterValueSuggestions } from '@/lib/actions/filtered-search'
import { Loader } from 'lucide-react'

interface FilterSuggestionsProps {
  field: string
  value: string
  onChange: (value: string) => void
  pageType: 'expenses' | 'therapies' | 'results'
  onSelect?: (value: string) => void
  placeholder?: string
}

export function FilterSuggestions({
  field,
  value,
  onChange,
  pageType,
  onSelect,
  placeholder = 'Wert eingeben...',
}: FilterSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const debouncedValue = useDebounce(value, 300)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Load suggestions when debounced value changes
  useEffect(() => {
    if (!debouncedValue.trim()) {
      setSuggestions([])
      return
    }

    const loadSuggestions = async () => {
      setIsLoading(true)
      try {
        const result = await getFilterValueSuggestions(
          field,
          debouncedValue,
          pageType
        )

        if (result.error) {
          setSuggestions([])
        } else if (result.data) {
          setSuggestions(result.data)
          setIsOpen(true)
        }
      } catch (error) {
        console.error('Error loading suggestions:', error)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }

    loadSuggestions()
  }, [debouncedValue, field, pageType])

  const handleSelectSuggestion = useCallback((selectedValue: string) => {
    onChange(selectedValue)
    onSelect?.(selectedValue)
    setIsOpen(false)
    setHighlightedIndex(-1)
  }, [onChange, onSelect])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen || suggestions.length === 0) {
        if (e.key === 'Enter') {
          e.preventDefault()
          onSelect?.(value)
        }
        return
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setHighlightedIndex(prev =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          )
          break

        case 'ArrowUp':
          e.preventDefault()
          setHighlightedIndex(prev =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          )
          break

        case 'Enter':
          e.preventDefault()
          if (highlightedIndex >= 0) {
            handleSelectSuggestion(suggestions[highlightedIndex])
          } else {
            onSelect?.(value)
          }
          break

        case 'Escape':
          e.preventDefault()
          setIsOpen(false)
          setHighlightedIndex(-1)
          break
      }
    },
    [isOpen, suggestions, highlightedIndex, value, handleSelectSuggestion, onSelect]
  )

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setIsOpen(true)
            setHighlightedIndex(-1)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => value.trim() && setIsOpen(true)}
          className="w-full"
        />

        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Loader className="h-4 w-4 animate-spin" />
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSelectSuggestion(suggestion)}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                index === highlightedIndex
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && !isLoading && value.trim() && suggestions.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
          Keine Vorschläge gefunden
        </div>
      )}
    </div>
  )
}
