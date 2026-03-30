export type PokemonCatalogItem = {
  id: number
  slug: string
  label: string
  image: string | null
  thumb: string | null
}

export type PokemonLevelMove = {
  name: string
  level: number
}

export type PokemonHeldItem = {
  name: string
  rarity: number | null
}

export type PokemonDetailDto = {
  isPlaceholder: false
  id: string
  slug: string
  name: string
  image: string
  thumb: string
  type: string
  types: string[]
  typeKeys: string[]
  hp: number
  attack: number
  defense: number
  specialAttack: number
  specialDefense: number
  speed: number
  bonus: string
  description: string
  role: string
  palette: string
  height: number | null
  weight: number | null
  levelMoves: PokemonLevelMove[]
  heldItems: PokemonHeldItem[]
}

export type PokemonMoveLearnDto = {
  move: string
  moveSlug: string
  type: string
  typeKey: string
  method: string
  methodKey: string
  versionGroup: string
  versionGroupKey: string
  level: number
}
