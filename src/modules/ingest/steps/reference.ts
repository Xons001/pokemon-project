import type { Prisma } from '@prisma/client'

import { extractNumericIdFromResourceUrl, processInBatches } from '@/src/modules/ingest/pokeapi/client'
import type { IngestContext } from '@/src/modules/ingest/types'

type ApiDescription = {
  description?: string
  language?: {
    name?: string
  }
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue
}

function pickEnglishDescription(descriptions: ApiDescription[] | undefined): string | null {
  if (!Array.isArray(descriptions)) {
    return null
  }

  const englishDescription =
    descriptions.find((entry) => entry?.language?.name === 'en')?.description ??
    descriptions.find((entry) => typeof entry?.description === 'string')?.description

  return typeof englishDescription === 'string' ? englishDescription : null
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

async function upsertGeneration(context: IngestContext, detail: any) {
  await context.prisma.generation.upsert({
    where: { id: detail.id },
    create: {
      id: detail.id,
      name: detail.name,
      mainRegion: detail.main_region?.name ?? null,
    },
    update: {
      name: detail.name,
      mainRegion: detail.main_region?.name ?? null,
    },
  })
}

async function ensureGenerationExists(context: IngestContext, resource: { url: string }) {
  const generationId = extractNumericIdFromResourceUrl(resource.url)
  const existingGeneration = await context.prisma.generation.findUnique({
    where: { id: generationId },
    select: { id: true },
  })

  if (existingGeneration) {
    return generationId
  }

  const generationDetail = await context.client.fetchByUrl<any>(resource.url)
  await upsertGeneration(context, generationDetail)
  return generationId
}

async function upsertVersionGroup(context: IngestContext, detail: any) {
  await ensureGenerationExists(context, detail.generation)

  await context.prisma.versionGroup.upsert({
    where: { id: detail.id },
    create: {
      id: detail.id,
      name: detail.name,
      generationId: extractNumericIdFromResourceUrl(detail.generation.url),
      sortOrder: detail.order ?? null,
      rawPayload: toJson(detail),
    },
    update: {
      name: detail.name,
      generationId: extractNumericIdFromResourceUrl(detail.generation.url),
      sortOrder: detail.order ?? null,
      rawPayload: toJson(detail),
    },
  })
}

async function ensureVersionGroupExists(context: IngestContext, resource: { url: string }) {
  const versionGroupId = extractNumericIdFromResourceUrl(resource.url)
  const existingVersionGroup = await context.prisma.versionGroup.findUnique({
    where: { id: versionGroupId },
    select: { id: true },
  })

  if (existingVersionGroup) {
    return versionGroupId
  }

  const versionGroupDetail = await context.client.fetchByUrl<any>(resource.url)
  await upsertVersionGroup(context, versionGroupDetail)
  return versionGroupId
}

async function upsertType(context: IngestContext, detail: any) {
  await ensureGenerationExists(context, detail.generation)

  await context.prisma.type.upsert({
    where: { id: detail.id },
    create: {
      id: detail.id,
      name: detail.name,
      generationId: extractNumericIdFromResourceUrl(detail.generation.url),
      rawPayload: toJson(detail),
    },
    update: {
      name: detail.name,
      generationId: extractNumericIdFromResourceUrl(detail.generation.url),
      rawPayload: toJson(detail),
    },
  })
}

async function ensureTypeExists(context: IngestContext, resource: { url: string }) {
  const typeId = extractNumericIdFromResourceUrl(resource.url)
  const existingType = await context.prisma.type.findUnique({
    where: { id: typeId },
    select: { id: true },
  })

  if (existingType) {
    return typeId
  }

  const typeDetail = await context.client.fetchByUrl<any>(resource.url)
  await upsertType(context, typeDetail)
  return typeId
}

export async function ingestGenerations(context: IngestContext) {
  await ingestResourceCollection(context, 'generation', 'generation', async (detail) => {
    await upsertGeneration(context, detail)
  })
}

export async function ingestVersionGroups(context: IngestContext) {
  await ingestResourceCollection(context, 'version-group', 'version-group', async (detail) => {
    await upsertVersionGroup(context, detail)
  })
}

export async function ingestVersions(context: IngestContext) {
  await ingestResourceCollection(context, 'version', 'version', async (detail) => {
    await ensureVersionGroupExists(context, detail.version_group)

    await context.prisma.version.upsert({
      where: { id: detail.id },
      create: {
        id: detail.id,
        name: detail.name,
        versionGroupId: extractNumericIdFromResourceUrl(detail.version_group.url),
      },
      update: {
        name: detail.name,
        versionGroupId: extractNumericIdFromResourceUrl(detail.version_group.url),
      },
    })
  })
}

export async function ingestTypes(context: IngestContext) {
  await ingestResourceCollection(context, 'type', 'type', async (detail) => {
    await upsertType(context, detail)
  })
}

export async function ingestStats(context: IngestContext) {
  await ingestResourceCollection(context, 'stat', 'stat', async (detail) => {
    await context.prisma.stat.upsert({
      where: { id: detail.id },
      create: {
        id: detail.id,
        name: detail.name,
        gameIndex: detail.game_index ?? null,
        isBattleOnly: Boolean(detail.is_battle_only),
        moveDamageClass: detail.move_damage_class?.name ?? null,
      },
      update: {
        name: detail.name,
        gameIndex: detail.game_index ?? null,
        isBattleOnly: Boolean(detail.is_battle_only),
        moveDamageClass: detail.move_damage_class?.name ?? null,
      },
    })
  })
}

export async function ingestAbilities(context: IngestContext) {
  await ingestResourceCollection(context, 'ability', 'ability', async (detail) => {
    await ensureGenerationExists(context, detail.generation)

    await context.prisma.ability.upsert({
      where: { id: detail.id },
      create: {
        id: detail.id,
        name: detail.name,
        generationId: extractNumericIdFromResourceUrl(detail.generation.url),
        isMainSeries: Boolean(detail.is_main_series),
        rawPayload: toJson(detail),
      },
      update: {
        name: detail.name,
        generationId: extractNumericIdFromResourceUrl(detail.generation.url),
        isMainSeries: Boolean(detail.is_main_series),
        rawPayload: toJson(detail),
      },
    })
  })
}

export async function ingestMoveLearnMethods(context: IngestContext) {
  await ingestResourceCollection(context, 'move-learn-method', 'move-learn-method', async (detail) => {
    await context.prisma.moveLearnMethod.upsert({
      where: { id: detail.id },
      create: {
        id: detail.id,
        name: detail.name,
        description: pickEnglishDescription(detail.descriptions),
        sortOrder: detail.order ?? null,
      },
      update: {
        name: detail.name,
        description: pickEnglishDescription(detail.descriptions),
        sortOrder: detail.order ?? null,
      },
    })
  })
}

export async function ingestItems(context: IngestContext) {
  await ingestResourceCollection(context, 'item', 'item', async (detail) => {
    await context.prisma.item.upsert({
      where: { id: detail.id },
      create: {
        id: detail.id,
        name: detail.name,
        cost: detail.cost ?? null,
        flingPower: detail.fling_power ?? null,
        flingEffectName: detail.fling_effect?.name ?? null,
        categoryName: detail.category?.name ?? null,
        rawPayload: toJson(detail),
      },
      update: {
        name: detail.name,
        cost: detail.cost ?? null,
        flingPower: detail.fling_power ?? null,
        flingEffectName: detail.fling_effect?.name ?? null,
        categoryName: detail.category?.name ?? null,
        rawPayload: toJson(detail),
      },
    })
  })
}

export async function ingestMoves(context: IngestContext) {
  await ingestResourceCollection(context, 'move', 'move', async (detail) => {
    await ensureGenerationExists(context, detail.generation)
    await ensureTypeExists(context, detail.type)

    await context.prisma.move.upsert({
      where: { id: detail.id },
      create: {
        id: detail.id,
        name: detail.name,
        generationId: extractNumericIdFromResourceUrl(detail.generation.url),
        typeId: extractNumericIdFromResourceUrl(detail.type.url),
        accuracy: detail.accuracy ?? null,
        effectChance: detail.effect_chance ?? null,
        power: detail.power ?? null,
        pp: detail.pp ?? null,
        priority: detail.priority ?? null,
        damageClassName: detail.damage_class?.name ?? null,
        targetName: detail.target?.name ?? null,
        rawPayload: toJson(detail),
      },
      update: {
        name: detail.name,
        generationId: extractNumericIdFromResourceUrl(detail.generation.url),
        typeId: extractNumericIdFromResourceUrl(detail.type.url),
        accuracy: detail.accuracy ?? null,
        effectChance: detail.effect_chance ?? null,
        power: detail.power ?? null,
        pp: detail.pp ?? null,
        priority: detail.priority ?? null,
        damageClassName: detail.damage_class?.name ?? null,
        targetName: detail.target?.name ?? null,
        rawPayload: toJson(detail),
      },
    })
  })
}
