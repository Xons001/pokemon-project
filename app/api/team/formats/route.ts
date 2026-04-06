import { NextResponse } from 'next/server'

import { isDatabaseUnavailableError } from '@/src/lib/database'
import { listFallbackCompetitiveFormats } from '@/src/modules/team/fallback'
import { listCompetitiveFormats } from '@/src/modules/team/queries'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const items = await listCompetitiveFormats()

    return NextResponse.json({
      total: items.length,
      items,
    })
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      const fallbackItems = listFallbackCompetitiveFormats()

      return NextResponse.json({
        total: fallbackItems.length,
        items: fallbackItems,
        fallbackSource: 'static',
      })
    }

    console.error('Failed to load competitive formats', error)

    return NextResponse.json(
      {
        error: 'No se pudieron cargar los formatos competitivos desde la base de datos.',
      },
      {
        status: 500,
      }
    )
  }
}
