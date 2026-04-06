'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../components/i18n/LanguageProvider'
import {
  fetchItemCatalog,
  fetchPokemonDetail,
  fetchPokemonMoves,
  fetchTeamBuilderBootstrap,
  fetchTeamSuggestions,
  validateTeamBuild,
} from '../lib/api'
import {
  createCatalogPokemon,
  createPlaceholderPokemon,
  formatName as formatPokemonName,
  localizePokemonDetail,
  localizePokemonMoveLearn,
} from '../lib/pokemon'
import {
  ATTACKING_TYPES,
  DEFAULT_TEAM_FORMAT,
  LEGACY_TEAM_TEMPLATES_STORAGE_KEY,
  TEAM_STORAGE_KEY,
  TEAM_SEARCH_PAGE_SIZE,
  buildUpdatedEffortValues,
  buildUpdatedIndividualValues,
  buildCatalogSearchResults,
  createDefaultTeam,
  createEmptyTeamSlot,
  createFallbackMoveEntry,
  createTeamSlot,
  migrateLegacyTemplates,
  sanitizeStoredTeam,
  summarizeTeam,
} from '../lib/team-builder'
import { exportTeamToShowdownText, importTeamFromShowdownText } from '../lib/team-io'

const TEAM_SUGGESTIONS_DEBOUNCE_MS = 250

const teamBuilderBootstrapCache = new Map()
const teamBuilderBootstrapRequestCache = new Map()
const itemCatalogCache = new Map()
const pokemonDetailCache = new Map()
const pokemonDetailRequestCache = new Map()
const pokemonMoveCache = new Map()
const pokemonMoveRequestCache = new Map()
const teamSuggestionsCache = new Map()
const teamSuggestionsRequestCache = new Map()

function buildFormatRequestKey(value) {
  return typeof value === 'string' && value.trim() ? value.trim().toLowerCase() : DEFAULT_TEAM_FORMAT
}

function getCachedTeamBuilderBootstrap(formatKey) {
  return teamBuilderBootstrapCache.get(buildFormatRequestKey(formatKey)) ?? null
}

async function loadTeamBuilderBootstrap(formatKey) {
  const requestKey = buildFormatRequestKey(formatKey)
  const cachedPayload = teamBuilderBootstrapCache.get(requestKey)

  if (cachedPayload) {
    return cachedPayload
  }

  const inFlightRequest = teamBuilderBootstrapRequestCache.get(requestKey)

  if (inFlightRequest) {
    return inFlightRequest
  }

  const request = fetchTeamBuilderBootstrap({
    formatKey,
  })
    .then((payload) => {
      teamBuilderBootstrapCache.set(requestKey, payload)
      teamBuilderBootstrapCache.set(buildFormatRequestKey(payload?.resolvedFormatKey ?? requestKey), payload)

      if (payload?.resolvedFormatKey && Array.isArray(payload?.items?.items)) {
        itemCatalogCache.set(buildFormatRequestKey(payload.resolvedFormatKey), payload.items.items)
      }

      return payload
    })
    .finally(() => {
      teamBuilderBootstrapRequestCache.delete(requestKey)
    })

  teamBuilderBootstrapRequestCache.set(requestKey, request)

  return request
}

function getCachedItemCatalog(formatKey) {
  return itemCatalogCache.get(buildFormatRequestKey(formatKey)) ?? null
}

async function loadItemCatalogCached(formatKey) {
  const items = getCachedItemCatalog(formatKey)

  if (items) {
    return items
  }

  const payload = await fetchItemCatalog({
    formatKey,
  })

  const nextItems = Array.isArray(payload?.items) ? payload.items : []
  itemCatalogCache.set(buildFormatRequestKey(formatKey), nextItems)

  return nextItems
}

function getCachedPokemonDetail(slug) {
  return pokemonDetailCache.get(slug) ?? null
}

