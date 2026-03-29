'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createCatalogEntry, createPokemonDetails, createPlaceholderPokemon } from '../lib/pokemon'
import {
  ATTACKING_TYPES,
  TEAM_STORAGE_KEY,
  buildCatalogSearchResults,
  createDefaultTeamTemplates,
  getBalanceLabel,
  normalizeTypeChartEntry,
  sanitizeTeamTemplates,
  summarizeTeam,
} from '../lib/team-builder'

const EXCLUDED_TYPES = new Set(['unknown', 'shadow'])

export function useTeamBuilder() {
  const [catalog, setCatalog] = useState([])
  const [pokemonCache, setPokemonCache] = useState({})
  const [templates, setTemplates] = useState(createDefaultTeamTemplates)
  const [activeTemplateId, setActiveTemplateId] = useState('team-template-1')
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeChart, setTypeChart] = useState({})
  const [isCatalogLoading, setIsCatalogLoading] = useState(true)
  const [isTypeChartLoading, setIsTypeChartLoading] = useState(true)
  const [isPokemonLoading, setIsPokemonLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [notice, setNotice] = useState('Las plantillas se guardan automaticamente en este navegador.')

  const loadingSlugsRef = useRef(new Set())

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const storedTemplates = window.localStorage.getItem(TEAM_STORAGE_KEY)
      if (!storedTemplates) return

      const parsedTemplates = JSON.parse(storedTemplates)
      const sanitizedTemplates = sanitizeTeamTemplates(parsedTemplates)

      setTemplates(sanitizedTemplates)
      setActiveTemplateId(sanitizedTemplates[0]?.id ?? 'team-template-1')
    } catch {
      setTemplates(createDefaultTeamTemplates())
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(templates))
  }, [templates])

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
      } catch {
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

  useEffect(() => {
    let isMounted = true

    async function loadTypeChart() {
      try {
        const response = await fetch('https://pokeapi.co/api/v2/type?limit=100')
        if (!response.ok) {
          throw new Error('No se pudo cargar la tabla de tipos')
        }

        const typeListData = await response.json()
        const battleTypes = typeListData.results.filter((entry) => !EXCLUDED_TYPES.has(entry.name))
        const typeResponses = await Promise.all(
          battleTypes.map(async (entry) => {
            const typeResponse = await fetch(entry.url)
            if (!typeResponse.ok) {
              throw new Error(`No se pudo cargar el tipo ${entry.name}`)
            }

            const typeData = await typeResponse.json()
            return normalizeTypeChartEntry(typeData)
          })
        )

        if (!isMounted) return

        const chart = typeResponses.reduce((accumulator, entry) => {
          accumulator[entry.name] = entry
          return accumulator
        }, {})

        setTypeChart(chart)
      } catch {
        if (!isMounted) return
        setLoadError('No se pudo cargar la tabla de compatibilidades de tipos.')
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
    const targetSlugs = Array.from(
      new Set(
        templates
          .flatMap((template) => template.slots)
          .filter(Boolean)
      )
    )
    const missingSlugs = targetSlugs.filter((slug) => !pokemonCache[slug] && !loadingSlugsRef.current.has(slug))

    if (!missingSlugs.length) {
      setIsPokemonLoading(false)
      return
    }

    setIsPokemonLoading(true)
    missingSlugs.forEach((slug) => loadingSlugsRef.current.add(slug))

    async function loadTeamPokemon() {
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
  }, [catalog, pokemonCache, templates])

  const activeTemplate = useMemo(() => {
    return templates.find((template) => template.id === activeTemplateId) ?? templates[0]
  }, [activeTemplateId, templates])

  const teamMembers = useMemo(() => {
    if (!activeTemplate) return []

    return activeTemplate.slots.map((slug) => {
      if (!slug) return null

      const cachedPokemon = pokemonCache[slug]
      if (cachedPokemon) return cachedPokemon

      const entry = catalog.find((item) => item.slug === slug)
      return entry ? createPlaceholderPokemon(entry) : null
    })
  }, [activeTemplate, catalog, pokemonCache])

  const searchResults = useMemo(() => {
    return buildCatalogSearchResults(catalog, pokemonCache, searchQuery)
  }, [catalog, pokemonCache, searchQuery])

  const activeTemplateSummary = useMemo(() => {
    return summarizeTeam(teamMembers, typeChart)
  }, [teamMembers, typeChart])

  const templateSummaries = useMemo(() => {
    return templates.map((template) => {
      const templateMembers = template.slots.map((slug) => {
        if (!slug) return null
        const cachedPokemon = pokemonCache[slug]
        if (cachedPokemon) return cachedPokemon

        const entry = catalog.find((item) => item.slug === slug)
        return entry ? createPlaceholderPokemon(entry) : null
      })

      const summary = summarizeTeam(templateMembers, typeChart)

      return {
        id: template.id,
        name: template.name,
        filledSlots: summary.filledSlots,
        balanceScore: summary.balanceScore,
        balanceLabel: getBalanceLabel(summary.balanceScore),
      }
    })
  }, [catalog, pokemonCache, templates, typeChart])

  const rankedWeaknesses = useMemo(() => {
    return activeTemplateSummary.weaknesses.slice(0, 6)
  }, [activeTemplateSummary])

  const rankedResistances = useMemo(() => {
    return activeTemplateSummary.resistances.slice(0, 6)
  }, [activeTemplateSummary])

  const strongestTemplate = useMemo(() => {
    if (!templateSummaries.length) return null

    return [...templateSummaries].sort((left, right) => right.balanceScore - left.balanceScore)[0]
  }, [templateSummaries])

  function updateTemplates(updater) {
    setTemplates((previous) => updater(previous))
  }

  function selectTemplate(templateId) {
    setActiveTemplateId(templateId)
    setSelectedSlotIndex(0)
    setNotice('Selecciona un hueco y anade un Pokemon desde el buscador.')
  }

  function renameActiveTemplate(value) {
    updateTemplates((previous) =>
      previous.map((template) =>
        template.id === activeTemplateId
          ? {
              ...template,
              name: value,
            }
          : template
      )
    )
  }

  function selectSlot(index) {
    setSelectedSlotIndex(index)
  }

  function addPokemonToTeam(slug) {
    if (!activeTemplate) return

    const currentSlots = activeTemplate.slots
    const existingIndex = currentSlots.findIndex((value) => value === slug)

    if (existingIndex !== -1 && existingIndex !== selectedSlotIndex) {
      setNotice('Ese Pokemon ya forma parte de esta plantilla.')
      setSelectedSlotIndex(existingIndex)
      return
    }

    const targetIndex =
      typeof selectedSlotIndex === 'number'
        ? selectedSlotIndex
        : currentSlots.findIndex((value) => value === null)

    const safeTargetIndex = targetIndex === -1 ? 0 : targetIndex

    updateTemplates((previous) =>
      previous.map((template) => {
        if (template.id !== activeTemplateId) return template

        const nextSlots = [...template.slots]
        nextSlots[safeTargetIndex] = slug

        return {
          ...template,
          slots: nextSlots,
          leaderSlot: nextSlots[template.leaderSlot] ? template.leaderSlot : safeTargetIndex,
        }
      })
    )

    setSelectedSlotIndex(Math.min(safeTargetIndex + 1, activeTemplate.slots.length - 1))
    setNotice('Pokemon anadido a la plantilla activa.')
  }

  function removePokemonFromTeam(index) {
    updateTemplates((previous) =>
      previous.map((template) => {
        if (template.id !== activeTemplateId) return template

        const nextSlots = [...template.slots]
        nextSlots[index] = null

        const nextLeaderSlot = nextSlots[template.leaderSlot]
          ? template.leaderSlot
          : Math.max(
              0,
              nextSlots.findIndex(Boolean)
            )

        return {
          ...template,
          slots: nextSlots,
          leaderSlot: nextLeaderSlot === -1 ? 0 : nextLeaderSlot,
        }
      })
    )

    setSelectedSlotIndex(index)
    setNotice('Hueco liberado para otro Pokemon.')
  }

  function clearActiveTemplate() {
    updateTemplates((previous) =>
      previous.map((template) =>
        template.id === activeTemplateId
          ? {
              ...template,
              slots: Array(template.slots.length).fill(null),
              leaderSlot: 0,
            }
          : template
      )
    )

    setSelectedSlotIndex(0)
    setNotice('Plantilla vaciada. Puedes volver a construirla desde cero.')
  }

  function setLeaderSlot(index) {
    updateTemplates((previous) =>
      previous.map((template) =>
        template.id === activeTemplateId
          ? {
              ...template,
              leaderSlot: index,
            }
          : template
      )
    )

    setNotice('Pokemon marcado como lider destacado del equipo.')
  }

  return {
    activeTemplate,
    activeTemplateSummary,
    catalogCount: catalog.length,
    isCatalogLoading,
    isPokemonLoading,
    isTypeChartLoading,
    loadError,
    notice,
    rankedResistances,
    rankedWeaknesses,
    searchQuery,
    searchResults,
    selectedSlotIndex,
    setSearchQuery,
    selectSlot,
    addPokemonToTeam,
    removePokemonFromTeam,
    clearActiveTemplate,
    renameActiveTemplate,
    selectTemplate,
    setLeaderSlot,
    strongestTemplate,
    teamMembers,
    templateSummaries,
    typeAnalysis: activeTemplateSummary.typeAnalysis,
    typeChartReady: Object.keys(typeChart).length === ATTACKING_TYPES.length,
  }
}
