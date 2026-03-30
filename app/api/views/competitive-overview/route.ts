import { NextRequest, NextResponse } from 'next/server'

import { invalidQueryParamResponse, readBooleanParam, readIntegerParam, readStringParam } from '@/src/modules/views/http'
import { listPokemonCompetitiveOverviewView } from '@/src/modules/views/queries'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const limit = readIntegerParam(request, 'limit')
    const offset = readIntegerParam(request, 'offset')
    const hasIsSampleSetAvailable = request.nextUrl.searchParams.has('isSampleSetAvailable')
    const hasIsUsageTracked = request.nextUrl.searchParams.has('isUsageTracked')
    const isSampleSetAvailable = readBooleanParam(request, 'isSampleSetAvailable')
    const isUsageTracked = readBooleanParam(request, 'isUsageTracked')

    if (Number.isNaN(limit)) {
      return invalidQueryParamResponse('limit')
    }

    if (Number.isNaN(offset)) {
      return invalidQueryParamResponse('offset')
    }

    if (hasIsSampleSetAvailable && typeof isSampleSetAvailable !== 'boolean') {
      return invalidQueryParamResponse('isSampleSetAvailable')
    }

    if (hasIsUsageTracked && typeof isUsageTracked !== 'boolean') {
      return invalidQueryParamResponse('isUsageTracked')
    }

    const result = await listPokemonCompetitiveOverviewView({
      formatKey: readStringParam(request, 'formatKey'),
      showdownPokemonId: readStringParam(request, 'showdownPokemonId'),
      pokemonSlug: readStringParam(request, 'pokemonSlug'),
      tierKey: readStringParam(request, 'tierKey'),
      latestUsageMonth: readStringParam(request, 'latestUsageMonth'),
      isSampleSetAvailable,
      isUsageTracked,
      limit,
      offset,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to load pokemon competitive overview view', error)

    return NextResponse.json(
      {
        error: 'No se pudo consultar la vista pokemon_competitive_overview_view desde la base de datos.',
      },
      {
        status: 500,
      }
    )
  }
}
