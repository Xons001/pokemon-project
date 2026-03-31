import { createCatalogPokemon, formatAbility, formatDexNumber, translateType } from './pokemon'

export const TEAM_STORAGE_KEY = 'pokemon-project-team-v2'
export const LEGACY_TEAM_TEMPLATES_STORAGE_KEY = 'pokemon-project-team-templates-v1'
export const TEAM_SIZE = 6
export const TEAM_MOVE_SLOTS = 4
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

export function createEmptyTeamSlot() {
  return {
    pokemonSlug: null,
    moveSlugs: Array(TEAM_MOVE_SLOTS).fill(null),
  }
}

export function createTeamSlot(pokemonSlug) {
  return {
    ...createEmptyTeamSlot(),
    pokemonSlug,
  }
}

export function createDefaultTeam() {
  return {
    name: 'Equipo principal',
    slots: Array.from({ length: TEAM_SIZE }, () => createEmptyTeamSlot()),
    leaderSlot: 0,
  }
}

function sanitizeTeamSlot(value) {
  if (typeof value === 'string') {
    return createTeamSlot(value)
  }

  if (!value || typeof value !== 'object') {
    return createEmptyTeamSlot()
  }

  const safeMoveSlugs = Array.isArray(value.moveSlugs)
    ? value.moveSlugs.slice(0, TEAM_MOVE_SLOTS).map((moveSlug) => (typeof moveSlug === 'string' ? moveSlug : null))
    : []

  while (safeMoveSlugs.length < TEAM_MOVE_SLOTS) {
    safeMoveSlugs.push(null)
  }

  return {
    pokemonSlug: typeof value.pokemonSlug === 'string' ? value.pokemonSlug : null,
    moveSlugs: safeMoveSlugs,
  }
}

function sanitizeSlots(value) {
  const safeSlots = Array.isArray(value) ? value.slice(0, TEAM_SIZE).map((slot) => sanitizeTeamSlot(slot)) : []

  while (safeSlots.length < TEAM_SIZE) {
    safeSlots.push(createEmptyTeamSlot())
  }

  return safeSlots
}

export function sanitizeStoredTeam(value) {
  const defaultTeam = createDefaultTeam()
  const safeSlots = sanitizeSlots(value?.slots)

  return {
    name: typeof value?.name === 'string' && value.name.trim() ? value.name.trim() : defaultTeam.name,
    slots: safeSlots,
    leaderSlot:
      Number.isInteger(value?.leaderSlot) && value.leaderSlot >= 0 && value.leaderSlot < TEAM_SIZE
        ? value.leaderSlot
        : defaultTeam.leaderSlot,
  }
}

export function migrateLegacyTemplates(value) {
  if (!Array.isArray(value) || !value.length) {
    return createDefaultTeam()
  }

  const source = value[0] ?? {}

  return sanitizeStoredTeam({
    name: source.name,
    slots: source.slots,
    leaderSlot: source.leaderSlot,
  })
}

export function buildCatalogSearchResults(catalog, query) {
  const normalized = query.trim().toLowerCase()
  const baseResults = normalized
    ? catalog.filter((entry) => {
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
    : catalog

  return baseResults.slice(0, TEAM_SEARCH_LIMIT).map((entry) => createCatalogPokemon(entry))
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
    return null
  }

  return pokemon.typeKeys.reduce((multiplier, defendingType) => {
    return multiplier * getSingleTypeMultiplier(attackingType, defendingType, typeChart)
  }, 1)
}

export function buildTeamTypeAnalysis(teamMembers, typeChart) {
  return ATTACKING_TYPES.map((attackingType) => {
    const slotMultipliers = teamMembers.map((pokemon) => getPokemonDefensiveMultiplier(pokemon, attackingType, typeChart))
    const multipliers = slotMultipliers.filter((value) => typeof value === 'number')
    const weakCount = multipliers.filter((value) => value > 1).length
    const superWeakCount = multipliers.filter((value) => value >= 4).length
    const resistCount = multipliers.filter((value) => value > 0 && value < 1).length
    const immuneCount = multipliers.filter((value) => value === 0).length
    const neutralCount = multipliers.filter((value) => value === 1).length

    return {
      type: attackingType,
      label: translateType(attackingType),
      slotMultipliers,
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
  const typeAnalysis = buildTeamTypeAnalysis(teamMembers, typeChart)
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
