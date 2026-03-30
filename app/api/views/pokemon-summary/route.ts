import { NextRequest, NextResponse } from 'next/server'

import { invalidQueryParamResponse, readBooleanParam, readIntegerParam, readStringParam } from '@/src/modules/views/http'
import { listPokemonSummaryView } from '@/src/modules/views/queries'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const limit = readIntegerParam(request, 'limit')
    const offset = readIntegerParam(request, 'offset')
    const hasIsDefault = request.nextUrl.searchParams.has('isDefault')
    const isDefault = readBooleanParam(request, 'isDefault')

    if (Number.isNaN(limit)) {
      return invalidQueryParamResponse('limit')
    }

    if (Number.isNaN(offset)) {
      return invalidQueryParamResponse('offset')
    }

    if (hasIsDefault && typeof isDefault !== 'boolean') {
      return invalidQueryParamResponse('isDefault')
    }

    const result = await listPokemonSummaryView({
      pokemonSlug: readStringParam(request, 'pokemonSlug'),
      speciesSlug: readStringParam(request, 'speciesSlug'),
      generationName: readStringParam(request, 'generationName'),
      primaryType: readStringParam(request, 'primaryType'),
      isDefault,
      limit,
      offset,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to load pokemon summary view', error)

    return NextResponse.json(
      {
        error: 'No se pudo consultar la vista pokemon_summary_view desde la base de datos.',
      },
      {
        status: 500,
      }
    )
  }
}
