import type { PokemonAbilityOption, PokemonCatalogItem, PokemonDetailDto, PokemonHeldItem, PokemonMoveLearnDto, PokemonLevelMove } from './contracts'
import type { TypeChartEntryDto } from '@/src/modules/team/queries'
import { buildDescription, buildRole, formatDexNumber, formatName, getPalette, translateDamageClass, translateType } from './format'

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2'
const POKEAPI_INDEX_LIMIT = 1500
const POKEAPI_TIMEOUT_MS = 12000
const POKEAPI_BATTLE_TYPE_KEYS = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
] as const

const TYPE_QUERY_ALIASES: Record<string, string> = {
  acero: 'steel',
  agua: 'water',
  bicho: 'bug',
  dark: 'dark',
  dragon: 'dragon',
  electrico: 'electric',
  electric: 'electric',
  fairy: 'fairy',
  fantasma: 'ghost',
  fighting: 'fighting',
  fire: 'fire',
  flying: 'flying',
  fuego: 'fire',
  ghost: 'ghost',
  grass: 'grass',
  ground: 'ground',
  hada: 'fairy',
  hielo: 'ice',
  ice: 'ice',
  lucha: 'fighting',
  normal: 'normal',
  planta: 'grass',
  poison: 'poison',
  psiquico: 'psychic',
  psychic: 'psychic',
  roca: 'rock',
  rock: 'rock',
  shadow: 'shadow',
  siniestro: 'dark',
  steel: 'steel',
  tierra: 'ground',
  veneno: 'poison',
  volador: 'flying',
  water: 'water',
}

type PokeApiNamedResource = {
  name: string
  url: string
}

type PokeApiPokemonListResponse = {
  count: number
  results: PokeApiNamedResource[]
}

type PokeApiPokemonTypeResponse = {
  pokemon: Array<{
    pokemon: PokeApiNamedResource
  }>
}

type PokeApiPokemonResponse = {
  id: number
  name: string
  height: number
  weight: number
  stats: Array<{
    base_stat: number
    stat: PokeApiNamedResource
  }>
  types: Array<{
    slot: number
    type: PokeApiNamedResource
  }>
  abilities: Array<{
    slot: number
    is_hidden: boolean
    ability: PokeApiNamedResource
  }>
  moves: Array<{
    move: PokeApiNamedResource
    version_group_details: Array<{
      level_learned_at: number
      move_learn_method: PokeApiNamedResource
      version_group: PokeApiNamedResource
    }>
  }>
  held_items: Array<{
    item: PokeApiNamedResource
    version_details: Array<{
      rarity: number | null
    }>
  }>
  sprites: {
    front_default: string | null
    other?: {
      ['official-artwork']?: {
        front_default: string | null
      }
      home?: {
        front_default: string | null
      }
    }
  }
}

type PokeApiTypeResponse = {
  name: string
  damage_relations: {
    double_damage_from: PokeApiNamedResource[]
    half_damage_from: PokeApiNamedResource[]
    no_damage_from: PokeApiNamedResource[]
  }
}

type FallbackPokemonCatalogResult = {
  total: number
  catalogTotal: number
  items: PokemonCatalogItem[]
}

let pokemonIndexPromise: Promise<PokeApiNamedResource[]> | null = null
let typeChartPromise: Promise<Record<string, TypeChartEntryDto>> | null = null
const typeCatalogPromiseCache = new Map<string, Promise<PokeApiNamedResource[]>>()

function createAbortSignal() {
  return typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
    ? AbortSignal.timeout(POKEAPI_TIMEOUT_MS)
    : undefined
}

