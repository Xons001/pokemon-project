import { getPrismaClient } from '@/src/lib/prisma'

import { formatName } from '@/src/modules/pokemon/format'

export async function getPokedexById(id: number) {
  const prisma = getPrismaClient()
  const pokedex = await prisma.pokedex.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      name: true,
      isMainSeries: true,
      regionName: true,
      entries: {
        select: {
          entryNumber: true,
          species: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          entryNumber: 'asc',
        },
      },
    },
  })

  if (!pokedex) {
    return null
  }

  return {
    id: pokedex.id,
    name: formatName(pokedex.name),
    slug: pokedex.name,
    isMainSeries: pokedex.isMainSeries,
    regionName: pokedex.regionName,
    entries: pokedex.entries.map((entry) => ({
      entryNumber: entry.entryNumber,
      speciesId: entry.species.id,
      speciesSlug: entry.species.name,
      speciesName: formatName(entry.species.name),
    })),
  }
}
