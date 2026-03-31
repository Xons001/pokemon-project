import { NextResponse } from 'next/server'

import { getPrismaClient } from '@/src/lib/prisma'
import { recordAppliedCheckpoints, recordObservedCheckpoints } from '@/src/modules/ingest/checkpoints'
import { runIngestion } from '@/src/modules/ingest'
import { buildSmartIngestPlan } from '@/src/modules/ingest/smart-plan'
import { isMetaRefreshRequestAuthorized } from '@/src/modules/ops/meta-refresh'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!isMetaRefreshRequestAuthorized(request)) {
    return NextResponse.json(
      {
        error: 'No autorizado para ejecutar el meta refresh.',
      },
      {
        status: 401,
      }
    )
  }

  try {
    const body = await request.json().catch(() => ({}))
    const force = Boolean(body?.force)
    const prisma = getPrismaClient()
    const plan = await buildSmartIngestPlan({ force })

    await recordObservedCheckpoints(
      prisma,
      plan.decisions.map((decision) => decision.source)
    )

    if (!plan.recommendedSteps.length) {
      return NextResponse.json({
        applied: false,
        reason: 'No hay pasos pendientes para esta ejecucion.',
        plan,
      })
    }

    await runIngestion({
      steps: plan.recommendedSteps,
    })

    await recordAppliedCheckpoints(
      prisma,
      plan.decisions.filter((decision) => decision.shouldRun).map((decision) => decision.source)
    )

    return NextResponse.json({
      applied: true,
      plan,
    })
  } catch (error) {
    console.error('Failed to apply meta refresh', error)

    return NextResponse.json(
      {
        error: 'No se pudo ejecutar el refresco automatico del meta.',
      },
      {
        status: 500,
      }
    )
  }
}
