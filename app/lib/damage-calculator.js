import { DEFAULT_LOCALE, getMessages } from './i18n'
import {
  ATTACKING_TYPES,
  TEAM_EVS_STEP,
  TEAM_MAX_EVS,
  TEAM_MAX_EVS_PER_STAT,
  TEAM_MAX_IVS_PER_STAT,
  TEAM_STAT_KEYS,
  createDefaultEffortValues,
  createDefaultIndividualValues,
} from './team-builder'

export const DAMAGE_CALCULATOR_STORAGE_KEY = 'pokemon-project-damage-calculator-v1'
export const DAMAGE_SIDE_KEYS = ['attacker', 'defender']
export const DAMAGE_MOVE_SLOTS = 4

export const DAMAGE_STAT_CONFIG = [
  { key: 'hp', label: 'HP' },
  { key: 'attack', label: 'Atk' },
  { key: 'defense', label: 'Def' },
  { key: 'specialAttack', label: 'SpA' },
  { key: 'specialDefense', label: 'SpD' },
  { key: 'speed', label: 'Spe' },
]

export const DAMAGE_BOOSTABLE_STAT_CONFIG = DAMAGE_STAT_CONFIG.filter((stat) => stat.key !== 'hp')
export const DAMAGE_BOOST_OPTIONS = Array.from({ length: 13 }, (_, index) => index - 6)
export const DAMAGE_TERA_TYPE_KEYS = [...ATTACKING_TYPES, 'stellar']

function getDamageMessages(locale = DEFAULT_LOCALE) {
  return getMessages(locale).damage ?? {}
}

export function getDamageStatusOptions(locale = DEFAULT_LOCALE) {
  const copy = getDamageMessages(locale).statusOptions ?? {}

  return [
    { value: '', label: copy.healthy?.label ?? 'Sano', meta: copy.healthy?.meta ?? 'Sin estado alterado' },
    { value: 'brn', label: copy.brn?.label ?? 'Quemado', meta: copy.brn?.meta ?? 'Reduce el ataque físico salvo excepciones' },
    { value: 'par', label: copy.par?.label ?? 'Paralizado', meta: copy.par?.meta ?? 'Puede afectar a velocidad e interacciones' },
    { value: 'psn', label: copy.psn?.label ?? 'Envenenado', meta: copy.psn?.meta ?? 'Veneno normal' },
    { value: 'tox', label: copy.tox?.label ?? 'Tóxico', meta: copy.tox?.meta ?? 'Veneno grave' },
    { value: 'slp', label: copy.slp?.label ?? 'Dormido', meta: copy.slp?.meta ?? 'Estado de sueño' },
    { value: 'frz', label: copy.frz?.label ?? 'Congelado', meta: copy.frz?.meta ?? 'Estado de congelación' },
  ]
}

export const DAMAGE_STATUS_OPTIONS = getDamageStatusOptions()

export function getDamageWeatherOptions(locale = DEFAULT_LOCALE) {
  const copy = getDamageMessages(locale).weather ?? {}

  return [
    { value: '', label: copy.none ?? 'Sin clima' },
    { value: 'Sun', label: copy.sun ?? 'Sol' },
    { value: 'Rain', label: copy.rain ?? 'Lluvia' },
    { value: 'Sand', label: copy.sand ?? 'Tormenta de arena' },
    { value: 'Snow', label: copy.snow ?? 'Nieve' },
    { value: 'Harsh Sunshine', label: copy.harshSunshine ?? 'Sol intenso' },
    { value: 'Heavy Rain', label: copy.heavyRain ?? 'Lluvia intensa' },
    { value: 'Strong Winds', label: copy.strongWinds ?? 'Vientos fuertes' },
  ]
}

export const DAMAGE_WEATHER_OPTIONS = getDamageWeatherOptions()

export function getDamageTerrainOptions(locale = DEFAULT_LOCALE) {
  const copy = getDamageMessages(locale).terrain ?? {}

  return [
    { value: '', label: copy.none ?? 'Sin terreno' },
    { value: 'Electric', label: copy.electric ?? 'Campo eléctrico' },
    { value: 'Grassy', label: copy.grassy ?? 'Campo de hierba' },
    { value: 'Misty', label: copy.misty ?? 'Campo de niebla' },
    { value: 'Psychic', label: copy.psychic ?? 'Campo psíquico' },
  ]
}

export const DAMAGE_TERRAIN_OPTIONS = getDamageTerrainOptions()

export const DAMAGE_GLOBAL_FIELD_OPTIONS = [
  { key: 'isMagicRoom', label: 'Magic Room' },
  { key: 'isWonderRoom', label: 'Wonder Room' },
  { key: 'isGravity', label: 'Gravity' },
]

