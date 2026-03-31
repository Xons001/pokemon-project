const typeLabels: Record<string, string> = {
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

const typePaletteMap: Record<string, string> = {
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

const damageClassLabels: Record<string, string> = {
  physical: 'Fisico',
  special: 'Especial',
  status: 'Estado',
}

export function formatName(value: string): string {
  return value
    .split('-')
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ')
}

export function translateType(value: string): string {
  return typeLabels[value] ?? formatName(value)
}

export function translateDamageClass(value: string | null | undefined): string {
  if (!value) {
    return 'Sin dato'
  }

  return damageClassLabels[value] ?? formatName(value)
}

export function formatDexNumber(id: number): string {
  return `#${String(id).padStart(4, '0')}`
}

export function getPalette(typeName: string): string {
  return typePaletteMap[typeName] ?? 'neutral'
}

export function buildRole(attack: number, defense: number, speed: number): string {
  if (speed >= attack && speed >= defense) {
    return 'Velocidad punta'
  }

  if (defense >= attack && defense >= speed) {
    return 'Muro defensivo'
  }

  return 'Presion ofensiva'
}

export function buildDescription(
  name: string,
  types: string[],
  role: string,
  attack: number,
  speed: number
): string {
  const typeText = types.length > 1 ? `${types[0]} / ${types[1]}` : types[0] ?? 'Normal'
  return `${name} combina ${typeText} con un perfil de ${role.toLowerCase()} y un pico de ataque ${attack} frente a velocidad ${speed}.`
}
