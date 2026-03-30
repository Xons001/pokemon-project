import { NextRequest, NextResponse } from 'next/server'

import { listPokemonCatalog } from '@/src/modules/pokemon/queries'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('query')?.trim().toLowerCase() ?? ''
    const items = await listPokemonCatalog()
    const filteredItems = query
      ? items.filter((entry) => {
          const haystack = `${entry.label} ${entry.slug} ${entry.id}`.toLowerCase()
          return haystack.includes(query)
        })
      : items

    return NextResponse.json({
      total: filteredItems.length,
      items: filteredItems,
    })
  } catch (error) {
    console.error('Failed to load pokemon catalog', error)

    return NextResponse.json(
      {
        error: 'No se pudo consultar el catalogo de Pokemon desde la base de datos.',
      },
      {
        status: 500,
      }
    )
  }
}
