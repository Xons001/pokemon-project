import type { Prisma } from '@prisma/client'

import { extractNumericIdFromResourceUrl, processInBatches } from '@/src/modules/ingest/pokeapi/client'
import type { IngestContext } from '@/src/modules/ingest/types'

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue
}

export async function ingestPokedexes(context: IngestContext) {
  const resources = await context.client.listResources('pokedex', context.limit)
  const speciesIds = await context.prisma.pokemonSpecies.findMany({ select: { id: true } })
  const existingSpeciesIds = new Set(speciesIds.map((entry) => entry.id))

  context.log(`[ingest:pokedex] ${resources.length} recursos detectados`)

  await processInBatches(resources, context.concurrency, async (entry, index) => {
    const detail = await context.client.fetchByUrl<any>(entry.url)

    await context.prisma.pokedex.upsert({
      where: { id: detail.id },
      create: {
        id: detail.id,
        name: detail.name,
        isMainSeries: Boolean(detail.is_main_series),
        regionName: detail.region?.name ?? null,
        rawPayload: toJson(detail),
      },
      update: {
        name: detail.name,
        isMainSeries: Boolean(detail.is_main_series),
        regionName: detail.region?.name ?? null,
        rawPayload: toJson(detail),
      },
    })

    const entries = Array.isArray(detail.pokemon_entries)
        ? detail.pokemon_entries
          .map((pokemonEntry: any) => {
            const speciesId = extractNumericIdFromResourceUrl(pokemonEntry.pokemon_species.url)

            if (!existingSpeciesIds.has(speciesId)) {
              return null
            }

            return {
              pokedexId: detail.id,
              speciesId,
              entryNumber: pokemonEntry.entry_number,
            }
          })
          .filter(Boolean)
      : []

    await context.prisma.$transaction(async (transaction) => {
      await transaction.pokedexEntry.deleteMany({
        where: {
          pokedexId: detail.id,
        },
      })

      if (entries.length) {
        await transaction.pokedexEntry.createMany({
          data: entries as Prisma.PokedexEntryCreateManyInput[],
        })
      }
    })

    if ((index + 1) % 25 === 0 || index === resources.length - 1) {
      context.log(`[ingest:pokedex] ${index + 1}/${resources.length}`)
    }
  })
}
