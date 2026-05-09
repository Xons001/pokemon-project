import { DEFAULT_LOCALE, getMessages } from './i18n'
import {
  createCatalogPokemon,
  formatAbility,
  formatDexNumber,
  formatResourceName,
  translateType,
} from './pokemon'

export const TEAM_STORAGE_KEY = 'pokemon-project-team-v2'
export const LEGACY_TEAM_TEMPLATES_STORAGE_KEY = 'pokemon-project-team-templates-v1'
export const TEAM_SIZE = 6
export const TEAM_MOVE_SLOTS = 4
export const TEAM_SEARCH_PAGE_SIZE = 18
export const DEFAULT_TEAM_FORMAT = 'gen9ou'
export const TEAM_STAT_LEVEL = 50
export const TEAM_MAX_EVS = 66
export const TEAM_MAX_EVS_PER_STAT = 32
export const TEAM_EVS_STEP = 1
export const TEAM_MAX_IVS_PER_STAT = 31
export const TEAM_STAT_KEYS = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed']

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

const STAT_LABELS = {
  hp: 'HP',
  attack: 'Atk',
  defense: 'Def',
  specialAttack: 'SpA',
  specialDefense: 'SpD',
  speed: 'Spe',
}

function getTeamBuilderMessages(locale = DEFAULT_LOCALE) {
  return getMessages(locale).teamBuilder ?? {}
}

function getMoveUtilityLabels(locale = DEFAULT_LOCALE) {
  return getTeamBuilderMessages(locale).moveUtility ?? {}
}

const HAZARD_MOVE_IDS = new Set(['stealthrock', 'spikes', 'toxicspikes', 'stickyweb'])
const HAZARD_REMOVAL_MOVE_IDS = new Set(['defog', 'rapidspin', 'mortalspin', 'tidyup', 'courtchange'])
const PIVOT_MOVE_IDS = new Set(['uturn', 'voltswitch', 'flipturn', 'partingshot', 'teleport', 'chillyreception'])
const RECOVERY_MOVE_IDS = new Set([
  'recover',
  'roost',
  'slackoff',
  'softboiled',
  'milkdrink',
  'moonlight',
  'morningsun',
  'synthesis',
  'shoreup',
  'wish',
  'rest',
  'healorder',
  'junglehealing',
  'strengthsap',
  'lifedew',
  'leechseed',
])
const STATUS_MOVE_IDS = new Set([
  'toxic',
  'thunderwave',
  'willowisp',
  'spore',
  'sleeppowder',
  'stunspore',
  'glare',
  'yawn',
  'encore',
  'taunt',
  'toxicthread',
])
const BOOSTING_MOVE_IDS = new Set([
  'swordsdance',
  'nastyplot',
  'dragondance',
  'calmmind',
  'bulkup',
  'quiverdance',
  'agility',
  'shellsmash',
  'irondefense',
  'cosmicpower',
  'trailblaze',
  'curse',
  'howl',
  'workup',
  'shiftgear',
  'growth',
  'flamecharge',
])

