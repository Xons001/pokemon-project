import { NextResponse } from 'next/server'

import { validateTeamBuild } from '@/src/modules/team/queries'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => null)

    if (!payload || typeof payload !== 'object') {
      return NextResponse.json(
        {
          error: 'El cuerpo de la peticion no es valido.',
        },
        {
          status: 400,
        }
      )
    }

    const result = await validateTeamBuild(payload)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to validate team build', error)

    return NextResponse.json(
      {
        error: 'No se pudo validar el equipo con los datos competitivos locales.',
      },
      {
        status: 500,
      }
    )
  }
}
