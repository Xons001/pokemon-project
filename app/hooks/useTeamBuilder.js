'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchPokemonCatalog, fetchPokemonMoves, fetchTypeChart } from '../lib/api'
import { createCatalogPokemon } from '../lib/pokemon'
import {
  ATTACKING_TYPES,
  LEGACY_TEAM_TEMPLATES_STORAGE_KEY,
  TEAM_STORAGE_KEY,
  buildUpdatedEffortValues,
  buildUpdatedIndividualValues,
  buildCatalogSearchResults,
  createDefaultTeam,
  createEmptyTeamSlot,
  createTeamSlot,
  migrateLegacyTemplates,
  sanitizeStoredTeam,
  summarizeTeam,
} from '../lib/team-builder'

export function useTeamBuilder() {
  const [catalog, setCatalog] = useState([])
  const [moveCache, setMoveCache] = useState({})
  const [team, setTeam] = useState(createDefaultTeam)
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeChart, setTypeChart] = useState({})
  const [isCatalogLoading, setIsCatalogLoading] = useState(true)
  const [isTypeChartLoading, setIsTypeChartLoading] = useState(true)
  const [isMovesLoading, setIsMovesLoading] = useState(false)
  const [isStorageReady, setIsStorageReady] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [notice, setNotice] = useState('Este equipo se guarda automaticamente en este navegador.')
  const loadingMovesRef = useRef(new Set())

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

  const selectedSlot = team.slots[selectedSlotIndex] ?? createEmptyTeamSlot()
  const selectedPokemonSlug = selectedSlot.pokemonSlug

  useEffect(() => {
    let isMounted = true

    async function loadCatalog() {
      try {
        const catalogData = await fetchPokemonCatalog()
        if (!isMounted) return

        setCatalog(catalogData.items)
        setLoadError('')
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
        setLoadError('')
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
    if (!selectedPokemonSlug || moveCache[selectedPokemonSlug] || loadingMovesRef.current.has(selectedPokemonSlug)) {
      return
    }

    let cancelled = false

    setIsMovesLoading(true)
    loadingMovesRef.current.add(selectedPokemonSlug)

    async function loadPokemonMoves() {
      try {
        const payload = await fetchPokemonMoves(selectedPokemonSlug)

        if (cancelled) return

        setMoveCache((previous) => ({
          ...previous,
          [selectedPokemonSlug]: payload.items,
        }))
        setLoadError('')
      } catch {
        if (!cancelled) {
          setLoadError('No se pudo cargar el learnset del Pokemon seleccionado.')
        }
      } finally {
        loadingMovesRef.current.delete(selectedPokemonSlug)
        if (!cancelled) {
          setIsMovesLoading(false)
        }
      }
    }

    loadPokemonMoves()

    return () => {
      cancelled = true
    }
  }, [moveCache, selectedPokemonSlug])

  const teamMembers = useMemo(() => {
    return team.slots.map((slot) => {
      const slug = slot?.pokemonSlug
      if (!slug) return null

      const entry = catalog.find((item) => item.slug === slug)
      return entry ? createCatalogPokemon(entry) : null
    })
  }, [catalog, team])

  const searchResults = useMemo(() => {
    return buildCatalogSearchResults(catalog, searchQuery)
  }, [catalog, searchQuery])

  const teamSummary = useMemo(() => {
    return summarizeTeam(teamMembers, typeChart)
  }, [teamMembers, typeChart])

  const leaderPokemon = useMemo(() => {
    return teamMembers[team.leaderSlot] ?? teamMembers.find(Boolean) ?? null
  }, [team, teamMembers])

  const selectedPokemonMoves = useMemo(() => {
    if (!selectedPokemonSlug) {
      return []
    }

    return moveCache[selectedPokemonSlug] ?? []
  }, [moveCache, selectedPokemonSlug])

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
    const existingIndex = currentSlots.findIndex((slot) => slot.pokemonSlug === slug)

    if (existingIndex !== -1 && existingIndex !== selectedSlotIndex) {
      setNotice('Ese Pokemon ya forma parte del equipo.')
      setSelectedSlotIndex(existingIndex)
      return
    }

    const targetIndex =
      typeof selectedSlotIndex === 'number'
        ? selectedSlotIndex
        : currentSlots.findIndex((slot) => slot.pokemonSlug === null)

    const safeTargetIndex = targetIndex === -1 ? 0 : targetIndex

    updateTeam((previous) => {
      const nextSlots = [...previous.slots]
      const currentSlot = nextSlots[safeTargetIndex] ?? createEmptyTeamSlot()
      nextSlots[safeTargetIndex] =
        currentSlot.pokemonSlug === slug
          ? currentSlot
          : createTeamSlot(slug)

      return {
        ...previous,
        slots: nextSlots,
        leaderSlot: nextSlots[previous.leaderSlot]?.pokemonSlug ? previous.leaderSlot : safeTargetIndex,
      }
    })

    setSelectedSlotIndex(Math.min(safeTargetIndex + 1, team.slots.length - 1))
    setNotice('Pokemon anadido al equipo actual.')
  }

  function removePokemonFromTeam(index) {
    updateTeam((previous) => {
      const nextSlots = [...previous.slots]
      nextSlots[index] = createEmptyTeamSlot()

      const nextLeaderSlot = nextSlots[previous.leaderSlot]?.pokemonSlug
        ? previous.leaderSlot
        : Math.max(
            0,
            nextSlots.findIndex((slot) => slot.pokemonSlug)
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

  function assignMoveToSlot(moveIndex, moveSlug) {
    if (!selectedPokemonSlug) {
      setNotice('Selecciona primero un Pokemon para asignarle movimientos.')
      return
    }

    const normalizedMoveSlug = typeof moveSlug === 'string' && moveSlug ? moveSlug : null

    if (
      normalizedMoveSlug &&
      selectedSlot.moveSlugs.some((slug, index) => slug === normalizedMoveSlug && index !== moveIndex)
    ) {
      setNotice('Ese movimiento ya esta elegido en otro hueco del moveset.')
      return
    }

    updateTeam((previous) => {
      const nextSlots = [...previous.slots]
      const currentSlot = nextSlots[selectedSlotIndex] ?? createEmptyTeamSlot()
      const nextMoveSlugs = [...currentSlot.moveSlugs]
      nextMoveSlugs[moveIndex] = normalizedMoveSlug

      nextSlots[selectedSlotIndex] = {
        ...currentSlot,
        moveSlugs: nextMoveSlugs,
      }

      return {
        ...previous,
        slots: nextSlots,
      }
    })

    setNotice(normalizedMoveSlug ? 'Movimiento guardado en el hueco activo.' : 'Hueco de movimiento liberado.')
  }

  function clearMovesFromSlot(index) {
    updateTeam((previous) => {
      const nextSlots = [...previous.slots]
      const currentSlot = nextSlots[index] ?? createEmptyTeamSlot()

      nextSlots[index] = {
        ...currentSlot,
        moveSlugs: currentSlot.moveSlugs.map(() => null),
      }

      return {
        ...previous,
        slots: nextSlots,
      }
    })

    setNotice('Moveset reiniciado para este Pokemon.')
  }

  function assignEffortValue(statKey, value) {
    updateTeam((previous) => {
      const nextSlots = [...previous.slots]
      const currentSlot = nextSlots[selectedSlotIndex] ?? createEmptyTeamSlot()

      nextSlots[selectedSlotIndex] = {
        ...currentSlot,
        evs: buildUpdatedEffortValues(currentSlot.evs, statKey, value),
      }

      return {
        ...previous,
        slots: nextSlots,
      }
    })
  }

  function assignIndividualValue(statKey, value) {
    updateTeam((previous) => {
      const nextSlots = [...previous.slots]
      const currentSlot = nextSlots[selectedSlotIndex] ?? createEmptyTeamSlot()

      nextSlots[selectedSlotIndex] = {
        ...currentSlot,
        ivs: buildUpdatedIndividualValues(currentSlot.ivs, statKey, value),
      }

      return {
        ...previous,
        slots: nextSlots,
      }
    })
  }

  function resetStatSpread(index) {
    updateTeam((previous) => {
      const nextSlots = [...previous.slots]
      const currentSlot = nextSlots[index] ?? createEmptyTeamSlot()

      nextSlots[index] = createTeamSlot(currentSlot.pokemonSlug)
      nextSlots[index].moveSlugs = currentSlot.moveSlugs

      return {
        ...previous,
        slots: nextSlots,
      }
    })

    setNotice('EVs e IVs reiniciados para este Pokemon.')
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
    isPokemonLoading: false,
    isTypeChartLoading,
    leaderPokemon,
    loadError,
    isMovesLoading,
    notice,
    searchQuery,
    searchResults,
    selectedPokemonMoves,
    selectedSlot,
    selectedSlotIndex,
    setSearchQuery,
    selectSlot,
    addPokemonToTeam,
    assignMoveToSlot,
    assignEffortValue,
    assignIndividualValue,
    clearMovesFromSlot,
    resetStatSpread,
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
