import { DEFAULT_LOCALE, getMessages } from './i18n'

export const DESKTOP_PAGE_SIZE = 16
export const INITIAL_SELECTED_SLUG = 'charizard'
export const INITIAL_SELECTED_ENTRY = {
  id: 6,
  slug: INITIAL_SELECTED_SLUG,
  label: 'Charizard',
}
export const FALLBACK_POKEMON_IMAGE = '/placeholder-pokemon.svg'

export function getPokemonNavItems(locale = DEFAULT_LOCALE) {
  const messages = getMessages(locale)

  return [
    { label: messages.pokemon.nav?.home ?? 'Inicio', href: '#inicio' },
    { label: messages.pokemon.nav?.search ?? 'Buscar', href: '#buscar' },
    { label: messages.pokemon.nav?.team ?? 'Equipo', href: '#equipo' },
    { label: messages.pokemon.nav?.detail ?? 'Ficha', href: '#ficha' },
  ]
}

export const navItems = getPokemonNavItems()

export const quickSuggestions = ['Charizard', 'Farigiraf', 'Gardevoir', 'Dragapult']

export function getPokemonCardStats(locale = DEFAULT_LOCALE) {
  const messages = getMessages(locale)

  return [
    { label: messages.pokemon.cardStats?.attack ?? 'Poder', image: '/pokemon-card/fuego.png', key: 'attack' },
    { label: messages.pokemon.cardStats?.defense ?? 'Resistencia', image: '/pokemon-card/castillo.png', key: 'defense' },
    { label: messages.pokemon.cardStats?.bonus ?? 'Bonus', image: '/pokemon-card/cofre.png', key: 'bonus' },
  ]
}

export const pokemonCardStats = getPokemonCardStats()

export const socialLinks = ['FB', 'X', 'IG']

export function getResponsiveGalleryColumns(viewportWidth) {
  if (typeof viewportWidth !== 'number' || Number.isNaN(viewportWidth)) {
    return 8
  }

  if (viewportWidth <= 720) {
    return 2
  }

  if (viewportWidth <= 1100) {
    return 4
  }

  if (viewportWidth <= 1440) {
    return 6
  }

  return 8
}

export function getResponsivePageSize(viewportWidth) {
  return getResponsiveGalleryColumns(viewportWidth) * 2
}

const typePaletteMap = {
  bug: 'grass',
  dark: 'dark',
  dragon: 'dragon',
  electric: 'electric',
  fairy: 'psychic',
  fighting: 'earth',
  fire: 'fire',
  flying: 'dragon',
  ghost: 'ghost',
  grass: 'grass',
  ground: 'earth',
  ice: 'ice',
  normal: 'neutral',
  poison: 'ghost',
  psychic: 'psychic',
  rock: 'earth',
  steel: 'steel',
  stellar: 'neutral',
  water: 'water',
}

export function formatName(value) {
  return value
    .split('-')
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ')
}

export function translateType(value, locale = DEFAULT_LOCALE) {
  const messages = getMessages(locale)
  return messages.types?.[value] ?? formatName(value)
}

export function translateDamageClass(value, locale = DEFAULT_LOCALE) {
  const messages = getMessages(locale)

  if (!value) {
    return messages.damageClasses?.unknown ?? 'Sin dato'
  }

  return messages.damageClasses?.[value] ?? formatName(value)
}

export function formatAbility(value) {
  return value
    .split('-')
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ')
}

export function formatResourceName(value) {
  return value
    .split('-')
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ')
}

export function formatDexNumber(id) {
  return `#${String(id).padStart(4, '0')}`
}

export function getStat(stats, name) {
  return stats.find((item) => item.stat.name === name)?.base_stat ?? 0
}

export function getPalette(typeName) {
  return typePaletteMap[typeName] ?? 'neutral'
}

export function buildRole(attack, defense, speed, locale = DEFAULT_LOCALE) {
  const roleMessages = getMessages(locale).pokemon.roles ?? {}

  if (speed >= attack && speed >= defense) {
    return roleMessages.speed ?? 'Velocidad punta'
  }

  if (defense >= attack && defense >= speed) {
    return roleMessages.defense ?? 'Muro defensivo'
  }

  return roleMessages.offense ?? 'Presión ofensiva'
}

