import { NextRequest, NextResponse } from 'next/server'

import { invalidQueryParamResponse, readIntegerParam, readStringParam } from '@/src/modules/views/http'
import { listPokemonPokedexEntryView } from '@/src/modules/views/queries'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const limit = readIntegerParam(request, 'limit')
    const offset = readIntegerParam(request, 'offset')

    if (Number.isNaN(limit)) {
      return invalidQueryParamResponse('limit')
    }

    if (Number.isNaN(offset)) {
      return invalidQueryParamResponse('offset')
    }

    const result = await listPokemonPokedexEntryView({
      pokedexSlug: readStringParam(request, 'pokedexSlug'),
      speciesSlug: readStringParam(request, 'speciesSlug'),
      defaultPokemonSlug: readStringParam(request, 'defaultPokemonSlug'),
      limit,
      offset,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to load pokemon pokedex entry view', error)

    return NextResponse.json(
      {
        error: 'No se pudo consultar la vista pokemon_pokedex_entry_view desde la base de datos.',
      },
      {
        status: 500,
      }
    )
  }
}
