import path from 'node:path'

import { config as loadEnvFile } from 'dotenv'
import { Prisma } from '@prisma/client'
import { Client } from 'pg'

import { getAppEnv } from '@/src/lib/env'
import { getPrismaClient } from '@/src/lib/prisma'
import { getActiveMetaFormatKeys } from '@/src/modules/showdown/format-scope'

type CliArgs = {
  apply: boolean
  vacuum: boolean
  envFile: string | null
}

type ActivePokemonScopeRow = {
  pokemonId: number | null
  speciesId: number | null
  showdownPokemonId: string
  competitiveTierId: string | null
}

type CompetitivePokemonScope = {
  pokemonIds: number[]
  speciesIds: number[]
  showdownIds: string[]
  tierIds: string[]
}

function parseArgs(argv: string[]): CliArgs {
  const apply = argv.includes('--apply')
  const vacuum = argv.includes('--vacuum')
  const envFileArg = argv.find((argument) => argument.startsWith('--env-file='))

  return {
    apply,
    vacuum,
    envFile: envFileArg ? envFileArg.split('=')[1] ?? null : null,
  }
}

function formatCount(value: number) {
  return new Intl.NumberFormat('es-ES').format(value)
}

function uniqueIntegers(values: Array<number | null>) {
  return Array.from(new Set(values.filter((value): value is number => Number.isInteger(value))))
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))))
}

function buildCompetitivePokemonScope(rows: ActivePokemonScopeRow[]): CompetitivePokemonScope {
  return {
    pokemonIds: uniqueIntegers(rows.map((row) => row.pokemonId)),
    speciesIds: uniqueIntegers(rows.map((row) => row.speciesId)),
    showdownIds: uniqueStrings(rows.map((row) => row.showdownPokemonId)),
    tierIds: uniqueStrings(rows.map((row) => row.competitiveTierId)),
  }
}

function buildActiveLearnsetWhere(scope: CompetitivePokemonScope): Prisma.CompetitiveLearnsetEntryWhereInput {
  const orClauses: Prisma.CompetitiveLearnsetEntryWhereInput[] = []

  if (scope.pokemonIds.length) {
    orClauses.push({
      pokemonId: {
        in: scope.pokemonIds,
      },
    })
  }

  if (scope.speciesIds.length) {
    orClauses.push({
      speciesId: {
        in: scope.speciesIds,
      },
    })
  }

  if (scope.showdownIds.length) {
    orClauses.push({
      showdownPokemonId: {
        in: scope.showdownIds,
      },
    })
  }

  return orClauses.length
    ? {
        OR: orClauses,
      }
    : {
        showdownPokemonId: '__no-active-meta-scope__',
      }
}