export const DAMAGE_RUIN_OPTIONS = [
  { key: 'isBeadsOfRuin', label: 'Beads of Ruin' },
  { key: 'isSwordOfRuin', label: 'Sword of Ruin' },
  { key: 'isTabletsOfRuin', label: 'Tablets of Ruin' },
  { key: 'isVesselOfRuin', label: 'Vessel of Ruin' },
]

export const DAMAGE_SIDE_FIELD_OPTIONS = [
  { key: 'isSR', label: 'Stealth Rock' },
  { key: 'isReflect', label: 'Reflect' },
  { key: 'isLightScreen', label: 'Light Screen' },
  { key: 'isProtected', label: 'Protect' },
  { key: 'isSeeded', label: 'Leech Seed' },
  { key: 'isSaltCured', label: 'Salt Cure' },
  { key: 'isForesight', label: 'Foresight' },
  { key: 'isTailwind', label: 'Tailwind' },
  { key: 'isHelpingHand', label: 'Helping Hand' },
  { key: 'isFlowerGift', label: 'Flower Gift' },
  { key: 'isFriendGuard', label: 'Friend Guard' },
  { key: 'isAuroraVeil', label: 'Aurora Veil' },
  { key: 'isBattery', label: 'Battery' },
  { key: 'isPowerSpot', label: 'Power Spot' },
  { key: 'isSteelySpirit', label: 'Steely Spirit' },
]

export function getDamageSwitchingOptions(locale = DEFAULT_LOCALE) {
  const copy = getDamageMessages(locale).switching ?? {}

  return [
    { value: '', label: copy.idle ?? 'Quieto' },
    { value: 'out', label: copy.out ?? 'Switching Out' },
    { value: 'in', label: copy.in ?? 'Switching In' },
  ]
}

export const DAMAGE_SWITCHING_OPTIONS = getDamageSwitchingOptions()

