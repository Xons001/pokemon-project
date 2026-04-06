'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchPokemonCatalog, fetchPokemonDetail } from '../lib/api'
import { useI18n } from '../components/i18n/LanguageProvider'
import {
  DESKTOP_PAGE_SIZE,
  INITIAL_SELECTED_SLUG,
  createCatalogPokemon,
  getResponsivePageSize,
  localizePokemonDetail,
  quickSuggestions,
} from '../lib/pokemon'

const catalogPageCache = new Map()
const catalogPageRequestCache = new Map()
const pokemonDetailCache = new Map()
const pokemonDetailRequestCache = new Map()

function buildCatalogRequestKey(query, page, pageSize) {
  return `${query.trim().toLowerCase()}::${page}::${pageSize}`
}

function getCachedCatalogPage(query, page, pageSize) {
  const requestKey = buildCatalogRequestKey(query, page, pageSize)
  return catalogPageCache.get(requestKey) ?? null
}

async function loadCatalogPage(query, page, pageSize) {
  const requestKey = buildCatalogRequestKey(query, page, pageSize)
  const cachedPayload = catalogPageCache.get(requestKey)

  if (cachedPayload) {
    return cachedPayload
  }

  const inFlightRequest = catalogPageRequestCache.get(requestKey)

  if (inFlightRequest) {
    return inFlightRequest
  }

  const request = fetchPokemonCatalog(query, {
    page,
    pageSize,
  })
    .then((payload) => {
      catalogPageCache.set(requestKey, payload)
      return payload
    })
    .finally(() => {
      catalogPageRequestCache.delete(requestKey)
    })

  catalogPageRequestCache.set(requestKey, request)

  return request
}

function getCachedPokemonDetail(slug) {
  return pokemonDetailCache.get(slug) ?? null
}

async function loadCachedPokemonDetail(slug) {
  const cachedPayload = pokemonDetailCache.get(slug)

  if (cachedPayload) {
    return cachedPayload
  }

  const inFlightRequest = pokemonDetailRequestCache.get(slug)

  if (inFlightRequest) {
    return inFlightRequest
  }

  const request = fetchPokemonDetail(slug)
    .then((payload) => {
      pokemonDetailCache.set(slug, payload)
      return payload
    })
    .finally(() => {
      pokemonDetailRequestCache.delete(slug)
    })

  pokemonDetailRequestCache.set(slug, request)

  return request
}

