import path from 'node:path'

import { config as loadEnvFile } from 'dotenv'
import { Prisma } from '@prisma/client'

import { getPrismaClient } from '@/src/lib/prisma'
import { getActiveMetaFormatKeys } from '@/src/modules/showdown/format-scope'
import { toShowdownId } from '@/src/modules/showdown/id'

type CliArgs = {
  envFile: string | null
}

function parseArgs(argv: string[]): CliArgs {
  const envFileArg = argv.find((argument) => argument.startsWith('--env-file='))

  return {
    envFile: envFileArg ? envFileArg.split('=')[1] ?? null : null,
  }
}

function formatCount(value: number) {
  return new Intl.NumberFormat('es-ES').format(value)
}

function buildCompetitivePokemonWhere(scope: {
  pokemonIds: number[]
  speciesIds: number[]
  showdownIds: string[]
}): Prisma.PokemonWhereInput {
  const orClauses: Prisma.PokemonWhereInput[] = []

  if (scope.pokemonIds.length) {
    orClauses.push({
      id: {
        in: scope.pokemonIds,
      },
    })
  }

  if (scope.showdownIds.length) {
    orClauses.push({
      showdownId: {
        in: scope.showdownIds,
      },
    })
  }

  if (scope.speciesIds.length) {
    orClauses.push({
      isDefault: true,
      speciesId: {
        in: scope.speciesIds,
      },
    })
  }

  return orClauses.length
    ? {
        OR: orClauses,
      }
    : {
        id: -1,
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
  const activeFormatKeys = getActiveMetaFormatKeys()
  const activeFormats = await prisma.competitiveFormat.findMany({
    where: activeFormatKeys.length
      ? {
          formatKey: {
            in: activeFormatKeys,
          },
        }
      : undefined,
    select: {
      id: true,
      formatKey: true,
      name: true,
      rawPayload: true,
    },
    orderBy: {
      name: 'asc',
    },
  })
  const activeFormatIds = activeFormats.map((format) => format.id)
  const scopedPokemonRows = activeFormatIds.length
    ? await prisma.pokemonFormat.findMany({
        where: {
          competitiveFormatId: {
            in: activeFormatIds,
          },
        },
        select: {
          pokemonId: true,
          speciesId: true,
          showdownPokemonId: true,
        },
      })
    : []
  const scopedPokemonWhere = buildCompetitivePokemonWhere({
    pokemonIds: Array.from(
      new Set(
        scopedPokemonRows
          .map((entry) => entry.pokemonId)
          .filter((value): value is number => Number.isInteger(value))
      )
    ),
    speciesIds: Array.from(
      new Set(
        scopedPokemonRows
          .map((entry) => entry.speciesId)
          .filter((value): value is number => Number.isInteger(value))
      )
    ),
    showdownIds: Array.from(
      new Set(scopedPokemonRows.map((entry) => entry.showdownPokemonId).filter(Boolean))
    ),
  })

  const [totalPokemon, scopedPokemon, totalItems, totalUsageRows, scopedUsageRows, totalSampleSets, scopedSampleSets] =
    await Promise.all([
      prisma.pokemon.count(),
      prisma.pokemon.count({
        where: scopedPokemonWhere,
      }),
      prisma.item.count(),
      prisma.usageStatMonthly.count(),
      activeFormatIds.length
        ? prisma.usageStatMonthly.count({
            where: {
              competitiveFormatId: {
                in: activeFormatIds,
              },
            },
          })
        : Promise.resolve(0),
      prisma.sampleSet.count(),
      activeFormatIds.length
        ? prisma.sampleSet.count({
            where: {
              competitiveFormatId: {
                in: activeFormatIds,
              },
            },
          })
        : Promise.resolve(0),
    ])

  const [pokemonPerFormat, latestUsageMonths, sampleSetRows, canonicalItems] = await Promise.all([
    activeFormatIds.length
      ? prisma.pokemonFormat.groupBy({
          by: ['competitiveFormatId'],
          where: {
            competitiveFormatId: {
              in: activeFormatIds,
            },
          },
          _count: {
            showdownPokemonId: true,
          },
        })
      : Promise.resolve([]),
    activeFormatIds.length
      ? prisma.usageStatMonthly.groupBy({
          by: ['competitiveFormatId'],
          where: {
            competitiveFormatId: {
              in: activeFormatIds,
            },
          },
          _max: {
            month: true,
          },
        })
      : Promise.resolve([]),
    activeFormatIds.length
      ? prisma.sampleSet.findMany({
          where: {
            competitiveFormatId: {
              in: activeFormatIds,
            },
            itemName: {
              not: null,
            },
          },
          select: {
            itemName: true,
          },
        })
      : Promise.resolve([]),
    prisma.item.findMany({
      select: {
        name: true,
      },
    }),
  ])

  const latestUsageClauses = latestUsageMonths
    .map((entry) => ({
      competitiveFormatId: entry.competitiveFormatId,
      month: entry._max.month,
    }))
    .filter((entry): entry is { competitiveFormatId: string; month: string } => Boolean(entry.month))

  const usageRows = latestUsageClauses.length
    ? await prisma.usageStatMonthly.findMany({
        where: {
          OR: latestUsageClauses,
        },
        select: {
          items: true,
        },
      })
    : []

  const activeItemIds = new Set<string>()

  usageRows.forEach((row) => {
    const itemDistribution = row.items

    if (!itemDistribution || typeof itemDistribution !== 'object' || Array.isArray(itemDistribution)) {
      return
    }

    Object.keys(itemDistribution as Record<string, unknown>).forEach((value) => {
      const showdownId = toShowdownId(value)

      if (showdownId && showdownId !== 'nothing') {
        activeItemIds.add(showdownId)
      }
    })
  })

  sampleSetRows.forEach((row) => {
    if (!row.itemName) {
      return
    }

    const showdownId = toShowdownId(row.itemName)

    if (showdownId && showdownId !== 'nothing') {
      activeItemIds.add(showdownId)
    }
  })

  activeFormats.forEach((format) => {
    const payload = (format.rawPayload ?? {}) as Record<string, unknown>
    const rawItemIds = Array.isArray(payload.championsItemIds) ? payload.championsItemIds : []

    rawItemIds.forEach((value) => {
      if (typeof value !== 'string') {
        return
      }

      const showdownId = toShowdownId(value)

      if (showdownId && showdownId !== 'nothing') {
        activeItemIds.add(showdownId)
      }
    })
  })

  const scopedItems = canonicalItems.filter((item) => activeItemIds.has(toShowdownId(item.name)))
  const pokemonCountByFormatId = new Map(
    pokemonPerFormat.map((row) => [row.competitiveFormatId, row._count.showdownPokemonId])
  )
  const latestMonthByFormatId = new Map(
    latestUsageMonths
      .map((row) => [row.competitiveFormatId, row._max.month])
      .filter((entry): entry is [string, string] => Boolean(entry[1]))
  )

  console.log('[meta-scope] formatos activos')

  if (!activeFormats.length) {
    console.log('- no hay formatos activos configurados')
  } else {
    activeFormats.forEach((format) => {
      const pokemonCount = pokemonCountByFormatId.get(format.id) ?? 0
      const latestMonth = latestMonthByFormatId.get(format.id) ?? 'sin usage'
      console.log(`- ${format.name} (${format.formatKey}): ${formatCount(pokemonCount)} Pokemon, usage ${latestMonth}`)
    })
  }

  console.log('[meta-scope] resumen')
  console.log(`- Pokemon canonicos totales: ${formatCount(totalPokemon)}`)
  console.log(`- Pokemon dentro del scope competitivo activo: ${formatCount(scopedPokemon)}`)
  console.log(`- Pokemon fuera de scope activo: ${formatCount(Math.max(totalPokemon - scopedPokemon, 0))}`)
  console.log(`- Items canonicos totales: ${formatCount(totalItems)}`)
  console.log(`- Items detectados en meta activo: ${formatCount(scopedItems.length)}`)
  console.log(`- Items fuera de scope activo: ${formatCount(Math.max(totalItems - scopedItems.length, 0))}`)
  console.log(`- usage_stat_monthly total: ${formatCount(totalUsageRows)}`)
  console.log(`- usage_stat_monthly en formatos activos: ${formatCount(scopedUsageRows)}`)
  console.log(`- sample_set total: ${formatCount(totalSampleSets)}`)
  console.log(`- sample_set en formatos activos: ${formatCount(scopedSampleSets)}`)
  console.log('[meta-scope] nota')
  console.log('- este script no borra nada; sirve para medir cuanto contenido podriamos recortar sin tocar todavia la Pokedex canonica')
}

main()
  .catch((error) => {
    console.error('[meta-scope] failed', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await getPrismaClient().$disconnect()
  })