const NATURE_DEFINITIONS = [
  { key: 'hardy', label: 'Hardy', localizedLabel: 'Fuerte', increasedStat: null, decreasedStat: null },
  { key: 'lonely', label: 'Lonely', localizedLabel: 'Huraña', increasedStat: 'attack', decreasedStat: 'defense' },
  { key: 'brave', label: 'Brave', localizedLabel: 'Audaz', increasedStat: 'attack', decreasedStat: 'speed' },
  { key: 'adamant', label: 'Adamant', localizedLabel: 'Firme', increasedStat: 'attack', decreasedStat: 'specialAttack' },
  { key: 'naughty', label: 'Naughty', localizedLabel: 'Picara', increasedStat: 'attack', decreasedStat: 'specialDefense' },
  { key: 'bold', label: 'Bold', localizedLabel: 'Osada', increasedStat: 'defense', decreasedStat: 'attack' },
  { key: 'docile', label: 'Docile', localizedLabel: 'Docil', increasedStat: null, decreasedStat: null },
  { key: 'relaxed', label: 'Relaxed', localizedLabel: 'Placida', increasedStat: 'defense', decreasedStat: 'speed' },
  { key: 'impish', label: 'Impish', localizedLabel: 'Agitada', increasedStat: 'defense', decreasedStat: 'specialAttack' },
  { key: 'lax', label: 'Lax', localizedLabel: 'Floja', increasedStat: 'defense', decreasedStat: 'specialDefense' },
  { key: 'timid', label: 'Timid', localizedLabel: 'Miedosa', increasedStat: 'speed', decreasedStat: 'attack' },
  { key: 'hasty', label: 'Hasty', localizedLabel: 'Activa', increasedStat: 'speed', decreasedStat: 'defense' },
  { key: 'serious', label: 'Serious', localizedLabel: 'Seria', increasedStat: null, decreasedStat: null },
  { key: 'jolly', label: 'Jolly', localizedLabel: 'Alegre', increasedStat: 'speed', decreasedStat: 'specialAttack' },
  { key: 'naive', label: 'Naive', localizedLabel: 'Ingenua', increasedStat: 'speed', decreasedStat: 'specialDefense' },
  { key: 'modest', label: 'Modest', localizedLabel: 'Modesta', increasedStat: 'specialAttack', decreasedStat: 'attack' },
  { key: 'mild', label: 'Mild', localizedLabel: 'Afable', increasedStat: 'specialAttack', decreasedStat: 'defense' },
  { key: 'quiet', label: 'Quiet', localizedLabel: 'Mansa', increasedStat: 'specialAttack', decreasedStat: 'speed' },
  { key: 'bashful', label: 'Bashful', localizedLabel: 'Timida', increasedStat: null, decreasedStat: null },
  { key: 'rash', label: 'Rash', localizedLabel: 'Alocada', increasedStat: 'specialAttack', decreasedStat: 'specialDefense' },
  { key: 'calm', label: 'Calm', localizedLabel: 'Serena', increasedStat: 'specialDefense', decreasedStat: 'attack' },
  { key: 'gentle', label: 'Gentle', localizedLabel: 'Amable', increasedStat: 'specialDefense', decreasedStat: 'defense' },
  { key: 'sassy', label: 'Sassy', localizedLabel: 'Grosera', increasedStat: 'specialDefense', decreasedStat: 'speed' },
  { key: 'careful', label: 'Careful', localizedLabel: 'Cauta', increasedStat: 'specialDefense', decreasedStat: 'specialAttack' },
  { key: 'quirky', label: 'Quirky', localizedLabel: 'Rara', increasedStat: null, decreasedStat: null },
]

const NATURE_MAP = new Map(NATURE_DEFINITIONS.map((nature) => [nature.key, nature]))

function sanitizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.'']/g, '')
    .replace(/[%:]/g, '')
    .replace(/♀/g, '-f')
    .replace(/♂/g, '-m')
}

export function normalizeTeamResourceId(value) {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = sanitizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')

  return normalized || null
}

export const TEAM_POKEMON_SLUG_ALIASES = {
  aegislash: 'aegislash-shield',
  basculegion: 'basculegion-male',
  'basculegion-m': 'basculegion-male',
  basculegionm: 'basculegion-male',
  'basculegion-f': 'basculegion-female',
  basculegionf: 'basculegion-female',
  floetteeternal: 'floette-eternal',
  'floette-eternal-flower': 'floette-eternal',
  floetteeternalflower: 'floette-eternal',
  'rotom-wash': 'wash-rotom',
  rotomwash: 'wash-rotom',
  'rotom-heat': 'heat-rotom',
  rotomheat: 'heat-rotom',
  'rotom-frost': 'frost-rotom',
  rotomfrost: 'frost-rotom',
  'rotom-fan': 'fan-rotom',
  rotomfan: 'fan-rotom',
  'rotom-mow': 'mow-rotom',
  rotommow: 'mow-rotom',
}

export function normalizeTeamPokemonSlug(value) {
  const normalized = normalizeTeamResourceId(value)
  return normalized ? TEAM_POKEMON_SLUG_ALIASES[normalized] ?? normalized : null
}

export function toCompetitiveResourceId(value) {
  return normalizeTeamResourceId(value)?.replace(/-/g, '') ?? ''
}

export function getTeamNatures(locale = DEFAULT_LOCALE) {
  return NATURE_DEFINITIONS.map((nature) => ({
    ...nature,
    displayLabel: getNatureLabel(nature.key, locale),
    summary: getNatureSummary(nature.key, locale),
  }))
}

export const TEAM_NATURES = getTeamNatures()

export function createDefaultEffortValues() {
  return {
    hp: 0,
    attack: 0,
    defense: 0,
    specialAttack: 0,
    specialDefense: 0,
    speed: 0,
  }
}

