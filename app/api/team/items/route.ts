import { NextRequest, NextResponse } from 'next/server'

import { isDatabaseUnavailableError } from '@/src/lib/database'
import { listFallbackItemOptions } from '@/src/modules/team/fallback'
import { listItemOptions } from '@/src/modules/team/queries'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const formatKey = request.nextUrl.searchParams.get('formatKey')?.trim() ?? null
    const items = await listItemOptions(formatKey)

    return NextResponse.json({
      total: items.length,
      items,
    })
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      const fallbackItems = listFallbackItemOptions()

      return NextResponse.json({
        total: fallbackItems.length,
        items: fallbackItems,
        fallbackSource: 'static',
      })
    }

    console.error('Failed to load item catalog', error)

    return NextResponse.json(
      {
        error: 'No se pudo cargar el catalogo de items desde la base de datos.',
      },
      {
        status: 500,
      }
    )
  }
}
