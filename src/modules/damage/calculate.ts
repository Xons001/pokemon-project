import { calculate, Field, Move, Pokemon, type Result } from '@smogon/calc'

import { getPrismaClient } from '@/src/lib/prisma'
import { formatName, translateDamageClass, translateType } from '@/src/modules/pokemon/format'
import { getActiveMetaFormatKeys, normalizeMetaFormatKey } from '@/src/modules/showdown/format-scope'
import { toShowdownId } from '@/src/modules/showdown/id'

const DAMAGE_MOVE_SLOTS = 4
const DAMAGE_LEVEL_DEFAULT = 50

const WEATHER_VALUES = [
  'Sun',
  'Rain',
  'Sand',
  'Snow',
  'Harsh Sunshine',
  'Heavy Rain',
  'Strong Winds',
 ] as const
const WEATHER_VALUE_SET = new Set<string>(WEATHER_VALUES)
type DamageWeather = (typeof WEATHER_VALUES)[number]

const TERRAIN_VALUES = ['Electric', 'Grassy', 'Misty', 'Psychic'] as const
const TERRAIN_VALUE_SET = new Set<string>(TERRAIN_VALUES)
type DamageTerrain = (typeof TERRAIN_VALUES)[number]

const TERA_TYPE_VALUES = [
  'Normal',
  'Fighting',
  'Flying',
  'Poison',
  'Ground',
  'Rock',
  'Bug',
  'Ghost',
  'Steel',
  'Fire',
  'Water',
  'Grass',
  'Electric',
  'Psychic',
  'Ice',
  'Dragon',
  'Dark',
  'Fairy',
  'Stellar',
] as const
const TERA_TYPE_VALUE_SET = new Set<string>(TERA_TYPE_VALUES)
type DamageTeraType = (typeof TERA_TYPE_VALUES)[number]

const STATUS_VALUES = ['brn', 'par', 'psn', 'tox', 'slp', 'frz'] as const
const STATUS_VALUE_SET = new Set<string>(STATUS_VALUES)
type DamageStatus = '' | (typeof STATUS_VALUES)[number]
const SWITCHING_VALUES = new Set(['out', 'in'])

type DamageCalculatorStatMapDto = {
  hp?: number | null
  attack?: number | null
  defense?: number | null
  specialAttack?: number | null
  specialDefense?: number | null
  speed?: number | null
}

type DamageCalculatorSideDto = {
  pokemonSlug?: string | null
  abilitySlug?: string | null
  itemSlug?: string | null
  natureKey?: string | null
  level?: number | null
  teraType?: string | null
  status?: string | null
  currentHpPercent?: number | null
  moveSlugs?: Array<string | null> | null
  evs?: DamageCalculatorStatMapDto | null
  ivs?: DamageCalculatorStatMapDto | null
  boosts?: Omit<DamageCalculatorStatMapDto, 'hp'> | null
}

type DamageCalculatorFieldSideDto = {
  spikes?: number | null
  isSR?: boolean | null
  isReflect?: boolean | null
  isLightScreen?: boolean | null
  isProtected?: boolean | null
  isSeeded?: boolean | null
  isSaltCured?: boolean | null
  isForesight?: boolean | null
  isTailwind?: boolean | null
  isHelpingHand?: boolean | null
  isFlowerGift?: boolean | null
  isFriendGuard?: boolean | null
  isAuroraVeil?: boolean | null
  isBattery?: boolean | null
  isPowerSpot?: boolean | null
  isSteelySpirit?: boolean | null
  isSwitching?: string | null
}

type DamageCalculatorFieldDto = {
  weather?: string | null
  terrain?: string | null
  isMagicRoom?: boolean | null
  isWonderRoom?: boolean | null
  isGravity?: boolean | null
  isBeadsOfRuin?: boolean | null
  isSwordOfRuin?: boolean | null
  isTabletsOfRuin?: boolean | null
  isVesselOfRuin?: boolean | null
  attackerSide?: DamageCalculatorFieldSideDto | null
  defenderSide?: DamageCalculatorFieldSideDto | null
}

type DamageCalculatorSelectedMoveDto = {
  side?: 'attacker' | 'defender' | null
  slot?: number | null
  isCrit?: boolean | null
  hits?: string | number | null
}

export type DamageCalculatorRequestDto = {
  formatKey?: string | null
  attacker?: DamageCalculatorSideDto | null
  defender?: DamageCalculatorSideDto | null
  field?: DamageCalculatorFieldDto | null
  selectedMove?: DamageCalculatorSelectedMoveDto | null
}

