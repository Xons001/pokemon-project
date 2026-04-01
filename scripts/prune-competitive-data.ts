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
    pokemonFormats: await prisma.pokemonFormat.count(),
    sampleSets: await prisma.sampleSet.count(),
    learnsetEntries: await prisma.competitiveLearnsetEntry.count(),
  }

  console.log('[prune-competitive] plan')
  console.log(`- profile actual: ${env.metaRefreshProfile}`)
  console.log(`- usage rows: ${formatCount(before.usageRows)}`)
  console.log(`- pokemon_format tracked: ${formatCount(before.trackedFormats)}`)
  console.log(`- pokemon_format total: ${formatCount(before.pokemonFormats)}`)
  console.log(`- sample sets: ${formatCount(before.sampleSets)}`)
  console.log(`- learnset entries: ${formatCount(before.learnsetEntries)}`)
  console.log('- accion: borrar usage_stat_monthly, vaciar pokemon_format y reconstruir solo desde sample_set')

  if (!args.apply) {
    console.log('[prune-competitive] no se ha aplicado nada. Usa --apply para ejecutar.')
    return
  }

  await prisma.usageStatMonthly.deleteMany()
  await prisma.pokemonFormat.deleteMany()

  if (args.vacuum) {
    console.log('[prune-competitive] ejecutando VACUUM FULL sobre usage_stat_monthly y pokemon_format...')
    await runVacuum(env.directUrl)
  }

  const sampleFormatRows = await prisma.sampleSet.groupBy({
    by: ['competitiveFormatId', 'showdownPokemonId', 'pokemonId', 'speciesId'],
  })

  for (let index = 0; index < sampleFormatRows.length; index += 500) {
    const batch = sampleFormatRows.slice(index, index + 500)

    await prisma.pokemonFormat.createMany({
      data: batch.map((row) => ({
        competitiveFormatId: row.competitiveFormatId,
        showdownPokemonId: row.showdownPokemonId,
        pokemonId: row.pokemonId,
        speciesId: row.speciesId,
        isSampleSetAvailable: true,
        isUsageTracked: false,
      })),
      skipDuplicates: true,
    })
  }

  const after = {
    usageRows: await prisma.usageStatMonthly.count(),
    trackedFormats: await prisma.pokemonFormat.count({
      where: {
        isUsageTracked: true,
      },
    }),
    pokemonFormats: await prisma.pokemonFormat.count(),
  }

  console.log('[prune-competitive] completado')
  console.log(`- usage rows despues: ${formatCount(after.usageRows)}`)
  console.log(`- pokemon_format tracked despues: ${formatCount(after.trackedFormats)}`)
  console.log(`- pokemon_format total despues: ${formatCount(after.pokemonFormats)}`)
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
