import { NextResponse } from 'next/server'

import { getPokedexById } from '@/src/modules/pokedex/queries'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  context: {
    params: {
      id: string
    }
  }
) {
  try {
    const pokedexId = Number(context.params.id)

    if (!Number.isInteger(pokedexId)) {
      return NextResponse.json(
        {
          error: 'El identificador de pokedex no es valido.',
        },
        {
          status: 400,
        }
      )
    }

    const pokedex = await getPokedexById(pokedexId)

    if (!pokedex) {
      return NextResponse.json(
        {
          error: 'Pokedex no encontrada en la base de datos.',
        },
        {
          status: 404,
        }
      )
    }

    return NextResponse.json(pokedex)
  } catch (error) {
    console.error('Failed to load pokedex', error)

    return NextResponse.json(
      {
        error: 'No se pudo consultar la pokedex desde la base de datos.',
      },
      {
        status: 500,
      }
    )
  }
}