type DamageMoveCalculationDto = {
  slot: number
  moveSlug: string
  moveName: string
  typeKey: string
  typeLabel: string
  categoryKey: string | null
  categoryLabel: string
  power: number
  accuracy: number | null
  priority: number
  minDamage: number
  maxDamage: number
  minPercent: number
  maxPercent: number
  rangeLabel: string
  description: string
  fullDescription: string
  koText: string
  rolls: number[]
  error?: string
}

export type DamageCalculatorResponseDto = {
  format: {
    key: string
    name: string
    section: string | null
    gameType: string | null
    battleMode: 'Singles' | 'Doubles'
    battleModeLabel: string
  }
  calculations: {
    attackerMoves: DamageMoveCalculationDto[]
    defenderMoves: DamageMoveCalculationDto[]
    selected: DamageMoveCalculationDto | null
  }
}

function clamp(value: unknown, min: number, max: number, fallback: number) {
  if (!Number.isFinite(Number(value))) {
    return fallback
  }

  return Math.min(Math.max(Math.round(Number(value)), min), max)
}

function normalizeSlug(value?: string | null) {
  return typeof value === 'string' && value.trim() ? value.trim().toLowerCase() : ''
}

function normalizeMoveList(value?: Array<string | null> | null) {
  const moves = Array.isArray(value) ? value.slice(0, DAMAGE_MOVE_SLOTS).map((move) => normalizeSlug(move)) : []

  while (moves.length < DAMAGE_MOVE_SLOTS) {
    moves.push('')
  }

  return moves
}

function normalizeWeather(value?: string | null) {
  return WEATHER_VALUE_SET.has(value ?? '') ? (value as DamageWeather) : undefined
}

function normalizeTerrain(value?: string | null) {
  return TERRAIN_VALUE_SET.has(value ?? '') ? (value as DamageTerrain) : undefined
}

function normalizeStatus(value?: string | null) {
  return STATUS_VALUE_SET.has(value ?? '') ? (value as DamageStatus) : ''
}

function normalizeNature(value?: string | null) {
  const normalized = normalizeSlug(value)
  return normalized ? formatName(normalized) : 'Serious'
}

function normalizeTeraType(value?: string | null) {
  const normalized = normalizeSlug(value)
  if (!normalized) {
    return undefined
  }

  const formattedType = formatName(normalized)
  return TERA_TYPE_VALUE_SET.has(formattedType) ? (formattedType as DamageTeraType) : undefined
}

function buildStatsTable(
  value: DamageCalculatorStatMapDto | null | undefined,
  defaults: Record<'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe', number>
) {
  return {
    hp: clamp(value?.hp, 0, 999, defaults.hp),
    atk: clamp(value?.attack, 0, 999, defaults.atk),
    def: clamp(value?.defense, 0, 999, defaults.def),
    spa: clamp(value?.specialAttack, 0, 999, defaults.spa),
    spd: clamp(value?.specialDefense, 0, 999, defaults.spd),
    spe: clamp(value?.speed, 0, 999, defaults.spe),
  }
}

function buildBoostTable(value: Omit<DamageCalculatorStatMapDto, 'hp'> | null | undefined) {
  return {
    atk: clamp(value?.attack, -6, 6, 0),
    def: clamp(value?.defense, -6, 6, 0),
    spa: clamp(value?.specialAttack, -6, 6, 0),
    spd: clamp(value?.specialDefense, -6, 6, 0),
    spe: clamp(value?.speed, -6, 6, 0),
  }
}

function buildSideField(value?: DamageCalculatorFieldSideDto | null) {
  return {
    spikes: clamp(value?.spikes, 0, 3, 0),
    isSR: Boolean(value?.isSR),
    isReflect: Boolean(value?.isReflect),
    isLightScreen: Boolean(value?.isLightScreen),
    isProtected: Boolean(value?.isProtected),
    isSeeded: Boolean(value?.isSeeded),
    isSaltCured: Boolean(value?.isSaltCured),
    isForesight: Boolean(value?.isForesight),
    isTailwind: Boolean(value?.isTailwind),
    isHelpingHand: Boolean(value?.isHelpingHand),
    isFlowerGift: Boolean(value?.isFlowerGift),
    isFriendGuard: Boolean(value?.isFriendGuard),
    isAuroraVeil: Boolean(value?.isAuroraVeil),
    isBattery: Boolean(value?.isBattery),
    isPowerSpot: Boolean(value?.isPowerSpot),
    isSteelySpirit: Boolean(value?.isSteelySpirit),
    isSwitching: SWITCHING_VALUES.has(value?.isSwitching ?? '') ? (value?.isSwitching as 'out' | 'in') : undefined,
  }
}

