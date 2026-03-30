import { NextResponse } from 'next/server'

import { getTypeChart } from '@/src/modules/team/queries'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const chart = await getTypeChart()
    return NextResponse.json(chart)
  } catch (error) {
    console.error('Failed to load type chart', error)

    return NextResponse.json(
      {
        error: 'No se pudo consultar la tabla de tipos desde la base de datos.',
      },
      {
        status: 500,
      }
    )
  }
}