export function buildDescription(name, types, role, attack, speed, locale = DEFAULT_LOCALE) {
  const typeText = types.length > 1 ? `${types[0]} / ${types[1]}` : types[0]
  const template = getMessages(locale).pokemon.description

  return template
    .replace('{name}', name)
    .replace('{typeText}', typeText)
    .replace('{role}', role.toLowerCase())
    .replace('{attack}', String(attack))
    .replace('{speed}', String(speed))
}

export function createCatalogEntry(entry) {
  const urlParts = entry.url.split('/').filter(Boolean)
  const id = Number(urlParts[urlParts.length - 1])

  return {
    id,
    slug: entry.name,
    label: formatName(entry.name),
    url: entry.url,
  }
}

export function createPlaceholderPokemon(entry, locale = DEFAULT_LOCALE) {
  const placeholderMessages = getMessages(locale).pokemon.placeholder ?? {}
  const image = entry.image ?? FALLBACK_POKEMON_IMAGE
  const thumb = entry.thumb ?? image

  return {
    isPlaceholder: true,
    id: formatDexNumber(entry.id),
    slug: entry.slug,
    name: entry.label,
    image,
    thumb,
    type: placeholderMessages.loading ?? 'Cargando',
    types: [],
    typeKeys: [],
    hp: '--',
    attack: '--',
    defense: '--',
    specialAttack: '--',
    specialDefense: '--',
    speed: '--',
    bonus: placeholderMessages.loading ?? 'Cargando',
    description: placeholderMessages.syncingDescription ?? 'Estamos cargando los datos desde la base de datos local.',
    role: getMessages(locale).pokemon.roles?.syncing ?? 'Sincronizando',
    palette: 'neutral',
    height: '--',
    weight: '--',
    levelMoves: [],
    heldItems: [],
  }
}

export function createCatalogPokemon(entry, locale = DEFAULT_LOCALE) {
  const placeholderMessages = getMessages(locale).pokemon.placeholder ?? {}
  const image = entry.image ?? FALLBACK_POKEMON_IMAGE
  const thumb = entry.thumb ?? image
  const typeKeys = [entry.primaryType, entry.secondaryType].filter(Boolean)
  const types = typeKeys.map((typeKey) => translateType(typeKey, locale))
  const hasRoleStats =
    typeof entry.attack === 'number' &&
    typeof entry.defense === 'number' &&
    typeof entry.speed === 'number'
  const role = hasRoleStats
    ? buildRole(entry.attack, entry.defense, entry.speed, locale)
    : getMessages(locale).pokemon.roles?.quickAnalysis ?? 'Análisis rápido'
  const name = entry.label ?? formatName(entry.slug)

  return {
    isPlaceholder: false,
    id: formatDexNumber(entry.id),
    slug: entry.slug,
    name,
    image,
    thumb,
    type: types[0] ?? 'Normal',
    types,
    typeKeys,
    hp: typeof entry.hp === 'number' ? entry.hp : '--',
    attack: typeof entry.attack === 'number' ? entry.attack : '--',
    defense: typeof entry.defense === 'number' ? entry.defense : '--',
    specialAttack: typeof entry.specialAttack === 'number' ? entry.specialAttack : '--',
    specialDefense: typeof entry.specialDefense === 'number' ? entry.specialDefense : '--',
    speed: typeof entry.speed === 'number' ? entry.speed : '--',
    bonus: entry.primaryAbility ? formatAbility(entry.primaryAbility) : placeholderMessages.noData ?? 'Sin dato',
    description: hasRoleStats && types.length
      ? buildDescription(name, types, role, entry.attack, entry.speed, locale)
      : (placeholderMessages.readyForLookup ?? '{name} listo para consulta rápida en la Pokédex.').replace('{name}', name),
    role,
    palette: getPalette(typeKeys[0] ?? 'neutral'),
    height: typeof entry.height === 'number' ? entry.height : '--',
    weight: typeof entry.weight === 'number' ? entry.weight : '--',
    levelMoves: [],
    heldItems: [],
  }
}

