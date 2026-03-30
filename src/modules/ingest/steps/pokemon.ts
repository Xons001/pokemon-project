import type { Prisma } from '@prisma/client'

import { extractNumericIdFromResourceUrl, processInBatches } from '@/src/modules/ingest/pokeapi/client'
import type { IngestContext } from '@/src/modules/ingest/types'
import { toShowdownId } from '@/src/modules/showdown/id'

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue
}

function extractOptionalId(resource?: { url?: string } | null): number | null {
  if (!resource?.url) {
    return null
  }

  return extractNumericIdFromResourceUrl(resource.url)
}

async function ingestResourceCollection(
  context: IngestContext,
  stepName: string,
  resource: string,
  worker: (detail: any, index: number) => Promise<void>
) {
  const resources = await context.client.listResources(resource, context.limit)
  context.log(`[ingest:${stepName}] ${resources.length} recursos detectados`)

  await processInBatches(resources, context.concurrency, async (entry, index) => {
    const detail = await context.client.fetchByUrl<any>(entry.url)
    await worker(detail, index)

    if ((index + 1) % 25 === 0 || index === resources.length - 1) {
      context.log(`[ingest:${stepName}] ${index + 1}/${resources.length}`)
    }
  })
}

export async function ingestPokemonSpecies(context: IngestContext) {
  await ingestResourceCollection(context, 'pokemon-species', 'pokemon-species', async (detail) => {
    await context.prisma.pokemonSpecies.upsert({
      where: { id: detail.id },
      create: {
        id: detail.id,
        name: detail.name,
        showdownId: toShowdownId(detail.name),
        generationId: extractNumericIdFromResourceUrl(detail.generation.url),
        evolutionChainId: extractOptionalId(detail.evolution_chain),
        baseHappiness: detail.base_happiness ?? null,
        captureRate: detail.capture_rate ?? null,
        colorName: detail.color?.name ?? null,
        formsSwitchable: Boolean(detail.forms_switchable),
        genderRate: detail.gender_rate ?? null,
        growthRateName: detail.growth_rate?.name ?? null,
        habitatName: detail.habitat?.name ?? null,
        hasGenderDifferences: Boolean(detail.has_gender_differences),
        hatchCounter: detail.hatch_counter ?? null,
        isBaby: Boolean(detail.is_baby),
        isLegendary: Boolean(detail.is_legendary),
        isMythical: Boolean(detail.is_mythical),
        order: detail.order ?? null,
        shapeName: detail.shape?.name ?? null,
        rawPayload: toJson(detail),
      },
      update: {
        name: detail.name,
        showdownId: toShowdownId(detail.name),
        generationId: extractNumericIdFromResourceUrl(detail.generation.url),
        evolutionChainId: extractOptionalId(detail.evolution_chain),
        baseHappiness: detail.base_happiness ?? null,
        captureRate: detail.capture_rate ?? null,
        colorName: detail.color?.name ?? null,
        formsSwitchable: Boolean(detail.forms_switchable),
        genderRate: detail.gender_rate ?? null,
        growthRateName: detail.growth_rate?.name ?? null,
        habitatName: detail.habitat?.name ?? null,
        hasGenderDifferences: Boolean(detail.has_gender_differences),
        hatchCounter: detail.hatch_counter ?? null,
        isBaby: Boolean(detail.is_baby),
        isLegendary: Boolean(detail.is_legendary),
        isMythical: Boolean(detail.is_mythical),
        order: detail.order ?? null,
        shapeName: detail.shape?.name ?? null,
        rawPayload: toJson(detail),
      },
    })
  })
}

