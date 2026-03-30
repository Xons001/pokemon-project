import { Prisma } from '@prisma/client'

import { getPrismaClient } from '@/src/lib/prisma'

export type ListViewResult<T> = {
  total: number
  items: T[]
}

export type PokemonSummaryViewRow = {
  pokemon_id: number
  pokemon_slug: string
  species_id: number
  species_slug: string
  showdown_id: string | null
  generation_id: number
  generation_name: string
  is_default: boolean
  is_legendary: boolean
  is_mythical: boolean
  primary_type: string | null
  secondary_type: string | null
  primary_ability: string | null
  hp: number | null
  attack: number | null
  defense: number | null
  special_attack: number | null
  special_defense: number | null
  speed: number | null
  base_stat_total: number
  height_m: number | null
  weight_kg: number | null
  base_experience: number | null
  official_artwork_url: string | null
  sprite_url: string | null
}

export type PokemonMoveLearnViewRow = {
  pokemon_move_learn_id: number
  pokemon_id: number
  pokemon_slug: string
  species_id: number
  species_slug: string
  move_id: number
  move_slug: string
  move_type: string
  version_group_id: number
  version_group: string
  move_learn_method_id: number
  move_learn_method: string
  level_learned_at: number
  sort_order: number
}

export type PokemonPokedexEntryViewRow = {
  pokedex_entry_id: number
  pokedex_id: number
  pokedex_slug: string
  is_main_series: boolean
  region_name: string | null
  entry_number: number
  species_id: number
  species_slug: string
  default_pokemon_id: number | null
  default_pokemon_slug: string | null
  primary_type: string | null
  secondary_type: string | null
  official_artwork_url: string | null
}

export type PokemonCompetitiveOverviewViewRow = {
  pokemon_format_id: string
  format_key: string
  format_name: string
  tier_scope: string | null
  tier_key: string | null
  tier_name: string | null
  showdown_pokemon_id: string
  pokemon_id: number | null
  pokemon_slug: string | null
  species_id: number | null
  species_slug: string | null
  primary_type: string | null
  secondary_type: string | null
  is_sample_set_available: boolean
  sample_set_count: number
  is_usage_tracked: boolean
  latest_usage_month: string | null
  latest_usage_rating: number | null
  latest_usage_percent: number | null
  is_nonstandard: string | null
}

type PaginationInput = {
  limit?: number
  offset?: number
}

type PokemonSummaryFilters = PaginationInput & {
  pokemonSlug?: string
  speciesSlug?: string
  generationName?: string
  primaryType?: string
  isDefault?: boolean
}

type PokemonMoveLearnFilters = PaginationInput & {
  pokemonSlug?: string
  moveSlug?: string
  moveType?: string
  moveLearnMethod?: string
  versionGroup?: string
}

type PokemonPokedexEntryFilters = PaginationInput & {
  pokedexSlug?: string
  speciesSlug?: string
  defaultPokemonSlug?: string
}

type PokemonCompetitiveOverviewFilters = PaginationInput & {
  formatKey?: string
  showdownPokemonId?: string
  pokemonSlug?: string
  tierKey?: string
  latestUsageMonth?: string
  isSampleSetAvailable?: boolean
  isUsageTracked?: boolean
}

function normalizeString(value?: string): string | undefined {
  const normalized = value?.trim().toLowerCase()
  return normalized ? normalized : undefined
}

function normalizeLimit(limit?: number): number {
  if (!Number.isInteger(limit) || typeof limit !== 'number') {
    return 50
  }

  return Math.min(Math.max(limit, 1), 250)
}

function normalizeOffset(offset?: number): number {
  if (!Number.isInteger(offset) || typeof offset !== 'number' || offset < 0) {
    return 0
  }

  return offset
}

