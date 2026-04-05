import { getPrismaClient } from '@/src/lib/prisma'
import { formatName, translateDamageClass, translateType } from '@/src/modules/pokemon/format'
import { getActiveMetaFormatKeys, isActiveMetaFormat } from '@/src/modules/showdown/format-scope'
import { toShowdownId } from '@/src/modules/showdown/id'

type JsonObject = Record<string, any>

const EXCLUDED_TYPES = new Set(['unknown', 'shadow', 'stellar'])
const VALIDATOR_PRIORITY = {
  invalid: 3,
  warning: 2,
  valid: 1,
  pending: 0,
} as const
const DEFAULT_COMPETITIVE_FORMAT = 'gen9ou'
const TEAM_VALIDATION_SIZE = 6
const DEFAULT_SUGGESTION_LIMIT = 8
const MAX_SUGGESTION_LIMIT = 12

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

const UTILITY_REASON_LABELS: Record<SuggestionUtilityTag, string> = {
  hazard: 'entry hazards',
  hazardRemoval: 'control de hazards',
  priority: 'prioridad',
  pivot: 'pivot',
  recovery: 'recuperacion fiable',
  status: 'presion de estado',
  boosting: 'boosting',
}

type ValidationStatus = keyof typeof VALIDATOR_PRIORITY

type TeamValidationSlotInput = {
  pokemonSlug?: string | null
  abilitySlug?: string | null
  moveSlugs?: Array<string | null> | null
}

type TeamValidationInput = {
  formatKey?: string | null
  slots?: TeamValidationSlotInput[] | null
}

type TeamSuggestionsInput = TeamValidationInput & {
  limit?: number | null
}

type ValidationCheckDto = {
  key: string
  label: string
  status: ValidationStatus
  message: string
}

type ValidationSlotDto = {
  slotIndex: number
  pokemonSlug: string | null
  pokemonName: string | null
  status: ValidationStatus
  checks: ValidationCheckDto[]
  tierKey: string | null
  tierName: string | null
}

export type CompetitiveFormatOptionDto = {
  key: string
  name: string
  section: string | null
  gameType: string | null
}

export type TeamValidationResultDto = {
  format: {
    key: string
    name: string
    section: string | null
    gameType: string | null
  }
  summary: {
    teamStatus: ValidationStatus
    checkedSlots: number
    validCount: number
    warningCount: number
    invalidCount: number
    pendingCount: number
  }
  slots: ValidationSlotDto[]
}

type SuggestionUtilityTag =
  | 'hazard'
  | 'hazardRemoval'
  | 'priority'
  | 'pivot'
  | 'recovery'
  | 'status'
  | 'boosting'

type UsageDistributionEntryDto = {
  label: string
  showdownId: string
  value: number
  share: number
}

type SuggestedMoveDto = UsageDistributionEntryDto & {
  typeKey: string | null
  typeLabel: string | null
  categoryKey: string | null
  categoryLabel: string | null
  priority: number
}

type SuggestedBuildDto = {
  abilities: UsageDistributionEntryDto[]
  items: UsageDistributionEntryDto[]
  moves: SuggestedMoveDto[]
  spread: UsageDistributionEntryDto | null
  teraType: UsageDistributionEntryDto | null
}

export type TeamSuggestionDto = {
  pokemonSlug: string | null
  showdownPokemonId: string
  pokemonName: string
  image: string | null
  thumb: string | null
  types: Array<{
    key: string
    label: string
  }>
  usagePercent: number | null
  fitPercent: number
  teammateCount: number
  affinityScore: number
  coverageScore: number
  utilityScore: number
  totalScore: number
  reasons: string[]
  recommendedBuild: SuggestedBuildDto
}

export type TeamSuggestionsResultDto = {
  format: {
    key: string
    name: string
    section: string | null
    gameType: string | null
    latestMonth: string | null
  }
  summary: {
    selectedCount: number
    evaluatedCount: number
    suggestionCount: number
    hasDirectMetaData: boolean
  }
  items: TeamSuggestionDto[]
}

export type TypeChartEntryDto = {
  name: string
  doubleDamageFrom: string[]
  halfDamageFrom: string[]
  noDamageFrom: string[]
}

const POKEMON_SUGGESTION_SELECT = {
  name: true,
  showdownId: true,
  officialArtworkUrl: true,
  spriteUrl: true,
  species: {
    select: {
      name: true,
      showdownId: true,
    },
  },
  types: {
    select: {
      slot: true,
      type: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      slot: 'asc',
    },
  },
  stats: {
    select: {
      baseStat: true,
      stat: {
        select: {
          name: true,
        },
      },
    },
  },
} as const

export async function getTypeChart(): Promise<Record<string, TypeChartEntryDto>> {
  const prisma = getPrismaClient()
  const types = await prisma.type.findMany({
    select: {
      name: true,
      rawPayload: true,
    },
    orderBy: {
      id: 'asc',
    },
  })

  return types.reduce<Record<string, TypeChartEntryDto>>((chart, typeEntry) => {
    if (EXCLUDED_TYPES.has(typeEntry.name)) {
      return chart
    }

    const payload = (typeEntry.rawPayload ?? {}) as JsonObject
    const damageRelations = (payload.damage_relations ?? {}) as JsonObject

    chart[typeEntry.name] = {
      name: typeEntry.name,
      doubleDamageFrom: Array.isArray(damageRelations.double_damage_from)
        ? damageRelations.double_damage_from.map((entry: JsonObject) => entry.name).filter(Boolean)
        : [],
      halfDamageFrom: Array.isArray(damageRelations.half_damage_from)
        ? damageRelations.half_damage_from.map((entry: JsonObject) => entry.name).filter(Boolean)
        : [],
      noDamageFrom: Array.isArray(damageRelations.no_damage_from)
        ? damageRelations.no_damage_from.map((entry: JsonObject) => entry.name).filter(Boolean)
        : [],
    }

    return chart
  }, {})
}

function normalizeFormatKey(value?: string | null): string {
  const normalized = value?.trim().toLowerCase()
  return normalized || DEFAULT_COMPETITIVE_FORMAT
}

