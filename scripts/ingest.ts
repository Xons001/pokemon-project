import 'dotenv/config'

import { getPrismaClient } from '@/src/lib/prisma'
import { INGESTION_ORDER, runIngestion } from '@/src/modules/ingest'
import type { IngestStepName } from '@/src/modules/ingest/types'

function parseArgs(argv: string[]) {
  const args = new Map<string, string>()

  argv.forEach((argument) => {
    if (!argument.startsWith('--')) {
      return
    }

    const [rawKey, rawValue = ''] = argument.slice(2).split('=')
    args.set(rawKey, rawValue)
  })

  return args
}

function parseSteps(rawSteps: string | undefined): IngestStepName[] | undefined {
  if (!rawSteps) {
    return undefined
  }

  const parsedSteps = rawSteps
    .split(',')
    .map((step) => step.trim())
    .filter(Boolean)

  const invalidSteps = parsedSteps.filter(
    (step): step is string => !INGESTION_ORDER.includes(step as IngestStepName)
  )

  if (invalidSteps.length) {
    throw new Error(
      `Invalid ingest step(s): ${invalidSteps.join(', ')}. Valid steps: ${INGESTION_ORDER.join(', ')}`
    )
  }

  return parsedSteps as IngestStepName[]
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const steps = parseSteps(args.get('steps'))
  const rawLimit = args.get('limit')
  const limit = rawLimit ? Number(rawLimit) : undefined

  if (typeof limit === 'number' && (!Number.isInteger(limit) || limit <= 0)) {
    throw new Error('The --limit value must be a positive integer')
  }

  await runIngestion({
    steps,
    limit,
  })
}

main()
  .catch((error) => {
    console.error('[ingest] failed', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await getPrismaClient().$disconnect()
  })
