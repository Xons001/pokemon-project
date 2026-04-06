import { NextRequest, NextResponse } from 'next/server'

import { isDatabaseUnavailableError } from '@/src/lib/database'
import { getFallbackTypeChart, listFallbackPokemonCatalog } from '@/src/modules/pokemon/pokeapi'
import { listPokemonCatalog } from '@/src/modules/pokemon/queries'
import {
  listFallbackCompetitiveFormats,
  listFallbackItemOptions,
} from '@/src/modules/team/fallback'
import { getTypeChart, listCompetitiveFormats, listItemOptions } from '@/src/modules/team/queries'

export const dynamic = 'force-dynamic'

function resolveFormatKey(formats: Array<{ key: string }>, requestedFormatKey?: string | null) {
  const normalizedRequestedKey = requestedFormatKey?.trim().toLowerCase() ?? ''

  return formats.find((format) => format.key.toLowerCase() === normalizedRequestedKey)?.key ?? formats[0]?.key ?? null
}

export async function GET(request: NextRequest) {
  const requestedFormatKey = request.nextUrl.searchParams.get('formatKey')?.trim() ?? null

  try {
    const formats = await listCompetitiveFormats()
    const resolvedFormatKey = resolveFormatKey(formats, requestedFormatKey)
    const [catalog, typeChart, items] = await Promise.all([
      listPokemonCatalog({
        competitiveOnly: true,
        query: '',
      }),
      getTypeChart(),
      listItemOptions(resolvedFormatKey),
    ])

    return NextResponse.json({
      resolvedFormatKey,
      catalog: {
        total: catalog.total,
        catalogTotal: catalog.catalogTotal,
        items: catalog.items,
      },
      formats: {
        total: formats.length,
        items: formats,
      },
      items: {
        total: items.length,
        items,
      },
      typeChart,
    })
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      const formats = listFallbackCompetitiveFormats()
      const resolvedFormatKey = resolveFormatKey(formats, requestedFormatKey)
      const [catalog, typeChart] = await Promise.all([
        listFallbackPokemonCatalog({
          query: '',
          page: null,
          pageSize: null,
        }),
        getFallbackTypeChart(),
      ])
      const items = listFallbackItemOptions()

      return NextResponse.json({
        resolvedFormatKey,
        catalog: {
          total: catalog.total,
          catalogTotal: catalog.catalogTotal,
          items: catalog.items,
        },
        formats: {
          total: formats.length,
          items: formats,
        },
        items: {
          total: items.length,
          items,
        },
        typeChart,
        fallbackSources: {
          catalog: 'pokeapi',
          formats: 'static',
          items: 'static',
          typeChart: 'pokeapi',
        },
      })
    }

    console.error('Failed to load team builder bootstrap payload', error)

    return NextResponse.json(
      {
        error: 'No se pudo cargar el bootstrap del team builder desde la API interna.',
      },
      {
        status: 500,
      }
    )
  }
}
