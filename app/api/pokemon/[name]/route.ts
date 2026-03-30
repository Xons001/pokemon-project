import { NextResponse } from 'next/server'

import { getPokemonDetailByName } from '@/src/modules/pokemon/queries'

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
    const pokemon = await getPokemonDetailByName(context.params.name)

    if (!pokemon) {
      return NextResponse.json(
        {
          error: 'Pokemon no encontrado en la base de datos.',
        },
        {
          status: 404,
        }
      )
    }

    return NextResponse.json(pokemon)
  } catch (error) {
    console.error('Failed to load pokemon detail', error)

    return NextResponse.json(
      {
        error: 'No se pudo consultar la ficha del Pokemon desde la base de datos.',
      },
      {
        status: 500,
      }
    )
  }
}
