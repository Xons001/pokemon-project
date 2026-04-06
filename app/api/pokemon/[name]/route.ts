import { NextResponse } from 'next/server'

import { isDatabaseUnavailableError } from '@/src/lib/database'
import { getFallbackPokemonDetail } from '@/src/modules/pokemon/pokeapi'
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
    if (isDatabaseUnavailableError(error)) {
      try {
        const fallbackPokemon = await getFallbackPokemonDetail(context.params.name)

        if (fallbackPokemon) {
          return NextResponse.json({
            ...fallbackPokemon,
            fallbackSource: 'pokeapi',
          })
        }
      } catch (fallbackError) {
        console.error('Failed to load pokemon detail fallback', fallbackError)
      }
    }

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
