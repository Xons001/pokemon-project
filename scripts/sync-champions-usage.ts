import 'dotenv/config'

import path from 'node:path'

import { config as loadEnvFile } from 'dotenv'
import type { Prisma } from '@prisma/client'

import { getPrismaClient } from '@/src/lib/prisma'
import { buildShowdownLookups } from '@/src/modules/ingest/showdown/lookups'
import { getActiveMetaFormatKeys } from '@/src/modules/showdown/format-scope'
import { toShowdownId } from '@/src/modules/showdown/id'

type CliArgs = {
  envFile: string | null
  limit: number
  dryRun: boolean
}

type RankingEntry = {
  rank: number
  name: string
  showdownPokemonId: string
  usagePercent: number
  aiUrl: string
}

type PokemonUsageDetails = {
  moves: Record<string, number>
  abilities: Record<string, number>
  items: Record<string, number>
  teammates: Record<string, number>
  spreads: Record<string, number>
}

const PIKALYTICS_AI_BASE_URL = 'https://www.pikalytics.com/ai/pokedex'
const DEFAULT_LIMIT = 50
const USAGE_RATING = 1760

function parseArgs(argv: string[]): CliArgs {
  const envFileArg = argv.find((argument) => argument.startsWith('--env-file='))
  const limitArg = argv.find((argument) => argument.startsWith('--limit='))
  const parsedLimit = limitArg ? Number(limitArg.split('=')[1]) : DEFAULT_LIMIT

  return {
    envFile: envFileArg ? envFileArg.split('=')[1] ?? null : null,
    limit: Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : DEFAULT_LIMIT,
    dryRun: argv.includes('--dry-run'),
  }
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue
}

function toDistributionPercent(value: string) {
  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed / 100 : 0
}

function extractDataDate(markdown: string) {
  return markdown.match(/\*\*Data Date\*\* \| (\d{4}-\d{2}) \|/)?.[1] ?? new Date().toISOString().slice(0, 7)
}

function parseRanking(markdown: string, limit: number): RankingEntry[] {
  const rows = Array.from(
    markdown.matchAll(/^\| (\d+) \| \*\*(.+?)\*\* \| ([0-9.]+)% \| .*? \| \[AI\]\((https:\/\/www\.pikalytics\.com\/ai\/pokedex\/[^)]+)\) \|$/gm)
  )

  return rows
    .map((match) => ({
      rank: Number(match[1]),
      name: match[2],
      showdownPokemonId: toShowdownId(match[2]),
      usagePercent: toDistributionPercent(match[3]),
      aiUrl: match[4],
    }))
    .filter((entry) => entry.rank > 0 && entry.showdownPokemonId && entry.usagePercent > 0)
    .slice(0, limit)
}

function parseBulletDistribution(markdown: string, sectionTitle: string) {
  const sectionPattern = new RegExp(`## ${sectionTitle}\\n([\\s\\S]*?)(?=\\n## |\\n---|$)`)
  const section = markdown.match(sectionPattern)?.[1] ?? ''
  const entries: Record<string, number> = {}

  Array.from(section.matchAll(/^- \*\*(.+?)\*\*: ([0-9.]+)%$/gm)).forEach((match) => {
    const showdownId = toShowdownId(match[1])
    const percent = toDistributionPercent(match[2])

    if (showdownId && percent > 0 && showdownId !== 'other') {
      entries[showdownId] = percent
    }
  })

  return entries
}

function parseTopSpread(markdown: string) {
  const match = markdown.match(/features a \*\*(.+?)\*\* nature with an EV spread of `(.+?)`\. This configuration accounts for ([0-9.]+)%/)

  if (!match) {
    return {}
  }

  return {
    [`${match[1]} ${match[2]}`]: toDistributionPercent(match[3]),
  }
}

