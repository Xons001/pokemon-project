import { NextRequest, NextResponse } from 'next/server'

import { isDatabaseUnavailableError } from '@/src/lib/database'
import { listFallbackPokemonCatalog } from '@/src/modules/pokemon/pokeapi'
import { listPokemonCatalog } from '@/src/modules/pokemon/queries'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query')?.trim().toLowerCase() ?? ''
  const scope = request.nextUrl.searchParams.get('scope')?.trim().toLowerCase() ?? 'all'
  const formatKey = request.nextUrl.searchParams.get('formatKey')?.trim() ?? null
  const pageParam = request.nextUrl.searchParams.get('page')
  const pageSizeParam = request.nextUrl.searchParams.get('pageSize')
  const page = pageParam ? Number(pageParam) : null
  const pageSize = pageSizeParam ? Number(pageSizeParam) : null

  try {
    const catalog = await listPokemonCatalog({
      formatKey,
      competitiveOnly: scope === 'competitive',
      page,
      pageSize,
      query,
    })

    return NextResponse.json({
      total: catalog.total,
      catalogTotal: catalog.catalogTotal,
      page: page && Number.isFinite(page) ? page : null,
      pageSize: pageSize && Number.isFinite(pageSize) ? pageSize : null,
      items: catalog.items,
    })
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      try {
        const fallbackCatalog = await listFallbackPokemonCatalog({
          query,
          page,
          pageSize,
        })

        return NextResponse.json({
          total: fallbackCatalog.total,
          catalogTotal: fallbackCatalog.catalogTotal,
          page: page && Number.isFinite(page) ? page : null,
          pageSize: pageSize && Number.isFinite(pageSize) ? pageSize : null,
          items: fallbackCatalog.items,
          fallbackSource: 'pokeapi',
        })
      } catch (fallbackError) {
        console.error('Failed to load pokemon catalog fallback', fallbackError)
      }
    }

    console.error('Failed to load pokemon catalog', error)

    return NextResponse.json(
      {
        error: 'No se pudo consultar el catalogo de Pokemon desde la base de datos.',
      },
      {
        status: 500,
      }
    )
  }
}
