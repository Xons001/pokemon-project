'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import {
  calculateDamage as requestDamageCalculation,
  fetchCompetitiveFormats,
  fetchItemCatalog,
  fetchPokemonCatalog,
  fetchPokemonDetail,
  fetchPokemonMoves,
} from '../lib/api'
import { createDefaultDamageSide, createDefaultDamageCalculatorState, DAMAGE_CALCULATOR_STORAGE_KEY, sanitizeStoredDamageCalculator } from '../lib/damage-calculator'
import { createCatalogPokemon, createPlaceholderPokemon, formatDexNumber, formatName as formatPokemonName, translateType } from '../lib/pokemon'

function getBattleModeLabel(format) {
  return format?.gameType === 'doubles' ? 'Combate doble' : 'Combate individual'
}

function getFormatHeadline(format) {
  return format?.gameType === 'doubles' ? 'Champions Doubles' : 'Champions Singles'
}

function getPokemonOptionKeywords(entry) {
  return [entry.slug, entry.primaryAbility, entry.primaryType, entry.secondaryType].filter(Boolean)
}

export function useDamageCalculator() {
  const [state, setState] = useState(createDefaultDamageCalculatorState)
  const [competitiveFormats, setCompetitiveFormats] = useState([])
  const [catalog, setCatalog] = useState([])
  const [itemCatalog, setItemCatalog] = useState([])
  const [detailCache, setDetailCache] = useState({})
  const [moveCache, setMoveCache] = useState({})
  const [loadError, setLoadError] = useState('')
  const [calculationError, setCalculationError] = useState('')
  const [calculationResult, setCalculationResult] = useState(null)
  const [isFormatsLoading, setIsFormatsLoading] = useState(true)
  const [isCatalogLoading, setIsCatalogLoading] = useState(true)
  const [isItemsLoading, setIsItemsLoading] = useState(true)
  const [isCalculating, setIsCalculating] = useState(false)
  const [isStorageReady, setIsStorageReady] = useState(false)
  const loadingDetailsRef = useRef(new Set())
  const loadingMovesRef = useRef(new Set())
  const attackerPokemonSlug = state.attacker.pokemonSlug
  const defenderPokemonSlug = state.defender.pokemonSlug

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const storedState = window.localStorage.getItem(DAMAGE_CALCULATOR_STORAGE_KEY)

      if (storedState) {
        setState(sanitizeStoredDamageCalculator(JSON.parse(storedState)))
      }
    } catch {
      setState(createDefaultDamageCalculatorState())
    } finally {
      setIsStorageReady(true)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !isStorageReady) {
      return
    }

    window.localStorage.setItem(DAMAGE_CALCULATOR_STORAGE_KEY, JSON.stringify(state))
  }, [isStorageReady, state])

  useEffect(() => {
    let cancelled = false

    async function loadFormats() {
      try {
        const result = await fetchCompetitiveFormats()

        if (cancelled) {
          return
        }

        setCompetitiveFormats(result.items)
        setLoadError('')
      } catch {
        if (!cancelled) {
          setLoadError('No se pudieron cargar los formatos competitivos para la calculadora.')
        }
      } finally {
        if (!cancelled) {
          setIsFormatsLoading(false)
        }
      }
    }

    loadFormats()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (isFormatsLoading || !competitiveFormats.length) {
      return
    }

    const hasSelectedFormat = competitiveFormats.some((format) => format.key === state.formatKey)

    if (hasSelectedFormat) {
      return
    }

    setState((previous) => ({
      ...previous,
      formatKey: competitiveFormats[0].key,
    }))
  }, [competitiveFormats, isFormatsLoading, state.formatKey])

  useEffect(() => {
    if (!state.formatKey) {
      return
    }

    let cancelled = false

    async function loadCatalogAndItems() {
      setIsCatalogLoading(true)
      setIsItemsLoading(true)

      try {
        const [catalogResult, itemResult] = await Promise.all([
          fetchPokemonCatalog('', {
            scope: 'competitive',
            formatKey: state.formatKey,
          }),
          fetchItemCatalog({
            formatKey: state.formatKey,
          }),
        ])

        if (cancelled) {
          return
        }

        setCatalog(catalogResult.items)
        setItemCatalog(itemResult.items)
        setLoadError('')
      } catch {
        if (!cancelled) {
          setLoadError('No se pudo sincronizar el scope competitivo de la calculadora desde la API interna.')
        }
      } finally {
        if (!cancelled) {
          setIsCatalogLoading(false)
          setIsItemsLoading(false)
        }
      }
    }

    loadCatalogAndItems()

    return () => {
      cancelled = true
    }
  }, [state.formatKey])

  useEffect(() => {
    const pendingSlugs = ['attacker', 'defender']
      .map((sideKey) => (sideKey === 'attacker' ? attackerPokemonSlug : defenderPokemonSlug))
      .filter(Boolean)
      .filter((slug, index, values) => values.indexOf(slug) === index)

    pendingSlugs.forEach((slug) => {
      if (!slug || detailCache[slug] || loadingDetailsRef.current.has(slug)) {
        return
      }

      loadingDetailsRef.current.add(slug)

      fetchPokemonDetail(slug)
        .then((payload) => {
          setDetailCache((previous) => ({
            ...previous,
            [slug]: payload,
          }))
          setLoadError('')
        })
        .catch(() => {
          setLoadError('No se pudo cargar alguna ficha de Pokemon para la calculadora.')
        })
        .finally(() => {
          loadingDetailsRef.current.delete(slug)
        })
    })
  }, [attackerPokemonSlug, defenderPokemonSlug, detailCache])

  useEffect(() => {
    const pendingSlugs = ['attacker', 'defender']
      .map((sideKey) => (sideKey === 'attacker' ? attackerPokemonSlug : defenderPokemonSlug))
      .filter(Boolean)
      .filter((slug, index, values) => values.indexOf(slug) === index)

    pendingSlugs.forEach((slug) => {
      if (!slug || moveCache[slug] || loadingMovesRef.current.has(slug)) {
        return
      }

      loadingMovesRef.current.add(slug)

      fetchPokemonMoves(slug)
        .then((payload) => {
          setMoveCache((previous) => ({
            ...previous,
            [slug]: payload.items,
          }))
          setLoadError('')
        })
        .catch(() => {
          setLoadError('No se pudo cargar algun learnset para la calculadora.')
        })
        .finally(() => {
          loadingMovesRef.current.delete(slug)
        })
    })
  }, [attackerPokemonSlug, defenderPokemonSlug, moveCache])

  useEffect(() => {
    const attackerDefaultAbility = attackerPokemonSlug ? detailCache[attackerPokemonSlug]?.abilities?.[0]?.slug ?? '' : ''
    const defenderDefaultAbility = defenderPokemonSlug ? detailCache[defenderPokemonSlug]?.abilities?.[0]?.slug ?? '' : ''
    const shouldUpdateAttacker = attackerPokemonSlug && !state.attacker.abilitySlug && attackerDefaultAbility
    const shouldUpdateDefender = defenderPokemonSlug && !state.defender.abilitySlug && defenderDefaultAbility

    if (!shouldUpdateAttacker && !shouldUpdateDefender) {
      return
    }

    setState((previous) => {
      return {
        ...previous,
        attacker: shouldUpdateAttacker
          ? {
              ...previous.attacker,
              abilitySlug: attackerDefaultAbility,
            }
          : previous.attacker,
        defender: shouldUpdateDefender
          ? {
              ...previous.defender,
              abilitySlug: defenderDefaultAbility,
            }
          : previous.defender,
      }
    })
  }, [attackerPokemonSlug, defenderPokemonSlug, detailCache, state.attacker.abilitySlug, state.defender.abilitySlug])

  useEffect(() => {
    const selectedMoveSlug =
      state.selectedMove.side === 'attacker'
        ? state.attacker.moveSlugs[state.selectedMove.slot]
        : state.defender.moveSlugs[state.selectedMove.slot]

    if (selectedMoveSlug) {
      return
    }

    const attackerFirst = state.attacker.moveSlugs.findIndex(Boolean)

    if (attackerFirst !== -1) {
      setState((previous) => ({
        ...previous,
        selectedMove: {
          ...previous.selectedMove,
          side: 'attacker',
          slot: attackerFirst,
        },
      }))
      return
    }

    const defenderFirst = state.defender.moveSlugs.findIndex(Boolean)

    if (defenderFirst !== -1) {
      setState((previous) => ({
        ...previous,
        selectedMove: {
          ...previous.selectedMove,
          side: 'defender',
          slot: defenderFirst,
        },
      }))
    }
  }, [state.attacker.moveSlugs, state.defender.moveSlugs, state.selectedMove.side, state.selectedMove.slot])

  const activeFormat = useMemo(() => {
    return competitiveFormats.find((format) => format.key === state.formatKey) ?? competitiveFormats[0] ?? null
  }, [competitiveFormats, state.formatKey])

  const pokemonOptions = useMemo(() => {
    return catalog.map((entry) => ({
      value: entry.slug,
      label: entry.label,
      meta: [entry.primaryType ? translateType(entry.primaryType) : null, entry.secondaryType ? translateType(entry.secondaryType) : null]
        .filter(Boolean)
        .join(' / ') || formatDexNumber(entry.id),
      keywords: getPokemonOptionKeywords(entry),
    }))
  }, [catalog])

  const itemOptions = useMemo(() => {
    return itemCatalog.map((item) => ({
      value: item.slug,
      label: item.label,
      meta: item.category ?? 'item',
      keywords: [item.slug, item.category ?? 'item'],
    }))
  }, [itemCatalog])

  const attackerPokemon = useMemo(() => {
    if (!attackerPokemonSlug) {
      return null
    }

    const entry = catalog.find((item) => item.slug === attackerPokemonSlug)

    if (entry) {
      return createCatalogPokemon(entry)
    }

    const detail = detailCache[attackerPokemonSlug]

    if (detail) {
      return detail
    }

    return createPlaceholderPokemon({
      id: 0,
      slug: attackerPokemonSlug,
      label: formatPokemonName(attackerPokemonSlug),
    })
  }, [attackerPokemonSlug, catalog, detailCache])

  const defenderPokemon = useMemo(() => {
    if (!defenderPokemonSlug) {
      return null
    }

    const entry = catalog.find((item) => item.slug === defenderPokemonSlug)

    if (entry) {
      return createCatalogPokemon(entry)
    }

    const detail = detailCache[defenderPokemonSlug]

    if (detail) {
      return detail
    }

    return createPlaceholderPokemon({
      id: 0,
      slug: defenderPokemonSlug,
      label: formatPokemonName(defenderPokemonSlug),
    })
  }, [catalog, defenderPokemonSlug, detailCache])

  const attackerDetail = attackerPokemonSlug ? detailCache[attackerPokemonSlug] ?? null : null
  const defenderDetail = defenderPokemonSlug ? detailCache[defenderPokemonSlug] ?? null : null
  const attackerMoves = attackerPokemonSlug ? moveCache[attackerPokemonSlug] ?? [] : []
  const defenderMoves = defenderPokemonSlug ? moveCache[defenderPokemonSlug] ?? [] : []

  const calculationPayload = useMemo(() => {
    return {
      formatKey: state.formatKey,
      attacker: state.attacker,
      defender: state.defender,
      field: state.field,
      selectedMove: state.selectedMove,
    }
  }, [state])

  const calculationRequestKey = useMemo(() => JSON.stringify(calculationPayload), [calculationPayload])

  useEffect(() => {
    if (!state.formatKey || !attackerPokemonSlug || !defenderPokemonSlug) {
      setCalculationResult(null)
      setCalculationError('')
      setIsCalculating(false)
      return
    }

    let cancelled = false
    const timeoutId = window.setTimeout(async () => {
      setIsCalculating(true)
      setCalculationError('')

      try {
        const result = await requestDamageCalculation(calculationPayload)

        if (cancelled) {
          return
        }

        setCalculationResult(result)
      } catch (error) {
        if (!cancelled) {
          setCalculationError(error instanceof Error ? error.message : 'No se pudo calcular el dano.')
        }
      } finally {
        if (!cancelled) {
          setIsCalculating(false)
        }
      }
    }, 140)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [attackerPokemonSlug, calculationPayload, calculationRequestKey, defenderPokemonSlug, state.formatKey])

  function updateSide(sideKey, updater) {
    setState((previous) => ({
      ...previous,
      [sideKey]: updater(previous[sideKey]),
    }))
  }

  function setFormatKey(formatKey) {
    setState((previous) => ({
      ...previous,
      formatKey,
    }))
  }

  function setSidePokemon(sideKey, pokemonSlug) {
    updateSide(sideKey, (previousSide) => {
      if (!pokemonSlug) {
        return createDefaultDamageSide()
      }

      return createDefaultDamageSide({
        pokemonSlug,
        level: previousSide.level,
        currentHpPercent: 100,
      })
    })
  }

  function setSideValue(sideKey, key, value) {
    updateSide(sideKey, (previousSide) => ({
      ...previousSide,
      [key]: value,
    }))
  }

  function setSideMove(sideKey, slot, moveSlug) {
    updateSide(sideKey, (previousSide) => {
      const moveSlugs = [...previousSide.moveSlugs]
      moveSlugs[slot] = moveSlug

      return {
        ...previousSide,
        moveSlugs,
      }
    })
  }

  function setSideStat(sideKey, bucket, statKey, value) {
    updateSide(sideKey, (previousSide) => ({
      ...previousSide,
      [bucket]: {
        ...previousSide[bucket],
        [statKey]: value,
      },
    }))
  }

  function toggleFieldFlag(key) {
    setState((previous) => ({
      ...previous,
      field: {
        ...previous.field,
        [key]: !previous.field[key],
      },
    }))
  }

  function setFieldValue(key, value) {
    setState((previous) => ({
      ...previous,
      field: {
        ...previous.field,
        [key]: value,
      },
    }))
  }

  function toggleFieldSideFlag(sideKey, key) {
    setState((previous) => ({
      ...previous,
      field: {
        ...previous.field,
        [sideKey]: {
          ...previous.field[sideKey],
          [key]: !previous.field[sideKey][key],
        },
      },
    }))
  }

  function setFieldSideValue(sideKey, key, value) {
    setState((previous) => ({
      ...previous,
      field: {
        ...previous.field,
        [sideKey]: {
          ...previous.field[sideKey],
          [key]: value,
        },
      },
    }))
  }

  function selectMove(side, slot) {
    setState((previous) => ({
      ...previous,
      selectedMove: {
        ...previous.selectedMove,
        side,
        slot,
      },
    }))
  }

  function setSelectedMoveOption(key, value) {
    setState((previous) => ({
      ...previous,
      selectedMove: {
        ...previous.selectedMove,
        [key]: value,
      },
    }))
  }

  return {
    state,
    activeFormat,
    competitiveFormats: competitiveFormats.map((format) => ({
      ...format,
      headline: getFormatHeadline(format),
      battleModeLabel: getBattleModeLabel(format),
    })),
    pokemonOptions,
    itemOptions,
    attackerPokemon,
    defenderPokemon,
    attackerDetail,
    defenderDetail,
    attackerMoves,
    defenderMoves,
    calculationResult,
    calculationError,
    loadError,
    isFormatsLoading,
    isCatalogLoading,
    isItemsLoading,
    isCalculating,
    setFormatKey,
    setSidePokemon,
    setSideValue,
    setSideMove,
    setSideStat,
    toggleFieldFlag,
    setFieldValue,
    toggleFieldSideFlag,
    setFieldSideValue,
    selectMove,
    setSelectedMoveOption,
  }
}
