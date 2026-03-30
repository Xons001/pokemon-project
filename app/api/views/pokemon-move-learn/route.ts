import { NextRequest, NextResponse } from 'next/server'

import { invalidQueryParamResponse, readIntegerParam, readStringParam } from '@/src/modules/views/http'
import { listPokemonMoveLearnView } from '@/src/modules/views/queries'

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

    const result = await listPokemonMoveLearnView({
      pokemonSlug: readStringParam(request, 'pokemonSlug'),
      moveSlug: readStringParam(request, 'moveSlug'),
      moveType: readStringParam(request, 'moveType'),
      moveLearnMethod: readStringParam(request, 'moveLearnMethod'),
      versionGroup: readStringParam(request, 'versionGroup'),
      limit,
      offset,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to load pokemon move learn view', error)

    return NextResponse.json(
      {
        error: 'No se pudo consultar la vista pokemon_move_learn_view desde la base de datos.',
      },
      {
        status: 500,
      }
    )
  }
}
