import { NextResponse } from 'next/server'

import { buildOpenApiSpec } from '@/src/modules/openapi/spec'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const origin = new URL(request.url).origin
  return NextResponse.json(buildOpenApiSpec(origin))
}
