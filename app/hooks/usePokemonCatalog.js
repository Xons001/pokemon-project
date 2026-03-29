'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  PAGE_SIZE,
  INITIAL_SELECTED_SLUG,
  createCatalogEntry,
  createPlaceholderPokemon,
  createPokemonDetails,
  formatDexNumber,
  quickSuggestions,
} from '../lib/pokemon'

export function usePokemonCatalog() {
  const [query, setQuery] = useState('')
  const [selectedSlug, setSelectedSlug] = useState(INITIAL_SELECTED_SLUG)
  const [currentPage, setCurrentPage] = useState(1)
  const [catalog, setCatalog] = useState([])
  const [pokemonCache, setPokemonCache] = useState({})
  const [isCatalogLoading, setIsCatalogLoading] = useState(true)
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [loadError, setLoadError] = useState('')

  const loadingSlugsRef = useRef(new Set())

  useEffect(() => {
    let isMounted = true

    async function loadCatalog() {
      try {
        const countResponse = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1&offset=0')
        if (!countResponse.ok) {
          throw new Error('No se pudo cargar el total de Pokemon')
        }

        const countData = await countResponse.json()
        const catalogResponse = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${countData.count}&offset=0`)
        if (!catalogResponse.ok) {
          throw new Error('No se pudo cargar el catalogo')
        }

        const catalogData = await catalogResponse.json()
        if (!isMounted) return

        setCatalog(catalogData.results.map(createCatalogEntry))
        setLoadError('')
      } catch (error) {
        if (!isMounted) return
        setLoadError('No se pudo cargar el catalogo completo desde PokeAPI.')
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
      const cached = pokemonCache[entry.slug]
      const haystack = [
        entry.label,
        entry.slug,
        formatDexNumber(entry.id),
        cached?.type,
        cached?.bonus,
        ...(cached?.types ?? []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalized)
    })
  }, [catalog, pokemonCache, query])

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const pageStart = (safeCurrentPage - 1) * PAGE_SIZE
  const currentPageEntries = useMemo(() => {
    return filteredEntries.slice(pageStart, pageStart + PAGE_SIZE)
  }, [filteredEntries, pageStart])

  useEffect(() => {
    setCurrentPage(1)
  }, [query])

  useEffect(() => {
    if (!filteredEntries.length) return

    const exists = filteredEntries.some((entry) => entry.slug === selectedSlug)
    if (!exists) {
      setSelectedSlug(filteredEntries[0].slug)
    }
  }, [filteredEntries, selectedSlug])

  useEffect(() => {
    if (!catalog.length) return

    let cancelled = false
    const targetSlugs = Array.from(
      new Set([...currentPageEntries.map((entry) => entry.slug), selectedSlug].filter(Boolean))
    )
    const missingSlugs = targetSlugs.filter(
      (slug) => !pokemonCache[slug] && !loadingSlugsRef.current.has(slug)
    )

    if (!missingSlugs.length) {
      setIsPageLoading(false)
      return
    }

    setIsPageLoading(true)
    missingSlugs.forEach((slug) => loadingSlugsRef.current.add(slug))

    async function loadPagePokemon() {
      const results = await Promise.allSettled(
        missingSlugs.map(async (slug) => {
          const entry = catalog.find((item) => item.slug === slug)
          const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${entry?.id ?? slug}`)
          if (!response.ok) {
            throw new Error(`No se pudo cargar ${slug}`)
          }

          const data = await response.json()
          return createPokemonDetails(data)
        })
      )

      setPokemonCache((previous) => {
        const next = { ...previous }
        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            next[result.value.slug] = result.value
          }
        })
        return next
      })

      const failedCount = results.filter((result) => result.status === 'rejected').length
      if (failedCount && !cancelled) {
        setLoadError(`Algunos Pokemon no se pudieron cargar correctamente desde PokeAPI (${failedCount}).`)
      } else if (!cancelled) {
        setLoadError('')
      }

      missingSlugs.forEach((slug) => loadingSlugsRef.current.delete(slug))
      if (!cancelled) {
        setIsPageLoading(false)
      }
    }

    loadPagePokemon().catch(() => {
      missingSlugs.forEach((slug) => loadingSlugsRef.current.delete(slug))
      if (!cancelled) {
        setIsPageLoading(false)
        setLoadError('No se pudieron cargar los datos de algunos Pokemon desde PokeAPI.')
      }
    })

    return () => {
      cancelled = true
    }
  }, [catalog, currentPageEntries, pokemonCache, selectedSlug])

  const displayedPokemon = currentPageEntries.map((entry) => {
    return pokemonCache[entry.slug] ?? createPlaceholderPokemon(entry)
  })

  const selectedEntry =
    catalog.find((entry) => entry.slug === selectedSlug) ??
    filteredEntries[0] ??
    currentPageEntries[0]

  const selectedPokemon = selectedEntry
    ? pokemonCache[selectedEntry.slug] ?? createPlaceholderPokemon(selectedEntry)
    : null

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
    setCurrentPage(Math.floor(filteredEntries.indexOf(firstMatch) / PAGE_SIZE) + 1)
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