export function usePokemonCatalog() {
  const { locale, t } = useI18n()
  const [query, setQueryValue] = useState('')
  const [selectedSlug, setSelectedSlug] = useState(INITIAL_SELECTED_SLUG)
  const [currentPage, setCurrentPage] = useState(1)
  const [catalogPage, setCatalogPage] = useState([])
  const [catalogCount, setCatalogCount] = useState(0)
  const [filteredCount, setFilteredCount] = useState(0)
  const [pageSize, setPageSize] = useState(null)
  const [isCatalogLoading, setIsCatalogLoading] = useState(true)
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [detailCache, setDetailCache] = useState({})
  const previousPageSizeRef = useRef(pageSize)
  const isInitialCatalogLoadRef = useRef(true)

  useEffect(() => {
    if (typeof window === 'undefined') return

    function syncPageSize() {
      const nextPageSize = getResponsivePageSize(window.innerWidth)
      setPageSize((previousPageSize) => (previousPageSize === nextPageSize ? previousPageSize : nextPageSize))
    }

    syncPageSize()
    window.addEventListener('resize', syncPageSize)

    return () => {
      window.removeEventListener('resize', syncPageSize)
    }
  }, [])

  useEffect(() => {
    if (!pageSize) {
      return
    }

    let isMounted = true
    const isInitialLoad = isInitialCatalogLoadRef.current
    const hasCachedCatalog = Boolean(getCachedCatalogPage(query, currentPage, pageSize))

    if (!isInitialLoad && !hasCachedCatalog) {
      setIsPageLoading(true)
    }

    async function loadCatalog() {
      try {
        const catalogData = await loadCatalogPage(query, currentPage, pageSize)
        if (!isMounted) return

        setCatalogPage(Array.isArray(catalogData.items) ? catalogData.items : [])
        setCatalogCount(Number(catalogData.catalogTotal ?? catalogData.total ?? 0))
        setFilteredCount(Number(catalogData.total ?? 0))
        setLoadError('')
      } catch {
        if (!isMounted) return
        setLoadError(t('team.errors.loadCatalog'))
      } finally {
        if (isMounted) {
          isInitialCatalogLoadRef.current = false
          setIsCatalogLoading(false)
          setIsPageLoading(false)
        }
      }
    }

    loadCatalog()

    return () => {
      isMounted = false
    }
  }, [currentPage, pageSize, query, t])

  const effectivePageSize = pageSize ?? DESKTOP_PAGE_SIZE
  const totalPages = Math.max(1, Math.ceil(filteredCount / effectivePageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)

  useEffect(() => {
    if (!pageSize) {
      return
    }

    if (previousPageSizeRef.current === pageSize) {
      return
    }

    previousPageSizeRef.current = pageSize
    setCurrentPage((previous) => Math.min(previous, Math.max(1, Math.ceil(filteredCount / pageSize))))
  }, [filteredCount, pageSize])

  useEffect(() => {
    if (!catalogPage.length) return

    if (!catalogPage.some((entry) => entry.slug === selectedSlug)) {
      setSelectedSlug(catalogPage[0].slug)
    }
  }, [catalogPage, selectedSlug, t])

  useEffect(() => {
    if (!selectedSlug || detailCache[selectedSlug]) {
      return
    }

    const cachedDetail = getCachedPokemonDetail(selectedSlug)

    if (cachedDetail) {
      setDetailCache((previous) => {
        if (previous[selectedSlug]) {
          return previous
        }

        return {
          ...previous,
          [selectedSlug]: cachedDetail,
        }
      })
      return
    }

    let isMounted = true

    async function syncPokemonDetail() {
      try {
        const payload = await loadCachedPokemonDetail(selectedSlug)
        if (!isMounted) return

        setDetailCache((previous) => ({
          ...previous,
          [selectedSlug]: payload,
        }))
      } catch {
        if (!isMounted) return
      }
    }

    syncPokemonDetail()

    return () => {
      isMounted = false
    }
  }, [detailCache, selectedSlug])

  const displayedPokemon = useMemo(() => {
    return catalogPage.map((entry) => createCatalogPokemon(entry, locale))
  }, [catalogPage, locale])

  const selectedEntry = useMemo(() => {
    return catalogPage.find((entry) => entry.slug === selectedSlug) ?? catalogPage[0] ?? null
  }, [catalogPage, selectedSlug])

  const selectedPokemon = selectedSlug
    ? (detailCache[selectedSlug] ? localizePokemonDetail(detailCache[selectedSlug], locale) : null) ??
      (getCachedPokemonDetail(selectedSlug) ? localizePokemonDetail(getCachedPokemonDetail(selectedSlug), locale) : null) ??
      (selectedEntry ? createCatalogPokemon(selectedEntry, locale) : null)
    : null

  function selectPokemon(slug) {
    setSelectedSlug(slug)
  }

  function setQuery(value) {
    setCurrentPage(1)
    setQueryValue(value)
  }

  function moveToPage(page) {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages))
  }

  function searchFirstMatch() {
    if (!catalogPage.length) return false

    setSelectedSlug(catalogPage[0].slug)
    return true
  }

  function applySuggestion(value) {
    setQueryValue(value)
    setCurrentPage(1)
  }

  function pickRandomSuggestion() {
    const next = quickSuggestions[Math.floor(Math.random() * quickSuggestions.length)]
    setQueryValue(next)
    setCurrentPage(1)
    return next
  }

  return {
    catalogCount,
    currentPage: safeCurrentPage,
    displayedPokemon,
    filteredCount,
    isCatalogLoading,
    isPageLoading,
    loadError,
    query,
    selectedPokemon,
    totalPages,
    setQuery,
    selectPokemon,
    moveToPage,
    searchFirstMatch,
    applySuggestion,
    pickRandomSuggestion,
  }
}
