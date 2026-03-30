import type { Prisma } from '@prisma/client'

import { processInBatches } from '@/src/modules/ingest/pokeapi/client'
import { buildShowdownLookups } from '@/src/modules/ingest/showdown/lookups'
import type { ShowdownEntityMatch } from '@/src/modules/ingest/showdown/lookups'
import type { IngestContext } from '@/src/modules/ingest/types'
import { toShowdownId } from '@/src/modules/showdown/id'

type ShowdownFormat = {
  name?: string
  section?: string
  mod?: string
  gameType?: string
  team?: string
  challengeShow?: boolean
  searchShow?: boolean
  tournamentShow?: boolean
  rated?: boolean
  bestOfDefault?: boolean
  ruleset?: string[]
  banlist?: string[]
  restricted?: string[]
  unbanlist?: string[]
  [key: string]: unknown
}

type FormatDataEntry = {
  tier?: string
  doublesTier?: string
  natDexTier?: string
  isNonstandard?: string
  [key: string]: unknown
}

type ShowdownSampleSetFile = {
  dex?: Record<string, Record<string, any>>
}

type UsageStatsFile = {
  info?: {
    metagame?: string
    cutoff?: number
    ['cutoff deviation']?: number
    ['team type']?: string | null
    ['number of battles']?: number
  }
  data?: Record<string, Record<string, any>>
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue
}

function chunkArray<T>(items: T[], size: number): T[][]
{
  const results: T[][] = []

  for (let index = 0; index < items.length; index += size) {
    results.push(items.slice(index, index + size))
  }

  return results
}

function buildTierName(key: string): string {
  return key.replace(/[()]/g, '').trim() || 'Unknown'
}

function parseLearnsetSourceCode(sourceCode: string) {
  const match = sourceCode.match(/^(\d+)([A-Z]+)(\d+)?$/)

  if (!match) {
    return {
      generation: null,
      acquisitionMethod: null,
      levelLearnedAt: null,
      eventIndex: null,
    }
  }

  const generation = Number(match[1])
  const acquisitionMethod = match[2]
  const trailingNumber = match[3] ? Number(match[3]) : null

  return {
    generation,
    acquisitionMethod,
    levelLearnedAt: acquisitionMethod === 'L' ? trailingNumber : null,
    eventIndex: acquisitionMethod === 'S' ? trailingNumber : null,
  }
}

async function getOrCreateCompetitiveFormat(context: IngestContext, formatKey: string, fallbackName?: string) {
  const existing = await context.prisma.competitiveFormat.findUnique({
    where: {
      formatKey,
    },
  })

  if (existing) {
    return existing
  }

  return context.prisma.competitiveFormat.create({
    data: {
      formatKey,
      name: fallbackName ?? formatKey,
      challengeShow: true,
      searchShow: true,
      tournamentShow: true,
      rated: true,
    },
  })
}

async function getOrCreateTier(
  context: IngestContext,
  scope: string,
  key: string,
  rawPayload?: unknown
) {
  const normalizedKey = key.trim()
  const existing = await context.prisma.competitiveTier.findFirst({
    where: {
      scope,
      key: normalizedKey,
    },
  })

  if (existing) {
    return existing
  }

  return context.prisma.competitiveTier.create({
    data: {
      scope,
      key: normalizedKey,
      name: buildTierName(normalizedKey),
      rawPayload: rawPayload ? toJson(rawPayload) : undefined,
    },
  })
}

function getEntityMatch(
  lookups: Map<string, ShowdownEntityMatch>,
  showdownPokemonId: string
): ShowdownEntityMatch {
  return (
    lookups.get(showdownPokemonId) ?? {
      pokemonId: null,
      speciesId: null,
      showdownPokemonId,
    }
  )
}

