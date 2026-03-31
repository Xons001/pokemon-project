import 'dotenv/config'

import { getPrismaClient } from '@/src/lib/prisma'
import { recordAppliedCheckpoints, recordObservedCheckpoints } from '@/src/modules/ingest/checkpoints'
import { runIngestion } from '@/src/modules/ingest'
import { buildSmartIngestPlan, buildSmartIngestTextReport } from '@/src/modules/ingest/smart-plan'

function parseArgs(argv: string[]) {
  const flags = new Set(argv.filter((argument) => argument.startsWith('--')))

  return {
    apply: flags.has('--apply'),
    force: flags.has('--force'),
    json: flags.has('--json'),
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const prisma = getPrismaClient()
  const plan = await buildSmartIngestPlan({
    force: args.force,
  })

  if (args.json) {
    console.log(JSON.stringify(plan, null, 2))
  } else {
    console.log(buildSmartIngestTextReport(plan))
  }

  if (!args.apply) {
    return
  }

  await recordObservedCheckpoints(
    prisma,
    plan.decisions.map((decision) => decision.source)
  )

  if (!plan.recommendedSteps.length) {
    console.log('[ingest-smart] no steps need to run')
    return
  }

  await runIngestion({
    steps: plan.recommendedSteps,
    log: (message) => console.log(message),
  })

  await recordAppliedCheckpoints(
    prisma,
    plan.decisions.filter((decision) => decision.shouldRun).map((decision) => decision.source)
  )

  console.log(`[ingest-smart] applied steps: ${plan.recommendedSteps.join(', ')}`)
}

main()
  .catch((error) => {
    console.error('[ingest-smart] failed', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await getPrismaClient().$disconnect()
  })