async function loadPokemonDetailCached(slug) {
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

function getCachedPokemonMoves(slug) {
  return pokemonMoveCache.get(slug) ?? null
}

async function loadPokemonMovesCached(slug) {
  const cachedPayload = pokemonMoveCache.get(slug)

  if (cachedPayload) {
    return cachedPayload
  }

  const inFlightRequest = pokemonMoveRequestCache.get(slug)

  if (inFlightRequest) {
    return inFlightRequest
  }

  const request = fetchPokemonMoves(slug)
    .then((payload) => {
      const items = Array.isArray(payload?.items) ? payload.items : []
      pokemonMoveCache.set(slug, items)
      return items
    })
    .finally(() => {
      pokemonMoveRequestCache.delete(slug)
    })

  pokemonMoveRequestCache.set(slug, request)

  return request
}

function getCachedTeamSuggestions(requestKey) {
  return teamSuggestionsCache.get(requestKey) ?? null
}

async function loadTeamSuggestionsCached(requestKey, payload) {
  const cachedPayload = teamSuggestionsCache.get(requestKey)

  if (cachedPayload) {
    return cachedPayload
  }

  const inFlightRequest = teamSuggestionsRequestCache.get(requestKey)

  if (inFlightRequest) {
    return inFlightRequest
  }

  const request = fetchTeamSuggestions(payload)
    .then((response) => {
      teamSuggestionsCache.set(requestKey, response)
      return response
    })
    .finally(() => {
      teamSuggestionsRequestCache.delete(requestKey)
    })

  teamSuggestionsRequestCache.set(requestKey, request)

  return request
}

export function useTeamBuilder() {
  const { locale } = useI18n()
  const [catalog, setCatalog] = useState([])
  const [itemCatalog, setItemCatalog] = useState([])
  const [competitiveFormats, setCompetitiveFormats] = useState([])
  const [detailCache, setDetailCache] = useState({})
  const [moveCache, setMoveCache] = useState({})
  const [team, setTeam] = useState(() => createDefaultTeam(DEFAULT_TEAM_FORMAT, locale))
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchPage, setSearchPage] = useState(1)
  const [typeChart, setTypeChart] = useState({})
  const [isCatalogLoading, setIsCatalogLoading] = useState(true)
  const [isItemsLoading, setIsItemsLoading] = useState(true)
  const [isTypeChartLoading, setIsTypeChartLoading] = useState(true)
  const [isFormatsLoading, setIsFormatsLoading] = useState(true)
  const [isPokemonLoading, setIsPokemonLoading] = useState(false)
  const [isMovesLoading, setIsMovesLoading] = useState(false)
  const [isValidationLoading, setIsValidationLoading] = useState(false)
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false)
  const [isStorageReady, setIsStorageReady] = useState(false)
  const [isBootstrapReady, setIsBootstrapReady] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [validationResult, setValidationResult] = useState(null)
  const [suggestionsError, setSuggestionsError] = useState('')
  const [suggestionsResult, setSuggestionsResult] = useState(null)
  const [isValidationDirty, setIsValidationDirty] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [notice, setNotice] = useState(
    'Este equipo se guarda automáticamente en este navegador y ya acepta import/export estilo Showdown.'
  )
  const loadingDetailsRef = useRef(new Set())
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
      setTeam(createDefaultTeam(DEFAULT_TEAM_FORMAT, locale))
    } finally {
      setIsStorageReady(true)
    }
  }, [locale])

  useEffect(() => {
    if (typeof window === 'undefined' || !isStorageReady) return
    window.localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(team))
  }, [isStorageReady, team])

  function getDefaultFormatKey() {
    return competitiveFormats[0]?.key ?? DEFAULT_TEAM_FORMAT
  }

  const selectedSlot = team.slots[selectedSlotIndex] ?? createEmptyTeamSlot()
  const selectedPokemonSlug = selectedSlot.pokemonSlug

  useEffect(() => {
    if (!isStorageReady) {
      return
    }

    let isMounted = true

    function applyBootstrapPayload(payload) {
      setCatalog(Array.isArray(payload?.catalog?.items) ? payload.catalog.items : [])
      setCompetitiveFormats(Array.isArray(payload?.formats?.items) ? payload.formats.items : [])
      setItemCatalog(Array.isArray(payload?.items?.items) ? payload.items.items : [])

      setTypeChart(payload?.typeChart && typeof payload.typeChart === 'object' ? payload.typeChart : {})
      setLoadError('')

      if (payload?.resolvedFormatKey && payload.resolvedFormatKey !== team.formatKey) {
        setTeam((previous) => ({
          ...previous,
          formatKey: payload.resolvedFormatKey,
        }))
        setNotice('El formato del equipo se ha ajustado al meta disponible en este entorno.')
      }
    }

    async function loadBootstrap() {
      const cachedPayload = getCachedTeamBuilderBootstrap(team.formatKey)

      if (cachedPayload) {
        applyBootstrapPayload(cachedPayload)
        setIsCatalogLoading(false)
        setIsItemsLoading(false)
        setIsFormatsLoading(false)
        setIsTypeChartLoading(false)
        setIsBootstrapReady(true)
        return
      }

      setIsBootstrapReady(false)
      setIsCatalogLoading(true)
      setIsItemsLoading(true)
      setIsFormatsLoading(true)
      setIsTypeChartLoading(true)

      try {
        const payload = await loadTeamBuilderBootstrap(team.formatKey)
        if (!isMounted) return

        applyBootstrapPayload(payload)
      } catch {
        if (!isMounted) return
        setLoadError('No se pudieron cargar los datos base del team builder desde la API interna.')
        setLoadError('No se pudo cargar el catálogo desde la API interna.')
      } finally {
        if (isMounted) {
          setIsCatalogLoading(false)
          setIsItemsLoading(false)
          setIsFormatsLoading(false)
          setIsTypeChartLoading(false)
          setIsBootstrapReady(true)
        }
      }
    }

    loadBootstrap()

    return () => {
      isMounted = false
    }
  }, [isStorageReady, team.formatKey])

  useEffect(() => {
    if (!isStorageReady || !isBootstrapReady || !team.formatKey) {
      return
    }

    const cachedItems = getCachedItemCatalog(team.formatKey)

    if (cachedItems) {
      setItemCatalog(cachedItems)
      setIsItemsLoading(false)
      return
    }

    let isMounted = true

    async function syncItemCatalog() {
      setIsItemsLoading(true)

      try {
        const items = await loadItemCatalogCached(team.formatKey)
        if (!isMounted) return

        setItemCatalog(items)
        setLoadError('')
      } catch {
        if (!isMounted) return
        setLoadError('No se pudo cargar el catálogo de items desde la API interna.')
      } finally {
        if (isMounted) {
          setIsItemsLoading(false)
        }
      }
    }

    syncItemCatalog()

    return () => {
      isMounted = false
    }
  }, [isBootstrapReady, isStorageReady, team.formatKey])

  useEffect(() => {
    if (!selectedPokemonSlug || detailCache[selectedPokemonSlug]) {
      setIsPokemonLoading(false)
      return
    }

    const cachedDetail = getCachedPokemonDetail(selectedPokemonSlug)

    if (cachedDetail) {
      setDetailCache((previous) => {
        if (previous[selectedPokemonSlug]) {
          return previous
        }

        return {
          ...previous,
          [selectedPokemonSlug]: cachedDetail,
        }
      })
      setIsPokemonLoading(false)
      return
    }

    if (!selectedPokemonSlug || detailCache[selectedPokemonSlug] || loadingDetailsRef.current.has(selectedPokemonSlug)) {
      return
    }

    let cancelled = false

    setIsPokemonLoading(true)
    loadingDetailsRef.current.add(selectedPokemonSlug)

    async function loadPokemonDetail() {
      try {
        const payload = await loadPokemonDetailCached(selectedPokemonSlug)

        if (cancelled) return

        setDetailCache((previous) => ({
          ...previous,
          [selectedPokemonSlug]: payload,
        }))
        setLoadError('')
      } catch {
        if (!cancelled) {
          setLoadError('No se pudo cargar la ficha competitiva del Pokémon seleccionado.')
        }
      } finally {
        loadingDetailsRef.current.delete(selectedPokemonSlug)
        if (!cancelled) {
          setIsPokemonLoading(false)
        }
      }
    }

    loadPokemonDetail()

    return () => {
      cancelled = true
    }
  }, [detailCache, selectedPokemonSlug])

  useEffect(() => {
    if (!selectedPokemonSlug || moveCache[selectedPokemonSlug]) {
      setIsMovesLoading(false)
      return
    }

    const cachedMoves = getCachedPokemonMoves(selectedPokemonSlug)

    if (cachedMoves) {
      setMoveCache((previous) => {
        if (previous[selectedPokemonSlug]) {
          return previous
        }

        return {
          ...previous,
          [selectedPokemonSlug]: cachedMoves,
        }
      })
      setIsMovesLoading(false)
      return
    }

    if (!selectedPokemonSlug || moveCache[selectedPokemonSlug] || loadingMovesRef.current.has(selectedPokemonSlug)) {
      return
    }

    let cancelled = false

    setIsMovesLoading(true)
    loadingMovesRef.current.add(selectedPokemonSlug)

    async function loadPokemonMoves() {
      try {
        const items = await loadPokemonMovesCached(selectedPokemonSlug)

        if (cancelled) return

        setMoveCache((previous) => ({
          ...previous,
          [selectedPokemonSlug]: items,
        }))
        setLoadError('')
      } catch {
        if (!cancelled) {
          setLoadError('No se pudo cargar el learnset del Pokémon seleccionado.')
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
      if (entry) {
        return createCatalogPokemon(entry, locale)
      }

      const cachedDetail = detailCache[slug]

      if (cachedDetail) {
        return localizePokemonDetail(cachedDetail, locale)
      }

      return createPlaceholderPokemon({
        id: 0,
        slug,
        label: formatPokemonName(slug),
      }, locale)
    })
  }, [catalog, detailCache, locale, team.slots])

  const teamMoveMatrix = useMemo(() => {
    return team.slots.map((slot) => {
      if (!slot?.pokemonSlug) {
        return []
      }

      const learnset = moveCache[slot.pokemonSlug] ?? []

      return slot.moveSlugs
        .filter(Boolean)
        .map((moveSlug) => learnset.find((entry) => entry.moveSlug === moveSlug) ?? createFallbackMoveEntry(moveSlug))
        .filter(Boolean)
    })
  }, [moveCache, team.slots])

  const searchResults = useMemo(() => {
    return buildCatalogSearchResults(catalog, searchQuery, locale)
  }, [catalog, locale, searchQuery])

  const totalSearchPages = useMemo(() => {
    return Math.max(1, Math.ceil(searchResults.length / TEAM_SEARCH_PAGE_SIZE))
  }, [searchResults.length])

  const paginatedSearchResults = useMemo(() => {
    const safePage = Math.min(searchPage, totalSearchPages)
    const startIndex = (safePage - 1) * TEAM_SEARCH_PAGE_SIZE
    return searchResults.slice(startIndex, startIndex + TEAM_SEARCH_PAGE_SIZE)
  }, [searchPage, searchResults, totalSearchPages])

  const searchResultsSummary = useMemo(() => {
    if (!searchResults.length) {
      return {
        total: 0,
        currentPage: 1,
        totalPages: 1,
        from: 0,
        to: 0,
      }
    }

    const currentPage = Math.min(searchPage, totalSearchPages)
    const from = (currentPage - 1) * TEAM_SEARCH_PAGE_SIZE + 1
    const to = Math.min(currentPage * TEAM_SEARCH_PAGE_SIZE, searchResults.length)

    return {
      total: searchResults.length,
      currentPage,
      totalPages: totalSearchPages,
      from,
      to,
    }
  }, [searchPage, searchResults.length, totalSearchPages])

  const teamSummary = useMemo(() => {
    return summarizeTeam(teamMembers, typeChart, team.slots, teamMoveMatrix, locale)
  }, [locale, teamMembers, teamMoveMatrix, team.slots, typeChart])

  const leaderPokemon = useMemo(() => {
    return teamMembers[team.leaderSlot] ?? teamMembers.find(Boolean) ?? null
  }, [team, teamMembers])

  const hasSelectedPokemon = useMemo(() => {
    return team.slots.some((slot) => slot.pokemonSlug)
  }, [team.slots])

  const suggestionsRequestPayload = useMemo(() => {
    return {
      formatKey: team.formatKey,
      limit: 8,
      slots: team.slots.map((slot) => ({
        pokemonSlug: slot.pokemonSlug,
        abilitySlug: slot.abilitySlug,
        moveSlugs: slot.moveSlugs,
      })),
    }
  }, [team.formatKey, team.slots])

  const suggestionsRequestKey = useMemo(() => {
    return JSON.stringify(suggestionsRequestPayload)
  }, [suggestionsRequestPayload])

  const selectedPokemonMoves = useMemo(() => {
    if (!selectedPokemonSlug) {
      return []
    }

    return (moveCache[selectedPokemonSlug] ?? []).map((move) => localizePokemonMoveLearn(move, locale))
  }, [locale, moveCache, selectedPokemonSlug])

  const selectedPokemonDetail = useMemo(() => {
    if (!selectedPokemonSlug) {
      return null
    }

    return localizePokemonDetail(detailCache[selectedPokemonSlug] ?? null, locale)
  }, [detailCache, locale, selectedPokemonSlug])

  useEffect(() => {
    setSearchPage(1)
  }, [searchQuery])

  useEffect(() => {
    setSearchPage((previous) => Math.min(previous, totalSearchPages))
  }, [totalSearchPages])

  useEffect(() => {
    if (!selectedPokemonSlug || selectedSlot.abilitySlug || !selectedPokemonDetail?.abilities?.length) {
      return
    }

    updateTeam((previous) => {
      const nextSlots = [...previous.slots]
      const currentSlot = nextSlots[selectedSlotIndex] ?? createEmptyTeamSlot()

      nextSlots[selectedSlotIndex] = {
        ...currentSlot,
        abilitySlug: selectedPokemonDetail.abilities[0].slug,
      }

      return {
        ...previous,
        slots: nextSlots,
      }
    })
  }, [selectedPokemonDetail, selectedPokemonSlug, selectedSlot.abilitySlug, selectedSlotIndex])

  useEffect(() => {
    setIsValidationDirty(true)
  }, [team])

  useEffect(() => {
    if (!isBootstrapReady || !hasSelectedPokemon) {
      setSuggestionsResult(null)
      setSuggestionsError('')
      setIsSuggestionsLoading(false)
      return
    }

    const cachedSuggestions = getCachedTeamSuggestions(suggestionsRequestKey)

    if (cachedSuggestions) {
      setSuggestionsResult(cachedSuggestions)
      setSuggestionsError('')
      setIsSuggestionsLoading(false)
      return
    }

    let cancelled = false

    async function loadSuggestions() {
      setIsSuggestionsLoading(true)
      setSuggestionsError('')

      try {
        const result = await loadTeamSuggestionsCached(suggestionsRequestKey, {
          ...suggestionsRequestPayload,
        })

        if (cancelled) return
        setSuggestionsResult(result)
      } catch (error) {
        if (cancelled) return
        setSuggestionsError(error instanceof Error ? error.message : 'No se pudieron cargar las sugerencias.')
      } finally {
        if (!cancelled) {
          setIsSuggestionsLoading(false)
        }
      }
    }

    const timeoutId = window.setTimeout(() => {
      loadSuggestions()
    }, TEAM_SUGGESTIONS_DEBOUNCE_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [hasSelectedPokemon, isBootstrapReady, suggestionsRequestKey, suggestionsRequestPayload])

  function updateTeam(updater) {
    setTeam((previous) => updater(previous))
  }

  function renameTeam(value) {
    updateTeam((previous) => ({
      ...previous,
      name: value,
    }))
  }

  function setFormatKey(value) {
    const nextFormatKey = typeof value === 'string' && value.trim() ? value.trim().toLowerCase() : getDefaultFormatKey()

    updateTeam((previous) => ({
      ...previous,
      formatKey: nextFormatKey,
    }))

    setNotice('Formato competitivo actualizado para el validador.')
  }

  function selectSlot(index) {
    setSelectedSlotIndex(index)
  }

  function changeSearchPage(nextPage) {
    setSearchPage((previous) => {
      const safeNextPage = Number.isFinite(Number(nextPage)) ? Math.round(Number(nextPage)) : previous
      return Math.min(Math.max(safeNextPage, 1), totalSearchPages)
    })
  }

  function addPokemonToTeam(slug) {
    const currentSlots = team.slots
    const existingIndex = currentSlots.findIndex((slot) => slot.pokemonSlug === slug)
    const catalogEntry = catalog.find((entry) => entry.slug === slug)
    const defaultAbility = typeof catalogEntry?.primaryAbility === 'string' ? catalogEntry.primaryAbility : null

    if (existingIndex !== -1 && existingIndex !== selectedSlotIndex) {
      setNotice('Ese Pokémon ya forma parte del equipo.')
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
          : createTeamSlot(slug, {
              abilitySlug: defaultAbility,
            })

      return {
        ...previous,
        slots: nextSlots,
        leaderSlot: nextSlots[previous.leaderSlot]?.pokemonSlug ? previous.leaderSlot : safeTargetIndex,
      }
    })

    setSelectedSlotIndex(Math.min(safeTargetIndex + 1, team.slots.length - 1))
    setNotice('Pokémon añadido al equipo actual.')
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
    setNotice('Hueco liberado para otro Pokémon.')
  }

  function assignMoveToSlot(moveIndex, moveSlug) {
    if (!selectedPokemonSlug) {
      setNotice('Selecciona primero un Pokémon para asignarle movimientos.')
      return
    }

    const normalizedMoveSlug = typeof moveSlug === 'string' && moveSlug ? moveSlug : null

    if (
      normalizedMoveSlug &&
      selectedSlot.moveSlugs.some((slug, index) => slug === normalizedMoveSlug && index !== moveIndex)
    ) {
      setNotice('Ese movimiento ya está elegido en otro hueco del moveset.')
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

  function assignAbilityToSlot(abilitySlug) {
    if (!selectedPokemonSlug) {
      setNotice('Selecciona primero un Pokémon para asignarle una habilidad.')
      return
    }

    const normalizedAbilitySlug = typeof abilitySlug === 'string' && abilitySlug ? abilitySlug : null

    updateTeam((previous) => {
      const nextSlots = [...previous.slots]
      const currentSlot = nextSlots[selectedSlotIndex] ?? createEmptyTeamSlot()

      nextSlots[selectedSlotIndex] = {
        ...currentSlot,
        abilitySlug: normalizedAbilitySlug,
      }

      return {
        ...previous,
        slots: nextSlots,
      }
    })

    setNotice(normalizedAbilitySlug ? 'Habilidad guardada en el hueco activo.' : 'Habilidad limpiada para este Pokémon.')
  }

  function assignItemToSlot(itemSlug) {
    if (!selectedPokemonSlug) {
      setNotice('Selecciona primero un Pokémon para asignarle un item.')
      return
    }

    const normalizedItemSlug = typeof itemSlug === 'string' && itemSlug ? itemSlug : null

    updateTeam((previous) => {
      const nextSlots = [...previous.slots]
      const currentSlot = nextSlots[selectedSlotIndex] ?? createEmptyTeamSlot()

      nextSlots[selectedSlotIndex] = {
        ...currentSlot,
        itemSlug: normalizedItemSlug,
      }

      return {
        ...previous,
        slots: nextSlots,
      }
    })

    setNotice(normalizedItemSlug ? 'Item guardado en el hueco activo.' : 'Item limpiado para este Pokémon.')
  }

  function assignNatureToSlot(natureKey) {
    if (!selectedPokemonSlug) {
      setNotice('Selecciona primero un Pokémon para asignarle una naturaleza.')
      return
    }

    const normalizedNatureKey = typeof natureKey === 'string' && natureKey ? natureKey : null

    updateTeam((previous) => {
      const nextSlots = [...previous.slots]
      const currentSlot = nextSlots[selectedSlotIndex] ?? createEmptyTeamSlot()

      nextSlots[selectedSlotIndex] = {
        ...currentSlot,
        natureKey: normalizedNatureKey,
      }

      return {
        ...previous,
        slots: nextSlots,
      }
    })

    setNotice(normalizedNatureKey ? 'Naturaleza guardada en el hueco activo.' : 'Naturaleza limpiada para este Pokémon.')
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

    setNotice('Moveset reiniciado para este Pokémon.')
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

      nextSlots[index] = createTeamSlot(currentSlot.pokemonSlug, {
        abilitySlug: currentSlot.abilitySlug,
        itemSlug: currentSlot.itemSlug,
        natureKey: currentSlot.natureKey,
        moveSlugs: currentSlot.moveSlugs,
      })

      return {
        ...previous,
        slots: nextSlots,
      }
    })

    setNotice('EVs e IVs reiniciados para este Pokémon.')
  }

  function clearTeam() {
    updateTeam(() => createDefaultTeam(getDefaultFormatKey(), locale))
    setSelectedSlotIndex(0)
    setNotice('Equipo vaciado. Puedes reconstruirlo desde cero.')
  }

  function setLeaderSlot(index) {
    updateTeam((previous) => ({
      ...previous,
      leaderSlot: index,
    }))

    setNotice('Pokémon marcado como líder del equipo.')
  }

  function generateTeamExportText() {
    return exportTeamToShowdownText(team, teamMembers, {
      itemCatalog,
    })
  }

  function importTeamFromText(text) {
    const importedTeam = importTeamFromShowdownText(text, {
      catalog,
      itemCatalog,
      defaultFormatKey: getDefaultFormatKey(),
      teamName: team.name,
    })
    const importedCount = importedTeam.slots.filter((slot) => slot.pokemonSlug).length

    if (!importedCount) {
      throw new Error('No hemos detectado sets válidos en ese texto.')
    }

    const firstFilledIndex = importedTeam.slots.findIndex((slot) => slot.pokemonSlug)
    setTeam(importedTeam)
    setSelectedSlotIndex(firstFilledIndex >= 0 ? firstFilledIndex : 0)
    setNotice(`Equipo importado con ${importedCount} Pokémon. Revisa item, naturaleza y validación del meta.`)
    return importedTeam
  }

  async function runValidation() {
    setIsValidationLoading(true)
    setValidationError('')

    try {
      const result = await validateTeamBuild({
        formatKey: team.formatKey,
        slots: team.slots.map((slot) => ({
          pokemonSlug: slot.pokemonSlug,
          abilitySlug: slot.abilitySlug,
          itemSlug: slot.itemSlug,
          moveSlugs: slot.moveSlugs,
        })),
      })

      setValidationResult(result)
      setIsValidationDirty(false)
      setNotice('Validador competitivo actualizado con los datos del meta seleccionado.')
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : 'No se pudo validar el equipo.')
    } finally {
      setIsValidationLoading(false)
    }
  }

  return {
    activeTeam: team,
    catalogCount: catalog.length,
    itemCatalog,
    competitiveFormats,
    isCatalogLoading,
    isItemsLoading,
    isFormatsLoading,
    isPokemonLoading,
    isSuggestionsLoading,
    isTypeChartLoading,
    isValidationDirty,
    isValidationLoading,
    leaderPokemon,
    loadError,
    isMovesLoading,
    notice,
    searchQuery,
    searchPage: searchResultsSummary.currentPage,
    searchResults: paginatedSearchResults,
    searchResultsSummary,
    selectedPokemonDetail,
    selectedPokemonMoves,
    selectedSlot,
    selectedSlotIndex,
    setSearchPage: changeSearchPage,
    setSearchQuery,
    setFormatKey,
    selectSlot,
    addPokemonToTeam,
    assignAbilityToSlot,
    assignItemToSlot,
    assignNatureToSlot,
    assignMoveToSlot,
    assignEffortValue,
    assignIndividualValue,
    clearMovesFromSlot,
    resetStatSpread,
    removePokemonFromTeam,
    clearTeam,
    renameTeam,
    runValidation,
    setLeaderSlot,
    generateTeamExportText,
    importTeamFromText,
    suggestionsError,
    suggestionsResult,
    teamMembers,
    teamSummary,
    typeAnalysis: teamSummary.typeAnalysis,
    typeChartReady: ATTACKING_TYPES.every((typeName) => Boolean(typeChart[typeName])),
    validationError,
    validationResult,
  }
}