export async function ingestShowdownFormats(context: IngestContext) {
  const formats = await context.showdownClient.fetchExportedData<ShowdownFormat[]>('formats.js', 'Formats')

  let currentSection: string | null = null

  for (const [index, format] of formats.entries()) {
    if (format.section && !format.name) {
      currentSection = format.section
      continue
    }

    if (!format.name) {
      continue
    }

    const formatName = format.name
    const formatKey = toShowdownId(formatName)

    await context.prisma.$transaction(async (transaction) => {
      const competitiveFormat = await transaction.competitiveFormat.upsert({
        where: {
          formatKey,
        },
        create: {
          formatKey,
          name: formatName,
          section: currentSection,
          mod: format.mod ?? null,
          gameType: format.gameType ?? null,
          teamType: format.team ?? null,
          challengeShow: format.challengeShow ?? true,
          searchShow: format.searchShow ?? true,
          tournamentShow: format.tournamentShow ?? true,
          rated: format.rated ?? true,
          bestOfDefault: format.bestOfDefault ?? null,
          ruleset: format.ruleset ? toJson(format.ruleset) : undefined,
          banlist: format.banlist ? toJson(format.banlist) : undefined,
          restricted: format.restricted ? toJson(format.restricted) : undefined,
          unbanlist: format.unbanlist ? toJson(format.unbanlist) : undefined,
          rawPayload: toJson(format),
        },
        update: {
          name: formatName,
          section: currentSection,
          mod: format.mod ?? null,
          gameType: format.gameType ?? null,
          teamType: format.team ?? null,
          challengeShow: format.challengeShow ?? true,
          searchShow: format.searchShow ?? true,
          tournamentShow: format.tournamentShow ?? true,
          rated: format.rated ?? true,
          bestOfDefault: format.bestOfDefault ?? null,
          ruleset: format.ruleset ? toJson(format.ruleset) : undefined,
          banlist: format.banlist ? toJson(format.banlist) : undefined,
          restricted: format.restricted ? toJson(format.restricted) : undefined,
          unbanlist: format.unbanlist ? toJson(format.unbanlist) : undefined,
          rawPayload: toJson(format),
        },
      })

      await transaction.banlistEntry.deleteMany({
        where: {
          competitiveFormatId: competitiveFormat.id,
        },
      })

      const entries = [
        ...(format.ruleset ?? []).map((value, sortOrder) => ({ kind: 'ruleset', value, sortOrder })),
        ...(format.banlist ?? []).map((value, sortOrder) => ({ kind: 'banlist', value, sortOrder })),
        ...(format.restricted ?? []).map((value, sortOrder) => ({ kind: 'restricted', value, sortOrder })),
        ...(format.unbanlist ?? []).map((value, sortOrder) => ({ kind: 'unbanlist', value, sortOrder })),
      ]

      if (entries.length) {
        await transaction.banlistEntry.createMany({
          data: entries.map((entry) => ({
            competitiveFormatId: competitiveFormat.id,
            kind: entry.kind,
            value: entry.value,
            sortOrder: entry.sortOrder,
            rawPayload: toJson(entry),
          })),
        })
      }
    })

    if ((index + 1) % 100 === 0 || index === formats.length - 1) {
      context.log(`[ingest:showdown-format] ${index + 1}/${formats.length}`)
    }
  }
}

export async function ingestShowdownTiers(context: IngestContext) {
  const [formatData, lookups] = await Promise.all([
    context.showdownClient.fetchExportedData<Record<string, FormatDataEntry>>('formats-data.js', 'BattleFormatsData'),
    buildShowdownLookups(context.prisma),
  ])

  const snapshotKey = new Date().toISOString().slice(0, 10)

  await context.prisma.pokemonTierHistory.deleteMany({
    where: {
      snapshotKey,
    },
  })

  let index = 0
  for (const [showdownPokemonId, entry] of Object.entries(formatData)) {
    const entity = getEntityMatch(lookups.pokemonById, showdownPokemonId)
    const dimensions = [
      { scope: 'singles', dimension: 'tier', key: entry.tier },
      { scope: 'doubles', dimension: 'doublesTier', key: entry.doublesTier },
      { scope: 'natdex', dimension: 'natDexTier', key: entry.natDexTier },
    ].filter((dimension) => dimension.key)

    for (const dimension of dimensions) {
      const tier = await getOrCreateTier(context, dimension.scope, dimension.key as string, entry)

      await context.prisma.pokemonTierHistory.create({
        data: {
          competitiveTierId: tier.id,
          pokemonId: entity.pokemonId,
          speciesId: entity.speciesId,
          showdownPokemonId,
          dimension: dimension.dimension,
          snapshotKey,
          isCurrent: true,
          rawPayload: toJson({
            ...entry,
            dimension: dimension.dimension,
          }),
        },
      })
    }

    index += 1
    if (index % 250 === 0 || index === Object.keys(formatData).length) {
      context.log(`[ingest:showdown-tier] ${index}/${Object.keys(formatData).length}`)
    }
  }
}

