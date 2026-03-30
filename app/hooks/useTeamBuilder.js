'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchPokemonCatalog, fetchPokemonDetail, fetchTypeChart } from '../lib/api'
import { createPlaceholderPokemon } from '../lib/pokemon'
import {
  ATTACKING_TYPES,
  LEGACY_TEAM_TEMPLATES_STORAGE_KEY,
  TEAM_STORAGE_KEY,
  buildCatalogSearchResults,
  createDefaultTeam,
  migrateLegacyTemplates,
  sanitizeStoredTeam,
  summarizeTeam,
} from '../lib/team-builder'

export function useTeamBuilder() {
  const [catalog, setCatalog] = useState([])
  const [pokemonCache, setPokemonCache] = useState({})
  const [team, setTeam] = useState(createDefaultTeam)
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeChart, setTypeChart] = useState({})
  const [isCatalogLoading, setIsCatalogLoading] = useState(true)
  const [isTypeChartLoading, setIsTypeChartLoading] = useState(true)
  const [isPokemonLoading, setIsPokemonLoading] = useState(false)
  const [isStorageReady, setIsStorageReady] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [notice, setNotice] = useState('Este equipo se guarda automaticamente en este navegador.')

  const loadingSlugsRef = useRef(new Set())

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const storedTeam = window.localStorage.getItem(TEAM_STORAGE_KEY)
      if (storedTeam) {
        setTeam(sanitizeStoredTeam(JSON.parse(storedTeam)))
        return
      }

      const legacyTemplates = window.localStorage.getItem(LEGACY_TEAM_TEMPLATES_STORAGE_KEY)
      if (legacyTemplates) {
        setTeam(migrateLegacyTemplates(JSON.parse(legacyTemplates)))
      }
    } catch {
      setTeam(createDefaultTeam())
    } finally {
      setIsStorageReady(true)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !isStorageReady) return
    window.localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(team))
  }, [isStorageReady, team])

  useEffect(() => {
    let isMounted = true

    async function loadCatalog() {
      try {
        const catalogData = await fetchPokemonCatalog()
        if (!isMounted) return

        setCatalog(catalogData.items)
      } catch {
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

  useEffect(() => {
    let isMounted = true

    async function loadTypeChart() {
      try {
        const chart = await fetchTypeChart()
        if (!isMounted) return
        setTypeChart(chart)
      } catch {
        if (!isMounted) return
        setLoadError('No se pudo cargar la tabla de compatibilidades de tipos desde la API interna.')
      } finally {
        if (isMounted) {
          setIsTypeChartLoading(false)
        }
      }
    }

    loadTypeChart()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!catalog.length) return

    let cancelled = false
    const targetSlugs = Array.from(new Set(team.slots.filter(Boolean)))
    const missingSlugs = targetSlugs.filter((slug) => !pokemonCache[slug] && !loadingSlugsRef.current.has(slug))

    if (!missingSlugs.length) {
      setIsPokemonLoading(false)
      return
    }

    setIsPokemonLoading(true)
    missingSlugs.forEach((slug) => loadingSlugsRef.current.add(slug))

    async function loadTeamPokemon() {
      const results = await Promise.allSettled(
        missingSlugs.map((slug) => fetchPokemonDetail(slug))
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

      missingSlugs.forEach((slug) => loadingSlugsRef.current.delete(slug))

      const failedCount = results.filter((result) => result.status === 'rejected').length
      if (!cancelled) {
        setIsPokemonLoading(false)
        if (failedCount) {
          setLoadError(`No se pudieron sincronizar ${failedCount} Pokemon del equipo.`)
        }
      }
    }

    loadTeamPokemon().catch(() => {
      missingSlugs.forEach((slug) => loadingSlugsRef.current.delete(slug))
      if (!cancelled) {
        setIsPokemonLoading(false)
        setLoadError('No se pudieron sincronizar los Pokemon del equipo.')
      }
    })

    return () => {
      cancelled = true
    }
  }, [catalog, pokemonCache, team])

  const teamMembers = useMemo(() => {
    return team.slots.map((slug) => {
      if (!slug) return null

      const cachedPokemon = pokemonCache[slug]
      if (cachedPokemon) return cachedPokemon

      const entry = catalog.find((item) => item.slug === slug)
      return entry ? createPlaceholderPokemon(entry) : null
    })
  }, [catalog, pokemonCache, team])

  const searchResults = useMemo(() => {
    return buildCatalogSearchResults(catalog, pokemonCache, searchQuery)
  }, [catalog, pokemonCache, searchQuery])

  const teamSummary = useMemo(() => {
    return summarizeTeam(teamMembers, typeChart)
  }, [teamMembers, typeChart])

  const leaderPokemon = useMemo(() => {
    return teamMembers[team.leaderSlot] ?? teamMembers.find(Boolean) ?? null
  }, [team, teamMembers])

  function updateTeam(updater) {
    setTeam((previous) => updater(previous))
  }

  function renameTeam(value) {
    updateTeam((previous) => ({
      ...previous,
      name: value,
    }))
  }

  function selectSlot(index) {
    setSelectedSlotIndex(index)
  }

  function addPokemonToTeam(slug) {
    const currentSlots = team.slots
    const existingIndex = currentSlots.findIndex((value) => value === slug)

    if (existingIndex !== -1 && existingIndex !== selectedSlotIndex) {
      setNotice('Ese Pokemon ya forma parte del equipo.')
      setSelectedSlotIndex(existingIndex)
      return
    }

    const targetIndex =
      typeof selectedSlotIndex === 'number'
        ? selectedSlotIndex
        : currentSlots.findIndex((value) => value === null)

    const safeTargetIndex = targetIndex === -1 ? 0 : targetIndex

    updateTeam((previous) => {
      const nextSlots = [...previous.slots]
      nextSlots[safeTargetIndex] = slug

      return {
        ...previous,
        slots: nextSlots,
        leaderSlot: nextSlots[previous.leaderSlot] ? previous.leaderSlot : safeTargetIndex,
      }
    })

    setSelectedSlotIndex(Math.min(safeTargetIndex + 1, team.slots.length - 1))
    setNotice('Pokemon anadido al equipo actual.')
  }

  function removePokemonFromTeam(index) {
    updateTeam((previous) => {
      const nextSlots = [...previous.slots]
      nextSlots[index] = null

      const nextLeaderSlot = nextSlots[previous.leaderSlot]
        ? previous.leaderSlot
        : Math.max(
            0,
            nextSlots.findIndex(Boolean)
          )

      return {
        ...previous,
        slots: nextSlots,
        leaderSlot: nextLeaderSlot === -1 ? 0 : nextLeaderSlot,
      }
    })

    setSelectedSlotIndex(index)
    setNotice('Hueco liberado para otro Pokemon.')
  }

  function clearTeam() {
    updateTeam(() => createDefaultTeam())
    setSelectedSlotIndex(0)
    setNotice('Equipo vaciado. Puedes reconstruirlo desde cero.')
  }

  function setLeaderSlot(index) {
    updateTeam((previous) => ({
      ...previous,
      leaderSlot: index,
    }))

    setNotice('Pokemon marcado como lider del equipo.')
  }

  return {
    activeTeam: team,
    catalogCount: catalog.length,
    isCatalogLoading,
    isPokemonLoading,
    isTypeChartLoading,
    leaderPokemon,
    loadError,
    notice,
    searchQuery,
    searchResults,
    selectedSlotIndex,
    setSearchQuery,
    selectSlot,
    addPokemonToTeam,
    removePokemonFromTeam,
    clearTeam,
    renameTeam,
    setLeaderSlot,
    teamMembers,
    teamSummary,
    typeAnalysis: teamSummary.typeAnalysis,
    typeChartReady: ATTACKING_TYPES.every((typeName) => Boolean(typeChart[typeName])),
  }
}
