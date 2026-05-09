import { NextResponse } from 'next/server'

import { getChampionsMetaTeam } from '@/src/modules/team/meta-teams'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const team = await getChampionsMetaTeam(params.id)

    if (!team) {
      return NextResponse.json(
        {
          error: 'No se encontro el equipo solicitado.',
        },
        {
          status: 404,
        }
      )
    }

    return NextResponse.json(team)
  } catch (error) {
    console.error('Failed to fetch Champions meta team detail', error)

    return NextResponse.json(
      {
        error: 'No se pudo cargar el detalle del equipo.',
      },
      {
        status: 500,
      }
    )
  }
}