async function runVacuum(connectionString: string) {
  const client = new Client({
    connectionString,
  })

  await client.connect()

  try {
    const tables = [
      'competitive_learnset_entry',
      'usage_stat_monthly',
      'sample_set',
      'pokemon_format',
      'banlist_entry',
      'competitive_format',
      'pokemon_tier_history',
      'competitive_tier',
    ]

    for (const table of tables) {
      await client.query(`VACUUM (FULL, ANALYZE) ${table}`)
    }
  } finally {
    await client.end()
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

  const env = getAppEnv()
  const prisma = getPrismaClient()
  const activeFormatKeys = getActiveMetaFormatKeys()

  if (!activeFormatKeys.length) {
    console.log('[prune-active-meta] no hay formatos activos configurados; no se aplicara ninguna poda.')
    return
  }

  const activeFormats = await prisma.competitiveFormat.findMany({
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
    orderBy: {
      name: 'asc',
    },
  })

  if (!activeFormats.length) {
    console.log('[prune-active-meta] no hay formatos activos presentes en la base de datos; no se ha tocado nada.')
    return
  }

  const activeFormatIds = activeFormats.map((format) => format.id)
  const activePokemonRows = await prisma.pokemonFormat.findMany({
    where: {
      competitiveFormatId: {
        in: activeFormatIds,
      },
    },
    select: {
      pokemonId: true,
      speciesId: true,
      showdownPokemonId: true,
      competitiveTierId: true,
    },
  })

  if (!activePokemonRows.length) {
    console.log('[prune-active-meta] los formatos activos no tienen filas en pokemon_format; abortando por seguridad.')
    return
  }

  const scope = buildCompetitivePokemonScope(activePokemonRows)
  const inactiveFormatFilter = {
    formatKey: {
      notIn: activeFormatKeys,
    },
  } satisfies Prisma.CompetitiveFormatWhereInput
  const activeLearnsetWhere = buildActiveLearnsetWhere(scope)
  const inactiveTierFilter = scope.tierIds.length
    ? ({
        id: {
          notIn: scope.tierIds,
        },
      } satisfies Prisma.CompetitiveTierWhereInput)
    : null

  const [
    totalFormats,
    inactiveFormats,
    totalPokemonFormats,
    inactivePokemonFormats,
    totalUsageRows,
    inactiveUsageRows,
    totalSampleSets,
    inactiveSampleSets,
    totalBanlistEntries,
    inactiveBanlistEntries,
    totalLearnsetEntries,
    inactiveLearnsetEntries,
    totalCompetitiveTiers,
    inactiveCompetitiveTiers,
    totalTierHistoryRows,
    inactiveTierHistoryRows,
  ] = await Promise.all([
    prisma.competitiveFormat.count(),
    prisma.competitiveFormat.count({
      where: inactiveFormatFilter,
    }),
    prisma.pokemonFormat.count(),
    prisma.pokemonFormat.count({
      where: {
        competitiveFormat: inactiveFormatFilter,
      },
    }),
    prisma.usageStatMonthly.count(),
    prisma.usageStatMonthly.count({
      where: {
        competitiveFormat: inactiveFormatFilter,
      },
    }),
    prisma.sampleSet.count(),
    prisma.sampleSet.count({
      where: {
        competitiveFormat: inactiveFormatFilter,
      },
    }),
    prisma.banlistEntry.count(),
    prisma.banlistEntry.count({
      where: {
        competitiveFormat: inactiveFormatFilter,
      },
    }),
    prisma.competitiveLearnsetEntry.count(),
    prisma.competitiveLearnsetEntry.count({
      where: {
        NOT: activeLearnsetWhere,
      },
    }),
    prisma.competitiveTier.count(),
    inactiveTierFilter
      ? prisma.competitiveTier.count({
          where: inactiveTierFilter,
        })
      : Promise.resolve(0),
    prisma.pokemonTierHistory.count(),
    inactiveTierFilter
      ? prisma.pokemonTierHistory.count({
          where: {
            competitiveTierId: {
              notIn: scope.tierIds,
            },
          },
        })
      : Promise.resolve(0),
  ])

  console.log('[prune-active-meta] formatos activos')
  activeFormats.forEach((format) => {
    console.log(`- ${format.name} (${format.formatKey})`)
  })

  console.log('[prune-active-meta] plan')
  console.log(`- entorno: ${env.environmentName}`)
  console.log(`- formatos competitivos totales: ${formatCount(totalFormats)}`)
  console.log(`- formatos fuera del meta activo: ${formatCount(inactiveFormats)}`)
  console.log(`- filas pokemon_format fuera del meta activo: ${formatCount(inactivePokemonFormats)} / ${formatCount(totalPokemonFormats)}`)
  console.log(`- filas usage_stat_monthly fuera del meta activo: ${formatCount(inactiveUsageRows)} / ${formatCount(totalUsageRows)}`)
  console.log(`- filas sample_set fuera del meta activo: ${formatCount(inactiveSampleSets)} / ${formatCount(totalSampleSets)}`)
  console.log(`- filas banlist_entry fuera del meta activo: ${formatCount(inactiveBanlistEntries)} / ${formatCount(totalBanlistEntries)}`)
  console.log(`- filas competitive_learnset_entry fuera del scope activo: ${formatCount(inactiveLearnsetEntries)} / ${formatCount(totalLearnsetEntries)}`)

  if (inactiveTierFilter) {
    console.log(`- filas competitive_tier fuera del scope activo: ${formatCount(inactiveCompetitiveTiers)} / ${formatCount(totalCompetitiveTiers)}`)
    console.log(`- filas pokemon_tier_history fuera del scope activo: ${formatCount(inactiveTierHistoryRows)} / ${formatCount(totalTierHistoryRows)}`)
  } else {
    console.log('- competitive_tier y pokemon_tier_history no se podaran porque los formatos activos no exponen tiers ligados.')
  }

  console.log('- alcance: solo se limpia la capa competitiva; la Pokedex canonica y los items canonicos no se borran.')

  if (!args.apply) {
    console.log('[prune-active-meta] no se ha aplicado nada. Usa --apply para ejecutar la poda real.')
    return
  }

  console.log('[prune-active-meta] borrando learnsets competitivos fuera del scope activo...')
  await prisma.competitiveLearnsetEntry.deleteMany({
    where: {
      NOT: activeLearnsetWhere,
    },
  })

  console.log('[prune-active-meta] borrando formatos competitivos fuera del meta activo...')
  await prisma.competitiveFormat.deleteMany({
    where: inactiveFormatFilter,
  })

  if (inactiveTierFilter) {
    console.log('[prune-active-meta] borrando tiers competitivos huerfanos tras la poda...')
    await prisma.competitiveTier.deleteMany({
      where: inactiveTierFilter,
    })
  }

  if (args.vacuum) {
    console.log('[prune-active-meta] ejecutando VACUUM FULL sobre las tablas competitivas recortadas...')
    await runVacuum(env.directUrl)
  }

  const [
    remainingFormats,
    remainingPokemonFormats,
    remainingUsageRows,
    remainingSampleSets,
    remainingBanlistEntries,
    remainingLearnsetEntries,
    remainingCompetitiveTiers,
    remainingTierHistoryRows,
  ] = await Promise.all([
    prisma.competitiveFormat.count(),
    prisma.pokemonFormat.count(),
    prisma.usageStatMonthly.count(),
    prisma.sampleSet.count(),
    prisma.banlistEntry.count(),
    prisma.competitiveLearnsetEntry.count(),
    prisma.competitiveTier.count(),
    prisma.pokemonTierHistory.count(),
  ])

  console.log('[prune-active-meta] completado')
  console.log(`- formatos competitivos restantes: ${formatCount(remainingFormats)}`)
  console.log(`- pokemon_format restante: ${formatCount(remainingPokemonFormats)}`)
  console.log(`- usage_stat_monthly restante: ${formatCount(remainingUsageRows)}`)
  console.log(`- sample_set restante: ${formatCount(remainingSampleSets)}`)
  console.log(`- banlist_entry restante: ${formatCount(remainingBanlistEntries)}`)
  console.log(`- competitive_learnset_entry restante: ${formatCount(remainingLearnsetEntries)}`)
  console.log(`- competitive_tier restante: ${formatCount(remainingCompetitiveTiers)}`)
  console.log(`- pokemon_tier_history restante: ${formatCount(remainingTierHistoryRows)}`)
}

main()
  .catch((error) => {
    console.error('[prune-active-meta] failed', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await getPrismaClient().$disconnect()
  })
