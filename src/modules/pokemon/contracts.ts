export type PokemonCatalogItem = {
  id: number
  slug: string
  label: string
  image: string | null
  thumb: string | null
  primaryType: string | null
  secondaryType: string | null
  primaryAbility: string | null
  hp: number | null
  attack: number | null
  defense: number | null
  specialAttack: number | null
  specialDefense: number | null
  speed: number | null
  height: number | null
  weight: number | null
}

export type PokemonLevelMove = {
  name: string
  level: number
}

export type PokemonHeldItem = {
  name: string
  rarity: number | null
}

export type PokemonAbilityOption = {
  slug: string
  label: string
  isHidden: boolean
  slot: number
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
  abilities: PokemonAbilityOption[]
  levelMoves: PokemonLevelMove[]
  heldItems: PokemonHeldItem[]
}

export type PokemonMoveLearnDto = {
  move: string
  moveSlug: string
  type: string
  typeKey: string
  category: string
  categoryKey: string | null
  power: number | null
  accuracy: number | null
  pp: number | null
  priority: number | null
  learnMethods: string[]
  learnMethodKeys: string[]
  versionGroups: string[]
  versionGroupKeys: string[]
  level: number | null
}
