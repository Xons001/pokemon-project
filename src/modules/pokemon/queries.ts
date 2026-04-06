import { Prisma } from '@prisma/client'

import { getPrismaClient } from '@/src/lib/prisma'
import {
  getActiveMetaFormatKeys,
  hasActiveMetaFormatLimit,
  isActiveMetaFormat,
  normalizeMetaFormatKey,
} from '@/src/modules/showdown/format-scope'

import type {
  PokemonAbilityOption,
  PokemonCatalogItem,
  PokemonDetailDto,
  PokemonHeldItem,
  PokemonLevelMove,
  PokemonMoveLearnDto,
} from './contracts'
import {
  buildDescription,
  buildRole,
  formatDexNumber,
  formatName,
  getPalette,
  translateDamageClass,
  translateType,
} from './format'

type JsonObject = Record<string, any>

type PokemonCatalogRecord = {
  pokemon_id: number
  pokemon_slug: string
  primary_type: string | null
  secondary_type: string | null
  primary_ability: string | null
  hp: number | null
  attack: number | null
  defense: number | null
  special_attack: number | null
  special_defense: number | null
  speed: number | null
  height_m: number | string | null
  weight_kg: number | string | null
  official_artwork_url: string | null
  sprite_url: string | null
}

const pokemonCatalogFallbackSelect = {
  id: true,
  name: true,
  heightDecimetres: true,
  weightHectograms: true,
  officialArtworkUrl: true,
  spriteUrl: true,
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
} satisfies Prisma.PokemonSelect

type PokemonCatalogFallbackRecord = Prisma.PokemonGetPayload<{
  select: typeof pokemonCatalogFallbackSelect
}>

type ListPokemonCatalogOptions = {
  competitiveOnly?: boolean
  formatKey?: string | null
  query?: string | null
  page?: number | null
  pageSize?: number | null
}

type ListPokemonCatalogResult = {
  total: number
  catalogTotal: number
  items: PokemonCatalogItem[]
}