export function createDefaultIndividualValues() {
  return {
    hp: 31,
    attack: 31,
    defense: 31,
    specialAttack: 31,
    specialDefense: 31,
    speed: 31,
  }
}

export function normalizeNatureKey(value) {
  const normalized = normalizeTeamResourceId(value)
  return normalized && NATURE_MAP.has(normalized) ? normalized : null
}

export function getNatureOption(natureKey) {
  return NATURE_MAP.get(normalizeNatureKey(natureKey) ?? '') ?? null
}

export function getNatureLabel(natureKey, locale = DEFAULT_LOCALE) {
  const nature = getNatureOption(natureKey)

  if (!nature) {
    return ''
  }

  return locale === 'es' ? `${nature.localizedLabel} (${nature.label})` : nature.label
}

export function getNatureSummary(natureKey, locale = DEFAULT_LOCALE) {
  const nature = getNatureOption(natureKey)

  if (!nature) {
    return getTeamBuilderMessages(locale).noNature ?? 'Sin naturaleza'
  }

  const label = getNatureLabel(nature.key, locale)

  if (!nature.increasedStat || !nature.decreasedStat) {
    return `${label} (neutral)`
  }

  return `${label} (+${STAT_LABELS[nature.increasedStat]}, -${STAT_LABELS[nature.decreasedStat]})`
}

export function getNatureModifier(natureKey, statKey) {
  const nature = getNatureOption(natureKey)

  if (!nature || statKey === 'hp') {
    return 1
  }

  if (nature.increasedStat === statKey) {
    return 1.1
  }

  if (nature.decreasedStat === statKey) {
    return 0.9
  }

  return 1
}

function normalizeEffortValue(value) {
  if (!Number.isFinite(Number(value))) {
    return 0
  }

  const normalized = Math.round(Number(value) / TEAM_EVS_STEP) * TEAM_EVS_STEP
  return Math.min(Math.max(normalized, 0), TEAM_MAX_EVS_PER_STAT)
}

function normalizeIndividualValue(value) {
  if (!Number.isFinite(Number(value))) {
    return TEAM_MAX_IVS_PER_STAT
  }

  return Math.min(Math.max(Math.round(Number(value)), 0), TEAM_MAX_IVS_PER_STAT)
}

export function convertChampionsPointsToStandardEvs(value) {
  const safeValue = normalizeEffortValue(value)

  if (safeValue <= 0) {
    return 0
  }

  return Math.min(252, 4 + (safeValue - 1) * 8)
}

function sanitizeEffortValues(value) {
  const base = createDefaultEffortValues()

  TEAM_STAT_KEYS.forEach((statKey) => {
    base[statKey] = normalizeEffortValue(value?.[statKey])
  })

  let total = Object.values(base).reduce((sum, statValue) => sum + statValue, 0)

  if (total <= TEAM_MAX_EVS) {
    return base
  }

  const next = { ...base }

  for (const statKey of TEAM_STAT_KEYS) {
    if (total <= TEAM_MAX_EVS) {
      break
    }

    const overflow = total - TEAM_MAX_EVS
    const deduction = Math.min(next[statKey], Math.ceil(overflow / TEAM_EVS_STEP) * TEAM_EVS_STEP)
    next[statKey] -= deduction
    total -= deduction
  }

  return next
}

function sanitizeIndividualValues(value) {
  const base = createDefaultIndividualValues()

  TEAM_STAT_KEYS.forEach((statKey) => {
    base[statKey] = normalizeIndividualValue(value?.[statKey])
  })

  return base
}

function sanitizeMoveSlugs(value) {
  const safeMoveSlugs = Array.isArray(value)
    ? value
        .slice(0, TEAM_MOVE_SLOTS)
        .map((moveSlug) => normalizeTeamResourceId(moveSlug))
        .map((moveSlug) => moveSlug || null)
    : []

  while (safeMoveSlugs.length < TEAM_MOVE_SLOTS) {
    safeMoveSlugs.push(null)
  }

  return safeMoveSlugs
}

export function createEmptyTeamSlot() {
  return {
    pokemonSlug: null,
    abilitySlug: null,
    itemSlug: null,
    natureKey: null,
    moveSlugs: Array(TEAM_MOVE_SLOTS).fill(null),
    evs: createDefaultEffortValues(),
    ivs: createDefaultIndividualValues(),
  }
}

