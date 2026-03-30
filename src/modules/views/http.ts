import { NextRequest, NextResponse } from 'next/server'

export function readStringParam(request: NextRequest, key: string): string | undefined {
  const value = request.nextUrl.searchParams.get(key)?.trim()
  return value ? value : undefined
}

export function readIntegerParam(request: NextRequest, key: string): number | undefined {
  const rawValue = request.nextUrl.searchParams.get(key)

  if (rawValue === null || rawValue.trim() === '') {
    return undefined
  }

  const parsed = Number(rawValue)
  return Number.isInteger(parsed) ? parsed : Number.NaN
}

export function readBooleanParam(request: NextRequest, key: string): boolean | undefined {
  const rawValue = request.nextUrl.searchParams.get(key)

  if (rawValue === null || rawValue.trim() === '') {
    return undefined
  }

  const normalized = rawValue.trim().toLowerCase()

  if (normalized === 'true' || normalized === '1') {
    return true
  }

  if (normalized === 'false' || normalized === '0') {
    return false
  }

  return undefined
}

export function invalidQueryParamResponse(name: string) {
  return NextResponse.json(
    {
      error: `El parametro de consulta "${name}" no es valido.`,
    },
    {
      status: 400,
    }
  )
}