function buildVisibleFormatWhere() {
  const activeFormatKeys = getActiveMetaFormatKeys()

  return {
    searchShow: true,
    section: {
      not: null,
    },
    NOT: {
      formatKey: {
        startsWith: './',
      },
    },
    ...(activeFormatKeys.length
      ? {
          formatKey: {
            in: activeFormatKeys,
          },
        }
      : {}),
  }
}

function buildScopedFormatWhere() {
  const activeFormatKeys = getActiveMetaFormatKeys()

  if (!activeFormatKeys.length) {
    return {}
  }

  return {
    formatKey: {
      in: activeFormatKeys,
    },
  }
}

async function resolveCompetitiveFormatKey(
  prisma: ReturnType<typeof getPrismaClient>,
  requestedFormatKey?: string | null
) {
  const requestedKey = normalizeFormatKey(requestedFormatKey)
  const preferredKeys = Array.from(new Set([requestedKey, DEFAULT_COMPETITIVE_FORMAT]))

  for (const candidateKey of preferredKeys) {
    if (!candidateKey || !isActiveMetaFormat(candidateKey)) {
      continue
    }

    const candidate = await prisma.competitiveFormat.findUnique({
      where: {
        formatKey: candidateKey,
      },
      select: {
        formatKey: true,
      },
    })

    if (candidate) {
      return candidate.formatKey
    }
  }

  const visibleFallback = await prisma.competitiveFormat.findFirst({
    where: buildVisibleFormatWhere(),
    orderBy: [
      {
        section: 'asc',
      },
      {
        name: 'asc',
      },
    ],
    select: {
      formatKey: true,
    },
  })

  if (visibleFallback) {
    return visibleFallback.formatKey
  }

  const scopedFallback = await prisma.competitiveFormat.findFirst({
    where: buildScopedFormatWhere(),
    orderBy: [
      {
        name: 'asc',
      },
    ],
    select: {
      formatKey: true,
    },
  })

  if (scopedFallback) {
    return scopedFallback.formatKey
  }

  throw new Error('No hay formatos competitivos disponibles en la base de datos.')
}

function normalizeSlug(value?: string | null): string | null {
  const normalized = value?.trim().toLowerCase()
  return normalized || null
}

function normalizeMoveSlugs(value?: Array<string | null> | null): Array<string | null> {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((entry) => normalizeSlug(entry))
}

function buildValidationCheck(
  key: string,
  label: string,
  status: ValidationStatus,
  message: string
): ValidationCheckDto {
  return {
    key,
    label,
    status,
    message,
  }
}

function getWorstStatus(statuses: ValidationStatus[]): ValidationStatus {
  return statuses.reduce<ValidationStatus>((worst, current) => {
    return VALIDATOR_PRIORITY[current] > VALIDATOR_PRIORITY[worst] ? current : worst
  }, 'pending')
}

function formatUsagePercent(value: number | null | undefined): string | null {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null
  }

  return `${(value * 100).toFixed(value >= 0.01 ? 2 : 3)}%`
}

function getFormatTierDimension(formatKey: string, gameType: string | null): string {
  if (formatKey.includes('natdex')) {
    return 'natDexTier'
  }

  if (gameType === 'doubles') {
    return 'doublesTier'
  }

  return 'tier'
}

function getCurrentTier(
  tierHistory: Array<{
    dimension: string
    competitiveTier: {
      key: string
      name: string
    }
  }>,
  dimension: string
) {
  return tierHistory.find((entry) => entry.dimension === dimension) ?? tierHistory.find((entry) => entry.dimension === 'tier') ?? null
}

function createEmptyValidationSlot(index: number): ValidationSlotDto {
  const checks = [
    buildValidationCheck(
      `slot-${index + 1}-empty`,
      'Hueco vacio',
      'pending',
      'Anade un Pokemon para poder comprobar su legalidad competitiva.'
    ),
  ]

  return {
    slotIndex: index,
    pokemonSlug: null,
    pokemonName: null,
    status: 'pending',
    checks,
    tierKey: null,
    tierName: null,
  }
}

function normalizeSuggestionLimit(value?: number | null): number {
  if (!Number.isFinite(Number(value))) {
    return DEFAULT_SUGGESTION_LIMIT
  }

  return Math.min(Math.max(Math.round(Number(value)), 1), MAX_SUGGESTION_LIMIT)
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function coerceUsageDistribution(
  value: unknown,
  normalizeKey: (value: string) => string = toShowdownId
): Array<{ key: string; value: number }> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return []
  }

  return Object.entries(value as Record<string, unknown>)
    .map(([key, rawValue]) => ({
      key: normalizeKey(key),
      value: Number(rawValue),
    }))
    .filter((entry) => entry.key && isPositiveNumber(entry.value))
    .sort((left, right) => right.value - left.value)
}

function buildLabelMap(values: string[], formatter: (value: string) => string): Map<string, string> {
  return new Map(
    values.map((value) => [toShowdownId(value), formatter(value)]).filter((entry): entry is [string, string] => Boolean(entry[0]))
  )
}

function getUsageEntries(
  distribution: unknown,
  limit: number,
  labelResolver: (showdownId: string) => string,
  normalizeKey: (value: string) => string = toShowdownId
): UsageDistributionEntryDto[] {
  const entries = coerceUsageDistribution(distribution, normalizeKey).slice(0, limit)
  const total = entries.reduce((sum, entry) => sum + entry.value, 0)

  return entries.map((entry) => ({
    label: labelResolver(entry.key),
    showdownId: entry.key,
    value: entry.value,
    share: total > 0 ? entry.value / total : 0,
  }))
}

function createStaticUsageEntry(label: string, showdownId: string): UsageDistributionEntryDto {
  return {
    label,
    showdownId,
    value: 1,
    share: 1,
  }
}

