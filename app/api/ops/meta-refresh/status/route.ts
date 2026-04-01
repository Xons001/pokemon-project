import { NextResponse } from 'next/server'

import { getPrismaClient } from '@/src/lib/prisma'
import { listIngestCheckpoints } from '@/src/modules/ingest/checkpoints'
import { buildSmartIngestPlan } from '@/src/modules/ingest/smart-plan'
import {
  getMetaRefreshEnvironmentName,
  getMetaRefreshRecommendedDagId,
  isMetaRefreshRequestAuthorized,
  META_REFRESH_DAG_FILE,
  META_REFRESH_DAG_FAMILY,
  META_REFRESH_LOCAL_UI_URL,
  OPS_META_REFRESH_TOKEN_HEADER,
} from '@/src/modules/ops/meta-refresh'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  if (!isMetaRefreshRequestAuthorized(request)) {
    return NextResponse.json(
      {
        error: 'No autorizado para consultar el estado del meta refresh.',
      },
      {
        status: 401,
      }
    )
  }

  try {
    const prisma = getPrismaClient()
    const [plan, checkpoints] = await Promise.all([
      buildSmartIngestPlan(),
      listIngestCheckpoints(prisma),
    ])

    return NextResponse.json({
      dag: {
        familyId: META_REFRESH_DAG_FAMILY,
        recommendedId: getMetaRefreshRecommendedDagId(),
        file: META_REFRESH_DAG_FILE,
        uiUrl: META_REFRESH_LOCAL_UI_URL,
      },
      environment: getMetaRefreshEnvironmentName(),
      auth: {
        header: OPS_META_REFRESH_TOKEN_HEADER,
        required: Boolean(process.env.OPS_META_REFRESH_TOKEN || process.env.OPS_REFRESH_TOKEN),
      },
      plan,
      checkpoints,
    })
  } catch (error) {
    console.error('Failed to load meta refresh status', error)

    return NextResponse.json(
      {
        error: 'No se pudo cargar el estado de refresco del meta.',
      },
      {
        status: 500,
      }
    )
  }
}