function buildField(field: DamageCalculatorFieldDto | null | undefined, battleMode: 'Singles' | 'Doubles') {
  return new Field({
    gameType: battleMode,
    weather: normalizeWeather(field?.weather),
    terrain: normalizeTerrain(field?.terrain),
    isMagicRoom: Boolean(field?.isMagicRoom),
    isWonderRoom: Boolean(field?.isWonderRoom),
    isGravity: Boolean(field?.isGravity),
    isBeadsOfRuin: Boolean(field?.isBeadsOfRuin),
    isSwordOfRuin: Boolean(field?.isSwordOfRuin),
    isTabletsOfRuin: Boolean(field?.isTabletsOfRuin),
    isVesselOfRuin: Boolean(field?.isVesselOfRuin),
    attackerSide: buildSideField(field?.attackerSide),
    defenderSide: buildSideField(field?.defenderSide),
  })
}

function buildPokemon(side: DamageCalculatorSideDto | null | undefined) {
  const pokemonSlug = normalizeSlug(side?.pokemonSlug)

  if (!pokemonSlug) {
    return null
  }

  const baseOptions = {
    level: clamp(side?.level, 1, 100, DAMAGE_LEVEL_DEFAULT),
    ability: normalizeSlug(side?.abilitySlug) || undefined,
    item: normalizeSlug(side?.itemSlug) || undefined,
    nature: normalizeNature(side?.natureKey),
    teraType: normalizeTeraType(side?.teraType),
    status: normalizeStatus(side?.status),
    evs: buildStatsTable(side?.evs, {
      hp: 0,
      atk: 0,
      def: 0,
      spa: 0,
      spd: 0,
      spe: 0,
    }),
    ivs: buildStatsTable(side?.ivs, {
      hp: 31,
      atk: 31,
      def: 31,
      spa: 31,
      spd: 31,
      spe: 31,
    }),
    boosts: buildBoostTable(side?.boosts),
  }

  const pokemon = new Pokemon(9, pokemonSlug, baseOptions)
  const currentHpPercent = clamp(side?.currentHpPercent, 1, 100, 100)

  if (currentHpPercent >= 100) {
    return pokemon
  }

  return new Pokemon(9, pokemonSlug, {
    ...baseOptions,
    curHP: Math.max(1, Math.floor((pokemon.maxHP() * currentHpPercent) / 100)),
  })
}

function getBattleMode(gameType: string | null | undefined): 'Singles' | 'Doubles' {
  return gameType === 'doubles' ? 'Doubles' : 'Singles'
}

function getBattleModeLabel(battleMode: 'Singles' | 'Doubles') {
  return battleMode === 'Doubles' ? 'Combate doble' : 'Combate individual'
}

function roundToTenth(value: number) {
  return Number(value.toFixed(1))
}

function getRangeLabel(minDamage: number, maxDamage: number, defender: Pokemon) {
  const minPercent = roundToTenth((minDamage / defender.maxHP()) * 100)
  const maxPercent = roundToTenth((maxDamage / defender.maxHP()) * 100)

  return `${minDamage}-${maxDamage} (${minPercent} - ${maxPercent}%)`
}

function extractRolls(damage: Result['damage']) {
  if (typeof damage === 'number') {
    return [damage]
  }

  if (Array.isArray(damage) && damage.every((entry) => typeof entry === 'number')) {
    return [...damage]
  }

  return []
}

function calculateMoveResult(
  attacker: Pokemon,
  defender: Pokemon,
  field: Field,
  moveSlug: string,
  slot: number,
  overrides: {
    isCrit?: boolean
    hits?: number
  } = {}
): DamageMoveCalculationDto {
  try {
    const move = new Move(9, moveSlug, {
      ability: attacker.ability,
      item: attacker.item,
      species: attacker.name,
      isCrit: overrides.isCrit,
      hits: overrides.hits,
    })
    const result = calculate(9, attacker, defender, move, field)
    const [minDamage, maxDamage] = result.range()
    const minPercent = roundToTenth((minDamage / defender.maxHP()) * 100)
    const maxPercent = roundToTenth((maxDamage / defender.maxHP()) * 100)
    const categoryKey = move.category ? toShowdownId(move.category) : null
    const rolls = extractRolls(result.damage)

    return {
      slot,
      moveSlug,
      moveName: move.name,
      typeKey: toShowdownId(move.type),
      typeLabel: translateType(toShowdownId(move.type)),
      categoryKey,
      categoryLabel: translateDamageClass(categoryKey),
      power: move.bp,
      accuracy: null,
      priority: move.priority,
      minDamage,
      maxDamage,
      minPercent,
      maxPercent,
      rangeLabel: getRangeLabel(minDamage, maxDamage, defender),
      description: result.desc(),
      fullDescription: result.fullDesc(),
      koText: result.kochance().text,
      rolls,
    }
  } catch (error) {
    return {
      slot,
      moveSlug,
      moveName: formatName(moveSlug),
      typeKey: '',
      typeLabel: 'Sin dato',
      categoryKey: null,
      categoryLabel: 'Sin dato',
      power: 0,
      accuracy: null,
      priority: 0,
      minDamage: 0,
      maxDamage: 0,
      minPercent: 0,
      maxPercent: 0,
      rangeLabel: 'No disponible',
      description: '',
      fullDescription: '',
      koText: '',
      rolls: [],
      error: error instanceof Error ? error.message : 'No se pudo calcular este movimiento.',
    }
  }
}

