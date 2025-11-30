'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { globalSearchAction, getSearchSuggestions } from '@/lib/actions/global-search'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X, Clock, Zap } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface SearchResult {
  id: string
  type: 'expense' | 'therapy' | 'document'
  title: string
  description?: string
  date?: string
  amount?: number
  category?: string
}

interface SearchSuggestion {
  text: string
  type: 'history' | 'category' | 'therapy'
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const debouncedQuery = useDebounce(query, 300)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem('search-history')
    if (history) {
      setSearchHistory(JSON.parse(history))
    }
  }, [])

  // Keyboard shortcut: Cmd+K or Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
        setTimeout(() => inputRef.current?.focus(), 0)
      }

      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        setQuery('')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

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

  // Perform search when debounced query changes
  const performSearch = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await globalSearchAction(debouncedQuery)
      if (data.error) {
        toast.error(data.error)
        setResults([])
      } else if (data.data) {
        setResults(data.data)
      }
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Suchanfrage fehlgeschlagen')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [debouncedQuery])

  useEffect(() => {
    if (debouncedQuery.trim()) {
      performSearch()
    } else {
      setResults([])
      loadSuggestions()
    }
  }, [debouncedQuery, performSearch])

  const loadSuggestions = async () => {
    try {
      const data = await getSearchSuggestions()
      if (data.data) {
        setSuggestions(data.data)
      }
    } catch (error) {
      console.error('Suggestions error:', error)
    }
  }

  const handleSelectSuggestion = (text: string) => {
    setQuery(text)
    // Save to history
    const updated = [text, ...searchHistory.filter(h => h !== text)].slice(0, 10)
    setSearchHistory(updated)
    localStorage.setItem('search-history', JSON.stringify(updated))
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setSuggestions([])
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'expense':
        return '💰'
      case 'therapy':
        return '💅'
      case 'document':
        return '📄'
      default:
        return '📎'
    }
  }

  const getResultPath = (result: SearchResult) => {
    switch (result.type) {
      case 'expense':
        return `/dashboard/ausgaben?id=${result.id}`
      case 'therapy':
        return `/dashboard/therapien?id=${result.id}`
      case 'document':
        return `/dashboard/dokumente?id=${result.id}`
      default:
        return '#'
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Suche... (Cmd+K)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-10"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto dark:bg-gray-900 dark:border-gray-700">
          {isLoading && (
            <div className="px-4 py-8 text-center text-gray-500">
              <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
              <p className="mt-2 text-sm">Wird gesucht...</p>
            </div>
          )}

          {!isLoading && query && results.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500">
              <p className="text-sm">Keine Ergebnisse gefunden für &quot;{query}&quot;</p>
            </div>
          )}

          {/* Results */}
          {!isLoading && query && results.length > 0 && (
            <>
              <div className="border-b border-gray-200 dark:border-gray-700 px-2 py-2">
                <p className="text-xs font-semibold text-gray-500 px-2 py-1">
                  {results.length} Ergebnis{results.length !== 1 ? 'se' : ''}
                </p>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {results.map((result) => (
                  <Link
                    key={`${result.type}-${result.id}`}
                    href={getResultPath(result)}
                    onClick={() => {
                      setIsOpen(false)
                      handleSelectSuggestion(query)
                    }}
                    className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg mt-1">{getResultIcon(result.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                          {result.title}
                        </p>
                        {result.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {result.description}
                          </p>
                        )}
                        <div className="flex gap-2 mt-1">
                          {result.category && (
                            <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                              {result.category}
                            </span>
                          )}
                          {result.date && (
                            <span className="text-xs text-gray-500">
                              {new Date(result.date).toLocaleDateString('de-DE')}
                            </span>
                          )}
                          {result.amount && (
                            <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                              €{result.amount.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* Suggestions (when no query) */}
          {!isLoading && !query && suggestions.length > 0 && (
            <>
              <div className="border-b border-gray-200 dark:border-gray-700 px-2 py-2">
                <p className="text-xs font-semibold text-gray-500 px-2 py-1 flex items-center gap-1">
                  <Zap className="h-3 w-3" /> Vorschläge
                </p>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {suggestions.slice(0, 5).map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      handleSelectSuggestion(suggestion.text)
                      setQuery(suggestion.text)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm text-gray-700 dark:text-gray-300"
                  >
                    {suggestion.type === 'history' && <Clock className="inline mr-2 h-3 w-3" />}
                    {suggestion.text}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Search History */}
          {!isLoading && !query && searchHistory.length > 0 && (
            <>
              <div className="border-b border-gray-200 dark:border-gray-700 px-2 py-2">
                <p className="text-xs font-semibold text-gray-500 px-2 py-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Suchverlauf
                </p>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {searchHistory.slice(0, 5).map((item, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectSuggestion(item)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm text-gray-700 dark:text-gray-300"
                  >
                    <Clock className="inline mr-2 h-3 w-3" />
                    {item}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