const pokemonDetailSelect = {
  id: true,
  name: true,
  speciesId: true,
  isDefault: true,
  heightDecimetres: true,
  weightHectograms: true,
  officialArtworkUrl: true,
  spriteUrl: true,
  rawPayload: true,
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
  moveLearns: {
    select: {
      levelLearnedAt: true,
      moveLearnMethod: {
        select: {
          name: true,
        },
      },
      move: {
        select: {
          name: true,
          type: {
            select: {
              name: true,
            },
          },
        },
      },
      versionGroup: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [{ levelLearnedAt: 'asc' }],
  },
} satisfies Prisma.PokemonSelect

type PokemonDetailRecord = Prisma.PokemonGetPayload<{
  select: typeof pokemonDetailSelect
}>

const pokemonMoveLearnSelect = {
  id: true,
  speciesId: true,
  isDefault: true,
  moveLearns: {
    select: {
      levelLearnedAt: true,
      moveLearnMethod: {
        select: {
          name: true,
        },
      },
      versionGroup: {
        select: {
          name: true,
        },
      },
      move: {
        select: {
          name: true,
          power: true,
          accuracy: true,
          pp: true,
          priority: true,
          damageClassName: true,
          type: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: [{ versionGroupId: 'asc' }, { levelLearnedAt: 'asc' }],
  },
} satisfies Prisma.PokemonSelect

type PokemonMoveLearnRecord = Prisma.PokemonGetPayload<{
  select: typeof pokemonMoveLearnSelect
}>

function getStat(stats: Array<{ baseStat: number; stat: { name: string } }>, statName: string): number {
  return stats.find((entry) => entry.stat.name === statName)?.baseStat ?? 0
}

function toNullableNumber(value: number | string | null): number | null {
  if (value === null || typeof value === 'number') {
    return value
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function getRawPayloadStats(rawPayload: Prisma.JsonValue | null) {
  const payload = (rawPayload ?? {}) as JsonObject
  const stats = Array.isArray(payload.stats) ? payload.stats : []

  return stats
    .map((entry) => ({
      baseStat: typeof entry?.base_stat === 'number' ? entry.base_stat : 0,
      stat: {
        name: entry?.stat?.name ?? '',
      },
    }))
    .filter((entry) => entry.stat.name)
}

function getTypeKeys(record: PokemonDetailRecord): string[] {
  if (record.types.length) {
    return record.types.map((entry) => entry.type.name)
  }

  const payload = (record.rawPayload ?? {}) as JsonObject
  const rawTypes = Array.isArray(payload.types) ? payload.types : []

  return rawTypes
    .sort((left, right) => (left?.slot ?? 0) - (right?.slot ?? 0))
    .map((entry) => entry?.type?.name)
    .filter(Boolean)
}

function getPrimaryAbilityName(record: PokemonDetailRecord): string | null {
  const primaryAbility =
    record.abilities.find((entry) => !entry.isHidden)?.ability.name ?? record.abilities[0]?.ability.name

  if (primaryAbility) {
    return primaryAbility
  }

  const payload = (record.rawPayload ?? {}) as JsonObject
  const rawAbilities = Array.isArray(payload.abilities) ? payload.abilities : []
  const sortedAbilities = rawAbilities.sort((left, right) => (left?.slot ?? 0) - (right?.slot ?? 0))
  const visibleAbility = sortedAbilities.find((entry) => !entry?.is_hidden)?.ability?.name ?? sortedAbilities[0]?.ability?.name

  return typeof visibleAbility === 'string' ? visibleAbility : null
}

function getCatalogTypeKeys(record: PokemonCatalogFallbackRecord): string[] {
  return record.types.map((entry) => entry.type.name).filter(Boolean)
}

function getCatalogPrimaryAbilityName(record: PokemonCatalogFallbackRecord): string | null {
  return (
    record.abilities.find((entry) => !entry.isHidden)?.ability.name ??
    record.abilities.find((entry) => entry.slot === 1)?.ability.name ??
    record.abilities[0]?.ability.name ??
    null
  )
}

function serializePokemonCatalogFromView(entry: PokemonCatalogRecord): PokemonCatalogItem {
  return {
    id: entry.pokemon_id,
    slug: entry.pokemon_slug,
    label: formatName(entry.pokemon_slug),
    image: entry.official_artwork_url,
    thumb: entry.sprite_url,
    primaryType: entry.primary_type,
    secondaryType: entry.secondary_type,
    primaryAbility: entry.primary_ability,
    hp: entry.hp,
    attack: entry.attack,
    defense: entry.defense,
    specialAttack: entry.special_attack,
    specialDefense: entry.special_defense,
    speed: entry.speed,
    height: toNullableNumber(entry.height_m),
    weight: toNullableNumber(entry.weight_kg),
  }
}

function serializePokemonCatalogFromPokemon(record: PokemonCatalogFallbackRecord): PokemonCatalogItem {
  const typeKeys = getCatalogTypeKeys(record)

  return {
    id: record.id,
    slug: record.name,
    label: formatName(record.name),
    image: record.officialArtworkUrl,
    thumb: record.spriteUrl,
    primaryType: typeKeys[0] ?? null,
    secondaryType: typeKeys[1] ?? null,
    primaryAbility: getCatalogPrimaryAbilityName(record),
    hp: getStat(record.stats, 'hp'),
    attack: getStat(record.stats, 'attack'),
    defense: getStat(record.stats, 'defense'),
    specialAttack: getStat(record.stats, 'special-attack'),
    specialDefense: getStat(record.stats, 'special-defense'),
    speed: getStat(record.stats, 'speed'),
    height:
      typeof record.heightDecimetres === 'number' ? Number((record.heightDecimetres / 10).toFixed(1)) : null,
    weight:
      typeof record.weightHectograms === 'number' ? Number((record.weightHectograms / 10).toFixed(1)) : null,
  }
}

function normalizeCatalogPage(value?: number | null): number | null {
  if (value === null || value === undefined) {
    return null
  }

  if (!Number.isFinite(Number(value))) {
    return null
  }

  return Math.max(1, Math.round(Number(value)))
}

function normalizeCatalogPageSize(value?: number | null): number | null {
  if (value === null || value === undefined) {
    return null
  }

  if (!Number.isFinite(Number(value))) {
    return null
  }

  return Math.min(Math.max(Math.round(Number(value)), 1), 96)
}

function filterPokemonCatalogItems(items: PokemonCatalogItem[], query?: string | null) {
  const normalizedQuery = query?.trim().toLowerCase()

  if (!normalizedQuery) {
    return items
  }

  return items.filter((entry) => {
    const haystack = [
      entry.label,
      entry.slug,
      formatDexNumber(entry.id),
      entry.primaryAbility,
      entry.primaryAbility ? formatName(entry.primaryAbility) : null,
      entry.primaryType,
      entry.secondaryType,
      entry.primaryType ? translateType(entry.primaryType) : null,
      entry.secondaryType ? translateType(entry.secondaryType) : null,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(normalizedQuery)
  })
}

function paginatePokemonCatalogItems(
  items: PokemonCatalogItem[],
  page?: number | null,
  pageSize?: number | null
) {
  const normalizedPageSize = normalizeCatalogPageSize(pageSize)

  if (!normalizedPageSize) {
    return items
  }

  const normalizedPage = normalizeCatalogPage(page) ?? 1
  const offset = (normalizedPage - 1) * normalizedPageSize

  return items.slice(offset, offset + normalizedPageSize)
}

async function listPokemonCatalogFromView(
  prisma: ReturnType<typeof getPrismaClient>,
  options: {
    page?: number | null
    pageSize?: number | null
  } = {}
) {
  const normalizedPageSize = normalizeCatalogPageSize(options.pageSize)
  const normalizedPage = normalizeCatalogPage(options.page) ?? 1

  if (normalizedPageSize) {
    const offset = (normalizedPage - 1) * normalizedPageSize
    const [countRows, pokemon] = await Promise.all([
      prisma.$queryRaw<Array<{ count: bigint | number }>>(Prisma.sql`
        SELECT COUNT(*) AS count
        FROM pokemon_summary_view
      `),
      prisma.$queryRaw<PokemonCatalogRecord[]>(Prisma.sql`
        SELECT
          pokemon_id,
          pokemon_slug,
          primary_type,
          secondary_type,
          primary_ability,
          hp,
          attack,
          defense,
          special_attack,
          special_defense,
          speed,
          height_m,
          weight_kg,
          official_artwork_url,
          sprite_url
        FROM pokemon_summary_view
        ORDER BY pokemon_id ASC
        LIMIT ${normalizedPageSize}
        OFFSET ${offset}
      `),
    ])

    return {
      total: Number(countRows[0]?.count ?? 0),
      items: pokemon.map(serializePokemonCatalogFromView),
    }
  }

  const pokemon = await prisma.$queryRaw<PokemonCatalogRecord[]>(Prisma.sql`
    SELECT
      pokemon_id,
      pokemon_slug,
      primary_type,
      secondary_type,
      primary_ability,
      hp,
      attack,
      defense,
      special_attack,
      special_defense,
      speed,
      height_m,
      weight_kg,
      official_artwork_url,
      sprite_url
    FROM pokemon_summary_view
    ORDER BY pokemon_id ASC
  `)

  return {
    total: pokemon.length,
    items: pokemon.map(serializePokemonCatalogFromView),
  }
}

async function listPokemonCatalogFromRelations(
  prisma: ReturnType<typeof getPrismaClient>,
  options: {
    page?: number | null
    pageSize?: number | null
  } = {}
) {
  const normalizedPageSize = normalizeCatalogPageSize(options.pageSize)
  const normalizedPage = normalizeCatalogPage(options.page) ?? 1
  const [total, pokemon] = await Promise.all([
    prisma.pokemon.count(),
    prisma.pokemon.findMany({
      select: pokemonCatalogFallbackSelect,
      orderBy: {
        id: 'asc',
      },
      ...(normalizedPageSize
        ? {
            skip: (normalizedPage - 1) * normalizedPageSize,
            take: normalizedPageSize,
          }
        : {}),
    }),
  ])

  return {
    total,
    items: pokemon.map(serializePokemonCatalogFromPokemon),
  }
}

function resolveScopedCatalogFormatKeys(requestedFormatKey?: string | null) {
  const normalizedRequestedFormatKey = requestedFormatKey ? normalizeMetaFormatKey(requestedFormatKey) : null

  if (normalizedRequestedFormatKey) {
    if (!hasActiveMetaFormatLimit() || isActiveMetaFormat(normalizedRequestedFormatKey)) {
      return [normalizedRequestedFormatKey]
    }
  }

  return getActiveMetaFormatKeys()
}

async function resolveCompetitiveCatalogScope(
  prisma: ReturnType<typeof getPrismaClient>,
  formatKeys: string[]
) {
  const scopedRows = await prisma.pokemonFormat.findMany({
    where: formatKeys.length
      ? {
          competitiveFormat: {
            is: {
              formatKey: {
                in: formatKeys,
              },
            },
          },
        }
      : undefined,
    select: {
      pokemonId: true,
      speciesId: true,
      showdownPokemonId: true,
    },
  })

  return {
    pokemonIds: Array.from(
      new Set(
        scopedRows
          .map((entry) => entry.pokemonId)
          .filter((value): value is number => Number.isInteger(value))
      )
    ),
    speciesIds: Array.from(
      new Set(
        scopedRows
          .map((entry) => entry.speciesId)
          .filter((value): value is number => Number.isInteger(value))
      )
    ),
    showdownIds: Array.from(
      new Set(scopedRows.map((entry) => entry.showdownPokemonId).filter(Boolean))
    ),
  }
}

function buildCompetitiveCatalogWhere(scope: {
  pokemonIds: number[]
  speciesIds: number[]
  showdownIds: string[]
}): Prisma.PokemonWhereInput {
  const orClauses: Prisma.PokemonWhereInput[] = []

  if (scope.pokemonIds.length) {
    orClauses.push({
      id: {
        in: scope.pokemonIds,
      },
    })
  }

  if (scope.showdownIds.length) {
    orClauses.push({
      showdownId: {
        in: scope.showdownIds,
      },
    })
  }

  if (scope.speciesIds.length) {
    orClauses.push({
      isDefault: true,
      speciesId: {
        in: scope.speciesIds,
      },
    })
  }

  return orClauses.length
    ? {
        OR: orClauses,
      }
    : {
        id: -1,
      }
}

function extractHeldItems(rawPayload: Prisma.JsonValue | null): PokemonHeldItem[] {
  const payload = (rawPayload ?? {}) as JsonObject
  const heldItems = Array.isArray(payload.held_items) ? payload.held_items : []

  return heldItems
    .map((entry) => {
      const versionDetails = Array.isArray(entry?.version_details) ? entry.version_details : []
      const rarityValues = versionDetails
        .map((detail: any) => detail?.rarity)
        .filter((rarity: unknown): rarity is number => typeof rarity === 'number')

      return {
        name: formatName(entry?.item?.name ?? 'desconocido'),
        rarity: rarityValues.length ? Math.max(...rarityValues) : null,
      }
    })
    .sort((left, right) => {
      if ((right.rarity ?? 0) === (left.rarity ?? 0)) {
        return left.name.localeCompare(right.name)
      }

      return (right.rarity ?? 0) - (left.rarity ?? 0)
    })
}

function extractAbilities(record: PokemonDetailRecord): PokemonAbilityOption[] {
  if (record.abilities.length) {
    return record.abilities.map((entry) => ({
      slug: entry.ability.name,
      label: formatName(entry.ability.name),
      isHidden: entry.isHidden,
      slot: entry.slot,
    }))
  }

  const payload = (record.rawPayload ?? {}) as JsonObject
  const rawAbilities = Array.isArray(payload.abilities) ? payload.abilities : []

  return rawAbilities
    .map((entry) => ({
      slug: entry?.ability?.name,
      label: entry?.ability?.name ? formatName(entry.ability.name) : null,
      isHidden: Boolean(entry?.is_hidden),
      slot: typeof entry?.slot === 'number' ? entry.slot : 0,
    }))
    .filter((entry): entry is PokemonAbilityOption => Boolean(entry.slug && entry.label))
    .sort((left, right) => left.slot - right.slot)
}

function extractLevelMoves(record: PokemonDetailRecord): PokemonLevelMove[] {
  if (!record.moveLearns.length) {
    const payload = (record.rawPayload ?? {}) as JsonObject
    const rawMoves = Array.isArray(payload.moves) ? payload.moves : []
    const levelMoveMap = new Map<string, PokemonLevelMove>()

    rawMoves.forEach((entry) => {
      const details = Array.isArray(entry?.version_group_details) ? entry.version_group_details : []
      const levelUpDetails = details.filter((detail: any) => detail?.move_learn_method?.name === 'level-up')

      if (!levelUpDetails.length) {
        return
      }

      const earliestLevel = Math.min(
        ...levelUpDetails.map((detail: any) =>
          typeof detail?.level_learned_at === 'number' ? detail.level_learned_at : 0
        )
      )
      const moveName = entry?.move?.name

      if (!moveName) {
        return
      }

      const previous = levelMoveMap.get(moveName)

      if (!previous || earliestLevel < previous.level) {
        levelMoveMap.set(moveName, {
          name: formatName(moveName),
          level: earliestLevel,
        })
      }
    })

    return Array.from(levelMoveMap.values()).sort((left, right) => {
      if (left.level === right.level) {
        return left.name.localeCompare(right.name)
      }

      return left.level - right.level
    })
  }

  const levelMoveMap = new Map<string, PokemonLevelMove>()

  record.moveLearns.forEach((entry) => {
    if (entry.moveLearnMethod.name !== 'level-up') {
      return
    }

    const previous = levelMoveMap.get(entry.move.name)

    if (!previous || entry.levelLearnedAt < previous.level) {
      levelMoveMap.set(entry.move.name, {
        name: formatName(entry.move.name),
        level: entry.levelLearnedAt,
      })
    }
  })

  return Array.from(levelMoveMap.values()).sort((left, right) => {
    if (left.level === right.level) {
      return left.name.localeCompare(right.name)
    }

    return left.level - right.level
  })
}

function serializePokemonDetail(record: PokemonDetailRecord): PokemonDetailDto {
  const normalizedStats = record.stats.length >= 6 ? record.stats : getRawPayloadStats(record.rawPayload)
  const hp = getStat(normalizedStats, 'hp')
  const attack = getStat(normalizedStats, 'attack')
  const defense = getStat(normalizedStats, 'defense')
  const specialAttack = getStat(normalizedStats, 'special-attack')
  const specialDefense = getStat(normalizedStats, 'special-defense')
  const speed = getStat(normalizedStats, 'speed')
  const typeKeys = getTypeKeys(record)
  const translatedTypes = typeKeys.map(translateType)
  const primaryTypeKey = typeKeys[0] ?? 'normal'
  const role = buildRole(attack, defense, speed)
  const name = formatName(record.name)
  const bonusAbility = getPrimaryAbilityName(record)
  const payload = (record.rawPayload ?? {}) as JsonObject
  const artworkFromPayload =
    payload?.sprites?.other?.['official-artwork']?.front_default ??
    payload?.sprites?.other?.home?.front_default ??
    payload?.sprites?.front_default
  const image = record.officialArtworkUrl ?? artworkFromPayload ?? `/placeholder-pokemon.png`
  const thumb = record.spriteUrl ?? payload?.sprites?.front_default ?? image

  return {
    isPlaceholder: false,
    id: formatDexNumber(record.id),
    slug: record.name,
    name,
    image,
    thumb,
    type: translatedTypes[0] ?? 'Normal',
    types: translatedTypes,
    typeKeys,
    hp,
    attack,
    defense,
    specialAttack,
    specialDefense,
    speed,
    bonus: bonusAbility ? formatName(bonusAbility) : 'Sin dato',
    description: buildDescription(name, translatedTypes, role, attack, speed),
    role,
    palette: getPalette(primaryTypeKey),
    height: typeof record.heightDecimetres === 'number' ? Number((record.heightDecimetres / 10).toFixed(1)) : null,
    weight: typeof record.weightHectograms === 'number' ? Number((record.weightHectograms / 10).toFixed(1)) : null,
    abilities: extractAbilities(record),
    levelMoves: extractLevelMoves(record),
    heldItems: extractHeldItems(record.rawPayload),
  }
}

async function findDefaultSpeciesPokemonDetail(
  prisma: ReturnType<typeof getPrismaClient>,
  speciesId: number,
  excludePokemonId: number
): Promise<PokemonDetailRecord | null> {
  return prisma.pokemon.findFirst({
    where: {
      speciesId,
      isDefault: true,
      NOT: {
        id: excludePokemonId,
      },
    },
    select: pokemonDetailSelect,
  })
}

async function findDefaultSpeciesPokemonMoves(
  prisma: ReturnType<typeof getPrismaClient>,
  speciesId: number,
  excludePokemonId: number
): Promise<PokemonMoveLearnRecord | null> {
  return prisma.pokemon.findFirst({
    where: {
      speciesId,
      isDefault: true,
      NOT: {
        id: excludePokemonId,
      },
    },
    select: pokemonMoveLearnSelect,
  })
}

export async function listPokemonCatalog(options: ListPokemonCatalogOptions = {}): Promise<ListPokemonCatalogResult> {
  const prisma = getPrismaClient()
  const competitiveOnly = Boolean(options.competitiveOnly)
  const normalizedQuery = options.query?.trim() ?? ''
  const normalizedPage = normalizeCatalogPage(options.page)
  const normalizedPageSize = normalizeCatalogPageSize(options.pageSize)

  if (competitiveOnly) {
    const competitiveScope = await resolveCompetitiveCatalogScope(prisma, resolveScopedCatalogFormatKeys(options.formatKey))
    const pokemon = await prisma.pokemon.findMany({
      where: buildCompetitiveCatalogWhere(competitiveScope),
      select: pokemonCatalogFallbackSelect,
      orderBy: {
        id: 'asc',
      },
    })

    const catalogItems = pokemon.map(serializePokemonCatalogFromPokemon)
    const filteredItems = filterPokemonCatalogItems(catalogItems, normalizedQuery)

    return {
      total: filteredItems.length,
      catalogTotal: catalogItems.length,
      items: paginatePokemonCatalogItems(filteredItems, normalizedPage, normalizedPageSize),
    }
  }

  try {
    if (normalizedQuery) {
      const baseCatalog = await listPokemonCatalogFromView(prisma)
      const filteredItems = filterPokemonCatalogItems(baseCatalog.items, normalizedQuery)

      return {
        total: filteredItems.length,
        catalogTotal: baseCatalog.total,
        items: paginatePokemonCatalogItems(filteredItems, normalizedPage, normalizedPageSize),
      }
    }

    const paginatedCatalog = await listPokemonCatalogFromView(prisma, {
      page: normalizedPage,
      pageSize: normalizedPageSize,
    })

    return {
      total: paginatedCatalog.total,
      catalogTotal: paginatedCatalog.total,
      items: paginatedCatalog.items,
    }
  } catch (error) {
    console.warn('[pokemon] pokemon_summary_view unavailable, falling back to relational catalog query.', error)

    if (normalizedQuery) {
      const baseCatalog = await listPokemonCatalogFromRelations(prisma)
      const filteredItems = filterPokemonCatalogItems(baseCatalog.items, normalizedQuery)

      return {
        total: filteredItems.length,
        catalogTotal: baseCatalog.total,
        items: paginatePokemonCatalogItems(filteredItems, normalizedPage, normalizedPageSize),
      }
    }

    const paginatedCatalog = await listPokemonCatalogFromRelations(prisma, {
      page: normalizedPage,
      pageSize: normalizedPageSize,
    })

    return {
      total: paginatedCatalog.total,
      catalogTotal: paginatedCatalog.total,
      items: paginatedCatalog.items,
    }
  }
}

export async function getPokemonDetailByName(nameOrId: string): Promise<PokemonDetailDto | null> {
  const prisma = getPrismaClient()
  const normalized = nameOrId.trim().toLowerCase()
  let pokemon = await prisma.pokemon.findFirst({
    where: Number.isInteger(Number(normalized))
      ? {
          id: Number(normalized),
        }
      : {
          name: normalized,
        },
    select: pokemonDetailSelect,
  })

  if (!pokemon) {
    return null
  }

  const needsFallbackAbilities = extractAbilities(pokemon).length === 0
  const needsFallbackLevelMoves = extractLevelMoves(pokemon).length === 0

  if (!pokemon.isDefault && (needsFallbackAbilities || needsFallbackLevelMoves)) {
    const fallbackPokemon = await findDefaultSpeciesPokemonDetail(prisma, pokemon.speciesId, pokemon.id)

    if (fallbackPokemon) {
      pokemon = {
        ...pokemon,
        abilities: needsFallbackAbilities ? fallbackPokemon.abilities : pokemon.abilities,
        moveLearns: needsFallbackLevelMoves ? fallbackPokemon.moveLearns : pokemon.moveLearns,
      }
    }
  }

  return serializePokemonDetail(pokemon)
}

export async function getPokemonMoveLearnsByName(nameOrId: string): Promise<PokemonMoveLearnDto[] | null> {
  const prisma = getPrismaClient()
  const normalized = nameOrId.trim().toLowerCase()
  let pokemon = await prisma.pokemon.findFirst({
    where: Number.isInteger(Number(normalized))
      ? {
          id: Number(normalized),
        }
      : {
          name: normalized,
        },
    select: pokemonMoveLearnSelect,
  })

  if (!pokemon) {
    return null
  }

  if (!pokemon.isDefault && !pokemon.moveLearns.length) {
    const fallbackPokemon = await findDefaultSpeciesPokemonMoves(prisma, pokemon.speciesId, pokemon.id)

    if (fallbackPokemon?.moveLearns.length) {
      pokemon = {
        ...pokemon,
        moveLearns: fallbackPokemon.moveLearns,
      }
    }
  }

  const moveMap = new Map<string, PokemonMoveLearnDto>()

  pokemon.moveLearns.forEach((entry) => {
    const existing = moveMap.get(entry.move.name)
    const normalizedLevel = entry.levelLearnedAt > 0 ? entry.levelLearnedAt : null

    if (!existing) {
      moveMap.set(entry.move.name, {
        move: formatName(entry.move.name),
        moveSlug: entry.move.name,
        type: translateType(entry.move.type.name),
        typeKey: entry.move.type.name,
        category: translateDamageClass(entry.move.damageClassName),
        categoryKey: entry.move.damageClassName ?? null,
        power: entry.move.power ?? null,
        accuracy: entry.move.accuracy ?? null,
        pp: entry.move.pp ?? null,
        priority: entry.move.priority ?? null,
        learnMethods: [formatName(entry.moveLearnMethod.name)],
        learnMethodKeys: [entry.moveLearnMethod.name],
        versionGroups: [formatName(entry.versionGroup.name)],
        versionGroupKeys: [entry.versionGroup.name],
        level: normalizedLevel,
      })

      return
    }

    if (!existing.learnMethodKeys.includes(entry.moveLearnMethod.name)) {
      existing.learnMethodKeys.push(entry.moveLearnMethod.name)
      existing.learnMethods.push(formatName(entry.moveLearnMethod.name))
    }

    if (!existing.versionGroupKeys.includes(entry.versionGroup.name)) {
      existing.versionGroupKeys.push(entry.versionGroup.name)
      existing.versionGroups.push(formatName(entry.versionGroup.name))
    }

    if (normalizedLevel !== null && (existing.level === null || normalizedLevel < existing.level)) {
      existing.level = normalizedLevel
    }
  })

  return Array.from(moveMap.values()).sort((left, right) => {
    if (left.level === null && right.level !== null) {
      return 1
    }

    if (left.level !== null && right.level === null) {
      return -1
    }

    if (left.level !== null && right.level !== null && left.level !== right.level) {
      return left.level - right.level
    }

    return left.move.localeCompare(right.move)
  })
}
