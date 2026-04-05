import type { PrismaClient } from '@prisma/client'

import type { PokeApiClient } from './pokeapi/client'
import type { ShowdownClient } from './showdown/client'

export const INGESTION_ORDER = [
  'generation',
  'version-group',
  'version',
  'type',
  'stat',
  'ability',
  'move-learn-method',
  'item',
  'move',
  'evolution-chain',
  'pokemon-species',
  'pokemon',
  'pokemon-form',
  'machine',
  'pokemon-bridges',
  'pokedex',
  'showdown-format',
  'showdown-tier',
  'showdown-learnset',
  'showdown-sample-set',
  'showdown-usage',
] as const

export type IngestStepName = (typeof INGESTION_ORDER)[number]

export type IngestContext = {
  prisma: PrismaClient
  client: PokeApiClient
  showdownClient: ShowdownClient
  allowedMetaFormats: string[]
  limit?: number
  concurrency: number
  showdownConcurrency: number
  smogonStatsMonth: string | null
  showdownUsageInsertMode: 'bulk' | 'sequential'
  showdownUsageTargetFormats: string[]
  environmentName: string
  metaRefreshProfile: 'full' | 'lean'
  log: (message: string) => void
}

export type RunIngestionOptions = {
  steps?: IngestStepName[]
  limit?: number
  log?: (message: string) => void
}
