'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../components/i18n/LanguageProvider'
import {
  fetchCompetitiveFormats,
  fetchItemCatalog,
  fetchPokemonCatalog,
  fetchPokemonDetail,
  fetchPokemonMoves,
  fetchTeamSuggestions,
  fetchTypeChart,
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
    let isMounted = true

    async function loadCatalog() {
      if (isMounted) {
        setIsCatalogLoading(true)
      }

      try {
        const catalogData = await fetchPokemonCatalog('', {
          scope: 'competitive',
        })
        if (!isMounted) return

        setCatalog(catalogData.items)
        setLoadError('')
      } catch {
        if (!isMounted) return
        setLoadError('No se pudo cargar el catálogo desde la API interna.')
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

    async function loadItemCatalog() {
      if (isMounted) {
        setIsItemsLoading(true)
      }

      try {
        const itemData = await fetchItemCatalog({
          formatKey: team.formatKey,
        })
        if (!isMounted) return

        setItemCatalog(itemData.items)
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

    loadItemCatalog()

    return () => {
      isMounted = false
    }
  }, [team.formatKey])

  useEffect(() => {
    if (!competitiveFormats.length) {
      return
    }

    const availableFormatKeys = new Set(competitiveFormats.map((entry) => entry.key))

    if (availableFormatKeys.has(team.formatKey)) {
      return
    }

    setTeam((previous) => ({
      ...previous,
      formatKey: competitiveFormats[0].key,
    }))
    setNotice('El formato del equipo se ha ajustado al meta disponible en este entorno.')
  }, [competitiveFormats, team.formatKey])

  useEffect(() => {
    let isMounted = true

    async function loadFormats() {
      try {
        const formatData = await fetchCompetitiveFormats()
        if (!isMounted) return

        setCompetitiveFormats(formatData.items)
        setLoadError('')
      } catch {
        if (!isMounted) return
        setLoadError('No se pudieron cargar los formatos competitivos desde la API interna.')
      } finally {
        if (isMounted) {
          setIsFormatsLoading(false)
        }
      }
    }

    loadFormats()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (isFormatsLoading || !competitiveFormats.length) {
      return
    }

    const hasSelectedFormat = competitiveFormats.some((format) => format.key === team.formatKey)

    if (hasSelectedFormat) {
      return
    }

    updateTeam((previous) => ({
      ...previous,
      formatKey: competitiveFormats[0].key,
    }))
  }, [competitiveFormats, isFormatsLoading, team.formatKey])

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
    if (!selectedPokemonSlug || detailCache[selectedPokemonSlug]) {
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
        const payload = await fetchPokemonDetail(selectedPokemonSlug)

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

  useEffect(() => {
    const pendingTeamSlugs = Array.from(
      new Set(team.slots.map((slot) => slot.pokemonSlug).filter((value) => Boolean(value)))
    ).filter((slug) => !moveCache[slug] && !loadingMovesRef.current.has(slug))

    if (!pendingTeamSlugs.length) {
      return
    }

    let cancelled = false

    async function preloadTeamMoves() {
      for (const pokemonSlug of pendingTeamSlugs) {
        if (cancelled || moveCache[pokemonSlug] || loadingMovesRef.current.has(pokemonSlug)) {
          continue
        }

        loadingMovesRef.current.add(pokemonSlug)

        try {
          const payload = await fetchPokemonMoves(pokemonSlug)

          if (cancelled) {
            return
          }

          setMoveCache((previous) => ({
            ...previous,
            [pokemonSlug]: payload.items,
          }))
        } catch {
          if (!cancelled) {
            setLoadError('No se pudo sincronizar por completo el learnset del equipo.')
          }
        } finally {
          loadingMovesRef.current.delete(pokemonSlug)
        }
      }
    }

    preloadTeamMoves()

    return () => {
      cancelled = true
    }
  }, [moveCache, team.slots])

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
    if (!hasSelectedPokemon) {
      setSuggestionsResult(null)
      setSuggestionsError('')
      setIsSuggestionsLoading(false)
      return
    }

    let cancelled = false

    async function loadSuggestions() {
      setIsSuggestionsLoading(true)
      setSuggestionsError('')

      try {
        const result = await fetchTeamSuggestions({
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

    loadSuggestions()

    return () => {
      cancelled = true
    }
  }, [hasSelectedPokemon, suggestionsRequestKey, suggestionsRequestPayload])

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
