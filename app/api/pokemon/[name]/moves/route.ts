import { NextResponse } from 'next/server'

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
