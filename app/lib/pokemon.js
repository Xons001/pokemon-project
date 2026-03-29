export const PAGE_SIZE = 12
export const INITIAL_SELECTED_SLUG = 'charizard'

export const navItems = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Buscar', href: '#buscar' },
  { label: 'Equipo', href: '#equipo' },
  { label: 'Ficha', href: '#ficha' },
]

export const quickSuggestions = ['Charizard', 'Pikachu', 'Gengar', 'Eevee']

export const pokemonCardStats = [
  { label: 'Poder', image: '/pokemon-card/fuego.png', key: 'attack' },
  { label: 'Resistencia', image: '/pokemon-card/castillo.png', key: 'defense' },
  { label: 'Bonus', image: '/pokemon-card/cofre.png', key: 'bonus' },
]

export const socialLinks = ['FB', 'X', 'IG']

const typeLabels = {
  bug: 'Bicho',
  dark: 'Siniestro',
  dragon: 'Dragon',
  electric: 'Electrico',
  fairy: 'Hada',
  fighting: 'Lucha',
  fire: 'Fuego',
  flying: 'Volador',
  ghost: 'Fantasma',
  grass: 'Planta',
  ground: 'Tierra',
  ice: 'Hielo',
  normal: 'Normal',
  poison: 'Veneno',
  psychic: 'Psiquico',
  rock: 'Roca',
  steel: 'Acero',
  water: 'Agua',
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
  water: 'water',
}

export function formatName(value) {
  return value
    .split('-')
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ')
}

export function translateType(value) {
  return typeLabels[value] ?? formatName(value)
}

export function formatAbility(value) {
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

export function buildRole(attack, defense, speed) {
  if (speed >= attack && speed >= defense) {
    return 'Velocidad punta'
  }

  if (defense >= attack && defense >= speed) {
    return 'Muro defensivo'
  }

  return 'Presion ofensiva'
}

export function buildDescription(name, types, role, attack, speed) {
  const typeText = types.length > 1 ? `${types[0]} / ${types[1]}` : types[0]
  return `${name} combina ${typeText} con un perfil de ${role.toLowerCase()} y un pico de ataque ${attack} frente a velocidad ${speed}.`
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

export function createPlaceholderPokemon(entry) {
  return {
    id: formatDexNumber(entry.id),
    slug: entry.slug,
    name: entry.label,
    image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${entry.id}.png`,
    thumb: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${entry.id}.png`,
    type: 'Cargando',
    types: [],
    hp: '--',
    attack: '--',
    defense: '--',
    specialAttack: '--',
    specialDefense: '--',
    speed: '--',
    bonus: 'Cargando',
    description: 'Estamos trayendo los datos oficiales desde PokeAPI.',
    role: 'Sincronizando',
    palette: 'neutral',
    height: '--',
    weight: '--',
  }
}

export function createPokemonDetails(data) {
  const hp = getStat(data.stats, 'hp')
  const attack = getStat(data.stats, 'attack')
  const defense = getStat(data.stats, 'defense')
  const specialAttack = getStat(data.stats, 'special-attack')
  const specialDefense = getStat(data.stats, 'special-defense')
  const speed = getStat(data.stats, 'speed')
  const types = data.types.map((entry) => translateType(entry.type.name))
  const primaryType = data.types[0]?.type.name ?? 'normal'
  const role = buildRole(attack, defense, speed)
  const name = formatName(data.name)
  const artwork =
    data.sprites.other?.['official-artwork']?.front_default ??
    data.sprites.other?.home?.front_default ??
    data.sprites.front_default ??
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${data.id}.png`

  return {
    id: formatDexNumber(data.id),
    slug: data.name,
    name,
    image: artwork,
    thumb: data.sprites.front_default ?? artwork,
    type: types[0] ?? 'Normal',
    types,
    hp,
    attack,
    defense,
    specialAttack,
    specialDefense,
    speed,
    bonus: formatAbility(data.abilities.find((entry) => !entry.is_hidden)?.ability?.name ?? 'Sin dato'),
    description: buildDescription(name, types, role, attack, speed),
    role,
    palette: getPalette(primaryType),
    height: Number((data.height / 10).toFixed(1)),
    weight: Number((data.weight / 10).toFixed(1)),
  }
}
