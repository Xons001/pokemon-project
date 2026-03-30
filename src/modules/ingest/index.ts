import { getAppEnv } from '@/src/lib/env'
import { getPrismaClient } from '@/src/lib/prisma'
import { PokeApiClient } from '@/src/modules/ingest/pokeapi/client'
import { ShowdownClient } from '@/src/modules/ingest/showdown/client'
import { syncEvolutionLinksFromChains, ingestEvolutionChains } from '@/src/modules/ingest/steps/evolution'
import { ingestPokedexes } from '@/src/modules/ingest/steps/pokedex'
import {
  ingestMachines,
  ingestPokemon,
  ingestPokemonForms,
  ingestPokemonSpecies,
  syncPokemonBridgeTables,
} from '@/src/modules/ingest/steps/pokemon'
import {
  ingestAbilities,
  ingestGenerations,
  ingestItems,
  ingestMoveLearnMethods,
  ingestMoves,
  ingestStats,
  ingestTypes,
  ingestVersionGroups,
  ingestVersions,
} from '@/src/modules/ingest/steps/reference'
import {
  ingestShowdownFormats,
  ingestShowdownLearnsets,
  ingestShowdownSampleSets,
  ingestShowdownTiers,
  ingestShowdownUsageStats,
} from '@/src/modules/ingest/steps/showdown'
import { INGESTION_ORDER } from '@/src/modules/ingest/types'
import type { IngestContext, IngestStepName, RunIngestionOptions } from '@/src/modules/ingest/types'

const stepHandlers: Record<IngestStepName, (context: IngestContext) => Promise<void>> = {
  generation: ingestGenerations,
  'version-group': ingestVersionGroups,
  version: ingestVersions,
  type: ingestTypes,
  stat: ingestStats,
  ability: ingestAbilities,
  'move-learn-method': ingestMoveLearnMethods,
  item: ingestItems,
  move: ingestMoves,
  'evolution-chain': ingestEvolutionChains,
  'pokemon-species': ingestPokemonSpecies,
  pokemon: ingestPokemon,
  'pokemon-form': ingestPokemonForms,
  machine: ingestMachines,
  'pokemon-bridges': async (context) => {
    await syncPokemonBridgeTables(context)
    await syncEvolutionLinksFromChains(context)
  },
  pokedex: ingestPokedexes,
  'showdown-format': ingestShowdownFormats,
  'showdown-tier': ingestShowdownTiers,
  'showdown-learnset': ingestShowdownLearnsets,
  'showdown-sample-set': ingestShowdownSampleSets,
  'showdown-usage': ingestShowdownUsageStats,
}

export { INGESTION_ORDER }

export async function runIngestion(options: RunIngestionOptions = {}) {
  const env = getAppEnv()
  const prisma = getPrismaClient()
  const log = options.log ?? console.log
  const context: IngestContext = {
    prisma,
    client: new PokeApiClient(env.pokeApiBaseUrl, env.pokeApiConcurrency),
    showdownClient: new ShowdownClient(env.showdownDataBaseUrl, env.smogonStatsBaseUrl),
    limit: options.limit,
    concurrency: env.pokeApiConcurrency,
    showdownConcurrency: env.showdownConcurrency,
    smogonStatsMonth: env.smogonStatsMonth,
    showdownUsageInsertMode: env.showdownUsageInsertMode,
    log,
  }

  const steps = options.steps?.length ? options.steps : [...INGESTION_ORDER]

  for (const step of steps) {
    const startedAt = Date.now()
    log(`[ingest] starting ${step}`)
    await stepHandlers[step](context)
    const elapsedSeconds = ((Date.now() - startedAt) / 1000).toFixed(1)
    log(`[ingest] completed ${step} in ${elapsedSeconds}s`)
  }
}
