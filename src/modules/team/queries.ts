import type { Prisma } from '@prisma/client'

import { getPrismaClient } from '@/src/lib/prisma'

type JsonObject = Record<string, any>

const EXCLUDED_TYPES = new Set(['unknown', 'shadow', 'stellar'])

export type TypeChartEntryDto = {
  name: string
  doubleDamageFrom: string[]
  halfDamageFrom: string[]
  noDamageFrom: string[]
}

export async function getTypeChart(): Promise<Record<string, TypeChartEntryDto>> {
  const prisma = getPrismaClient()
  const types = await prisma.type.findMany({
    select: {
      name: true,
      rawPayload: true,
    },
    orderBy: {
      id: 'asc',
    },
  })

  return types.reduce<Record<string, TypeChartEntryDto>>((chart, typeEntry) => {
    if (EXCLUDED_TYPES.has(typeEntry.name)) {
      return chart
    }

    const payload = (typeEntry.rawPayload ?? {}) as JsonObject
    const damageRelations = (payload.damage_relations ?? {}) as JsonObject

    chart[typeEntry.name] = {
      name: typeEntry.name,
      doubleDamageFrom: Array.isArray(damageRelations.double_damage_from)
        ? damageRelations.double_damage_from.map((entry: JsonObject) => entry.name).filter(Boolean)
        : [],
      halfDamageFrom: Array.isArray(damageRelations.half_damage_from)
        ? damageRelations.half_damage_from.map((entry: JsonObject) => entry.name).filter(Boolean)
        : [],
      noDamageFrom: Array.isArray(damageRelations.no_damage_from)
        ? damageRelations.no_damage_from.map((entry: JsonObject) => entry.name).filter(Boolean)
        : [],
    }

    return chart
  }, {})
}