export function createTeamSlot(pokemonSlug, overrides = {}) {
  return {
    ...createEmptyTeamSlot(),
    pokemonSlug: normalizeTeamPokemonSlug(pokemonSlug),
    abilitySlug: normalizeTeamResourceId(overrides.abilitySlug),
    itemSlug: normalizeTeamResourceId(overrides.itemSlug),
    natureKey: normalizeNatureKey(overrides.natureKey),
    moveSlugs: sanitizeMoveSlugs(overrides.moveSlugs),
    evs: sanitizeEffortValues(overrides.evs),
    ivs: sanitizeIndividualValues(overrides.ivs),
  }
}

export function createDefaultTeam(formatKey = DEFAULT_TEAM_FORMAT, locale = DEFAULT_LOCALE) {
  return {
    name: getTeamBuilderMessages(locale).defaultTeamName ?? 'Equipo principal',
    formatKey,
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

  return {
    pokemonSlug: normalizeTeamPokemonSlug(value.pokemonSlug),
    abilitySlug: normalizeTeamResourceId(value.abilitySlug),
    itemSlug: normalizeTeamResourceId(value.itemSlug),
    natureKey: normalizeNatureKey(value.natureKey),
    moveSlugs: sanitizeMoveSlugs(value.moveSlugs),
    evs: sanitizeEffortValues(value.evs),
    ivs: sanitizeIndividualValues(value.ivs),
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
    formatKey:
      typeof value?.formatKey === 'string' && value.formatKey.trim() ? value.formatKey.trim().toLowerCase() : defaultTeam.formatKey,
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

export function buildCatalogSearchResults(catalog, query, locale = DEFAULT_LOCALE) {
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
          entry.primaryType ? translateType(entry.primaryType, locale) : null,
          entry.secondaryType ? translateType(entry.secondaryType, locale) : null,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return haystack.includes(normalized)
      })
    : catalog

  return baseResults.map((entry) => createCatalogPokemon(entry, locale))
}

export function normalizeTypeChartEntry(typeData) {
  return {
    name: typeData.name,
    doubleDamageFrom: typeData.damage_relations.double_damage_from.map((entry) => entry.name),
    halfDamageFrom: typeData.damage_relations.half_damage_from.map((entry) => entry.name),
    noDamageFrom: typeData.damage_relations.no_damage_from.map((entry) => entry.name),
  }
}

export function getEffortValueTotal(evs) {
  return TEAM_STAT_KEYS.reduce((sum, statKey) => sum + (Number(evs?.[statKey]) || 0), 0)
}

export function buildUpdatedEffortValues(currentEvs, statKey, nextValue) {
  const nextEvs = {
    ...createDefaultEffortValues(),
    ...currentEvs,
  }

  const normalizedValue = normalizeEffortValue(nextValue)
  const totalWithoutCurrent = TEAM_STAT_KEYS.reduce((sum, key) => {
    return key === statKey ? sum : sum + (Number(nextEvs[key]) || 0)
  }, 0)
  const allowedValue = Math.max(0, Math.min(normalizedValue, TEAM_MAX_EVS - totalWithoutCurrent))

  nextEvs[statKey] = allowedValue

  return nextEvs
}

export function buildUpdatedIndividualValues(currentIvs, statKey, nextValue) {
  return {
    ...createDefaultIndividualValues(),
    ...currentIvs,
    [statKey]: normalizeIndividualValue(nextValue),
  }
}

export function calculateBattleStat({ base, iv, ev, level = TEAM_STAT_LEVEL, statKey, natureKey = null }) {
  const safeBase = Number(base) || 0
  const safeIv = normalizeIndividualValue(iv)
  const safeEv = convertChampionsPointsToStandardEvs(ev)
  const isHp = statKey === 'hp'

  if (isHp) {
    return Math.floor(((2 * safeBase + safeIv + Math.floor(safeEv / 4)) * level) / 100) + level + 10
  }

  const rawStat = Math.floor(((2 * safeBase + safeIv + Math.floor(safeEv / 4)) * level) / 100) + 5
  return Math.floor(rawStat * getNatureModifier(natureKey, statKey))
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

export function createFallbackMoveEntry(moveSlug) {
  if (!moveSlug) {
    return null
  }

  return {
    move: formatResourceName(moveSlug),
    moveSlug,
    type: getTeamBuilderMessages().pendingType ?? 'Tipo pendiente',
    typeKey: null,
    category: getTeamBuilderMessages().pendingCategory ?? 'Pendiente',
    categoryKey: null,
    power: null,
    accuracy: null,
    pp: null,
    priority: null,
    learnMethods: [],
    learnMethodKeys: [],
    versionGroups: [],
    versionGroupKeys: [],
    level: null,
  }
}

export function buildTeamTypeAnalysis(teamMembers, typeChart, locale = DEFAULT_LOCALE) {
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
      label: translateType(attackingType, locale),
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

function isDamagingMove(move) {
  return Boolean(move?.typeKey) && move?.categoryKey !== 'status'
}

function getAttackBias(attack, specialAttack) {
  const physical = Number(attack) || 0
  const special = Number(specialAttack) || 0

  if (physical >= special + 15) {
    return 'physical'
  }

  if (special >= physical + 15) {
    return 'special'
  }

  return 'mixed'
}

function getMoveUtilityTags(move) {
  const moveId = toCompetitiveResourceId(move?.moveSlug)
  const priority = Number(move?.priority) || 0
  const tags = new Set()

  if (!moveId) {
    return tags
  }

  if (HAZARD_MOVE_IDS.has(moveId)) {
    tags.add('hazard')
  }

  if (HAZARD_REMOVAL_MOVE_IDS.has(moveId)) {
    tags.add('hazardRemoval')
  }

  if (PIVOT_MOVE_IDS.has(moveId)) {
    tags.add('pivot')
  }

  if (RECOVERY_MOVE_IDS.has(moveId)) {
    tags.add('recovery')
  }

  if (STATUS_MOVE_IDS.has(moveId)) {
    tags.add('status')
  }

  if (BOOSTING_MOVE_IDS.has(moveId)) {
    tags.add('boosting')
  }

  if (priority > 0) {
    tags.add('priority')
  }

  return tags
}

function buildTeamMoveCoverage(teamMoveMatrix, typeChart, locale = DEFAULT_LOCALE) {
  const damagingMoves = teamMoveMatrix
    .flat()
    .filter((move) => isDamagingMove(move))
    .map((move) => ({
      moveSlug: move.moveSlug,
      label: move.move ?? formatResourceName(move.moveSlug),
      typeKey: move.typeKey,
      typeLabel: move.type ?? translateType(move.typeKey, locale),
    }))

  const entries = ATTACKING_TYPES.map((defendingType) => {
    const moveHits = damagingMoves
      .map((move) => ({
        ...move,
        multiplier: getSingleTypeMultiplier(move.typeKey, defendingType, typeChart),
      }))
      .sort((left, right) => right.multiplier - left.multiplier || left.label.localeCompare(right.label))
    const bestMultiplier = moveHits.length ? moveHits[0].multiplier : 0
    const bestMoves = moveHits.filter((entry) => entry.multiplier === bestMultiplier).slice(0, 3)
    const superEffectiveCount = moveHits.filter((entry) => entry.multiplier > 1).length
    const resistedCount = moveHits.filter((entry) => entry.multiplier > 0 && entry.multiplier < 1).length

    return {
      type: defendingType,
      label: translateType(defendingType, locale),
      bestMultiplier,
      bestMoves,
      superEffectiveCount,
      resistedCount,
      damagingMoveCount: damagingMoves.length,
      pressureScore:
        bestMultiplier >= 4
          ? 5
          : bestMultiplier >= 2
            ? 3 + Math.min(superEffectiveCount, 2) * 0.5
            : bestMultiplier === 1
              ? 1
              : bestMultiplier > 0
                ? -1
                : -2,
    }
  })

  const strongCoverage = [...entries]
    .filter((entry) => entry.bestMultiplier >= 2)
    .sort((left, right) => right.pressureScore - left.pressureScore || right.bestMultiplier - left.bestMultiplier)
  const limitedCoverage = [...entries]
    .filter((entry) => entry.bestMultiplier <= 1)
    .sort((left, right) => left.pressureScore - right.pressureScore || left.bestMultiplier - right.bestMultiplier)
  const coverageScore = entries.reduce((total, entry) => total + entry.pressureScore, 0)

  return {
    damagingMoveCount: damagingMoves.length,
    entries,
    strongCoverage,
    limitedCoverage,
    coveredTypes: strongCoverage.length,
    uncoveredTypes: limitedCoverage.length,
    coverageScore,
  }
}

function buildSlotArchetype(slot, pokemon, selectedMoves, slotIndex, locale = DEFAULT_LOCALE) {
  if (!pokemon) {
    return null
  }

  const utilityTags = new Set(selectedMoves.flatMap((move) => Array.from(getMoveUtilityTags(move))))
  const damagingMoves = selectedMoves.filter((move) => isDamagingMove(move))
  const attackBias = getAttackBias(pokemon.attack, pokemon.specialAttack)
  const hp = Number(pokemon.hp) || 0
  const attack = Number(pokemon.attack) || 0
  const defense = Number(pokemon.defense) || 0
  const specialAttack = Number(pokemon.specialAttack) || 0
  const specialDefense = Number(pokemon.specialDefense) || 0
  const speed = Number(pokemon.speed) || 0
  const bulkScore = hp + defense + specialDefense
  const powerScore = Math.max(attack, specialAttack)
  const boostedSpeed = getNatureModifier(slot?.natureKey, 'speed') > 1 || speed >= 105
  const labels = []
  const archetypes = getTeamBuilderMessages(locale).archetypes ?? {}

  if (utilityTags.has('hazard') && boostedSpeed) {
    labels.push(archetypes.hazardLead ?? 'lead de hazards')
  } else if (utilityTags.has('hazard')) {
    labels.push(archetypes.hazardStack ?? 'hazard stack')
  }

  if (utilityTags.has('hazardRemoval')) {
    labels.push(archetypes.hazardControl ?? 'control de hazards')
  }

  if (utilityTags.has('pivot') && bulkScore >= 250) {
    labels.push(archetypes.bulkyPivot ?? 'pivot bulky')
  } else if (utilityTags.has('pivot')) {
    labels.push(archetypes.pivot ?? 'pivot')
  }

  if (utilityTags.has('boosting') && boostedSpeed && powerScore >= 105) {
    labels.push(archetypes.setupSweeper ?? 'setup sweeper')
  } else if (utilityTags.has('boosting')) {
    labels.push(archetypes.setupBreaker ?? 'setup breaker')
  }

  if (utilityTags.has('recovery') && bulkScore >= 250) {
    labels.push(archetypes.wall ?? 'muro')
  }

  if (utilityTags.has('status') && bulkScore >= 240) {
    labels.push(archetypes.statusSupport ?? 'soporte de estado')
  }

  if (utilityTags.has('priority') && powerScore >= 100) {
    labels.push(archetypes.revengeKiller ?? 'revenge killer')
  }

  if (!labels.length && damagingMoves.length >= 3 && powerScore >= 120) {
    labels.push(archetypes.wallbreaker ?? 'wallbreaker')
  }

  if (!labels.length && boostedSpeed && damagingMoves.length >= 3) {
    labels.push(archetypes.cleaner ?? 'cleaner')
  }

  if (!labels.length) {
    labels.push(
      attackBias === 'mixed'
        ? archetypes.flexible ?? 'flexible'
        : attackBias === 'physical'
          ? archetypes.physicalBreaker ?? 'breaker físico'
          : archetypes.specialBreaker ?? 'breaker especial'
    )
  }

  return {
    slotIndex,
    pokemonSlug: pokemon.slug,
    pokemonName: pokemon.name,
    natureSummary: getNatureSummary(slot?.natureKey, locale),
    labels: Array.from(new Set(labels)).slice(0, 3),
    utilityTags: Array.from(utilityTags),
    attackBias,
  }
}

function buildTeamArchetypeSummary(teamSlots, teamMembers, teamMoveMatrix, locale = DEFAULT_LOCALE) {
  const memberRoles = teamMembers
    .map((pokemon, index) => buildSlotArchetype(teamSlots[index], pokemon, teamMoveMatrix[index] ?? [], index, locale))
    .filter(Boolean)
  const tagCounts = {
    hazard: 0,
    hazardRemoval: 0,
    pivot: 0,
    recovery: 0,
    status: 0,
    boosting: 0,
    priority: 0,
  }
  let offensiveCount = 0

  const copy = getTeamBuilderMessages(locale)
  const archetypes = copy.archetypes ?? {}
  const reasons = copy.archetypeReasons ?? {}

  memberRoles.forEach((entry) => {
    entry.utilityTags.forEach((tag) => {
      if (typeof tagCounts[tag] === 'number') {
        tagCounts[tag] += 1
      }
    })

    if (
      entry.labels.some((label) =>
        [
          archetypes.setupSweeper ?? 'setup sweeper',
          archetypes.setupBreaker ?? 'setup breaker',
          archetypes.wallbreaker ?? 'wallbreaker',
          archetypes.cleaner ?? 'cleaner',
          archetypes.revengeKiller ?? 'revenge killer',
        ].includes(label)
      )
    ) {
      offensiveCount += 1
    }
  })

  let styleLabel = archetypes.balance ?? 'Balance'
  let styleReason =
    reasons.balance ?? 'La distribución actual mezcla presión ofensiva y utilidades sin caer todavía en un arquetipo extremo.'

  if (tagCounts.boosting >= 2 && offensiveCount >= 3) {
    styleLabel = archetypes.setupOffense ?? 'Setup offense'
    styleReason = reasons.setupOffense ?? 'Tu plan principal gira alrededor de abrir huecos y cerrar partidas con boosts.'
  } else if (tagCounts.pivot >= 2) {
    styleLabel = archetypes.voltTurnBalance ?? 'VoltTurn balance'
    styleReason = reasons.voltTurnBalance ?? 'Hay varios pivots para ganar inercia y recolocar a tus wincons con seguridad.'
  } else if (tagCounts.hazard >= 2) {
    styleLabel = archetypes.hazardStack ?? 'hazard stack'
    styleReason = reasons.hazardStack ?? 'El equipo ya apunta a acumular hazards y castigar cambios rivales.'
  } else if (tagCounts.recovery >= 2 && tagCounts.status >= 1) {
    styleLabel = archetypes.bulkyBalance ?? 'Balance bulky'
    styleReason = reasons.bulkyBalance ?? 'Tienes varias piezas con sustain y herramientas para desgastar a largo plazo.'
  } else if (offensiveCount >= 4) {
    styleLabel = archetypes.bulkyOffense ?? 'Bulky offense'
    styleReason = reasons.bulkyOffense ?? 'La mayor parte del equipo quiere presionar turnos y mantener el ritmo del combate.'
  }

  const topTraits = Object.entries(tagCounts)
    .filter(([, count]) => count > 0)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 4)
    .map(([key, count]) => ({
      key,
      label: getMoveUtilityLabels(locale)[key],
      count,
    }))

  return {
    styleLabel,
    styleReason,
    topTraits,
    memberRoles,
    offensiveCount,
  }
}

export function summarizeTeam(teamMembers, typeChart, teamSlots = [], teamMoveMatrix = [], locale = DEFAULT_LOCALE) {
  const filledSlots = teamMembers.filter(Boolean).length
  const readyMembers = teamMembers.filter((pokemon) => pokemon && !pokemon.isPlaceholder)
  const typeAnalysis = buildTeamTypeAnalysis(teamMembers, typeChart, locale)
  const weaknesses = [...typeAnalysis]
    .filter((entry) => entry.weakCount > 0)
    .sort((left, right) => right.riskScore - left.riskScore || right.maxMultiplier - left.maxMultiplier)
  const resistances = [...typeAnalysis]
    .filter((entry) => entry.resistCount > 0 || entry.immuneCount > 0)
    .sort((left, right) => right.stabilityScore - left.stabilityScore || right.immuneCount - left.immuneCount)
  const balanceScore = typeAnalysis.reduce((total, entry) => total + entry.stabilityScore, 0)
  const moveCoverage = buildTeamMoveCoverage(teamMoveMatrix, typeChart, locale)
  const archetypeAnalysis = buildTeamArchetypeSummary(teamSlots, teamMembers, teamMoveMatrix, locale)

  return {
    filledSlots,
    readyMembers: readyMembers.length,
    balanceScore,
    typeAnalysis,
    weaknesses,
    resistances,
    moveCoverage,
    archetypeAnalysis,
  }
}

export function getBalanceLabel(balanceScore, locale = DEFAULT_LOCALE) {
  const labels = getTeamBuilderMessages(locale).balance ?? {}

  if (balanceScore >= 8) {
    return labels.veryStable ?? 'Muy compensado'
  }

  if (balanceScore >= 2) {
    return labels.stable ?? 'Bastante estable'
  }

  if (balanceScore >= -4) {
    return labels.medium ?? 'Equilibrio medio'
  }

  return labels.fragile ?? 'Frágil ante counters'
}
