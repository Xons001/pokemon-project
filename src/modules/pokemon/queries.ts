import type { Prisma } from '@prisma/client'

import { getPrismaClient } from '@/src/lib/prisma'

import type { PokemonCatalogItem, PokemonDetailDto, PokemonHeldItem, PokemonLevelMove, PokemonMoveLearnDto } from './contracts'
import { buildDescription, buildRole, formatDexNumber, formatName, getPalette, translateType } from './format'

type JsonObject = Record<string, any>

const pokemonDetailSelect = {
  id: true,
  name: true,
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

function getStat(stats: Array<{ baseStat: number; stat: { name: string } }>, statName: string): number {
  return stats.find((entry) => entry.stat.name === statName)?.baseStat ?? 0
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
    levelMoves: extractLevelMoves(record),
    heldItems: extractHeldItems(record.rawPayload),
  }
}

export async function listPokemonCatalog(): Promise<PokemonCatalogItem[]> {
  const prisma = getPrismaClient()
  const pokemon = await prisma.pokemon.findMany({
    select: {
      id: true,
      name: true,
      officialArtworkUrl: true,
      spriteUrl: true,
    },
    orderBy: {
      id: 'asc',
    },
  })

  return pokemon.map((entry) => ({
    id: entry.id,
    slug: entry.name,
    label: formatName(entry.name),
    image: entry.officialArtworkUrl,
    thumb: entry.spriteUrl,
  }))
}

export async function getPokemonDetailByName(nameOrId: string): Promise<PokemonDetailDto | null> {
  const prisma = getPrismaClient()
  const normalized = nameOrId.trim().toLowerCase()
  const pokemon = await prisma.pokemon.findFirst({
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

  return serializePokemonDetail(pokemon)
}

export async function getPokemonMoveLearnsByName(nameOrId: string): Promise<PokemonMoveLearnDto[] | null> {
  const prisma = getPrismaClient()
  const normalized = nameOrId.trim().toLowerCase()
  const pokemon = await prisma.pokemon.findFirst({
    where: Number.isInteger(Number(normalized))
      ? {
          id: Number(normalized),
        }
      : {
          name: normalized,
        },
    select: {
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
    },
  })

  if (!pokemon) {
    return null
  }

  return pokemon.moveLearns.map((entry) => ({
    move: formatName(entry.move.name),
    moveSlug: entry.move.name,
    type: translateType(entry.move.type.name),
    typeKey: entry.move.type.name,
    method: formatName(entry.moveLearnMethod.name),
    methodKey: entry.moveLearnMethod.name,
    versionGroup: formatName(entry.versionGroup.name),
    versionGroupKey: entry.versionGroup.name,
    level: entry.levelLearnedAt,
  }))
}