function getSingleTypeMultiplier(attackingType: string, defendingType: string, typeChart: Record<string, TypeChartEntryDto>): number {
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

function getDefensiveMultiplier(
  defendingTypes: string[],
  attackingType: string,
  typeChart: Record<string, TypeChartEntryDto>
): number | null {
  if (!defendingTypes.length) {
    return null
  }

  return defendingTypes.reduce((multiplier, defendingType) => {
    return multiplier * getSingleTypeMultiplier(attackingType, defendingType, typeChart)
  }, 1)
}

function buildTeamWeaknessTargets(
  teamTypeKeys: string[][],
  typeChart: Record<string, TypeChartEntryDto>
): Array<{
  typeKey: string
  label: string
  riskScore: number
}> {
  return Object.keys(typeChart)
    .map((attackingType) => {
      const multipliers = teamTypeKeys
        .map((typeKeys) => getDefensiveMultiplier(typeKeys, attackingType, typeChart))
        .filter((value): value is number => typeof value === 'number')
      const weakCount = multipliers.filter((value) => value > 1).length
      const superWeakCount = multipliers.filter((value) => value >= 4).length
      const resistCount = multipliers.filter((value) => value > 0 && value < 1).length
      const immuneCount = multipliers.filter((value) => value === 0).length

      return {
        typeKey: attackingType,
        label: translateType(attackingType),
        riskScore: weakCount + superWeakCount * 2 - resistCount - immuneCount * 2,
      }
    })
    .filter((entry) => entry.riskScore > 0)
    .sort((left, right) => right.riskScore - left.riskScore)
}

function getMoveUtilityTags(showdownMoveId: string, priority: number): Set<SuggestionUtilityTag> {
  const tags = new Set<SuggestionUtilityTag>()

  if (HAZARD_MOVE_IDS.has(showdownMoveId)) {
    tags.add('hazard')
  }

  if (HAZARD_REMOVAL_MOVE_IDS.has(showdownMoveId)) {
    tags.add('hazardRemoval')
  }

  if (PIVOT_MOVE_IDS.has(showdownMoveId)) {
    tags.add('pivot')
  }

  if (RECOVERY_MOVE_IDS.has(showdownMoveId)) {
    tags.add('recovery')
  }

  if (STATUS_MOVE_IDS.has(showdownMoveId)) {
    tags.add('status')
  }

  if (BOOSTING_MOVE_IDS.has(showdownMoveId)) {
    tags.add('boosting')
  }

  if (priority > 0) {
    tags.add('priority')
  }

  return tags
}

function getAttackBias(attack: number | null | undefined, specialAttack: number | null | undefined): 'physical' | 'special' | 'mixed' {
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

function getWorstCoveredWeaknesses(
  candidateTypes: string[],
  weaknessTargets: Array<{
    typeKey: string
    label: string
    riskScore: number
  }>,
  typeChart: Record<string, TypeChartEntryDto>
) {
  let coverageScore = 0
  const helpfulTypes: string[] = []
  const riskyTypes: string[] = []

  weaknessTargets.slice(0, 4).forEach((entry) => {
    const multiplier = getDefensiveMultiplier(candidateTypes, entry.typeKey, typeChart)

    if (multiplier === null) {
      return
    }

    if (multiplier === 0) {
      coverageScore += 3 + entry.riskScore
      helpfulTypes.push(entry.label)
      return
    }

    if (multiplier < 1) {
      coverageScore += 2 + entry.riskScore * 0.5
      helpfulTypes.push(entry.label)
      return
    }

    if (multiplier >= 4) {
      coverageScore -= 3
      riskyTypes.push(entry.label)
      return
    }

    if (multiplier > 1) {
      coverageScore -= 1.5
      riskyTypes.push(entry.label)
    }
  })

  return {
    coverageScore,
    helpfulTypes: Array.from(new Set(helpfulTypes)).slice(0, 3),
    riskyTypes: Array.from(new Set(riskyTypes)).slice(0, 2),
  }
}

function pickLatestUsageRows<T extends { showdownPokemonId: string; month: string; rating: number }>(rows: T[]): Map<string, T> {
  const latestRows = new Map<string, T>()

  rows.forEach((row) => {
    if (!latestRows.has(row.showdownPokemonId)) {
      latestRows.set(row.showdownPokemonId, row)
    }
  })

  return latestRows
}

function extractStatMap(
  stats: Array<{
    baseStat: number
    stat: {
      name: string
    }
  }>
) {
  return stats.reduce<Record<string, number>>((accumulator, entry) => {
    accumulator[entry.stat.name] = entry.baseStat
    return accumulator
  }, {})
}

export async function listCompetitiveFormats(): Promise<CompetitiveFormatOptionDto[]> {
  const prisma = getPrismaClient()
  const formats = await prisma.competitiveFormat.findMany({
    where: buildVisibleFormatWhere(),
    select: {
      formatKey: true,
      name: true,
      section: true,
      gameType: true,
    },
    orderBy: [
      {
        section: 'asc',
      },
      {
        name: 'asc',
      },
    ],
  })

  return formats.map((format) => ({
    key: format.formatKey,
    name: format.name,
    section: format.section,
    gameType: format.gameType,
  }))
}

export async function validateTeamBuild(input: TeamValidationInput): Promise<TeamValidationResultDto> {
  const prisma = getPrismaClient()
  const formatKey = await resolveCompetitiveFormatKey(prisma, input.formatKey)
  const normalizedSlots = Array.from({ length: TEAM_VALIDATION_SIZE }, (_, index) => {
    const slot = input.slots?.[index]

    return {
      pokemonSlug: normalizeSlug(slot?.pokemonSlug),
      abilitySlug: normalizeSlug(slot?.abilitySlug),
      moveSlugs: normalizeMoveSlugs(slot?.moveSlugs),
    }
  })

  const format = await prisma.competitiveFormat.findUnique({
    where: {
      formatKey,
    },
    select: {
      id: true,
      formatKey: true,
      name: true,
      section: true,
      gameType: true,
      banlistEntries: {
        where: {
          kind: 'banlist',
        },
        select: {
          value: true,
        },
      },
    },
  })

  if (!format) {
    throw new Error(`Competitive format "${formatKey}" was not found.`)
  }

  const selectedPokemonSlugs = Array.from(
    new Set(normalizedSlots.map((slot) => slot.pokemonSlug).filter((value): value is string => Boolean(value)))
  )

  const pokemonRecords = await prisma.pokemon.findMany({
    where: {
      name: {
        in: selectedPokemonSlugs,
      },
    },
    select: {
      name: true,
      showdownId: true,
      species: {
        select: {
          showdownId: true,
        },
      },
      abilities: {
        select: {
          slot: true,
          isHidden: true,
          ability: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          slot: 'asc',
        },
      },
      tierHistory: {
        where: {
          isCurrent: true,
        },
        select: {
          dimension: true,
          competitiveTier: {
            select: {
              key: true,
              name: true,
            },
          },
        },
      },
    },
  })

  const pokemonBySlug = new Map(pokemonRecords.map((record) => [record.name, record]))
  const showdownIds = Array.from(
    new Set(
      pokemonRecords.flatMap((record) => {
        return [record.showdownId, record.species.showdownId]
          .map((value) => normalizeSlug(value))
          .filter((value): value is string => Boolean(value))
      })
    )
  )

  const [pokemonFormatRows, learnsetRows] = await Promise.all([
    showdownIds.length
      ? prisma.pokemonFormat.findMany({
          where: {
            competitiveFormatId: format.id,
            showdownPokemonId: {
              in: showdownIds,
            },
          },
          select: {
            showdownPokemonId: true,
            isSampleSetAvailable: true,
            isUsageTracked: true,
            latestUsagePercent: true,
          },
        })
      : Promise.resolve([]),
    showdownIds.length
      ? prisma.competitiveLearnsetEntry.findMany({
          where: {
            showdownPokemonId: {
              in: showdownIds,
            },
            showdownMoveId: {
              in: Array.from(
                new Set(
                  normalizedSlots.flatMap((slot) =>
                    slot.moveSlugs
                      .filter((value): value is string => Boolean(value))
                      .map((moveSlug) => toShowdownId(moveSlug))
                  )
                )
              ),
            },
          },
          select: {
            showdownPokemonId: true,
            showdownMoveId: true,
          },
        })
      : Promise.resolve([]),
  ])

  const pokemonFormatById = new Map(pokemonFormatRows.map((row) => [row.showdownPokemonId, row]))
  const learnsetKeys = new Set(learnsetRows.map((row) => `${row.showdownPokemonId}:${row.showdownMoveId}`))
  const normalizedBanlist = new Set(
    format.banlistEntries
      .map((entry) => entry.value)
      .filter((value) => typeof value === 'string' && !value.includes('+'))
      .map((value) => toShowdownId(value))
      .filter(Boolean)
  )
  const tierDimension = getFormatTierDimension(format.formatKey, format.gameType)

  const slots = normalizedSlots.map<ValidationSlotDto>((slot, index) => {
    if (!slot.pokemonSlug) {
      return createEmptyValidationSlot(index)
    }

    const pokemon = pokemonBySlug.get(slot.pokemonSlug)

    if (!pokemon) {
      const checks = [
        buildValidationCheck(
          `slot-${index + 1}-pokemon-missing`,
          'Pokemon',
          'invalid',
          'No hemos encontrado ese Pokemon en la base local, asi que no podemos validarlo.'
        ),
      ]

      return {
        slotIndex: index,
        pokemonSlug: slot.pokemonSlug,
        pokemonName: formatName(slot.pokemonSlug),
        status: 'invalid',
        checks,
        tierKey: null,
        tierName: null,
      }
    }

    const pokemonShowdownIds = Array.from(
      new Set(
        [pokemon.showdownId, pokemon.species.showdownId]
          .map((value) => normalizeSlug(value))
          .filter((value): value is string => Boolean(value))
      )
    )
    const currentTier = getCurrentTier(pokemon.tierHistory, tierDimension)
    const tierKey = currentTier?.competitiveTier.key ?? null
    const tierName = currentTier?.competitiveTier.name ?? null
    const normalizedTierKey = tierKey ? toShowdownId(tierKey) : null
    const pokemonName = formatName(pokemon.name)
    const directPokemonBan = pokemonShowdownIds.some((value) => normalizedBanlist.has(value))
    const tierBan = normalizedTierKey ? normalizedBanlist.has(normalizedTierKey) : false
    const formatPresence =
      pokemonShowdownIds
        .map((value) => pokemonFormatById.get(value))
        .find(Boolean) ?? null

    const abilityNames = pokemon.abilities.map((entry) => entry.ability.name)
    const selectedAbility = slot.abilitySlug
    const checks: ValidationCheckDto[] = []

    if (directPokemonBan) {
      checks.push(
        buildValidationCheck(
          `slot-${index + 1}-pokemon`,
          'Pokemon',
          'invalid',
          `${pokemonName} aparece de forma directa en la banlist de ${format.name}.`
        )
      )
    } else if (tierBan && tierKey) {
      checks.push(
        buildValidationCheck(
          `slot-${index + 1}-pokemon`,
          'Pokemon',
          'invalid',
          `${pokemonName} pertenece al tier ${tierKey}, que esta baneado en ${format.name}.`
        )
      )
    } else {
      checks.push(
        buildValidationCheck(
          `slot-${index + 1}-pokemon`,
          'Pokemon',
          'valid',
          tierKey
            ? `${pokemonName} no aparece vetado en ${format.name}; su tier competitivo actual es ${tierKey}.`
            : `${pokemonName} no aparece vetado de forma directa en ${format.name}.`
        )
      )
    }

    if (formatPresence?.isUsageTracked || formatPresence?.isSampleSetAvailable) {
      const usageText = formatUsagePercent(formatPresence.latestUsagePercent)
      checks.push(
        buildValidationCheck(
          `slot-${index + 1}-meta`,
          'Meta',
          'valid',
          usageText
            ? `${pokemonName} tiene presencia registrada en ${format.name} con un uso reciente aproximado de ${usageText}.`
            : `${pokemonName} tiene datos competitivos directos dentro de ${format.name}.`
        )
      )
    } else {
      checks.push(
        buildValidationCheck(
          `slot-${index + 1}-meta`,
          'Meta',
          'warning',
          `${pokemonName} no aparece en usage ni en sample sets de ${format.name}. Puede ser niche o simplemente faltar cobertura competitiva en la base.`
        )
      )
    }

    if (!selectedAbility) {
      checks.push(
        buildValidationCheck(
          `slot-${index + 1}-ability`,
          'Habilidad',
          'pending',
          'Selecciona una habilidad para poder validarla tambien.'
        )
      )
    } else if (!abilityNames.includes(selectedAbility)) {
      checks.push(
        buildValidationCheck(
          `slot-${index + 1}-ability`,
          'Habilidad',
          'invalid',
          `${formatName(selectedAbility)} no forma parte de las habilidades legales de ${pokemonName}.`
        )
      )
    } else if (normalizedBanlist.has(toShowdownId(selectedAbility))) {
      checks.push(
        buildValidationCheck(
          `slot-${index + 1}-ability`,
          'Habilidad',
          'invalid',
          `${formatName(selectedAbility)} aparece en la banlist directa de ${format.name}.`
        )
      )
    } else {
      checks.push(
        buildValidationCheck(
          `slot-${index + 1}-ability`,
          'Habilidad',
          'valid',
          `${formatName(selectedAbility)} es una habilidad valida para ${pokemonName} en esta configuracion.`
        )
      )
    }

    const selectedMoveSlugs = slot.moveSlugs.filter((value): value is string => Boolean(value))

    if (!selectedMoveSlugs.length) {
      checks.push(
        buildValidationCheck(
          `slot-${index + 1}-moves`,
          'Movimientos',
          'pending',
          'Todavia no has elegido movimientos para este hueco.'
        )
      )
    } else {
      selectedMoveSlugs.forEach((moveSlug) => {
        const showdownMoveId = toShowdownId(moveSlug)
        const moveName = formatName(moveSlug)
        const hasLearnsetEntry = pokemonShowdownIds.some((value) => learnsetKeys.has(`${value}:${showdownMoveId}`))

        if (normalizedBanlist.has(showdownMoveId)) {
          checks.push(
            buildValidationCheck(
              `slot-${index + 1}-move-${showdownMoveId}`,
              moveName,
              'invalid',
              `${moveName} esta baneado de forma directa en ${format.name}.`
            )
          )
          return
        }

        if (!hasLearnsetEntry) {
          checks.push(
            buildValidationCheck(
              `slot-${index + 1}-move-${showdownMoveId}`,
              moveName,
              'invalid',
              `${pokemonName} no tiene ${moveName} en el learnset competitivo que hemos cargado desde Showdown.`
            )
          )
          return
        }

        checks.push(
          buildValidationCheck(
            `slot-${index + 1}-move-${showdownMoveId}`,
            moveName,
            'valid',
            `${moveName} aparece como movimiento legal para ${pokemonName}.`
          )
        )
      })
    }

    return {
      slotIndex: index,
      pokemonSlug: slot.pokemonSlug,
      pokemonName,
      status: getWorstStatus(checks.map((check) => check.status)),
      checks,
      tierKey,
      tierName,
    }
  })

  const summary = slots.reduce(
    (accumulator, slot) => {
      if (slot.pokemonSlug) {
        accumulator.checkedSlots += 1
      }

      if (slot.status === 'valid') {
        accumulator.validCount += 1
      } else if (slot.status === 'warning') {
        accumulator.warningCount += 1
      } else if (slot.status === 'invalid') {
        accumulator.invalidCount += 1
      } else {
        accumulator.pendingCount += 1
      }

      return accumulator
    },
    {
      checkedSlots: 0,
      validCount: 0,
      warningCount: 0,
      invalidCount: 0,
      pendingCount: 0,
    }
  )

  return {
    format: {
      key: format.formatKey,
      name: format.name,
      section: format.section,
      gameType: format.gameType,
    },
    summary: {
      ...summary,
      teamStatus: getWorstStatus(slots.map((slot) => slot.status)),
    },
    slots,
  }
}

export async function getTeamSuggestions(input: TeamSuggestionsInput): Promise<TeamSuggestionsResultDto> {
  const prisma = getPrismaClient()
  const formatKey = await resolveCompetitiveFormatKey(prisma, input.formatKey)
  const limit = normalizeSuggestionLimit(input.limit)
  const normalizedSlots = Array.from({ length: TEAM_VALIDATION_SIZE }, (_, index) => {
    const slot = input.slots?.[index]

    return {
      pokemonSlug: normalizeSlug(slot?.pokemonSlug),
      abilitySlug: normalizeSlug(slot?.abilitySlug),
      moveSlugs: normalizeMoveSlugs(slot?.moveSlugs),
    }
  })

  const format = await prisma.competitiveFormat.findUnique({
    where: {
      formatKey,
    },
    select: {
      id: true,
      formatKey: true,
      name: true,
      section: true,
      gameType: true,
    },
  })

  if (!format) {
    throw new Error(`Competitive format "${formatKey}" was not found.`)
  }

  const relatedFormatKeys = Array.from(
    new Set([format.formatKey, format.formatKey.startsWith('./') ? format.formatKey.slice(2) : `./${format.formatKey}`])
  )
  const relatedFormats = await prisma.competitiveFormat.findMany({
    where: {
      formatKey: {
        in: relatedFormatKeys,
      },
    },
    select: {
      id: true,
      formatKey: true,
    },
  })
  const relatedFormatIds = Array.from(new Set(relatedFormats.map((entry) => entry.id)))

  const selectedPokemonSlugs = Array.from(
    new Set(normalizedSlots.map((slot) => slot.pokemonSlug).filter((value): value is string => Boolean(value)))
  )

  if (!selectedPokemonSlugs.length) {
    return {
      format: {
        key: format.formatKey,
        name: format.name,
        section: format.section,
        gameType: format.gameType,
        latestMonth: null,
      },
      summary: {
        selectedCount: 0,
        evaluatedCount: 0,
        suggestionCount: 0,
        hasDirectMetaData: false,
      },
      items: [],
    }
  }

  const [selectedPokemonRows, typeChart, moveRows, abilityRows, itemRows] = await Promise.all([
    prisma.pokemon.findMany({
      where: {
        name: {
          in: selectedPokemonSlugs,
        },
      },
      select: POKEMON_SUGGESTION_SELECT,
    }),
    getTypeChart(),
    prisma.move.findMany({
      select: {
        name: true,
        priority: true,
        damageClassName: true,
        type: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.ability.findMany({
      select: {
        name: true,
      },
    }),
    prisma.item.findMany({
      select: {
        name: true,
      },
    }),
  ])

  const moveLookup = new Map(
    moveRows.map((move) => [
      toShowdownId(move.name),
      {
        label: formatName(move.name),
        priority: move.priority ?? 0,
        categoryKey: move.damageClassName ?? null,
        categoryLabel: translateDamageClass(move.damageClassName),
        typeKey: move.type.name,
        typeLabel: translateType(move.type.name),
      },
    ])
  )
  const abilityLookup = buildLabelMap(abilityRows.map((entry) => entry.name), formatName)
  const itemLookup = buildLabelMap(itemRows.map((entry) => entry.name), formatName)
  const selectedPokemonBySlug = new Map(selectedPokemonRows.map((pokemon) => [pokemon.name, pokemon]))
  const selectedShowdownIds = Array.from(
    new Set(
      selectedPokemonRows.flatMap((pokemon) => {
        return [pokemon.showdownId, pokemon.species?.showdownId]
          .map((value) => normalizeSlug(value))
          .filter((value): value is string => Boolean(value))
      })
    )
  )
  const teamTypeKeys = selectedPokemonSlugs
    .map((slug) => selectedPokemonBySlug.get(slug))
    .filter((pokemon): pokemon is (typeof selectedPokemonRows)[number] => Boolean(pokemon))
    .map((pokemon) => pokemon.types.map((entry) => entry.type.name))
  const weaknessTargets = buildTeamWeaknessTargets(teamTypeKeys, typeChart)
  const selectedMoveIds = normalizedSlots.flatMap((slot) =>
    slot.moveSlugs.filter((value): value is string => Boolean(value)).map((moveSlug) => toShowdownId(moveSlug))
  )
  const currentUtilityTags = new Set<SuggestionUtilityTag>()

  selectedMoveIds.forEach((moveId) => {
    const move = moveLookup.get(moveId)
    getMoveUtilityTags(moveId, move?.priority ?? 0).forEach((tag) => currentUtilityTags.add(tag))
  })

  const teamBiasCounts = selectedPokemonSlugs.reduce(
    (accumulator, slug) => {
      const pokemon = selectedPokemonBySlug.get(slug)

      if (!pokemon) {
        return accumulator
      }

      const statMap = extractStatMap(pokemon.stats)
      const bias = getAttackBias(statMap.attack, statMap['special-attack'])
      accumulator[bias] += 1
      return accumulator
    },
    {
      physical: 0,
      special: 0,
      mixed: 0,
    }
  )

  const selectedUsageRows = selectedShowdownIds.length
    ? await prisma.usageStatMonthly.findMany({
        where: {
          competitiveFormatId: format.id,
          showdownPokemonId: {
            in: selectedShowdownIds,
          },
        },
        orderBy: [
          {
            month: 'desc',
          },
          {
            rating: 'desc',
          },
        ],
      })
    : []

  const latestSelectedUsageRows = pickLatestUsageRows(selectedUsageRows)
  const contributorNameByShowdownId = new Map<string, string>()

  selectedPokemonRows.forEach((pokemon) => {
    if (pokemon.showdownId) {
      contributorNameByShowdownId.set(pokemon.showdownId, formatName(pokemon.name))
    }

    if (pokemon.species?.showdownId) {
      contributorNameByShowdownId.set(pokemon.species.showdownId, formatName(pokemon.name))
    }
  })

  const candidateScoreMap = new Map<
    string,
    {
      affinityScore: number
      teammateCount: number
      labels: Set<string>
      contributors: Set<string>
    }
  >()
  const exclusionIds = new Set(
    [...selectedShowdownIds, ...selectedPokemonSlugs.map((slug) => toShowdownId(slug))].filter((value): value is string => Boolean(value))
  )

  latestSelectedUsageRows.forEach((usageRow, showdownPokemonId) => {
    coerceUsageDistribution(usageRow.teammates)
      .slice(0, 40)
      .forEach((entry) => {
        if (exclusionIds.has(entry.key)) {
          return
        }

        const existing = candidateScoreMap.get(entry.key) ?? {
          affinityScore: 0,
          teammateCount: 0,
          labels: new Set<string>(),
          contributors: new Set<string>(),
        }
        const rawLabel =
          Object.keys((usageRow.teammates ?? {}) as Record<string, unknown>).find((value) => toShowdownId(value) === entry.key) ?? entry.key

        existing.affinityScore += entry.value
        existing.teammateCount += 1
        existing.labels.add(rawLabel)
        existing.contributors.add(contributorNameByShowdownId.get(showdownPokemonId) ?? formatName(showdownPokemonId))

        candidateScoreMap.set(entry.key, existing)
      })
  })

  if (!candidateScoreMap.size) {
    const [fallbackRows, sampleSetCounts] = await Promise.all([
      prisma.pokemonFormat.findMany({
        where: {
          competitiveFormatId: {
            in: relatedFormatIds,
          },
          OR: [
            {
              isUsageTracked: true,
            },
            {
              isSampleSetAvailable: true,
            },
          ],
        },
        orderBy: [
          {
            latestUsagePercent: 'desc',
          },
          {
            showdownPokemonId: 'asc',
          },
        ],
        take: limit * 12,
        select: {
          showdownPokemonId: true,
          latestUsagePercent: true,
          isSampleSetAvailable: true,
          isUsageTracked: true,
        },
      }),
      prisma.sampleSet.groupBy({
        by: ['showdownPokemonId'],
        where: {
          competitiveFormatId: {
            in: relatedFormatIds,
          },
        },
        _count: {
          showdownPokemonId: true,
        },
      }),
    ])
    const sampleSetCountById = new Map(
      sampleSetCounts.map((row) => [row.showdownPokemonId, row._count.showdownPokemonId])
    )
    const maxSampleSetCount = Math.max(
      1,
      ...sampleSetCounts.map((row) => row._count.showdownPokemonId)
    )

    fallbackRows.forEach((row) => {
      if (exclusionIds.has(row.showdownPokemonId)) {
        return
      }

      const sampleSetCount = sampleSetCountById.get(row.showdownPokemonId) ?? 0
      const fallbackAffinity =
        typeof row.latestUsagePercent === 'number'
          ? row.latestUsagePercent
          : sampleSetCount
            ? sampleSetCount / maxSampleSetCount
            : row.isSampleSetAvailable
              ? 0.1
              : 0
      const existing = candidateScoreMap.get(row.showdownPokemonId)

      if (existing) {
        existing.affinityScore = Math.max(existing.affinityScore, fallbackAffinity)
        existing.labels.add(row.showdownPokemonId)
        candidateScoreMap.set(row.showdownPokemonId, existing)
        return
      }

      candidateScoreMap.set(row.showdownPokemonId, {
        affinityScore: fallbackAffinity,
        teammateCount: 0,
        labels: new Set<string>([row.showdownPokemonId]),
        contributors: new Set<string>(),
      })
    })

    if (!candidateScoreMap.size && sampleSetCountById.size) {
      Array.from(sampleSetCountById.entries())
        .sort((left, right) => right[1] - left[1])
        .slice(0, limit * 6)
        .forEach(([showdownPokemonId, sampleSetCount]) => {
          if (exclusionIds.has(showdownPokemonId)) {
            return
          }

          candidateScoreMap.set(showdownPokemonId, {
            affinityScore: sampleSetCount / maxSampleSetCount,
            teammateCount: 0,
            labels: new Set<string>([showdownPokemonId]),
            contributors: new Set<string>(),
          })
        })
    }
  }

  const rankedCandidateIds = Array.from(candidateScoreMap.entries())
    .sort((left, right) => right[1].affinityScore - left[1].affinityScore)
    .slice(0, limit * 4)
    .map(([showdownPokemonId]) => showdownPokemonId)

  if (!rankedCandidateIds.length) {
    return {
      format: {
        key: format.formatKey,
        name: format.name,
        section: format.section,
        gameType: format.gameType,
        latestMonth: null,
      },
      summary: {
        selectedCount: selectedPokemonSlugs.length,
        evaluatedCount: 0,
        suggestionCount: 0,
        hasDirectMetaData: latestSelectedUsageRows.size > 0,
      },
      items: [],
    }
  }

  const [candidateUsageRows, directCandidateRows, candidateSampleSets] = await Promise.all([
    prisma.usageStatMonthly.findMany({
      where: {
        competitiveFormatId: format.id,
        showdownPokemonId: {
          in: rankedCandidateIds,
        },
      },
      orderBy: [
        {
          month: 'desc',
        },
        {
          rating: 'desc',
        },
      ],
    }),
    prisma.pokemon.findMany({
      where: {
        OR: [
          {
            showdownId: {
              in: rankedCandidateIds,
            },
          },
          {
            species: {
              showdownId: {
                in: rankedCandidateIds,
              },
            },
          },
        ],
      },
      select: POKEMON_SUGGESTION_SELECT,
    }),
    prisma.sampleSet.findMany({
      where: {
        competitiveFormatId: {
          in: relatedFormatIds,
        },
        showdownPokemonId: {
          in: rankedCandidateIds,
        },
      },
      orderBy: [
        {
          showdownPokemonId: 'asc',
        },
        {
          setName: 'asc',
        },
      ],
      select: {
        showdownPokemonId: true,
        setName: true,
        abilityName: true,
        itemName: true,
        teraType: true,
        nature: true,
        moves: true,
        evs: true,
      },
    }),
  ])

  const latestCandidateUsageRows = pickLatestUsageRows(candidateUsageRows)
  const candidatePokemonById = new Map<string, (typeof directCandidateRows)[number]>()
  const candidateSampleSetById = new Map<string, (typeof candidateSampleSets)[number]>()

  directCandidateRows.forEach((pokemon) => {
    const keys = [pokemon.showdownId, pokemon.species?.showdownId]
      .map((value) => normalizeSlug(value))
      .filter((value): value is string => Boolean(value))

    keys.forEach((key) => {
      if (!candidatePokemonById.has(key)) {
        candidatePokemonById.set(key, pokemon)
      }
    })
  })

  candidateSampleSets.forEach((sampleSet) => {
    if (!candidateSampleSetById.has(sampleSet.showdownPokemonId)) {
      candidateSampleSetById.set(sampleSet.showdownPokemonId, sampleSet)
    }
  })

  for (const showdownPokemonId of rankedCandidateIds) {
    if (candidatePokemonById.has(showdownPokemonId)) {
      continue
    }

    const fuzzyPokemon = await prisma.pokemon.findFirst({
      where: {
        OR: [
          {
            showdownId: {
              startsWith: showdownPokemonId,
            },
          },
          {
            showdownId: {
              endsWith: showdownPokemonId,
            },
          },
        ],
      },
      select: POKEMON_SUGGESTION_SELECT,
    })

    if (fuzzyPokemon) {
      candidatePokemonById.set(showdownPokemonId, fuzzyPokemon)
    }
  }

  const suggestions = rankedCandidateIds
    .map<TeamSuggestionDto | null>((showdownPokemonId) => {
      const candidateScore = candidateScoreMap.get(showdownPokemonId)
      const usageRow = latestCandidateUsageRows.get(showdownPokemonId)
      const pokemon = candidatePokemonById.get(showdownPokemonId) ?? null
      const sampleSet = candidateSampleSetById.get(showdownPokemonId) ?? null

      if (!candidateScore) {
        return null
      }

      if (pokemon && selectedPokemonSlugs.includes(pokemon.name)) {
        return null
      }

      const pokemonTypes = pokemon?.types.map((entry) => entry.type.name) ?? []
      const weaknessCoverage = getWorstCoveredWeaknesses(pokemonTypes, weaknessTargets, typeChart)
      const sampleSetMoveIds = Array.isArray(sampleSet?.moves)
        ? sampleSet.moves.map((moveName) => toShowdownId(String(moveName))).filter(Boolean)
        : []
      const moveSuggestions = usageRow
        ? getUsageEntries(usageRow.moves, 6, (moveId) => moveLookup.get(moveId)?.label ?? formatName(moveId))
        : sampleSetMoveIds.slice(0, 6).map((moveId) => createStaticUsageEntry(moveLookup.get(moveId)?.label ?? formatName(moveId), moveId))
      const candidateUtilities = new Set<SuggestionUtilityTag>()

      moveSuggestions.forEach((move) => {
        const moveMeta = moveLookup.get(move.showdownId)
        getMoveUtilityTags(move.showdownId, moveMeta?.priority ?? 0).forEach((tag) => candidateUtilities.add(tag))
      })

      const missingUtilityMatches = Array.from(candidateUtilities).filter((tag) => !currentUtilityTags.has(tag))
      let utilityScore = missingUtilityMatches.length * 5
      const candidateStats = pokemon ? extractStatMap(pokemon.stats) : {}
      const candidateBias = getAttackBias(candidateStats.attack, candidateStats['special-attack'])

      if (teamBiasCounts.physical >= teamBiasCounts.special + 2 && candidateBias === 'special') {
        utilityScore += 4
      }

      if (teamBiasCounts.special >= teamBiasCounts.physical + 2 && candidateBias === 'physical') {
        utilityScore += 4
      }

      const usageScore = (usageRow?.usagePercent ?? 0) * 28
      const totalScore = candidateScore.affinityScore * 110 + weaknessCoverage.coverageScore * 3 + utilityScore + usageScore
      const reasons: string[] = []

      if (candidateScore.contributors.size) {
        reasons.push(
          candidateScore.contributors.size > 1
            ? `Encaja con ${candidateScore.contributors.size} miembros del equipo segun teammates del meta.`
            : `Aparece como pareja frecuente de ${Array.from(candidateScore.contributors)[0]}.`
        )
      } else if (sampleSet) {
        reasons.push(`Tiene sample sets disponibles en ${format.name}, aunque este entorno no cargue usage mensual completo.`)
      } else {
        reasons.push(`Se mantiene entre las opciones mas jugadas de ${format.name}.`)
      }

      if (weaknessCoverage.helpfulTypes.length) {
        reasons.push(`Te ayuda a tapar ${weaknessCoverage.helpfulTypes.join(', ')}.`)
      }

      if (missingUtilityMatches.length) {
        reasons.push(`Aporta ${missingUtilityMatches.map((tag) => UTILITY_REASON_LABELS[tag]).join(', ')} que ahora mismo te falta.`)
      }

      if (teamBiasCounts.physical >= teamBiasCounts.special + 2 && candidateBias === 'special') {
        reasons.push('Compensa el dano especial del equipo.')
      }

      if (teamBiasCounts.special >= teamBiasCounts.physical + 2 && candidateBias === 'physical') {
        reasons.push('Compensa el dano fisico del equipo.')
      }

      if (usageRow?.usagePercent) {
        reasons.push(`Uso reciente aproximado de ${formatUsagePercent(usageRow.usagePercent)} en ${format.name}.`)
      }

      const abilityEntries = usageRow
        ? getUsageEntries(usageRow.abilities, 2, (abilityId) => abilityLookup.get(abilityId) ?? formatName(abilityId))
        : sampleSet?.abilityName
          ? [createStaticUsageEntry(formatName(sampleSet.abilityName), toShowdownId(sampleSet.abilityName))]
          : []
      const itemEntries = usageRow
        ? getUsageEntries(usageRow.items, 2, (itemId) => itemLookup.get(itemId) ?? formatName(itemId))
        : sampleSet?.itemName
          ? [createStaticUsageEntry(formatName(sampleSet.itemName), toShowdownId(sampleSet.itemName))]
          : []
      const teraEntry = usageRow
        ? getUsageEntries(usageRow.teraTypes, 1, (typeId) => translateType(typeId))[0] ?? null
        : sampleSet?.teraType
          ? createStaticUsageEntry(translateType(sampleSet.teraType), toShowdownId(sampleSet.teraType))
          : null
      const spreadEntry = usageRow
        ? getUsageEntries(usageRow.spreads, 1, (value) => value, (value) => value.trim())[0] ?? null
        : sampleSet?.nature
          ? createStaticUsageEntry(
              `${sampleSet.nature}${sampleSet.evs && typeof sampleSet.evs === 'object' ? ' / sample EVs' : ''}`,
              `${showdownPokemonId}-sample-spread`
            )
          : null
      const enrichedMoves = moveSuggestions.slice(0, 4).map<SuggestedMoveDto>((move) => {
        const moveMeta = moveLookup.get(move.showdownId)

        return {
          ...move,
          typeKey: moveMeta?.typeKey ?? null,
          typeLabel: moveMeta?.typeLabel ?? null,
          categoryKey: moveMeta?.categoryKey ?? null,
          categoryLabel: moveMeta?.categoryLabel ?? null,
          priority: moveMeta?.priority ?? 0,
        }
      })

      const fallbackLabel = Array.from(candidateScore.labels)[0] ?? formatName(showdownPokemonId)
      const pokemonName = pokemon ? formatName(pokemon.name) : fallbackLabel

      return {
        pokemonSlug: pokemon?.name ?? null,
        showdownPokemonId,
        pokemonName,
        image: pokemon?.officialArtworkUrl ?? null,
        thumb: pokemon?.spriteUrl ?? pokemon?.officialArtworkUrl ?? null,
        types: pokemonTypes.map((typeKey) => ({
          key: typeKey,
          label: translateType(typeKey),
        })),
        usagePercent: usageRow?.usagePercent ?? null,
        fitPercent: 0,
        teammateCount: candidateScore.teammateCount,
        affinityScore: Number(candidateScore.affinityScore.toFixed(2)),
        coverageScore: Number(weaknessCoverage.coverageScore.toFixed(2)),
        utilityScore: Number(utilityScore.toFixed(2)),
        totalScore: Number(totalScore.toFixed(2)),
        reasons: reasons.slice(0, 4),
        recommendedBuild: {
          abilities: abilityEntries,
          items: itemEntries,
          moves: enrichedMoves,
          spread: spreadEntry,
          teraType: teraEntry,
        },
      }
    })
    .filter((entry): entry is TeamSuggestionDto => Boolean(entry))
    .sort((left, right) => right.totalScore - left.totalScore)
    .slice(0, limit)

  const topScore = suggestions[0]?.totalScore ?? 0

  const normalizedSuggestions = suggestions.map((suggestion) => ({
    ...suggestion,
    fitPercent: topScore > 0 ? Math.max(12, Math.round((suggestion.totalScore / topScore) * 100)) : 0,
  }))

  return {
    format: {
      key: format.formatKey,
      name: format.name,
      section: format.section,
      gameType: format.gameType,
      latestMonth: Array.from(latestCandidateUsageRows.values())[0]?.month ?? Array.from(latestSelectedUsageRows.values())[0]?.month ?? null,
    },
    summary: {
      selectedCount: selectedPokemonSlugs.length,
      evaluatedCount: rankedCandidateIds.length,
      suggestionCount: normalizedSuggestions.length,
      hasDirectMetaData: latestSelectedUsageRows.size > 0,
    },
    items: normalizedSuggestions,
  }
}