export async function ingestPokemon(context: IngestContext) {
  await ingestResourceCollection(context, 'pokemon', 'pokemon', async (detail) => {
    const officialArtworkUrl =
      detail?.sprites?.other?.['official-artwork']?.front_default ??
      detail?.sprites?.other?.home?.front_default ??
      null

    await context.prisma.pokemon.upsert({
      where: { id: detail.id },
      create: {
        id: detail.id,
        name: detail.name,
        showdownId: toShowdownId(detail.name),
        speciesId: extractNumericIdFromResourceUrl(detail.species.url),
        baseExperience: detail.base_experience ?? null,
        heightDecimetres: detail.height ?? null,
        weightHectograms: detail.weight ?? null,
        sortOrder: detail.order ?? null,
        isDefault: Boolean(detail.is_default),
        officialArtworkUrl,
        spriteUrl: detail?.sprites?.front_default ?? null,
        rawPayload: toJson(detail),
      },
      update: {
        name: detail.name,
        showdownId: toShowdownId(detail.name),
        speciesId: extractNumericIdFromResourceUrl(detail.species.url),
        baseExperience: detail.base_experience ?? null,
        heightDecimetres: detail.height ?? null,
        weightHectograms: detail.weight ?? null,
        sortOrder: detail.order ?? null,
        isDefault: Boolean(detail.is_default),
        officialArtworkUrl,
        spriteUrl: detail?.sprites?.front_default ?? null,
        rawPayload: toJson(detail),
      },
    })
  })
}

export async function ingestPokemonForms(context: IngestContext) {
  await ingestResourceCollection(context, 'pokemon-form', 'pokemon-form', async (detail) => {
    await context.prisma.pokemonForm.upsert({
      where: { id: detail.id },
      create: {
        id: detail.id,
        name: detail.name,
        pokemonId: extractNumericIdFromResourceUrl(detail.pokemon.url),
        formName: detail.form_name || null,
        formOrder: detail.form_order ?? null,
        isBattleOnly: Boolean(detail.is_battle_only),
        isDefault: Boolean(detail.is_default),
        isMega: Boolean(detail.is_mega),
        sortOrder: detail.order ?? null,
        rawPayload: toJson(detail),
      },
      update: {
        name: detail.name,
        pokemonId: extractNumericIdFromResourceUrl(detail.pokemon.url),
        formName: detail.form_name || null,
        formOrder: detail.form_order ?? null,
        isBattleOnly: Boolean(detail.is_battle_only),
        isDefault: Boolean(detail.is_default),
        isMega: Boolean(detail.is_mega),
        sortOrder: detail.order ?? null,
        rawPayload: toJson(detail),
      },
    })
  })
}

export async function ingestMachines(context: IngestContext) {
  await ingestResourceCollection(context, 'machine', 'machine', async (detail) => {
    await context.prisma.machine.upsert({
      where: { id: detail.id },
      create: {
        id: detail.id,
        moveId: extractNumericIdFromResourceUrl(detail.move.url),
        itemId: extractNumericIdFromResourceUrl(detail.item.url),
        versionGroupId: extractNumericIdFromResourceUrl(detail.version_group.url),
        rawPayload: toJson(detail),
      },
      update: {
        moveId: extractNumericIdFromResourceUrl(detail.move.url),
        itemId: extractNumericIdFromResourceUrl(detail.item.url),
        versionGroupId: extractNumericIdFromResourceUrl(detail.version_group.url),
        rawPayload: toJson(detail),
      },
    })
  })
}

