import 'dotenv/config'

import path from 'node:path'
import vm from 'node:vm'

import { config as loadEnvFile } from 'dotenv'
import { Prisma } from '@prisma/client'

import { getPrismaClient } from '@/src/lib/prisma'
import { buildShowdownLookups } from '@/src/modules/ingest/showdown/lookups'
import { toShowdownId } from '@/src/modules/showdown/id'

type CliArgs = {
  dryRun: boolean
  envFile: string | null
}

type FormatDataEntry = {
  tier?: string
  isNonstandard?: string | null
  [key: string]: unknown
}

type LearnsetEntry = {
  learnset?: Record<string, string[]>
}

type ChampionsFormat = {
  formatKey: string
  name: string
  section: string
  mod: string
  gameType: string | null
  bestOfDefault: boolean
  ruleset: string[]
}

const CHAMPIONS_FORMATS_DATA_URL =
  'https://raw.githubusercontent.com/smogon/pokemon-showdown/master/data/mods/champions/formats-data.ts'
const CHAMPIONS_LEARNSETS_URL =
  'https://raw.githubusercontent.com/smogon/pokemon-showdown/master/data/mods/champions/learnsets.ts'
const CHAMPIONS_ITEMS_URL =
  'https://raw.githubusercontent.com/smogon/pokemon-showdown/master/data/mods/champions/items.ts'
const CHAMPIONS_TIER_SCOPE = 'champions'
const CHAMPIONS_TIER_DIMENSION = 'championsTier'
const CHAMPIONS_SNAPSHOT_KEY = 'champions-reg-m-a'

const CHAMPIONS_FORMATS: ChampionsFormat[] = [
  {
    formatKey: toShowdownId('[Gen 9 Champions] BSS Reg M-A'),
    name: '[Gen 9 Champions] BSS Reg M-A',
    section: 'Champions',
    mod: 'champions',
    gameType: null,
    bestOfDefault: true,
    ruleset: ['Flat Rules', 'VGC Timer'],
  },
  {
    formatKey: toShowdownId('[Gen 9 Champions] VGC 2026 Reg M-A'),
    name: '[Gen 9 Champions] VGC 2026 Reg M-A',
    section: 'Champions',
    mod: 'champions',
    gameType: 'doubles',
    bestOfDefault: true,
    ruleset: ['Flat Rules', 'VGC Timer', 'Open Team Sheets'],
  },
]

const SHOWDOWN_TO_LOCAL_ID_ALIASES: Record<string, string> = {
  basculegionf: 'basculegionfemale',
  meowsticfmega: 'meowsticmega',
  meowsticmmega: 'meowsticmega',
  taurospaldeaaqua: 'taurospaldeaaquabreed',
  taurospaldeablaze: 'taurospaldeablazebreed',
  taurospaldeacombat: 'taurospaldeacombatbreed',
}

function parseArgs(argv: string[]): CliArgs {
  const envFileArg = argv.find((argument) => argument.startsWith('--env-file='))

  return {
    dryRun: argv.includes('--dry-run'),
    envFile: envFileArg ? envFileArg.split('=')[1] ?? null : null,
  }
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}

function buildTierName(key: string): string {
  return key.replace(/[()]/g, '').trim() || 'Unknown'
}

