import { NextResponse } from 'next/server'

import { isDatabaseUnavailableError } from '@/src/lib/database'
import { getFallbackPokemonMoveLearns } from '@/src/modules/pokemon/pokeapi'
import { getPokemonMoveLearnsByName } from '@/src/modules/pokemon/queries'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  context: {
    params: {
      name: string
    }
  }
) {
  try {
    const moves = await getPokemonMoveLearnsByName(context.params.name)

    if (!moves) {
      return NextResponse.json(
        {
          error: 'Pokemon no encontrado en la base de datos.',
        },
        {
          status: 404,
        }
      )
    }

    return NextResponse.json({
      total: moves.length,
      items: moves,
    })
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      try {
        const fallbackMoves = await getFallbackPokemonMoveLearns(context.params.name)

        if (fallbackMoves) {
          return NextResponse.json({
            total: fallbackMoves.length,
            items: fallbackMoves,
            fallbackSource: 'pokeapi',
          })
        }
      } catch (fallbackError) {
        console.error('Failed to load pokemon moves fallback', fallbackError)
      }
    }

    console.error('Failed to load pokemon moves', error)

    return NextResponse.json(
      {
        error: 'No se pudo consultar el learnset del Pokemon desde la base de datos.',
      },
      {
        status: 500,
      }
    )
  }
}