export async function syncPokemonBridgeTables(context: IngestContext) {
  const [pokemon, typeIds, abilityIds, statIds, moveIds, versionGroupIds, moveLearnMethodIds] = await Promise.all([
    context.prisma.pokemon.findMany({
      select: {
        id: true,
        rawPayload: true,
      },
      orderBy: {
        id: 'asc',
      },
      ...(typeof context.limit === 'number' ? { take: context.limit } : {}),
    }),
    context.prisma.type.findMany({ select: { id: true } }),
    context.prisma.ability.findMany({ select: { id: true } }),
    context.prisma.stat.findMany({ select: { id: true } }),
    context.prisma.move.findMany({ select: { id: true } }),
    context.prisma.versionGroup.findMany({ select: { id: true } }),
    context.prisma.moveLearnMethod.findMany({ select: { id: true } }),
  ])

  const typeIdSet = new Set(typeIds.map((entry) => entry.id))
  const abilityIdSet = new Set(abilityIds.map((entry) => entry.id))
  const statIdSet = new Set(statIds.map((entry) => entry.id))
  const moveIdSet = new Set(moveIds.map((entry) => entry.id))
  const versionGroupIdSet = new Set(versionGroupIds.map((entry) => entry.id))
  const moveLearnMethodIdSet = new Set(moveLearnMethodIds.map((entry) => entry.id))

  for (const [index, pokemonEntry] of pokemon.entries()) {
    const payload = (pokemonEntry.rawPayload ?? {}) as Record<string, any>
    const types = Array.isArray(payload.types) ? payload.types : []
    const abilities = Array.isArray(payload.abilities) ? payload.abilities : []
    const stats = Array.isArray(payload.stats) ? payload.stats : []
    const moves = Array.isArray(payload.moves) ? payload.moves : []

    const pokemonTypes = types
      .map((entry) => ({
        pokemonId: pokemonEntry.id,
        typeId: extractNumericIdFromResourceUrl(entry.type.url),
        slot: entry.slot,
      }))
      .filter((entry) => typeIdSet.has(entry.typeId))

    const pokemonAbilities = abilities
      .map((entry) => ({
        pokemonId: pokemonEntry.id,
        abilityId: extractNumericIdFromResourceUrl(entry.ability.url),
        slot: entry.slot,
        isHidden: Boolean(entry.is_hidden),
      }))
      .filter((entry) => abilityIdSet.has(entry.abilityId))

    const pokemonStats = stats
      .map((entry) => ({
        pokemonId: pokemonEntry.id,
        statId: extractNumericIdFromResourceUrl(entry.stat.url),
        baseStat: entry.base_stat ?? 0,
        effort: entry.effort ?? 0,
      }))
      .filter((entry) => statIdSet.has(entry.statId))

    const pokemonMoveMap = new Map<string, Prisma.PokemonMoveLearnCreateManyInput>()

    moves.forEach((moveEntry) => {
      const moveId = extractNumericIdFromResourceUrl(moveEntry.move.url)

      if (!moveIdSet.has(moveId)) {
        return
      }

      const versionGroupDetails = Array.isArray(moveEntry.version_group_details) ? moveEntry.version_group_details : []
      versionGroupDetails.forEach((detail: any, detailIndex: number) => {
        const versionGroupId = extractNumericIdFromResourceUrl(detail.version_group.url)
        const moveLearnMethodId = extractNumericIdFromResourceUrl(detail.move_learn_method.url)

        if (!versionGroupIdSet.has(versionGroupId) || !moveLearnMethodIdSet.has(moveLearnMethodId)) {
          return
        }

        const levelLearnedAt = detail.level_learned_at ?? 0
        const key = [
          pokemonEntry.id,
          moveId,
          versionGroupId,
          moveLearnMethodId,
          levelLearnedAt,
        ].join(':')

        if (!pokemonMoveMap.has(key)) {
          pokemonMoveMap.set(key, {
            pokemonId: pokemonEntry.id,
            moveId,
            versionGroupId,
            moveLearnMethodId,
            levelLearnedAt,
            sortOrder: detailIndex,
          })
        }
      })
    })

    const pokemonMoves = Array.from(pokemonMoveMap.values())

    await context.prisma.$transaction(async (transaction) => {
      await transaction.pokemonType.deleteMany({ where: { pokemonId: pokemonEntry.id } })
      await transaction.pokemonAbility.deleteMany({ where: { pokemonId: pokemonEntry.id } })
      await transaction.pokemonStatValue.deleteMany({ where: { pokemonId: pokemonEntry.id } })
      await transaction.pokemonMoveLearn.deleteMany({ where: { pokemonId: pokemonEntry.id } })

      if (pokemonTypes.length) {
        await transaction.pokemonType.createMany({ data: pokemonTypes })
      }

      if (pokemonAbilities.length) {
        await transaction.pokemonAbility.createMany({ data: pokemonAbilities })
      }

      if (pokemonStats.length) {
        await transaction.pokemonStatValue.createMany({ data: pokemonStats })
      }

      if (pokemonMoves.length) {
        await transaction.pokemonMoveLearn.createMany({ data: pokemonMoves })
      }
    })

    if ((index + 1) % 25 === 0 || index === pokemon.length - 1) {
      context.log(`[ingest:pokemon-bridges] ${index + 1}/${pokemon.length}`)
    }
  }
}
