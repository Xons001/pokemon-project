import { createPlaceholderPokemon, formatDexNumber, translateType } from './pokemon'

export const TEAM_STORAGE_KEY = 'pokemon-project-team-templates-v1'
export const TEAM_TEMPLATE_LIMIT = 5
export const TEAM_SIZE = 6
export const TEAM_SEARCH_LIMIT = 18

export const ATTACKING_TYPES = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
]

export function createDefaultTeamTemplates() {
  return Array.from({ length: TEAM_TEMPLATE_LIMIT }, (_, index) => ({
    id: `team-template-${index + 1}`,
    name: `Plantilla ${index + 1}`,
    slots: Array(TEAM_SIZE).fill(null),
    leaderSlot: 0,
  }))
}

export function sanitizeTeamTemplates(value) {
  if (!Array.isArray(value) || !value.length) {
    return createDefaultTeamTemplates()
  }

  const defaults = createDefaultTeamTemplates()

  return defaults.map((template, index) => {
    const source = value[index] ?? {}
    const safeSlots = Array.isArray(source.slots)
      ? source.slots.slice(0, TEAM_SIZE).map((slot) => (typeof slot === 'string' ? slot : null))
      : template.slots

    while (safeSlots.length < TEAM_SIZE) {
      safeSlots.push(null)
    }

    return {
      id: typeof source.id === 'string' ? source.id : template.id,
      name: typeof source.name === 'string' && source.name.trim() ? source.name.trim() : template.name,
      slots: safeSlots,
      leaderSlot:
        Number.isInteger(source.leaderSlot) && source.leaderSlot >= 0 && source.leaderSlot < TEAM_SIZE
          ? source.leaderSlot
          : template.leaderSlot,
    }
  })
}

export function buildCatalogSearchResults(catalog, pokemonCache, query) {
  const normalized = query.trim().toLowerCase()
  const baseResults = normalized
    ? catalog.filter((entry) => {
        const cached = pokemonCache[entry.slug]
        const haystack = [
          entry.label,
          entry.slug,
          formatDexNumber(entry.id),
          cached?.type,
          ...(cached?.types ?? []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return haystack.includes(normalized)
      })
    : catalog

  return baseResults.slice(0, TEAM_SEARCH_LIMIT).map((entry) => {
    return pokemonCache[entry.slug] ?? createPlaceholderPokemon(entry)
  })
}

export function normalizeTypeChartEntry(typeData) {
  return {
    name: typeData.name,
    doubleDamageFrom: typeData.damage_relations.double_damage_from.map((entry) => entry.name),
    halfDamageFrom: typeData.damage_relations.half_damage_from.map((entry) => entry.name),
    noDamageFrom: typeData.damage_relations.no_damage_from.map((entry) => entry.name),
  }
}

export function getSingleTypeMultiplier(attackingType, defendingType, typeChart) {
  const relations = typeChart[defendingType]

  if (!relations) {
    return 1
  }

  if (relations.noDamageFrom.includes(attackingType)) {
    return 0
  }

  let multiplier = 1

  if (relations.doubleDamageFrom.includes(attackingType)) {
    multiplier *= 2
  }

  if (relations.halfDamageFrom.includes(attackingType)) {
    multiplier *= 0.5
  }

  return multiplier
}

export function getPokemonDefensiveMultiplier(pokemon, attackingType, typeChart) {
  if (!pokemon || pokemon.isPlaceholder || !pokemon.typeKeys?.length) {
    return 1
  }

  return pokemon.typeKeys.reduce((multiplier, defendingType) => {
    return multiplier * getSingleTypeMultiplier(attackingType, defendingType, typeChart)
  }, 1)
}

export function buildTeamTypeAnalysis(teamMembers, typeChart) {
  return ATTACKING_TYPES.map((attackingType) => {
    const multipliers = teamMembers
      .filter(Boolean)
      .map((pokemon) => getPokemonDefensiveMultiplier(pokemon, attackingType, typeChart))

    const weakCount = multipliers.filter((value) => value > 1).length
    const superWeakCount = multipliers.filter((value) => value >= 4).length
    const resistCount = multipliers.filter((value) => value > 0 && value < 1).length
    const immuneCount = multipliers.filter((value) => value === 0).length
    const neutralCount = multipliers.filter((value) => value === 1).length

    return {
      type: attackingType,
      label: translateType(attackingType),
      multipliers,
      weakCount,
      superWeakCount,
      resistCount,
      immuneCount,
      neutralCount,
      maxMultiplier: multipliers.length ? Math.max(...multipliers) : 1,
      riskScore: weakCount + superWeakCount * 2 - resistCount - immuneCount * 2,
      stabilityScore: resistCount + immuneCount * 2 - weakCount - superWeakCount * 2,
    }
  })
}

export function summarizeTeam(teamMembers, typeChart) {
  const filledSlots = teamMembers.filter(Boolean).length
  const readyMembers = teamMembers.filter((pokemon) => pokemon && !pokemon.isPlaceholder)
  const typeAnalysis = buildTeamTypeAnalysis(readyMembers, typeChart)
  const weaknesses = [...typeAnalysis]
    .filter((entry) => entry.weakCount > 0)
    .sort((left, right) => right.riskScore - left.riskScore || right.maxMultiplier - left.maxMultiplier)
  const resistances = [...typeAnalysis]
    .filter((entry) => entry.resistCount > 0 || entry.immuneCount > 0)
    .sort((left, right) => right.stabilityScore - left.stabilityScore || right.immuneCount - left.immuneCount)
  const balanceScore = typeAnalysis.reduce((total, entry) => total + entry.stabilityScore, 0)

  return {
    filledSlots,
    readyMembers: readyMembers.length,
    balanceScore,
    typeAnalysis,
    weaknesses,
    resistances,
  }
}

export function getBalanceLabel(balanceScore) {
  if (balanceScore >= 8) {
    return 'Muy compensado'
  }

  if (balanceScore >= 2) {
    return 'Bastante estable'
  }

  if (balanceScore >= -4) {
    return 'Equilibrio medio'
  }

  return 'Fragil ante counters'
}
