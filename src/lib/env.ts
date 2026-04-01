type AppEnv = {
  databaseUrl: string
  directUrl: string
  pokeApiBaseUrl: string
  pokeApiConcurrency: number
  showdownDataBaseUrl: string
  smogonStatsBaseUrl: string
  showdownConcurrency: number
  smogonStatsMonth: string | null
  showdownUsageInsertMode: 'bulk' | 'sequential'
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

function getMetaRefreshProfile(): 'full' | 'lean' {
  const rawValue = process.env.POKEMON_PROJECT_META_REFRESH_PROFILE?.trim().toLowerCase()

  if (rawValue === 'full' || rawValue === 'lean') {
    return rawValue
  }

  const environmentName = (
    process.env.POKEMON_PROJECT_ENV_NAME ??
    process.env.VERCEL_TARGET_ENV ??
    process.env.VERCEL_ENV ??
    'local'
  )
    .trim()
    .toLowerCase()

  if (['preview', 'develop', 'development', 'staging'].includes(environmentName)) {
    return 'lean'
  }

  return 'full'
}

export function getAppEnv(): AppEnv {
  if (cachedEnv) {
    return cachedEnv
  }

  cachedEnv = {
    databaseUrl: getRequiredEnv('DATABASE_URL'),
    directUrl: process.env.DIRECT_URL ?? getRequiredEnv('DATABASE_URL'),
    pokeApiBaseUrl: process.env.POKEAPI_BASE_URL ?? 'https://pokeapi.co/api/v2',
    pokeApiConcurrency: getNumberEnv('POKEAPI_CONCURRENCY', 4),
    showdownDataBaseUrl: process.env.SHOWDOWN_DATA_BASE_URL ?? 'https://play.pokemonshowdown.com/data',
    smogonStatsBaseUrl: process.env.SMOGON_STATS_BASE_URL ?? 'https://www.smogon.com/stats',
    showdownConcurrency: getNumberEnv('SHOWDOWN_CONCURRENCY', 4),
    smogonStatsMonth: process.env.SMOGON_STATS_MONTH?.trim() || null,
    showdownUsageInsertMode: getShowdownUsageInsertMode(),
    metaRefreshProfile: getMetaRefreshProfile(),
  }

  return cachedEnv
}
