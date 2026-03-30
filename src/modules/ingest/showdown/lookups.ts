import type { PrismaClient } from '@prisma/client'

import { toShowdownId } from '@/src/modules/showdown/id'

export type ShowdownEntityMatch = {
  pokemonId: number | null
  speciesId: number | null
  showdownPokemonId: string
}

export type ShowdownLookups = {
  pokemonById: Map<string, ShowdownEntityMatch>
  moveIdsById: Map<string, number>
}

export async function buildShowdownLookups(prisma: PrismaClient): Promise<ShowdownLookups> {
  const [pokemon, species, moves] = await Promise.all([
    prisma.pokemon.findMany({
      select: {
        id: true,
        speciesId: true,
        name: true,
        showdownId: true,
      },
    }),
    prisma.pokemonSpecies.findMany({
      select: {
        id: true,
        name: true,
        showdownId: true,
      },
    }),
    prisma.move.findMany({
      select: {
        id: true,
        name: true,
      },
    }),
  ])

  const pokemonById = new Map<string, ShowdownEntityMatch>()
  const speciesById = new Map<string, number>()
  const moveIdsById = new Map<string, number>()

  species.forEach((entry) => {
    const showdownId = entry.showdownId ?? toShowdownId(entry.name)
    speciesById.set(showdownId, entry.id)
  })

  pokemon.forEach((entry) => {
    const showdownId = entry.showdownId ?? toShowdownId(entry.name)
    pokemonById.set(showdownId, {
      pokemonId: entry.id,
      speciesId: entry.speciesId,
      showdownPokemonId: showdownId,
    })

    if (!speciesById.has(showdownId)) {
      speciesById.set(showdownId, entry.speciesId)
    }
  })

  speciesById.forEach((speciesId, showdownId) => {
    if (!pokemonById.has(showdownId)) {
      pokemonById.set(showdownId, {
        pokemonId: null,
        speciesId,
        showdownPokemonId: showdownId,
      })
    }
  })

  moves.forEach((entry) => {
    moveIdsById.set(toShowdownId(entry.name), entry.id)
  })

  return {
    pokemonById,
    moveIdsById,
  }
}
