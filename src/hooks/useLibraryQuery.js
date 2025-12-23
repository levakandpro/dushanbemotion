// ============================================================================
// D MOTION - ХУК ДЛЯ БИБЛИОТЕКИ С ПРЕДОХРАНИТЕЛЯМИ
// ============================================================================

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  fetchLibraryPage,
  createDebouncedSearch,
  viewsBatcher,
  pagesCache,
  getSessionSeed
} from '../lib/performanceGuards'
import { supabase } from '../lib/supabaseClient'

/**
 * Хук для загрузки библиотеки с keyset-пагинацией и всеми предохранителями
 * 
 * @param {string} table - имя таблицы/view
 * @param {object} options - опции
 */
export function useLibraryQuery(table, options = {}) {
  const {
    select = '*',
    pageSize = 24,
    filters = {},
    shuffle = false,
    enabled = true,
    cacheEnabled = true
  } = options

  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  
  const cursorRef = useRef(null)
  const filtersRef = useRef(filters)
  const abortControllerRef = useRef(null)

  // Сброс при изменении фильтров
  useEffect(() => {
    if (JSON.stringify(filters) !== JSON.stringify(filtersRef.current)) {
      filtersRef.current = filters
      cursorRef.current = null
      setItems([])
      setHasMore(true)
      setError(null)
    }
  }, [filters])

  /**
   * Загрузка первой страницы
   */
  const loadInitial = useCallback(async () => {
    if (!enabled) return

    // Отменяем предыдущий запрос
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setIsLoading(true)
    setError(null)
    cursorRef.current = null

    try {
      const data = await fetchLibraryPage(table, {
        select,
        pageSize,
        cursor: null,
        filters: filtersRef.current,
        shuffle,
        cacheEnabled
      })

      if (data) {
        setItems(data)
        setHasMore(data.length === pageSize)
        
        // Обновляем курсор
        if (data.length > 0) {
          const lastItem = data[data.length - 1]
          cursorRef.current = {
            lastCreatedAt: lastItem.created_at,
            lastId: lastItem.id
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message)
      }
    } finally {
      setIsLoading(false)
    }
  }, [table, select, pageSize, shuffle, enabled, cacheEnabled])

  /**
   * Загрузка следующей страницы (infinite scroll)
   */
  const loadMore = useCallback(async () => {
    if (!enabled || !hasMore || isLoadingMore || isLoading) return

    setIsLoadingMore(true)

    try {
      const data = await fetchLibraryPage(table, {
        select,
        pageSize,
        cursor: cursorRef.current,
        filters: filtersRef.current,
        shuffle,
        cacheEnabled
      })

      if (data && data.length > 0) {
        setItems(prev => [...prev, ...data])
        setHasMore(data.length === pageSize)
        
        // Обновляем курсор
        const lastItem = data[data.length - 1]
        cursorRef.current = {
          lastCreatedAt: lastItem.created_at,
          lastId: lastItem.id
        }
      } else {
        setHasMore(false)
      }
    } catch (err) {
      if (err.message?.includes('Rate limit')) {
        // Тихо игнорируем rate limit при скролле
        console.warn('Rate limit hit, waiting...')
      } else {
        setError(err.message)
      }
    } finally {
      setIsLoadingMore(false)
    }
  }, [table, select, pageSize, shuffle, enabled, hasMore, isLoadingMore, isLoading, cacheEnabled])

  /**
   * Обновление (pull-to-refresh)
   */
  const refresh = useCallback(() => {
    pagesCache.invalidate(table)
    return loadInitial()
  }, [table, loadInitial])

  // Загружаем при монтировании
  useEffect(() => {
    if (enabled) {
      loadInitial()
    }
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [enabled, loadInitial])

  return {
    items,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
    // Утилиты
    trackView: (itemId) => viewsBatcher.trackView(itemId),
    sessionSeed: getSessionSeed()
  }
}

/**
 * Хук для поиска с дебаунсом
 */
export function useLibrarySearch(table, options = {}) {
  const {
    select = '*',
    searchField = 'title',
    pageSize = 24,
    debounceMs = 400
  } = options

  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState(null)

  const debouncedSearchRef = useRef(null)

  // Создаём дебаунс-функцию один раз
  useEffect(() => {
    debouncedSearchRef.current = createDebouncedSearch(async (searchQuery, signal) => {
      if (!searchQuery || searchQuery.length < 2) {
        return []
      }

      const { data, error } = await supabase
        .from(table)
        .select(select)
        .ilike(searchField, `%${searchQuery}%`)
        .limit(pageSize)

      if (error) throw error
      return data || []
    }, debounceMs)
  }, [table, select, searchField, pageSize, debounceMs])

  /**
   * Обработчик изменения поиска
   */
  const handleSearch = useCallback(async (newQuery) => {
    setQuery(newQuery)
    
    if (!newQuery || newQuery.length < 2) {
      setResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    setError(null)

    try {
      const data = await debouncedSearchRef.current(newQuery)
      if (data !== null) {
        setResults(data)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSearching(false)
    }
  }, [])

  /**
   * Очистка поиска
   */
  const clearSearch = useCallback(() => {
    setQuery('')
    setResults([])
    setError(null)
  }, [])

  return {
    query,
    results,
    isSearching,
    error,
    handleSearch,
    clearSearch
  }
}

/**
 * Хук для отслеживания просмотров
 */
export function useViewTracker() {
  const trackedRef = useRef(new Set())

  /**
   * Отслеживает просмотр элемента (один раз за сессию)
   */
  const trackView = useCallback((itemId) => {
    if (!itemId || trackedRef.current.has(itemId)) return
    
    trackedRef.current.add(itemId)
    viewsBatcher.trackView(itemId)
  }, [])

  /**
   * Отслеживает просмотр при появлении в viewport
   */
  const createViewObserver = useCallback((itemId) => {
    return (node) => {
      if (!node) return

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              trackView(itemId)
              observer.disconnect()
            }
          })
        },
        { threshold: 0.5 }
      )

      observer.observe(node)
      return () => observer.disconnect()
    }
  }, [trackView])

  return {
    trackView,
    createViewObserver
  }
}

export default {
  useLibraryQuery,
  useLibrarySearch,
  useViewTracker
}