function normalizeQuery(value?: string | null) {
  return (value ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function normalizePage(value?: number | null) {
  if (!Number.isFinite(Number(value))) {
    return 1
  }

  return Math.max(1, Math.round(Number(value)))
}

function normalizePageSize(value?: number | null) {
  if (value === null || value === undefined) {
    return null
  }

  if (!Number.isFinite(Number(value))) {
    return null
  }

  return Math.min(Math.max(Math.round(Number(value)), 1), 96)
}

function getPokemonIdFromUrl(url: string) {
  const urlParts = url.split('/').filter(Boolean)
  return Number(urlParts[urlParts.length - 1] ?? 0)
}

function getFallbackArtwork(id: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
}

function getFallbackSprite(id: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
}

async function fetchPokeApiJson<T>(path: string): Promise<T> {
  const response = await fetch(`${POKEAPI_BASE_URL}/${path}`, {
    headers: {
      Accept: 'application/json',
    },
    signal: createAbortSignal(),
  })

  if (!response.ok) {
    throw new Error(`PokeAPI request failed with status ${response.status} for ${path}`)
  }

  return response.json() as Promise<T>
}

async function getPokemonIndex() {
  if (!pokemonIndexPromise) {
    pokemonIndexPromise = fetchPokeApiJson<PokeApiPokemonListResponse>(`pokemon?limit=${POKEAPI_INDEX_LIMIT}&offset=0`).then(
      (payload) => payload.results
    )
  }

  return pokemonIndexPromise
}

async function getPokemonTypeEntries(typeKey: string) {
  if (!typeCatalogPromiseCache.has(typeKey)) {
    typeCatalogPromiseCache.set(
      typeKey,
      fetchPokeApiJson<PokeApiPokemonTypeResponse>(`type/${typeKey}`).then((payload) =>
        payload.pokemon.map((entry) => entry.pokemon)
      )
    )
  }

  return typeCatalogPromiseCache.get(typeKey) as Promise<PokeApiNamedResource[]>
}

async function fetchPokeApiPokemon(nameOrId: string) {
  try {
    return await fetchPokeApiJson<PokeApiPokemonResponse>(`pokemon/${encodeURIComponent(nameOrId.trim().toLowerCase())}`)
  } catch (error) {
    if (error instanceof Error && error.message.includes('status 404')) {
      return null
    }

    throw error
  }
}

function getStatValue(
  stats: Array<{
    base_stat: number
    stat: PokeApiNamedResource
  }>,
  statName: string
) {
  return stats.find((entry) => entry.stat.name === statName)?.base_stat ?? 0
}

function getTypeKeys(types: PokeApiPokemonResponse['types']) {
  return [...types]
    .sort((left, right) => left.slot - right.slot)
    .map((entry) => entry.type.name)
}

function getPrimaryAbilityName(abilities: PokeApiPokemonResponse['abilities']) {
  const sortedAbilities = [...abilities].sort((left, right) => left.slot - right.slot)
  return sortedAbilities.find((entry) => !entry.is_hidden)?.ability.name ?? sortedAbilities[0]?.ability.name ?? null
}

function buildCatalogItemFromEntry(entry: PokeApiNamedResource): PokemonCatalogItem {
  const id = getPokemonIdFromUrl(entry.url)

  return {
    id,
    slug: entry.name,
    label: formatName(entry.name),
    image: id ? getFallbackArtwork(id) : null,
    thumb: id ? getFallbackSprite(id) : null,
    primaryType: null,
    secondaryType: null,
    primaryAbility: null,
    hp: null,
    attack: null,
    defense: null,
    specialAttack: null,
    specialDefense: null,
    speed: null,
    height: null,
    weight: null,
  }
}

function buildCatalogItemFromPokemon(pokemon: PokeApiPokemonResponse): PokemonCatalogItem {
  const typeKeys = getTypeKeys(pokemon.types)
  const primaryAbility = getPrimaryAbilityName(pokemon.abilities)

  return {
    id: pokemon.id,
    slug: pokemon.name,
    label: formatName(pokemon.name),
    image:
      pokemon.sprites.other?.['official-artwork']?.front_default ??
      pokemon.sprites.other?.home?.front_default ??
      getFallbackArtwork(pokemon.id),
    thumb: pokemon.sprites.front_default ?? getFallbackSprite(pokemon.id),
    primaryType: typeKeys[0] ?? null,
    secondaryType: typeKeys[1] ?? null,
    primaryAbility,
    hp: getStatValue(pokemon.stats, 'hp'),
    attack: getStatValue(pokemon.stats, 'attack'),
    defense: getStatValue(pokemon.stats, 'defense'),
    specialAttack: getStatValue(pokemon.stats, 'special-attack'),
    specialDefense: getStatValue(pokemon.stats, 'special-defense'),
    speed: getStatValue(pokemon.stats, 'speed'),
    height: typeof pokemon.height === 'number' ? Number((pokemon.height / 10).toFixed(1)) : null,
    weight: typeof pokemon.weight === 'number' ? Number((pokemon.weight / 10).toFixed(1)) : null,
  }
}

function extractLevelMoves(moves: PokeApiPokemonResponse['moves']): PokemonLevelMove[] {
  const levelMoveMap = new Map<string, PokemonLevelMove>()

  moves.forEach((entry) => {
    const levelValues = entry.version_group_details
      .filter((detail) => detail.move_learn_method.name === 'level-up')
      .map((detail) => detail.level_learned_at)
      .filter((level) => typeof level === 'number')

    if (!levelValues.length) {
      return
    }

    const earliestLevel = Math.min(...levelValues)
    const previous = levelMoveMap.get(entry.move.name)

    if (!previous || earliestLevel < previous.level) {
      levelMoveMap.set(entry.move.name, {
        name: formatName(entry.move.name),
        level: earliestLevel,
      })
    }
  })

  return Array.from(levelMoveMap.values()).sort((left, right) => {
    if (left.level === right.level) {
      return left.name.localeCompare(right.name)
    }

    return left.level - right.level
  })
}

function extractHeldItems(heldItems: PokeApiPokemonResponse['held_items']): PokemonHeldItem[] {
  return heldItems
    .map((entry) => {
      const rarityValues = entry.version_details
        .map((detail) => detail.rarity)
        .filter((rarity): rarity is number => typeof rarity === 'number')

      return {
        name: formatName(entry.item.name),
        rarity: rarityValues.length ? Math.max(...rarityValues) : null,
      }
    })
    .sort((left, right) => {
      if ((right.rarity ?? 0) === (left.rarity ?? 0)) {
        return left.name.localeCompare(right.name)
      }

      return (right.rarity ?? 0) - (left.rarity ?? 0)
    })
}

function extractAbilities(abilities: PokeApiPokemonResponse['abilities']): PokemonAbilityOption[] {
  return [...abilities]
    .sort((left, right) => left.slot - right.slot)
    .map((entry) => ({
      slug: entry.ability.name,
      label: formatName(entry.ability.name),
      isHidden: entry.is_hidden,
      slot: entry.slot,
    }))
}

function buildPokemonDetailFromPokeApi(pokemon: PokeApiPokemonResponse): PokemonDetailDto {
  const hp = getStatValue(pokemon.stats, 'hp')
  const attack = getStatValue(pokemon.stats, 'attack')
  const defense = getStatValue(pokemon.stats, 'defense')
  const specialAttack = getStatValue(pokemon.stats, 'special-attack')
  const specialDefense = getStatValue(pokemon.stats, 'special-defense')
  const speed = getStatValue(pokemon.stats, 'speed')
  const typeKeys = getTypeKeys(pokemon.types)
  const translatedTypes = typeKeys.map(translateType)
  const role = buildRole(attack, defense, speed)
  const primaryAbility = getPrimaryAbilityName(pokemon.abilities)
  const artwork =
    pokemon.sprites.other?.['official-artwork']?.front_default ??
    pokemon.sprites.other?.home?.front_default ??
    getFallbackArtwork(pokemon.id)

  return {
    isPlaceholder: false,
    id: formatDexNumber(pokemon.id),
    slug: pokemon.name,
    name: formatName(pokemon.name),
    image: artwork,
    thumb: pokemon.sprites.front_default ?? getFallbackSprite(pokemon.id),
    type: translatedTypes[0] ?? 'Normal',
    types: translatedTypes,
    typeKeys,
    hp,
    attack,
    defense,
    specialAttack,
    specialDefense,
    speed,
    bonus: primaryAbility ? formatName(primaryAbility) : 'Sin dato',
    description: buildDescription(formatName(pokemon.name), translatedTypes, role, attack, speed),
    role,
    palette: getPalette(typeKeys[0] ?? 'normal'),
    height: typeof pokemon.height === 'number' ? Number((pokemon.height / 10).toFixed(1)) : null,
    weight: typeof pokemon.weight === 'number' ? Number((pokemon.weight / 10).toFixed(1)) : null,
    abilities: extractAbilities(pokemon.abilities),
    levelMoves: extractLevelMoves(pokemon.moves),
    heldItems: extractHeldItems(pokemon.held_items),
  }
}

function buildPokemonMoveLearnsFromPokeApi(pokemon: PokeApiPokemonResponse): PokemonMoveLearnDto[] {
  return pokemon.moves
    .map((entry) => {
      const moveLearnMethodKeys = Array.from(
        new Set(
          entry.version_group_details
            .map((detail) => detail.move_learn_method.name)
            .filter((value): value is string => Boolean(value))
        )
      )
      const versionGroupKeys = Array.from(
        new Set(
          entry.version_group_details
            .map((detail) => detail.version_group.name)
            .filter((value): value is string => Boolean(value))
        )
      )
      const learnedLevels = entry.version_group_details
        .filter((detail) => detail.move_learn_method.name === 'level-up')
        .map((detail) => detail.level_learned_at)
        .filter((level) => typeof level === 'number')

      return {
        move: formatName(entry.move.name),
        moveSlug: entry.move.name,
        type: 'Sin dato',
        typeKey: '',
        category: translateDamageClass(null),
        categoryKey: null,
        power: null,
        accuracy: null,
        pp: null,
        priority: null,
        learnMethods: moveLearnMethodKeys.map(formatName),
        learnMethodKeys: moveLearnMethodKeys,
        versionGroups: versionGroupKeys.map(formatName),
        versionGroupKeys,
        level: learnedLevels.length ? Math.min(...learnedLevels) : null,
      }
    })
    .sort((left, right) => {
      const leftLevel = left.level ?? Number.MAX_SAFE_INTEGER
      const rightLevel = right.level ?? Number.MAX_SAFE_INTEGER

      if (leftLevel === rightLevel) {
        return left.move.localeCompare(right.move)
      }

      return leftLevel - rightLevel
    })
}

function buildTypeChartEntryFromPokeApi(typeData: PokeApiTypeResponse): TypeChartEntryDto {
  return {
    name: typeData.name,
    doubleDamageFrom: typeData.damage_relations.double_damage_from.map((entry) => entry.name),
    halfDamageFrom: typeData.damage_relations.half_damage_from.map((entry) => entry.name),
    noDamageFrom: typeData.damage_relations.no_damage_from.map((entry) => entry.name),
  }
}

function resolveTypeQueryKey(query: string) {
  return TYPE_QUERY_ALIASES[normalizeQuery(query)] ?? null
}

function filterIndexEntries(entries: PokeApiNamedResource[], query: string) {
  const normalizedQuery = normalizeQuery(query)

  if (!normalizedQuery) {
    return entries
  }

  const resolvedTypeKey = resolveTypeQueryKey(normalizedQuery)

  if (resolvedTypeKey) {
    return null
  }

  return entries.filter((entry) => {
    const entryId = String(getPokemonIdFromUrl(entry.url))
    return entry.name.includes(normalizedQuery) || entryId.includes(normalizedQuery)
  })
}

async function buildDetailedCatalogPage(entries: PokeApiNamedResource[]) {
  const catalogItems = await Promise.all(
    entries.map(async (entry) => {
      try {
        const pokemon = await fetchPokeApiPokemon(entry.name)
        return pokemon ? buildCatalogItemFromPokemon(pokemon) : buildCatalogItemFromEntry(entry)
      } catch {
        return buildCatalogItemFromEntry(entry)
      }
    })
  )

  return catalogItems
}

export async function listFallbackPokemonCatalog(options: {
  query?: string | null
  page?: number | null
  pageSize?: number | null
}): Promise<FallbackPokemonCatalogResult> {
  const normalizedQuery = normalizeQuery(options.query)
  const normalizedPage = normalizePage(options.page)
  const normalizedPageSize = normalizePageSize(options.pageSize)
  const pokemonIndex = await getPokemonIndex()
  const resolvedTypeKey = resolveTypeQueryKey(normalizedQuery)
  const filteredEntries =
    !normalizedQuery
      ? pokemonIndex
      : resolvedTypeKey
        ? await getPokemonTypeEntries(resolvedTypeKey)
        : filterIndexEntries(pokemonIndex, normalizedQuery)
  const catalogTotal = pokemonIndex.length
  const safeEntries = Array.isArray(filteredEntries) ? [...filteredEntries] : []

  if (!normalizedPageSize) {
    return {
      total: safeEntries.length,
      catalogTotal,
      items: safeEntries.map((entry) => buildCatalogItemFromEntry(entry)),
    }
  }

  const offset = (normalizedPage - 1) * normalizedPageSize
  const pageEntries = safeEntries.slice(offset, offset + normalizedPageSize)

  return {
    total: safeEntries.length,
    catalogTotal,
    items: await buildDetailedCatalogPage(pageEntries),
  }
}

export async function getFallbackPokemonDetail(nameOrId: string) {
  const pokemon = await fetchPokeApiPokemon(nameOrId)
  return pokemon ? buildPokemonDetailFromPokeApi(pokemon) : null
}

export async function getFallbackPokemonMoveLearns(nameOrId: string) {
  const pokemon = await fetchPokeApiPokemon(nameOrId)
  return pokemon ? buildPokemonMoveLearnsFromPokeApi(pokemon) : null
}

export async function getFallbackTypeChart(): Promise<Record<string, TypeChartEntryDto>> {
  if (!typeChartPromise) {
    typeChartPromise = Promise.all(
      POKEAPI_BATTLE_TYPE_KEYS.map(async (typeKey) => {
        const payload = await fetchPokeApiJson<PokeApiTypeResponse>(`type/${typeKey}`)
        return [typeKey, buildTypeChartEntryFromPokeApi(payload)] as const
      })
    ).then((entries) => Object.fromEntries(entries))
  }

  return typeChartPromise
}
