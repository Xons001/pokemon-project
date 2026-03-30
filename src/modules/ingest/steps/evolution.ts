import type { Prisma } from '@prisma/client'

import { extractNumericIdFromResourceUrl, processInBatches } from '@/src/modules/ingest/pokeapi/client'
import type { IngestContext } from '@/src/modules/ingest/types'

type ApiResource = {
  name: string
  url: string
}

type EvolutionNode = {
  species: ApiResource
  evolution_details?: any[]
  evolves_to?: EvolutionNode[]
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue
}

function toOptionalId(resource?: ApiResource | null, allowedIds?: Set<number>): number | null {
  if (!resource?.url) {
    return null
  }

  const value = extractNumericIdFromResourceUrl(resource.url)
  if (allowedIds && !allowedIds.has(value)) {
    return null
  }

  return value
}

function flattenEvolutionLinks(
  node: EvolutionNode,
  chainId: number,
  existingSpeciesIds: Set<number>,
  relationSets: {
    itemIds: Set<number>
    moveIds: Set<number>
    typeIds: Set<number>
  },
  parentSpeciesId: number | null = null
): Prisma.EvolutionLinkCreateManyInput[] {
  const currentSpeciesId = toOptionalId(node.species, existingSpeciesIds)
  const results: Prisma.EvolutionLinkCreateManyInput[] = []

  if (parentSpeciesId !== null && currentSpeciesId !== null) {
    const evolutionDetails = Array.isArray(node.evolution_details) && node.evolution_details.length > 0
      ? node.evolution_details
      : [{}]

    evolutionDetails.forEach((detail) => {
      results.push({
        evolutionChainId: chainId,
        fromSpeciesId: parentSpeciesId,
        toSpeciesId: currentSpeciesId,
        evolutionTriggerName: detail?.trigger?.name ?? null,
        triggerItemId: toOptionalId(detail?.item, relationSets.itemIds),
        minimumLevel: detail?.min_level ?? null,
        gender: detail?.gender ?? null,
        heldItemId: toOptionalId(detail?.held_item, relationSets.itemIds),
        knownMoveId: toOptionalId(detail?.known_move, relationSets.moveIds),
        knownMoveTypeId: toOptionalId(detail?.known_move_type, relationSets.typeIds),
        locationName: detail?.location?.name ?? null,
        minimumHappiness: detail?.min_happiness ?? null,
        minimumBeauty: detail?.min_beauty ?? null,
        minimumAffection: detail?.min_affection ?? null,
        needsOverworldRain: Boolean(detail?.needs_overworld_rain),
        partySpeciesId: toOptionalId(detail?.party_species, existingSpeciesIds),
        partyTypeId: toOptionalId(detail?.party_type, relationSets.typeIds),
        relativePhysicalStats: detail?.relative_physical_stats ?? null,
        timeOfDay: detail?.time_of_day || null,
        tradeSpeciesId: toOptionalId(detail?.trade_species, existingSpeciesIds),
        turnUpsideDown: Boolean(detail?.turn_upside_down),
        rawPayload: toJson(detail ?? {}),
      })
    })
  }

  const children = Array.isArray(node.evolves_to) ? node.evolves_to : []
  children.forEach((childNode) => {
    if (currentSpeciesId === null) {
      return
    }

    results.push(
      ...flattenEvolutionLinks(childNode, chainId, existingSpeciesIds, relationSets, currentSpeciesId)
    )
  })

  return results
}

export async function ingestEvolutionChains(context: IngestContext) {
  const resources = await context.client.listResources('evolution-chain', context.limit)
  context.log(`[ingest:evolution-chain] ${resources.length} recursos detectados`)

  await processInBatches(resources, context.concurrency, async (entry, index) => {
    const detail = await context.client.fetchByUrl<any>(entry.url)

    await context.prisma.evolutionChain.upsert({
      where: { id: detail.id },
      create: {
        id: detail.id,
        babyTriggerItemId: toOptionalId(detail.baby_trigger_item),
        rawPayload: toJson(detail),
      },
      update: {
        babyTriggerItemId: toOptionalId(detail.baby_trigger_item),
        rawPayload: toJson(detail),
      },
    })

    if ((index + 1) % 25 === 0 || index === resources.length - 1) {
      context.log(`[ingest:evolution-chain] ${index + 1}/${resources.length}`)
    }
  })
}

export async function syncEvolutionLinksFromChains(context: IngestContext) {
  const [chains, species, items, moves, types] = await Promise.all([
    context.prisma.evolutionChain.findMany({
      select: {
        id: true,
        rawPayload: true,
      },
      orderBy: {
        id: 'asc',
      },
      ...(typeof context.limit === 'number' ? { take: context.limit } : {}),
    }),
    context.prisma.pokemonSpecies.findMany({ select: { id: true } }),
    context.prisma.item.findMany({ select: { id: true } }),
    context.prisma.move.findMany({ select: { id: true } }),
    context.prisma.type.findMany({ select: { id: true } }),
  ])

  const existingSpeciesIds = new Set(species.map((entry) => entry.id))
  const relationSets = {
    itemIds: new Set(items.map((entry) => entry.id)),
    moveIds: new Set(moves.map((entry) => entry.id)),
    typeIds: new Set(types.map((entry) => entry.id)),
  }

  for (const [index, chain] of chains.entries()) {
    const payload = (chain.rawPayload ?? {}) as { chain?: EvolutionNode }
    const chainNode = payload.chain

    if (!chainNode) {
      await context.prisma.evolutionLink.deleteMany({
        where: {
          evolutionChainId: chain.id,
        },
      })
      continue
    }

    const links = flattenEvolutionLinks(chainNode, chain.id, existingSpeciesIds, relationSets)

    await context.prisma.$transaction(async (transaction) => {
      await transaction.evolutionLink.deleteMany({
        where: {
          evolutionChainId: chain.id,
        },
      })

      if (links.length) {
        await transaction.evolutionLink.createMany({
          data: links,
        })
      }
    })

    if ((index + 1) % 25 === 0 || index === chains.length - 1) {
      context.log(`[ingest:evolution-link] ${index + 1}/${chains.length}`)
    }
  }
}