function extractLevelMoves(moves) {
  const levelMovesMap = new Map()

  moves.forEach((entry) => {
    const levelDetails = entry.version_group_details.filter(
      (detail) => detail.move_learn_method.name === 'level-up'
    )

    if (!levelDetails.length) {
      return
    }

    const earliestLevel = Math.min(...levelDetails.map((detail) => detail.level_learned_at))
    const previous = levelMovesMap.get(entry.move.name)

    if (!previous || earliestLevel < previous.level) {
      levelMovesMap.set(entry.move.name, {
        name: formatResourceName(entry.move.name),
        level: earliestLevel,
      })
    }
  })

  return Array.from(levelMovesMap.values()).sort((left, right) => {
    if (left.level === right.level) {
      return left.name.localeCompare(right.name)
    }

    return left.level - right.level
  })
}

function extractHeldItems(heldItems) {
  return heldItems
    .map((entry) => {
      const rarityValues = entry.version_details
        .map((detail) => detail.rarity)
        .filter((rarity) => typeof rarity === 'number')

      return {
        name: formatResourceName(entry.item.name),
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

export function createPokemonDetails(data, locale = DEFAULT_LOCALE) {
  const placeholderMessages = getMessages(locale).pokemon.placeholder ?? {}
  const hp = getStat(data.stats, 'hp')
  const attack = getStat(data.stats, 'attack')
  const defense = getStat(data.stats, 'defense')
  const specialAttack = getStat(data.stats, 'special-attack')
  const specialDefense = getStat(data.stats, 'special-defense')
  const speed = getStat(data.stats, 'speed')
  const types = data.types.map((entry) => translateType(entry.type.name, locale))
  const typeKeys = data.types.map((entry) => entry.type.name)
  const primaryType = data.types[0]?.type.name ?? 'normal'
  const role = buildRole(attack, defense, speed, locale)
  const name = formatName(data.name)
  const levelMoves = extractLevelMoves(data.moves)
  const heldItems = extractHeldItems(data.held_items)
  const artwork =
    data.sprites.other?.['official-artwork']?.front_default ??
    data.sprites.other?.home?.front_default ??
    data.sprites.front_default ??
    FALLBACK_POKEMON_IMAGE

  return {
    isPlaceholder: false,
    id: formatDexNumber(data.id),
    slug: data.name,
    name,
    image: artwork,
    thumb: data.sprites.front_default ?? artwork,
    type: types[0] ?? 'Normal',
    types,
    typeKeys,
    hp,
    attack,
    defense,
    specialAttack,
    specialDefense,
    speed,
    bonus: formatAbility(data.abilities.find((entry) => !entry.is_hidden)?.ability?.name ?? placeholderMessages.noData ?? 'Sin dato'),
    description: buildDescription(name, types, role, attack, speed, locale),
    role,
    palette: getPalette(primaryType),
    height: Number((data.height / 10).toFixed(1)),
    weight: Number((data.weight / 10).toFixed(1)),
    levelMoves,
    heldItems,
  }
}

export function localizePokemonDetail(detail, locale = DEFAULT_LOCALE) {
  if (!detail || typeof detail !== 'object') {
    return detail
  }

  const typeKeys = Array.isArray(detail.typeKeys) ? detail.typeKeys : []
  const translatedTypes = typeKeys.map((typeKey) => translateType(typeKey, locale))
  const role =
    typeof detail.attack === 'number' && typeof detail.defense === 'number' && typeof detail.speed === 'number'
      ? buildRole(detail.attack, detail.defense, detail.speed, locale)
      : detail.role

  return {
    ...detail,
    type: translatedTypes[0] ?? detail.type,
    types: translatedTypes.length ? translatedTypes : detail.types,
    role,
    description:
      translatedTypes.length && typeof detail.attack === 'number' && typeof detail.speed === 'number'
        ? buildDescription(detail.name, translatedTypes, role, detail.attack, detail.speed, locale)
        : detail.description,
  }
}

export function localizePokemonMoveLearn(move, locale = DEFAULT_LOCALE) {
  if (!move || typeof move !== 'object') {
    return move
  }

  return {
    ...move,
    type: move.typeKey ? translateType(move.typeKey, locale) : move.type,
    category: translateDamageClass(move.categoryKey, locale),
  }
}