function toNullableNumber(value: number | string | null): number | null {
  if (value === null || typeof value === 'number') {
    return value
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function buildWhereClause(conditions: Prisma.Sql[]): Prisma.Sql {
  if (!conditions.length) {
    return Prisma.empty
  }

  return Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
}

async function countRows(fromClause: Prisma.Sql, whereClause: Prisma.Sql): Promise<number> {
  const prisma = getPrismaClient()
  const rows = await prisma.$queryRaw<Array<{ total: number }>>(Prisma.sql`
    SELECT COUNT(*)::int AS total
    ${fromClause}
    ${whereClause}
  `)

  return rows[0]?.total ?? 0
}

export async function listPokemonSummaryView(
  filters: PokemonSummaryFilters = {}
): Promise<ListViewResult<PokemonSummaryViewRow>> {
  const prisma = getPrismaClient()
  const conditions: Prisma.Sql[] = []

  const pokemonSlug = normalizeString(filters.pokemonSlug)
  const speciesSlug = normalizeString(filters.speciesSlug)
  const generationName = normalizeString(filters.generationName)
  const primaryType = normalizeString(filters.primaryType)

  if (pokemonSlug) {
    conditions.push(Prisma.sql`pokemon_slug = ${pokemonSlug}`)
  }

  if (speciesSlug) {
    conditions.push(Prisma.sql`species_slug = ${speciesSlug}`)
  }

  if (generationName) {
    conditions.push(Prisma.sql`generation_name = ${generationName}`)
  }

  if (primaryType) {
    conditions.push(Prisma.sql`primary_type = ${primaryType}`)
  }

  if (typeof filters.isDefault === 'boolean') {
    conditions.push(Prisma.sql`is_default = ${filters.isDefault}`)
  }

  const whereClause = buildWhereClause(conditions)
  const limit = normalizeLimit(filters.limit)
  const offset = normalizeOffset(filters.offset)
  const fromClause = Prisma.sql`FROM pokemon_summary_view`

  const [total, items] = await Promise.all([
    countRows(fromClause, whereClause),
    prisma.$queryRaw<PokemonSummaryViewRow[]>(Prisma.sql`
      SELECT *
      ${fromClause}
      ${whereClause}
      ORDER BY pokemon_id ASC
      LIMIT ${limit}
      OFFSET ${offset}
    `),
  ])

  return {
    total,
    items: items.map((entry) => ({
      ...entry,
      height_m: toNullableNumber(entry.height_m),
      weight_kg: toNullableNumber(entry.weight_kg),
    })),
  }
}

export async function listPokemonMoveLearnView(
  filters: PokemonMoveLearnFilters = {}
): Promise<ListViewResult<PokemonMoveLearnViewRow>> {
  const prisma = getPrismaClient()
  const conditions: Prisma.Sql[] = []

  const pokemonSlug = normalizeString(filters.pokemonSlug)
  const moveSlug = normalizeString(filters.moveSlug)
  const moveType = normalizeString(filters.moveType)
  const moveLearnMethod = normalizeString(filters.moveLearnMethod)
  const versionGroup = normalizeString(filters.versionGroup)

  if (pokemonSlug) {
    conditions.push(Prisma.sql`pokemon_slug = ${pokemonSlug}`)
  }

  if (moveSlug) {
    conditions.push(Prisma.sql`move_slug = ${moveSlug}`)
  }

  if (moveType) {
    conditions.push(Prisma.sql`move_type = ${moveType}`)
  }

  if (moveLearnMethod) {
    conditions.push(Prisma.sql`move_learn_method = ${moveLearnMethod}`)
  }

  if (versionGroup) {
    conditions.push(Prisma.sql`version_group = ${versionGroup}`)
  }

  const whereClause = buildWhereClause(conditions)
  const limit = normalizeLimit(filters.limit)
  const offset = normalizeOffset(filters.offset)
  const fromClause = Prisma.sql`FROM pokemon_move_learn_view`

  const [total, items] = await Promise.all([
    countRows(fromClause, whereClause),
    prisma.$queryRaw<PokemonMoveLearnViewRow[]>(Prisma.sql`
      SELECT *
      ${fromClause}
      ${whereClause}
      ORDER BY pokemon_slug ASC, version_group ASC, level_learned_at ASC, move_slug ASC
      LIMIT ${limit}
      OFFSET ${offset}
    `),
  ])

  return { total, items }
}

export async function listPokemonPokedexEntryView(
  filters: PokemonPokedexEntryFilters = {}
): Promise<ListViewResult<PokemonPokedexEntryViewRow>> {
  const prisma = getPrismaClient()
  const conditions: Prisma.Sql[] = []

  const pokedexSlug = normalizeString(filters.pokedexSlug)
  const speciesSlug = normalizeString(filters.speciesSlug)
  const defaultPokemonSlug = normalizeString(filters.defaultPokemonSlug)

  if (pokedexSlug) {
    conditions.push(Prisma.sql`pokedex_slug = ${pokedexSlug}`)
  }

  if (speciesSlug) {
    conditions.push(Prisma.sql`species_slug = ${speciesSlug}`)
  }

  if (defaultPokemonSlug) {
    conditions.push(Prisma.sql`default_pokemon_slug = ${defaultPokemonSlug}`)
  }

  const whereClause = buildWhereClause(conditions)
  const limit = normalizeLimit(filters.limit)
  const offset = normalizeOffset(filters.offset)
  const fromClause = Prisma.sql`FROM pokemon_pokedex_entry_view`

  const [total, items] = await Promise.all([
    countRows(fromClause, whereClause),
    prisma.$queryRaw<PokemonPokedexEntryViewRow[]>(Prisma.sql`
      SELECT *
      ${fromClause}
      ${whereClause}
      ORDER BY pokedex_slug ASC, entry_number ASC
      LIMIT ${limit}
      OFFSET ${offset}
    `),
  ])

  return { total, items }
}

export async function listPokemonCompetitiveOverviewView(
  filters: PokemonCompetitiveOverviewFilters = {}
): Promise<ListViewResult<PokemonCompetitiveOverviewViewRow>> {
  const prisma = getPrismaClient()
  const conditions: Prisma.Sql[] = []

  const formatKey = normalizeString(filters.formatKey)
  const showdownPokemonId = normalizeString(filters.showdownPokemonId)
  const pokemonSlug = normalizeString(filters.pokemonSlug)
  const tierKey = normalizeString(filters.tierKey)
  const latestUsageMonth = filters.latestUsageMonth?.trim() || undefined

  if (formatKey) {
    conditions.push(Prisma.sql`format_key = ${formatKey}`)
  }

  if (showdownPokemonId) {
    conditions.push(Prisma.sql`showdown_pokemon_id = ${showdownPokemonId}`)
  }

  if (pokemonSlug) {
    conditions.push(Prisma.sql`pokemon_slug = ${pokemonSlug}`)
  }

  if (tierKey) {
    conditions.push(Prisma.sql`tier_key = ${tierKey}`)
  }

  if (latestUsageMonth) {
    conditions.push(Prisma.sql`latest_usage_month = ${latestUsageMonth}`)
  }

  if (typeof filters.isSampleSetAvailable === 'boolean') {
    conditions.push(Prisma.sql`is_sample_set_available = ${filters.isSampleSetAvailable}`)
  }

  if (typeof filters.isUsageTracked === 'boolean') {
    conditions.push(Prisma.sql`is_usage_tracked = ${filters.isUsageTracked}`)
  }

  const whereClause = buildWhereClause(conditions)
  const limit = normalizeLimit(filters.limit)
  const offset = normalizeOffset(filters.offset)
  const fromClause = Prisma.sql`FROM pokemon_competitive_overview_view`

  const [total, items] = await Promise.all([
    countRows(fromClause, whereClause),
    prisma.$queryRaw<PokemonCompetitiveOverviewViewRow[]>(Prisma.sql`
      SELECT *
      ${fromClause}
      ${whereClause}
      ORDER BY format_key ASC, showdown_pokemon_id ASC
      LIMIT ${limit}
      OFFSET ${offset}
    `),
  ])

  return { total, items }
}
