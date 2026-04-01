import { toShowdownId } from '@/src/modules/showdown/id'
import { getDefaultProductionUsageTargets } from '@/src/modules/ingest/showdown/usage-targets'

type AppEnv = {
  databaseUrl: string
  directUrl: string
  environmentName: string
  pokeApiBaseUrl: string
  pokeApiConcurrency: number
  showdownDataBaseUrl: string
  smogonStatsBaseUrl: string
  showdownConcurrency: number
  smogonStatsMonth: string | null
  showdownUsageInsertMode: 'bulk' | 'sequential'
  showdownUsageTargetFormats: string[]
  metaRefreshProfile: 'full' | 'lean'
}

let cachedEnv: AppEnv | null = null

function getRequiredEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function getNumberEnv(name: string, fallback: number): number {
  const rawValue = process.env[name]

  if (!rawValue) {
    return fallback
  }

  const parsed = Number(rawValue)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function getShowdownUsageInsertMode(): 'bulk' | 'sequential' {
  const rawValue = process.env.SHOWDOWN_USAGE_INSERT_MODE?.trim().toLowerCase()
  return rawValue === 'sequential' ? 'sequential' : 'bulk'
}

function getEnvironmentName() {
  return (
    process.env.POKEMON_PROJECT_ENV_NAME ??
    process.env.VERCEL_TARGET_ENV ??
    process.env.VERCEL_ENV ??
    'local'
  )
    .trim()
    .toLowerCase()
}

function getMetaRefreshProfile(): 'full' | 'lean' {
  const rawValue = process.env.POKEMON_PROJECT_META_REFRESH_PROFILE?.trim().toLowerCase()

  if (rawValue === 'full' || rawValue === 'lean') {
    return rawValue
  }

  const environmentName = getEnvironmentName()

  if (['preview', 'develop', 'development', 'staging'].includes(environmentName)) {
    return 'lean'
  }

  return 'full'
}

function getConfiguredUsageTargetFormats(): string[] {
  const rawValue = process.env.SHOWDOWN_USAGE_TARGET_FORMATS?.trim()

  if (rawValue) {
    return Array.from(
      new Set(
        rawValue
          .split(',')
          .map((value) => toShowdownId(value))
          .filter(Boolean)
      )
    )
  }

  const environmentName = getEnvironmentName()
  const metaRefreshProfile = getMetaRefreshProfile()

  if (environmentName === 'production' && metaRefreshProfile === 'full') {
    return getDefaultProductionUsageTargets()
  }

  return []
}

export function getAppEnv(): AppEnv {
  if (cachedEnv) {
    return cachedEnv
  }

  const environmentName = getEnvironmentName()

  cachedEnv = {
    databaseUrl: getRequiredEnv('DATABASE_URL'),
    directUrl: process.env.DIRECT_URL ?? getRequiredEnv('DATABASE_URL'),
    environmentName,
    pokeApiBaseUrl: process.env.POKEAPI_BASE_URL ?? 'https://pokeapi.co/api/v2',
    pokeApiConcurrency: getNumberEnv('POKEAPI_CONCURRENCY', 4),
    showdownDataBaseUrl: process.env.SHOWDOWN_DATA_BASE_URL ?? 'https://play.pokemonshowdown.com/data',
    smogonStatsBaseUrl: process.env.SMOGON_STATS_BASE_URL ?? 'https://www.smogon.com/stats',
    showdownConcurrency: getNumberEnv('SHOWDOWN_CONCURRENCY', 4),
    smogonStatsMonth: process.env.SMOGON_STATS_MONTH?.trim() || null,
    showdownUsageInsertMode: getShowdownUsageInsertMode(),
    showdownUsageTargetFormats: getConfiguredUsageTargetFormats(),
    metaRefreshProfile: getMetaRefreshProfile(),
  }

  return cachedEnv
}