function parseExportedObject<T>(source: string, exportName: string): T {
  const assignmentPattern = new RegExp(`export const ${exportName}:[\\s\\S]*?=\\s*`)
  const runnableSource = source.replace(assignmentPattern, `exports.${exportName} = `)
  const sandbox: { exports: Record<string, unknown> } = {
    exports: {},
  }

  vm.runInNewContext(runnableSource, sandbox)
  return sandbox.exports[exportName] as T
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

function getLegalPokemonEntries(formatData: Record<string, FormatDataEntry>) {
  return Object.entries(formatData)
    .filter(([, entry]) => !entry.isNonstandard && entry.tier !== 'Illegal')
    .map(([showdownPokemonId, entry]) => ({
      showdownPokemonId,
      tierKey: entry.tier?.trim() || 'Unranked',
      rawPayload: entry,
    }))
    .sort((left, right) => left.showdownPokemonId.localeCompare(right.showdownPokemonId))
}

function getLegalItemIdsFromSource(source: string) {
  return Array.from(source.matchAll(/\n\t([a-z0-9]+): \{\n(?:\t\t[^\n]*\n)*?\t\tisNonstandard: null,/g))
    .map((match) => match[1])
    .filter((value): value is string => Boolean(value))
    .sort()
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(30_000),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`)
  }

  return response.text()
}

async function getOrCreateTier(prisma: ReturnType<typeof getPrismaClient>, key: string, rawPayload: unknown) {
  const existing = await prisma.competitiveTier.findFirst({
    where: {
      scope: CHAMPIONS_TIER_SCOPE,
      key,
    },
  })

  if (existing) {
    return existing
  }

  return prisma.competitiveTier.create({
    data: {
      scope: CHAMPIONS_TIER_SCOPE,
      key,
      name: buildTierName(key),
      rawPayload: toJson(rawPayload),
    },
  })
}

async function ensureChampionsItems(prisma: ReturnType<typeof getPrismaClient>, legalItemIds: string[]) {
  const existingItems = await prisma.item.findMany({
    select: {
      id: true,
      name: true,
    },
  })
  const existingShowdownIds = new Set(existingItems.map((item) => toShowdownId(item.name)))
  const missingItemIds = legalItemIds.filter((itemId) => !existingShowdownIds.has(toShowdownId(itemId)))

  if (!missingItemIds.length) {
    return missingItemIds
  }

  const maxExistingId = existingItems.reduce((maxId, item) => Math.max(maxId, item.id), 0)
  const firstPlaceholderId = Math.max(maxExistingId + 1, 900_000)

  await prisma.item.createMany({
    data: missingItemIds.map((itemId, index) => ({
      id: firstPlaceholderId + index,
      name: itemId,
      cost: null,
      flingPower: null,
      flingEffectName: null,
      categoryName: itemId.endsWith('ite') ? 'mega-stones' : 'champions-items',
      rawPayload: toJson({
        source: 'pokemon-showdown',
        mod: 'champions',
        snapshotKey: CHAMPIONS_SNAPSHOT_KEY,
        showdownItemId: itemId,
        placeholder: true,
      }),
    })),
    skipDuplicates: true,
  })

  return missingItemIds
}

function resolvePokemonEntity(
  lookups: Awaited<ReturnType<typeof buildShowdownLookups>>,
  showdownPokemonId: string
) {
  return (
    lookups.pokemonById.get(showdownPokemonId) ??
    lookups.pokemonById.get(SHOWDOWN_TO_LOCAL_ID_ALIASES[showdownPokemonId] ?? '') ?? {
      pokemonId: null,
      speciesId: null,
      showdownPokemonId,
    }
  )
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.envFile) {
    loadEnvFile({
      path: path.resolve(process.cwd(), args.envFile),
      override: true,
    })
  }

  const [formatDataSource, learnsetsSource, itemsSource] = await Promise.all([
    fetchText(CHAMPIONS_FORMATS_DATA_URL),
    fetchText(CHAMPIONS_LEARNSETS_URL),
    fetchText(CHAMPIONS_ITEMS_URL),
  ])
  const formatData = parseExportedObject<Record<string, FormatDataEntry>>(formatDataSource, 'FormatsData')
  const learnsets = parseExportedObject<Record<string, LearnsetEntry>>(learnsetsSource, 'Learnsets')
  const legalPokemonEntries = getLegalPokemonEntries(formatData)
  const legalItemIds = getLegalItemIdsFromSource(itemsSource)
  const prisma = getPrismaClient()
  const lookups = await buildShowdownLookups(prisma)
  const tierKeys = Array.from(new Set(legalPokemonEntries.map((entry) => entry.tierKey))).sort()
  const unresolvedPokemonIds: string[] = []
  const entityByShowdownId = new Map(
    legalPokemonEntries.map((entry) => {
      const entity = resolvePokemonEntity(lookups, entry.showdownPokemonId)

      if (!entity.pokemonId && !entity.speciesId) {
        unresolvedPokemonIds.push(entry.showdownPokemonId)
      }

      return [entry.showdownPokemonId, entity] as const
    })
  )

  console.log(
    `[champions-meta] source roster=${legalPokemonEntries.length}, legalItems=${legalItemIds.length}, learnsetPokemon=${Object.keys(learnsets).length}`
  )

  if (unresolvedPokemonIds.length) {
    console.log(
      `[champions-meta] unresolved local Pokemon IDs (${unresolvedPokemonIds.length}): ${unresolvedPokemonIds.join(', ')}`
    )
  }

  if (args.dryRun) {
    console.log('[champions-meta] dry run, no database changes applied')
    return
  }

  const tierByKey = new Map<string, { id: string }>()

  for (const tierKey of tierKeys) {
    const tier = await getOrCreateTier(prisma, tierKey, {
      source: 'pokemon-showdown',
      mod: 'champions',
      snapshotKey: CHAMPIONS_SNAPSHOT_KEY,
    })
    tierByKey.set(tierKey, tier)
  }

  const createdPlaceholderItemIds = await ensureChampionsItems(prisma, legalItemIds)

  if (createdPlaceholderItemIds.length) {
    console.log(
      `[champions-meta] created placeholder items (${createdPlaceholderItemIds.length}): ${createdPlaceholderItemIds.join(', ')}`
    )
  }

  const formatRows = []

  for (const format of CHAMPIONS_FORMATS) {
    const rawPayload = {
      source: 'pokemon-showdown',
      sources: {
        formatsData: CHAMPIONS_FORMATS_DATA_URL,
        learnsets: CHAMPIONS_LEARNSETS_URL,
        items: CHAMPIONS_ITEMS_URL,
      },
      snapshotKey: CHAMPIONS_SNAPSHOT_KEY,
      championsPokemonCount: legalPokemonEntries.length,
      championsItemIds: legalItemIds,
      championsRules: {
        editableStats: ['evs'],
        ivs: 'fixed-by-game',
      },
    }
    const row = await prisma.competitiveFormat.upsert({
      where: {
        formatKey: format.formatKey,
      },
      create: {
        formatKey: format.formatKey,
        name: format.name,
        section: format.section,
        mod: format.mod,
        gameType: format.gameType,
        bestOfDefault: format.bestOfDefault,
        ruleset: toJson(format.ruleset),
        rawPayload: toJson(rawPayload),
      },
      update: {
        name: format.name,
        section: format.section,
        mod: format.mod,
        gameType: format.gameType,
        bestOfDefault: format.bestOfDefault,
        searchShow: true,
        challengeShow: true,
        tournamentShow: true,
        rated: true,
        ruleset: toJson(format.ruleset),
        banlist: Prisma.JsonNull,
        restricted: Prisma.JsonNull,
        unbanlist: Prisma.JsonNull,
        rawPayload: toJson(rawPayload),
      },
    })

    await prisma.banlistEntry.deleteMany({
      where: {
        competitiveFormatId: row.id,
      },
    })
    await prisma.banlistEntry.createMany({
      data: format.ruleset.map((value, sortOrder) => ({
        competitiveFormatId: row.id,
        kind: 'ruleset',
        value,
        sortOrder,
        rawPayload: toJson({
          kind: 'ruleset',
          value,
          sortOrder,
        }),
      })),
    })

    formatRows.push(row)
  }

  const pokemonFormatRows: Prisma.PokemonFormatCreateManyInput[] = []
  const tierHistoryRows: Prisma.PokemonTierHistoryCreateManyInput[] = []
  const competitiveLearnsetRows: Prisma.CompetitiveLearnsetEntryCreateManyInput[] = []

  for (const format of formatRows) {
    for (const entry of legalPokemonEntries) {
      const entity = entityByShowdownId.get(entry.showdownPokemonId)
      const tier = tierByKey.get(entry.tierKey)

      pokemonFormatRows.push({
        competitiveFormatId: format.id,
        competitiveTierId: tier?.id ?? null,
        pokemonId: entity?.pokemonId ?? null,
        speciesId: entity?.speciesId ?? null,
        showdownPokemonId: entry.showdownPokemonId,
        isSampleSetAvailable: false,
        isUsageTracked: false,
        isNonstandard: null,
        rawPayload: toJson({
          source: 'pokemon-showdown',
          mod: 'champions',
          snapshotKey: CHAMPIONS_SNAPSHOT_KEY,
          tier: entry.tierKey,
          ...entry.rawPayload,
        }),
      })
    }
  }

  for (const entry of legalPokemonEntries) {
    const entity = entityByShowdownId.get(entry.showdownPokemonId)
    const tier = tierByKey.get(entry.tierKey)

    if (!tier) {
      continue
    }

    tierHistoryRows.push({
      competitiveTierId: tier.id,
      pokemonId: entity?.pokemonId ?? null,
      speciesId: entity?.speciesId ?? null,
      showdownPokemonId: entry.showdownPokemonId,
      dimension: CHAMPIONS_TIER_DIMENSION,
      snapshotKey: CHAMPIONS_SNAPSHOT_KEY,
      isCurrent: true,
      rawPayload: toJson({
        source: 'pokemon-showdown',
        mod: 'champions',
        tier: entry.tierKey,
        ...entry.rawPayload,
      }),
    })
  }

  const formatIds = formatRows.map((format) => format.id)
  await prisma.pokemonFormat.deleteMany({
    where: {
      competitiveFormatId: {
        in: formatIds,
      },
    },
  })
  for (const batch of chunkArray(pokemonFormatRows, 1_000)) {
    await prisma.pokemonFormat.createMany({
      data: batch,
      skipDuplicates: true,
    })
  }

  await prisma.pokemonTierHistory.deleteMany({
    where: {
      dimension: CHAMPIONS_TIER_DIMENSION,
    },
  })
  for (const batch of chunkArray(tierHistoryRows, 1_000)) {
    await prisma.pokemonTierHistory.createMany({
      data: batch,
      skipDuplicates: true,
    })
  }

  for (const [showdownPokemonId, payload] of Object.entries(learnsets)) {
    const entity = resolvePokemonEntity(lookups, showdownPokemonId)
    const learnset = payload.learnset ?? {}

    for (const [showdownMoveId, sourceCodes] of Object.entries(learnset)) {
      const moveId = lookups.moveIdsById.get(showdownMoveId) ?? null
      const uniqueSourceCodes = Array.from(new Set(sourceCodes))

      uniqueSourceCodes.forEach((sourceCode) => {
        const parsed = parseLearnsetSourceCode(sourceCode)

        competitiveLearnsetRows.push({
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
            source: 'pokemon-showdown',
            mod: 'champions',
            snapshotKey: CHAMPIONS_SNAPSHOT_KEY,
            showdownPokemonId,
            showdownMoveId,
            sourceCode,
          }),
        })
      })
    }
  }

  const learnsetPokemonIds = Object.keys(learnsets)
  await prisma.competitiveLearnsetEntry.deleteMany({
    where: {
      showdownPokemonId: {
        in: learnsetPokemonIds,
      },
    },
  })
  for (const batch of chunkArray(competitiveLearnsetRows, 5_000)) {
    await prisma.competitiveLearnsetEntry.createMany({
      data: batch,
      skipDuplicates: true,
    })
  }

  await prisma.ingestSourceCheckpoint.upsert({
    where: {
      sourceKey: 'pokemon-showdown:champions-reg-m-a',
    },
    create: {
      sourceKey: 'pokemon-showdown:champions-reg-m-a',
      sourceType: 'pokemon-showdown',
      description: 'Pokemon Champions Regulation M-A roster, items and learnsets',
      cadence: 'manual',
      lastObservedVersion: CHAMPIONS_SNAPSHOT_KEY,
      lastObservedAt: new Date(),
      lastAppliedVersion: CHAMPIONS_SNAPSHOT_KEY,
      lastAppliedAt: new Date(),
      metadata: toJson({
        sources: [CHAMPIONS_FORMATS_DATA_URL, CHAMPIONS_LEARNSETS_URL, CHAMPIONS_ITEMS_URL],
        legalPokemonCount: legalPokemonEntries.length,
        legalItemCount: legalItemIds.length,
        learnsetPokemonCount: learnsetPokemonIds.length,
        unresolvedPokemonIds,
      }),
    },
    update: {
      lastObservedVersion: CHAMPIONS_SNAPSHOT_KEY,
      lastObservedAt: new Date(),
      lastAppliedVersion: CHAMPIONS_SNAPSHOT_KEY,
      lastAppliedAt: new Date(),
      metadata: toJson({
        sources: [CHAMPIONS_FORMATS_DATA_URL, CHAMPIONS_LEARNSETS_URL, CHAMPIONS_ITEMS_URL],
        legalPokemonCount: legalPokemonEntries.length,
        legalItemCount: legalItemIds.length,
        learnsetPokemonCount: learnsetPokemonIds.length,
        unresolvedPokemonIds,
      }),
    },
  })

  console.log(
    `[champions-meta] applied formats=${formatRows.length}, pokemonFormatRows=${pokemonFormatRows.length}, tierHistoryRows=${tierHistoryRows.length}, learnsetRows=${competitiveLearnsetRows.length}`
  )
}

main()
  .catch((error) => {
    console.error('[champions-meta] failed', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await getPrismaClient().$disconnect()
  })
