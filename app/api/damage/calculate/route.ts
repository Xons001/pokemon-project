import { NextResponse } from 'next/server'

import { calculateDamage, type DamageCalculatorRequestDto } from '@/src/modules/damage/calculate'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as DamageCalculatorRequestDto
    const result = await calculateDamage(payload)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to calculate damage', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'No se pudo calcular el dano con los datos enviados.',
      },
      {
        status: 400,
      }
    )
  }
}
