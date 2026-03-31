'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchPokemonCatalog } from '../lib/api'
import {
  INITIAL_SELECTED_SLUG,
  createCatalogPokemon,
  formatAbility,
  formatDexNumber,
  getResponsivePageSize,
  quickSuggestions,
  translateType,
} from '../lib/pokemon'

export function usePokemonCatalog() {
  const [query, setQuery] = useState('')
  const [selectedSlug, setSelectedSlug] = useState(INITIAL_SELECTED_SLUG)
  const [currentPage, setCurrentPage] = useState(1)
  const [catalog, setCatalog] = useState([])
  const [pageSize, setPageSize] = useState(() => getResponsivePageSize(undefined))
  const [isCatalogLoading, setIsCatalogLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const previousPageSizeRef = useRef(pageSize)

  useEffect(() => {
    if (typeof window === 'undefined') return

    function syncPageSize() {
      setPageSize(getResponsivePageSize(window.innerWidth))
    }

    syncPageSize()
    window.addEventListener('resize', syncPageSize)

    return () => {
      window.removeEventListener('resize', syncPageSize)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadCatalog() {
      try {
        const catalogData = await fetchPokemonCatalog()
        if (!isMounted) return

        setCatalog(catalogData.items)
        setLoadError('')
      } catch (error) {
        if (!isMounted) return
        setLoadError('No se pudo cargar el catalogo desde la API interna.')
      } finally {
        if (isMounted) {
          setIsCatalogLoading(false)
        }
      }
    }

    loadCatalog()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredEntries = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return catalog

    return catalog.filter((entry) => {
      const haystack = [
        entry.label,
        entry.slug,
        formatDexNumber(entry.id),
        entry.primaryAbility,
        entry.primaryAbility ? formatAbility(entry.primaryAbility) : null,
        entry.primaryType,
        entry.secondaryType,
        entry.primaryType ? translateType(entry.primaryType) : null,
        entry.secondaryType ? translateType(entry.secondaryType) : null,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalized)
    })
  }, [catalog, query])

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const pageStart = (safeCurrentPage - 1) * pageSize
  const currentPageEntries = useMemo(() => {
    return filteredEntries.slice(pageStart, pageStart + pageSize)
  }, [filteredEntries, pageSize, pageStart])

  useEffect(() => {
    setCurrentPage(1)
  }, [query])

  useEffect(() => {
    if (previousPageSizeRef.current === pageSize) {
      return
    }

    previousPageSizeRef.current = pageSize

    if (!filteredEntries.length) return

    const selectedIndex = filteredEntries.findIndex((entry) => entry.slug === selectedSlug)

    if (selectedIndex === -1) {
      return
    }

    const pageForSelected = Math.floor(selectedIndex / pageSize) + 1
    setCurrentPage((previous) => (previous === pageForSelected ? previous : pageForSelected))
  }, [filteredEntries, pageSize, selectedSlug])

  useEffect(() => {
    if (!filteredEntries.length) return

    const exists = filteredEntries.some((entry) => entry.slug === selectedSlug)
    if (!exists) {
      setSelectedSlug(filteredEntries[0].slug)
    }
  }, [filteredEntries, selectedSlug])

  const displayedPokemon = currentPageEntries.map((entry) => {
    return createCatalogPokemon(entry)
  })

  const selectedEntry =
    catalog.find((entry) => entry.slug === selectedSlug) ??
    filteredEntries[0] ??
    currentPageEntries[0]

  const selectedPokemon = selectedEntry ? createCatalogPokemon(selectedEntry) : null

  function selectPokemon(slug) {
    setSelectedSlug(slug)
  }

  function moveToPage(page) {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages))
  }

  function searchFirstMatch() {
    if (!filteredEntries.length) return false

    const firstMatch = filteredEntries[0]
    setSelectedSlug(firstMatch.slug)
    setCurrentPage(Math.floor(filteredEntries.indexOf(firstMatch) / pageSize) + 1)
    return true
  }

  function applySuggestion(value) {
    setQuery(value)
  }

  function pickRandomSuggestion() {
    const next = quickSuggestions[Math.floor(Math.random() * quickSuggestions.length)]
    setQuery(next)
    return next
  }

  return {
    catalogCount: catalog.length,
    currentPage: safeCurrentPage,
    displayedPokemon,
    filteredCount: filteredEntries.length,
    isCatalogLoading,
    isPageLoading: false,
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