function parsePokemonUsageDetails(markdown: string): PokemonUsageDetails {
  return {
    moves: parseBulletDistribution(markdown, 'Common Moves'),
    abilities: parseBulletDistribution(markdown, 'Common Abilities'),
    items: parseBulletDistribution(markdown, 'Common Items'),
    teammates: parseBulletDistribution(markdown, 'Common Teammates'),
    spreads: parseTopSpread(markdown),
  }
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

async function fetchFormatUsage(formatKey: string, limit: number) {
  const indexUrl = `${PIKALYTICS_AI_BASE_URL}/${formatKey}`
  const indexMarkdown = await fetchText(indexUrl)
  const month = extractDataDate(indexMarkdown)
  const ranking = parseRanking(indexMarkdown, limit)
  const detailsById = new Map<string, PokemonUsageDetails>()

  for (const [index, entry] of ranking.entries()) {
    const markdown = await fetchText(entry.aiUrl)
    detailsById.set(entry.showdownPokemonId, parsePokemonUsageDetails(markdown))

    if ((index + 1) % 10 === 0 || index === ranking.length - 1) {
      console.log(`[champions-usage] ${formatKey}: ${index + 1}/${ranking.length}`)
    }
  }

  return {
    indexUrl,
    month,
    ranking,
    detailsById,
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.envFile) {
    loadEnvFile({
      path: path.resolve(process.cwd(), args.envFile),
      override: true,
    })
  }

  const prisma = getPrismaClient()
  const lookups = await buildShowdownLookups(prisma)
  const activeFormatKeys = getActiveMetaFormatKeys()
  const formats = await prisma.competitiveFormat.findMany({
    where: {
      formatKey: {
        in: activeFormatKeys,
      },
    },
    select: {
      id: true,
      formatKey: true,
      name: true,
    },
  })

  if (!formats.length) {
    throw new Error('No active Champions formats found in the local database.')
  }

  for (const format of formats) {
    const usage = await fetchFormatUsage(format.formatKey, args.limit)
    const usageRows: Prisma.UsageStatMonthlyCreateManyInput[] = usage.ranking.map((entry) => {
      const details = usage.detailsById.get(entry.showdownPokemonId) ?? {
        moves: {},
        abilities: {},
        items: {},
        teammates: {},
        spreads: {},
      }
      const entity =
        lookups.pokemonById.get(entry.showdownPokemonId) ?? {
          pokemonId: null,
          speciesId: null,
          showdownPokemonId: entry.showdownPokemonId,
        }

      return {
        competitiveFormatId: format.id,
        pokemonId: entity.pokemonId,
        speciesId: entity.speciesId,
        showdownPokemonId: entry.showdownPokemonId,
        month: usage.month,
        rating: USAGE_RATING,
        metagame: format.name,
        rank: entry.rank,
        usagePercent: entry.usagePercent,
        abilities: toJson(details.abilities),
        items: toJson(details.items),
        moves: toJson(details.moves),
        teammates: toJson(details.teammates),
        spreads: toJson(details.spreads),
        rawPayload: toJson({
          source: 'pikalytics-ai',
          indexUrl: usage.indexUrl,
          aiUrl: entry.aiUrl,
          dataDate: usage.month,
          rank: entry.rank,
          pokemonName: entry.name,
        }),
      }
    })

    console.log(`[champions-usage] ${format.formatKey}: parsed rows=${usageRows.length}, month=${usage.month}`)

    if (args.dryRun) {
      continue
    }

    await prisma.usageStatMonthly.deleteMany({
      where: {
        competitiveFormatId: format.id,
        month: usage.month,
        rating: USAGE_RATING,
      },
    })

    if (usageRows.length) {
      await prisma.usageStatMonthly.createMany({
        data: usageRows,
        skipDuplicates: true,
      })
    }

    for (const row of usageRows) {
      await prisma.pokemonFormat.updateMany({
        where: {
          competitiveFormatId: format.id,
          showdownPokemonId: row.showdownPokemonId,
        },
        data: {
          isUsageTracked: true,
          latestUsageMonth: usage.month,
          latestUsageRating: USAGE_RATING,
          latestUsagePercent: row.usagePercent,
        },
      })
    }
  }
}

main()
  .catch((error) => {
    console.error('[champions-usage] failed', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await getPrismaClient().$disconnect()
  })
