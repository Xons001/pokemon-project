import path from 'node:path'

import { config as loadEnvFile } from 'dotenv'
import { Client } from 'pg'

type CliArgs = {
  apply: boolean
  vacuum: boolean
  envFile: string | null
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

async function runVacuum(connectionString: string) {
  const client = new Client({
    connectionString,
  })

  await client.connect()

  try {
    await client.query('VACUUM (FULL, ANALYZE) usage_stat_monthly')
    await client.query('VACUUM (FULL, ANALYZE) pokemon_format')
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

  const [{ getAppEnv }, { getPrismaClient }] = await Promise.all([
    import('@/src/lib/env'),
    import('@/src/lib/prisma'),
  ])
  const env = getAppEnv()
  const prisma = getPrismaClient()

  const before = {
    usageRows: await prisma.usageStatMonthly.count(),
    trackedFormats: await prisma.pokemonFormat.count({
      where: {
        isUsageTracked: true,
      },
    }),
    sampleSets: await prisma.sampleSet.count(),
    learnsetEntries: await prisma.competitiveLearnsetEntry.count(),
  }

  console.log('[prune-competitive] plan')
  console.log(`- profile actual: ${env.metaRefreshProfile}`)
  console.log(`- usage rows: ${formatCount(before.usageRows)}`)
  console.log(`- pokemon_format tracked: ${formatCount(before.trackedFormats)}`)
  console.log(`- sample sets: ${formatCount(before.sampleSets)}`)
  console.log(`- learnset entries: ${formatCount(before.learnsetEntries)}`)
  console.log('- accion: borrar usage_stat_monthly y limpiar flags de usage en pokemon_format')

  if (!args.apply) {
    console.log('[prune-competitive] no se ha aplicado nada. Usa --apply para ejecutar.')
    return
  }

  await prisma.usageStatMonthly.deleteMany()
  await prisma.pokemonFormat.updateMany({
    where: {
      OR: [
        {
          isUsageTracked: true,
        },
        {
          latestUsageMonth: {
            not: null,
          },
        },
        {
          latestUsageRating: {
            not: null,
          },
        },
        {
          latestUsagePercent: {
            not: null,
          },
        },
      ],
    },
    data: {
      isUsageTracked: false,
      latestUsageMonth: null,
      latestUsageRating: null,
      latestUsagePercent: null,
    },
  })

  if (args.vacuum) {
    console.log('[prune-competitive] ejecutando VACUUM FULL sobre usage_stat_monthly y pokemon_format...')
    await runVacuum(env.directUrl)
  }

  const after = {
    usageRows: await prisma.usageStatMonthly.count(),
    trackedFormats: await prisma.pokemonFormat.count({
      where: {
        isUsageTracked: true,
      },
    }),
  }

  console.log('[prune-competitive] completado')
  console.log(`- usage rows despues: ${formatCount(after.usageRows)}`)
  console.log(`- pokemon_format tracked despues: ${formatCount(after.trackedFormats)}`)
}

main()
  .catch((error) => {
    console.error('[prune-competitive] failed', error)
    process.exitCode = 1
  })
  .finally(async () => {
    const { getPrismaClient } = await import('@/src/lib/prisma')
    await getPrismaClient().$disconnect()
  })
