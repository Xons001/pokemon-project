import { getPrismaClient } from '@/src/lib/prisma'
import { formatName } from '@/src/modules/pokemon/format'
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

export type TypeChartEntryDto = {
  name: string
  doubleDamageFrom: string[]
  halfDamageFrom: string[]
  noDamageFrom: string[]
}

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

export async function listCompetitiveFormats(): Promise<CompetitiveFormatOptionDto[]> {
  const prisma = getPrismaClient()
  const formats = await prisma.competitiveFormat.findMany({
    where: {
      searchShow: true,
      section: {
        not: null,
      },
      NOT: {
        formatKey: {
          startsWith: './',
        },
      },
    },
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
  const formatKey = normalizeFormatKey(input.formatKey)
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