export async function ingestShowdownLearnsets(context: IngestContext) {
  const [learnsets, lookups] = await Promise.all([
    context.showdownClient.fetchDataJson<Record<string, { learnset?: Record<string, string[]> }>>('learnsets.json'),
    buildShowdownLookups(context.prisma),
  ])

  await context.prisma.competitiveLearnsetEntry.deleteMany()

  const rows: Prisma.CompetitiveLearnsetEntryCreateManyInput[] = []
  let processedPokemon = 0

  for (const [showdownPokemonId, payload] of Object.entries(learnsets)) {
    const entity = getEntityMatch(lookups.pokemonById, showdownPokemonId)
    const learnset = payload.learnset ?? {}

    for (const [showdownMoveId, sources] of Object.entries(learnset)) {
      const moveId = lookups.moveIdsById.get(showdownMoveId) ?? null

      sources.forEach((sourceCode) => {
        const parsed = parseLearnsetSourceCode(sourceCode)

        rows.push({
          pokemonId: entity.pokemonId,
          speciesId: entity.speciesId,
          moveId,
          showdownPokemonId,
          showdownMoveId,
          sourceCode,
          generation: parsed.generation,
          acquisitionMethod: parsed.acquisitionMethod,
          levelLearnedAt: parsed.levelLearnedAt,
          eventIndex: parsed.eventIndex,
          rawPayload: toJson({
            showdownPokemonId,
            showdownMoveId,
            sourceCode,
          }),
        })
      })
    }

    processedPokemon += 1
    if (processedPokemon % 250 === 0 || processedPokemon === Object.keys(learnsets).length) {
      context.log(`[ingest:showdown-learnset] ${processedPokemon}/${Object.keys(learnsets).length}`)
    }
  }

  for (const batch of chunkArray(rows, 5000)) {
    await context.prisma.competitiveLearnsetEntry.createMany({
      data: batch,
      skipDuplicates: true,
    })
  }
}

export async function ingestShowdownSampleSets(context: IngestContext) {
  const [files, lookups] = await Promise.all([
    context.showdownClient.listDataDirectory('sets/'),
    buildShowdownLookups(context.prisma),
  ])

  const jsonFiles = files
    .filter((file) => file.endsWith('.json'))
    .filter((file) => file !== 'package.json' && file !== 'index.d.ts')
    .sort()

  const limitedFiles = typeof context.limit === 'number' ? jsonFiles.slice(0, context.limit) : jsonFiles

  await processInBatches(limitedFiles, 1, async (file, index) => {
    const formatKey = file.replace(/\.json$/, '')
    const competitiveFormat = await getOrCreateCompetitiveFormat(context, formatKey, formatKey)
    const payload = await context.showdownClient.fetchDataJson<ShowdownSampleSetFile>(`sets/${file}`)
    const dexEntries = payload.dex ?? {}

    const sampleRows: Prisma.SampleSetCreateManyInput[] = []
    const pokemonFormatRows = new Map<string, Prisma.PokemonFormatCreateManyInput>()

    for (const [pokemonName, sets] of Object.entries(dexEntries)) {
      const showdownPokemonId = toShowdownId(pokemonName)
      const entity = getEntityMatch(lookups.pokemonById, showdownPokemonId)

      pokemonFormatRows.set(showdownPokemonId, {
        competitiveFormatId: competitiveFormat.id,
        pokemonId: entity.pokemonId,
        speciesId: entity.speciesId,
        showdownPokemonId,
        isSampleSetAvailable: true,
        isUsageTracked: false,
      })

      for (const [setName, setPayload] of Object.entries(sets)) {
        sampleRows.push({
          competitiveFormatId: competitiveFormat.id,
          pokemonId: entity.pokemonId,
          speciesId: entity.speciesId,
          showdownPokemonId,
          setName,
          sourceFile: file,
          abilityName: setPayload.ability ?? null,
          itemName: setPayload.item ?? null,
          nature: setPayload.nature ?? null,
          teraType: setPayload.teraType ?? null,
          level: typeof setPayload.level === 'number' ? setPayload.level : null,
          happiness: typeof setPayload.happiness === 'number' ? setPayload.happiness : null,
          shiny: typeof setPayload.shiny === 'boolean' ? setPayload.shiny : null,
          gender: setPayload.gender ?? null,
          moves: toJson(setPayload.moves ?? []),
          evs: setPayload.evs ? toJson(setPayload.evs) : undefined,
          ivs: setPayload.ivs ? toJson(setPayload.ivs) : undefined,
          rawPayload: toJson(setPayload),
        })
      }
    }

    await context.prisma.$transaction(async (transaction) => {
      await transaction.sampleSet.deleteMany({
        where: {
          competitiveFormatId: competitiveFormat.id,
        },
      })

      await transaction.pokemonFormat.deleteMany({
        where: {
          competitiveFormatId: competitiveFormat.id,
        },
      })

      for (const batch of chunkArray(sampleRows, 1000)) {
        if (batch.length) {
          await transaction.sampleSet.createMany({
            data: batch,
          })
        }
      }

      const formatRows = Array.from(pokemonFormatRows.values())
      if (formatRows.length) {
        await transaction.pokemonFormat.createMany({
          data: formatRows,
          skipDuplicates: true,
        })
      }
    })

    if ((index + 1) % 20 === 0 || index === limitedFiles.length - 1) {
      context.log(`[ingest:showdown-sample-set] ${index + 1}/${limitedFiles.length}`)
    }
  })
}

