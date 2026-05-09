import { NextResponse } from 'next/server'

import { listChampionsMetaTeams } from '@/src/modules/team/meta-teams'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const result = await listChampionsMetaTeams({
      pokemon: url.searchParams.get('pokemon'),
      fullPasteOnly: url.searchParams.get('fullPasteOnly') !== 'false',
      limit: Number(url.searchParams.get('limit') ?? 24),
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to fetch Champions meta teams', error)

    return NextResponse.json(
      {
        error: 'No se pudieron cargar los equipos populares del meta.',
      },
      {
        status: 500,
      }
    )
  }
}