async function resolveDamageFormat(requestedFormatKey?: string | null) {
  const prisma = getPrismaClient()
  const activeFormatKeys = getActiveMetaFormatKeys()
  const requestedKey = requestedFormatKey ? normalizeMetaFormatKey(requestedFormatKey) : null

  if (requestedKey && (!activeFormatKeys.length || activeFormatKeys.includes(requestedKey))) {
    const requestedFormat = await prisma.competitiveFormat.findUnique({
      where: {
        formatKey: requestedKey,
      },
      select: {
        formatKey: true,
        name: true,
        section: true,
        gameType: true,
      },
    })

    if (requestedFormat) {
      return requestedFormat
    }
  }

  const fallbackFormat = await prisma.competitiveFormat.findFirst({
    where: activeFormatKeys.length
      ? {
          formatKey: {
            in: activeFormatKeys,
          },
        }
      : undefined,
    select: {
      formatKey: true,
      name: true,
      section: true,
      gameType: true,
    },
    orderBy: [{ section: 'asc' }, { name: 'asc' }],
  })

  if (!fallbackFormat) {
    throw new Error('No hay formatos competitivos disponibles para la calculadora de dano.')
  }

  return fallbackFormat
}

function calculateSideMoveList(attacker: Pokemon, defender: Pokemon, field: Field, moveSlugs: string[]) {
  return moveSlugs
    .map((moveSlug, slot) => ({ moveSlug, slot }))
    .filter((entry) => entry.moveSlug)
    .map((entry) => calculateMoveResult(attacker, defender, field, entry.moveSlug, entry.slot))
}

export async function calculateDamage(payload: DamageCalculatorRequestDto): Promise<DamageCalculatorResponseDto> {
  const format = await resolveDamageFormat(payload.formatKey)
  const battleMode = getBattleMode(format.gameType)
  const attacker = buildPokemon(payload.attacker)
  const defender = buildPokemon(payload.defender)

  if (!attacker || !defender) {
    throw new Error('La calculadora necesita un atacante y un defensor validos.')
  }

  const field = buildField(payload.field, battleMode)
  const attackerMoveSlugs = normalizeMoveList(payload.attacker?.moveSlugs)
  const defenderMoveSlugs = normalizeMoveList(payload.defender?.moveSlugs)
  const attackerMoves = calculateSideMoveList(attacker, defender, field, attackerMoveSlugs)
  const defenderMoves = calculateSideMoveList(defender, attacker, field.clone().swap(), defenderMoveSlugs)
  const selectedMoveSide = payload.selectedMove?.side === 'defender' ? 'defender' : 'attacker'
  const selectedMoveSlot = clamp(payload.selectedMove?.slot, 0, DAMAGE_MOVE_SLOTS - 1, 0)
  const selectedMoveSlug = (selectedMoveSide === 'attacker' ? attackerMoveSlugs : defenderMoveSlugs)[selectedMoveSlot]
  const selectedField = selectedMoveSide === 'attacker' ? field : field.clone().swap()
  const selected = selectedMoveSlug
    ? calculateMoveResult(
        selectedMoveSide === 'attacker' ? attacker : defender,
        selectedMoveSide === 'attacker' ? defender : attacker,
        selectedField,
        selectedMoveSlug,
        selectedMoveSlot,
        {
          isCrit: Boolean(payload.selectedMove?.isCrit),
          hits:
            payload.selectedMove?.hits === '' || payload.selectedMove?.hits === null || payload.selectedMove?.hits === undefined
              ? undefined
              : clamp(payload.selectedMove?.hits, 2, 5, 2),
        }
      )
    : null

  return {
    format: {
      key: format.formatKey,
      name: format.name,
      section: format.section,
      gameType: format.gameType,
      battleMode,
      battleModeLabel: getBattleModeLabel(battleMode),
    },
    calculations: {
      attackerMoves: attackerMoves,
      defenderMoves: defenderMoves,
      selected,
    },
  }
}