export async function ingestShowdownUsageStats(context: IngestContext) {
  const useSequentialInserts = context.showdownUsageInsertMode === 'sequential'
  const month = context.smogonStatsMonth ?? (await context.showdownClient.getLatestStatsMonth())

  if (!month) {
    throw new Error('No monthly Smogon stats snapshot was found')
  }

  const [files, lookups] = await Promise.all([
    context.showdownClient.listStatsDirectory(`${month}/chaos/`),
    buildShowdownLookups(context.prisma),
  ])

  const jsonFiles = files
    .filter((file) => file.endsWith('.json'))
    .filter((file) => !file.endsWith('.json.gz'))
    .sort()

  const limitedFiles = typeof context.limit === 'number' ? jsonFiles.slice(0, context.limit) : jsonFiles

  await processInBatches(limitedFiles, 1, async (file, index) => {
    const usage = await context.showdownClient.fetchJson<UsageStatsFile>(
      context.showdownClient.getStatsUrl(`${month}/chaos/${file}`)
    )

    const formatKey = file.replace(/\.json$/, '').replace(/-\d+$/, '')
    const ratingMatch = file.match(/-(\d+)\.json$/)
    const rating = ratingMatch ? Number(ratingMatch[1]) : 0
    const competitiveFormat = await getOrCreateCompetitiveFormat(context, formatKey, formatKey)
    const existingPokemonFormats = await context.prisma.pokemonFormat.findMany({
      where: {
        competitiveFormatId: competitiveFormat.id,
      },
      select: {
        competitiveTierId: true,
        pokemonId: true,
        speciesId: true,
        showdownPokemonId: true,
        isSampleSetAvailable: true,
        isUsageTracked: true,
        latestUsageMonth: true,
        latestUsageRating: true,
        latestUsagePercent: true,
        isNonstandard: true,
        rawPayload: true,
      },
    })
    const rows = Object.entries(usage.data ?? {})
      .map(([pokemonName, payload], rank) => {
        const showdownPokemonId = toShowdownId(pokemonName)
        const entity = getEntityMatch(lookups.pokemonById, showdownPokemonId)

        return {
          usageRow: {
            competitiveFormatId: competitiveFormat.id,
            pokemonId: entity.pokemonId,
            speciesId: entity.speciesId,
            showdownPokemonId,
            month,
            rating,
            metagame: usage.info?.metagame ?? formatKey,
            cutoffDeviation:
              typeof usage.info?.['cutoff deviation'] === 'number' ? usage.info['cutoff deviation'] : null,
            teamType: usage.info?.['team type'] ?? null,
            totalBattles: usage.info?.['number of battles'] ?? null,
            rank: rank + 1,
            usagePercent: typeof payload['usage'] === 'number' ? payload['usage'] : null,
            rawCount: typeof payload['Raw count'] === 'number' ? payload['Raw count'] : null,
            realCount: typeof payload['Real count'] === 'number' ? payload['Real count'] : null,
            weightedCount: typeof payload['Weighted count'] === 'number' ? payload['Weighted count'] : null,
            viabilityCeiling: payload['Viability Ceiling'] ? toJson(payload['Viability Ceiling']) : undefined,
            abilities: payload['Abilities'] ? toJson(payload['Abilities']) : undefined,
            items: payload['Items'] ? toJson(payload['Items']) : undefined,
            moves: payload['Moves'] ? toJson(payload['Moves']) : undefined,
            teraTypes: payload['Tera Types'] ? toJson(payload['Tera Types']) : undefined,
            teammates: payload['Teammates'] ? toJson(payload['Teammates']) : undefined,
            counters: payload['Checks and Counters'] ? toJson(payload['Checks and Counters']) : undefined,
            spreads: payload['Spreads'] ? toJson(payload['Spreads']) : undefined,
          } satisfies Prisma.UsageStatMonthlyCreateManyInput,
          pokemonFormatUpdate: {
            competitiveFormatId: competitiveFormat.id,
            showdownPokemonId,
            pokemonId: entity.pokemonId,
            speciesId: entity.speciesId,
            latestUsageMonth: month,
            latestUsageRating: rating,
            latestUsagePercent: typeof payload['usage'] === 'number' ? payload['usage'] : null,
          },
        }
      })

    const mergedPokemonFormats = new Map<string, Prisma.PokemonFormatCreateManyInput>()

    existingPokemonFormats.forEach((entry) => {
      mergedPokemonFormats.set(entry.showdownPokemonId, {
        competitiveFormatId: competitiveFormat.id,
        competitiveTierId: entry.competitiveTierId,
        pokemonId: entry.pokemonId,
        speciesId: entry.speciesId,
        showdownPokemonId: entry.showdownPokemonId,
        isSampleSetAvailable: entry.isSampleSetAvailable,
        isUsageTracked: entry.isUsageTracked,
        latestUsageMonth: entry.latestUsageMonth,
        latestUsageRating: entry.latestUsageRating,
        latestUsagePercent: entry.latestUsagePercent ?? undefined,
        isNonstandard: entry.isNonstandard,
        rawPayload: entry.rawPayload ? toJson(entry.rawPayload) : undefined,
      })
    })

    rows.forEach((row) => {
      const previous = mergedPokemonFormats.get(row.pokemonFormatUpdate.showdownPokemonId)

      mergedPokemonFormats.set(row.pokemonFormatUpdate.showdownPokemonId, {
        competitiveFormatId: competitiveFormat.id,
        competitiveTierId: previous?.competitiveTierId ?? null,
        pokemonId: row.pokemonFormatUpdate.pokemonId,
        speciesId: row.pokemonFormatUpdate.speciesId,
        showdownPokemonId: row.pokemonFormatUpdate.showdownPokemonId,
        isSampleSetAvailable: previous?.isSampleSetAvailable ?? false,
        isUsageTracked: true,
        latestUsageMonth: row.pokemonFormatUpdate.latestUsageMonth,
        latestUsageRating: row.pokemonFormatUpdate.latestUsageRating,
        latestUsagePercent: row.pokemonFormatUpdate.latestUsagePercent ?? undefined,
        isNonstandard: previous?.isNonstandard ?? null,
        rawPayload: previous?.rawPayload ?? undefined,
      })
    })

    await context.prisma.usageStatMonthly.deleteMany({
      where: {
        competitiveFormatId: competitiveFormat.id,
        month,
        rating,
      },
    })

    if (useSequentialInserts) {
      // Free-tier hosted Postgres instances can reject JSON-heavy createMany payloads on usage snapshots.
      // Sequential inserts are slower, but much more tolerant of constrained cloud plans.
      for (const row of rows) {
        await context.prisma.usageStatMonthly.create({
          data: row.usageRow,
        })
      }
    } else {
      for (const batch of chunkArray(rows.map((entry) => entry.usageRow), 500)) {
        if (batch.length) {
          await context.prisma.usageStatMonthly.createMany({
            data: batch,
          })
        }
      }
    }

    await context.prisma.$transaction(async (transaction) => {
      await transaction.pokemonFormat.deleteMany({
        where: {
          competitiveFormatId: competitiveFormat.id,
        },
      })

      for (const batch of chunkArray(Array.from(mergedPokemonFormats.values()), 500)) {
        if (batch.length) {
          await transaction.pokemonFormat.createMany({
            data: batch,
            skipDuplicates: true,
          })
        }
      }
    })
    
    if ((index + 1) % 20 === 0 || index === limitedFiles.length - 1) {
      context.log(`[ingest:showdown-usage] ${index + 1}/${limitedFiles.length}`)
    }
  })
}