function clamp(value, min, max, fallback) {
  if (!Number.isFinite(Number(value))) {
    return fallback
  }

  return Math.min(Math.max(Math.round(Number(value)), min), max)
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export function createDefaultDamageBoosts() {
  return {
    attack: 0,
    defense: 0,
    specialAttack: 0,
    specialDefense: 0,
    speed: 0,
  }
}

export function createDefaultDamageFieldSide() {
  return {
    spikes: 0,
    isSR: false,
    isReflect: false,
    isLightScreen: false,
    isProtected: false,
    isSeeded: false,
    isSaltCured: false,
    isForesight: false,
    isTailwind: false,
    isHelpingHand: false,
    isFlowerGift: false,
    isFriendGuard: false,
    isAuroraVeil: false,
    isBattery: false,
    isPowerSpot: false,
    isSteelySpirit: false,
    isSwitching: '',
  }
}

export function createDefaultDamageSide(overrides = {}) {
  return {
    pokemonSlug: '',
    abilitySlug: '',
    itemSlug: '',
    natureKey: 'serious',
    level: 50,
    teraType: '',
    status: '',
    currentHpPercent: 100,
    moveSlugs: Array(DAMAGE_MOVE_SLOTS).fill(''),
    evs: createDefaultEffortValues(),
    ivs: createDefaultIndividualValues(),
    boosts: createDefaultDamageBoosts(),
    ...overrides,
  }
}

export function createDefaultDamageField() {
  return {
    weather: '',
    terrain: '',
    isMagicRoom: false,
    isWonderRoom: false,
    isGravity: false,
    isBeadsOfRuin: false,
    isSwordOfRuin: false,
    isTabletsOfRuin: false,
    isVesselOfRuin: false,
    attackerSide: createDefaultDamageFieldSide(),
    defenderSide: createDefaultDamageFieldSide(),
  }
}

export function createDefaultDamageCalculatorState(formatKey = '') {
  return {
    formatKey,
    attacker: createDefaultDamageSide({
      pokemonSlug: 'charizard',
      natureKey: 'modest',
      moveSlugs: ['flamethrower', 'air-slash', 'dragon-pulse', 'heat-wave'],
    }),
    defender: createDefaultDamageSide({
      pokemonSlug: 'pidgeot',
      natureKey: 'timid',
      moveSlugs: ['air-slash', 'hurricane', 'u-turn', 'heat-wave'],
    }),
    field: createDefaultDamageField(),
    selectedMove: {
      side: 'attacker',
      slot: 0,
      isCrit: false,
      hits: '',
    },
  }
}

function sanitizeMoveSlugs(value) {
  const nextMoveSlugs = Array.isArray(value) ? value.slice(0, DAMAGE_MOVE_SLOTS).map(normalizeString) : []

  while (nextMoveSlugs.length < DAMAGE_MOVE_SLOTS) {
    nextMoveSlugs.push('')
  }

  return nextMoveSlugs
}

function sanitizeBoostMap(value) {
  const nextBoosts = createDefaultDamageBoosts()

  Object.keys(nextBoosts).forEach((statKey) => {
    nextBoosts[statKey] = clamp(value?.[statKey], -6, 6, 0)
  })

  return nextBoosts
}

function sanitizeEffortValues(value) {
  const nextEvs = createDefaultEffortValues()

  Object.keys(nextEvs).forEach((statKey) => {
    nextEvs[statKey] = clamp(value?.[statKey], 0, TEAM_MAX_EVS_PER_STAT, 0)
    nextEvs[statKey] = Math.round(nextEvs[statKey] / TEAM_EVS_STEP) * TEAM_EVS_STEP
  })

  let total = TEAM_STAT_KEYS.reduce((sum, statKey) => sum + nextEvs[statKey], 0)

  for (const statKey of TEAM_STAT_KEYS) {
    if (total <= TEAM_MAX_EVS) {
      break
    }

    const deduction = Math.min(nextEvs[statKey], Math.ceil((total - TEAM_MAX_EVS) / TEAM_EVS_STEP) * TEAM_EVS_STEP)
    nextEvs[statKey] -= deduction
    total -= deduction
  }

  return nextEvs
}

function sanitizeIndividualValues(value) {
  const nextIvs = createDefaultIndividualValues()

  Object.keys(nextIvs).forEach((statKey) => {
    nextIvs[statKey] = TEAM_MAX_IVS_PER_STAT
  })

  return nextIvs
}

function sanitizeDamageSide(value) {
  return createDefaultDamageSide({
    pokemonSlug: normalizeString(value?.pokemonSlug),
    abilitySlug: normalizeString(value?.abilitySlug),
    itemSlug: normalizeString(value?.itemSlug),
    natureKey: normalizeString(value?.natureKey) || 'serious',
    level: clamp(value?.level, 1, 100, 50),
    teraType: normalizeString(value?.teraType),
    status: normalizeString(value?.status),
    currentHpPercent: clamp(value?.currentHpPercent, 1, 100, 100),
    moveSlugs: sanitizeMoveSlugs(value?.moveSlugs),
    evs: sanitizeEffortValues(value?.evs),
    ivs: sanitizeIndividualValues(value?.ivs),
    boosts: sanitizeBoostMap(value?.boosts),
  })
}

function sanitizeFieldSide(value) {
  const nextSide = createDefaultDamageFieldSide()

  DAMAGE_SIDE_FIELD_OPTIONS.forEach((option) => {
    nextSide[option.key] = Boolean(value?.[option.key])
  })

  nextSide.spikes = clamp(value?.spikes, 0, 3, 0)
  nextSide.isSwitching = getDamageSwitchingOptions().some((option) => option.value === value?.isSwitching)
    ? value?.isSwitching
    : ''

  return nextSide
}

function sanitizeField(value) {
  const nextField = createDefaultDamageField()

  nextField.weather = getDamageWeatherOptions().some((option) => option.value === value?.weather) ? value.weather : ''
  nextField.terrain = getDamageTerrainOptions().some((option) => option.value === value?.terrain) ? value.terrain : ''

  ;[...DAMAGE_GLOBAL_FIELD_OPTIONS, ...DAMAGE_RUIN_OPTIONS].forEach((option) => {
    nextField[option.key] = Boolean(value?.[option.key])
  })

  nextField.attackerSide = sanitizeFieldSide(value?.attackerSide)
  nextField.defenderSide = sanitizeFieldSide(value?.defenderSide)

  return nextField
}

function sanitizeSelectedMove(value) {
  return {
    side: value?.side === 'defender' ? 'defender' : 'attacker',
    slot: clamp(value?.slot, 0, DAMAGE_MOVE_SLOTS - 1, 0),
    isCrit: Boolean(value?.isCrit),
    hits: value?.hits === '' || value?.hits === null || value?.hits === undefined ? '' : String(clamp(value?.hits, 2, 5, 2)),
  }
}

export function sanitizeStoredDamageCalculator(value) {
  return {
    formatKey: normalizeString(value?.formatKey),
    attacker: sanitizeDamageSide(value?.attacker),
    defender: sanitizeDamageSide(value?.defender),
    field: sanitizeField(value?.field),
    selectedMove: sanitizeSelectedMove(value?.selectedMove),
  }
}
