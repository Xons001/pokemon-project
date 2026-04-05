import {
  TEAM_MOVE_SLOTS,
  TEAM_SIZE,
  TEAM_STAT_KEYS,
  createDefaultEffortValues,
  createDefaultIndividualValues,
  createDefaultTeam,
  createTeamSlot,
  getNatureOption,
  normalizeNatureKey,
  normalizeTeamResourceId,
  sanitizeStoredTeam,
} from './team-builder'
import { formatResourceName } from './pokemon'

const IMPORT_STAT_MAP = {
  hp: 'hp',
  atk: 'attack',
  def: 'defense',
  spa: 'specialAttack',
  spd: 'specialDefense',
  spe: 'speed',
}

const EXPORT_STAT_ORDER = [
  ['hp', 'HP'],
  ['attack', 'Atk'],
  ['defense', 'Def'],
  ['specialAttack', 'SpA'],
  ['specialDefense', 'SpD'],
  ['speed', 'Spe'],
]

function buildResourceLookup(entries, labelKey = 'label') {
  const lookup = new Map()

  ;(entries ?? []).forEach((entry) => {
    if (!entry) {
      return
    }

    const slug = normalizeTeamResourceId(entry.slug ?? entry.name)

    if (!slug) {
      return
    }

    lookup.set(slug, slug)

    const label = normalizeTeamResourceId(entry[labelKey] ?? entry.name)

    if (label) {
      lookup.set(label, slug)
    }
  })

  return lookup
}

function resolveLookupSlug(value, lookup) {
  const normalized = normalizeTeamResourceId(value)

  if (!normalized) {
    return null
  }

  return lookup?.get(normalized) ?? normalized
}

function formatSpreadLine(prefix, values, predicate, defaultValue) {
  const parts = EXPORT_STAT_ORDER.reduce((accumulator, [statKey, label]) => {
    const value = Number(values?.[statKey])

    if (!predicate(value, defaultValue)) {
      return accumulator
    }

    accumulator.push(`${value} ${label}`)
    return accumulator
  }, [])

  return parts.length ? `${prefix}: ${parts.join(' / ')}` : null
}

function parseSpreadLine(line, defaults) {
  const nextValues = { ...defaults }
  const content = line.replace(/^[^:]+:/, '').trim()

  content.split('/').forEach((chunk) => {
    const trimmed = chunk.trim()
    const match = trimmed.match(/^(\d+)\s+(HP|Atk|Def|SpA|SpD|Spe)$/i)

    if (!match) {
      return
    }

    const statKey = IMPORT_STAT_MAP[match[2].toLowerCase()]

    if (!statKey) {
      return
    }

    nextValues[statKey] = Number(match[1])
  })

  return nextValues
}

function extractSpeciesName(rawHeader) {
  const headerWithoutItem = rawHeader.split(' @ ')[0]?.trim() ?? ''
  const withoutGender = headerWithoutItem.replace(/\s+\((M|F)\)$/i, '').trim()
  const nicknameMatch = withoutGender.match(/\(([^()]+)\)\s*$/)

  if (nicknameMatch?.[1]) {
    return nicknameMatch[1].trim()
  }

  return withoutGender
}

function parseHeaderBlock(line, pokemonLookup, itemLookup) {
  const [leftSide, rawItem] = line.split(/\s+@\s+/)
  const pokemonSlug = resolveLookupSlug(extractSpeciesName(leftSide ?? ''), pokemonLookup)
  const itemSlug = resolveLookupSlug(rawItem ?? '', itemLookup)

  return {
    pokemonSlug,
    itemSlug,
  }
}

function parseSlotBlock(block, pokemonLookup, itemLookup) {
  const lines = block
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (!lines.length) {
    return null
  }

  const header = parseHeaderBlock(lines[0], pokemonLookup, itemLookup)

  if (!header.pokemonSlug) {
    return null
  }

  let abilitySlug = null
  let itemSlug = header.itemSlug
  let natureKey = null
  let evs = createDefaultEffortValues()
  let ivs = createDefaultIndividualValues()
  const moveSlugs = []

  lines.slice(1).forEach((line) => {
    if (/^ability:/i.test(line)) {
      abilitySlug = normalizeTeamResourceId(line.replace(/^ability:/i, '').trim())
      return
    }

    if (/^evs:/i.test(line)) {
      evs = parseSpreadLine(line, createDefaultEffortValues())
      return
    }

    if (/^ivs:/i.test(line)) {
      ivs = parseSpreadLine(line, createDefaultIndividualValues())
      return
    }

    if (/ nature$/i.test(line)) {
      natureKey = normalizeNatureKey(line.replace(/ nature$/i, '').trim())
      return
    }

    if (/^item:/i.test(line)) {
      itemSlug = resolveLookupSlug(line.replace(/^item:/i, '').trim(), itemLookup)
      return
    }

    if (/^[-~]/.test(line) && moveSlugs.length < TEAM_MOVE_SLOTS) {
      moveSlugs.push(normalizeTeamResourceId(line.replace(/^[-~]\s*/, '')))
    }
  })

  return createTeamSlot(header.pokemonSlug, {
    abilitySlug,
    itemSlug,
    natureKey,
    moveSlugs,
    evs,
    ivs,
  })
}

function extractTeamHeader(lines) {
  const firstLine = lines[0]?.trim()

  if (!firstLine || !firstLine.startsWith('===')) {
    return {
      formatKey: null,
      name: null,
      contentLines: lines,
    }
  }

  const match = firstLine.match(/^===\s*\[([^\]]+)\]\s*(.*?)\s*===$/)

  if (!match) {
    return {
      formatKey: null,
      name: null,
      contentLines: lines,
    }
  }

  return {
    formatKey: normalizeTeamResourceId(match[1]),
    name: match[2]?.trim() || null,
    contentLines: lines.slice(1),
  }
}

export function importTeamFromShowdownText(text, options = {}) {
  const pokemonLookup = buildResourceLookup(options.catalog, 'label')
  const itemLookup = buildResourceLookup(options.itemCatalog, 'label')
  const normalizedLines = String(text ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/^\uFEFF/, '')
    .split('\n')
  const header = extractTeamHeader(normalizedLines)
  const blocks = header.contentLines.join('\n').split(/\n\s*\n/g)
  const slots = blocks
    .map((block) => parseSlotBlock(block, pokemonLookup, itemLookup))
    .filter(Boolean)
    .slice(0, TEAM_SIZE)
  const baseTeam = createDefaultTeam(header.formatKey ?? options.defaultFormatKey)

  return sanitizeStoredTeam({
    ...baseTeam,
    name: header.name ?? options.teamName ?? 'Equipo importado',
    slots,
    leaderSlot: 0,
  })
}

export function exportTeamToShowdownText(team, teamMembers, options = {}) {
  const itemCatalog = options.itemCatalog ?? []
  const itemLookupBySlug = new Map(
    itemCatalog
      .map((entry) => {
        const slug = normalizeTeamResourceId(entry.slug ?? entry.name)

        if (!slug) {
          return null
        }

        return [slug, entry.label ?? formatResourceName(slug)]
      })
      .filter(Boolean)
  )

  const blocks = team.slots
    .slice(0, TEAM_SIZE)
    .map((slot, index) => {
      if (!slot?.pokemonSlug) {
        return null
      }

      const pokemon = teamMembers[index]
      const pokemonName = pokemon?.name ?? formatResourceName(slot.pokemonSlug)
      const itemLabel = slot.itemSlug ? itemLookupBySlug.get(slot.itemSlug) ?? formatResourceName(slot.itemSlug) : null
      const nature = getNatureOption(slot.natureKey)
      const lines = [itemLabel ? `${pokemonName} @ ${itemLabel}` : pokemonName]
      const evLine = formatSpreadLine('EVs', slot.evs, (value) => Number(value) > 0, 0)
      const ivLine = formatSpreadLine('IVs', slot.ivs, (value, defaultValue) => Number(value) !== defaultValue, 31)

      if (slot.abilitySlug) {
        lines.push(`Ability: ${formatResourceName(slot.abilitySlug)}`)
      }

      if (evLine) {
        lines.push(evLine)
      }

      if (nature) {
        lines.push(`${nature.label} Nature`)
      }

      if (ivLine) {
        lines.push(ivLine)
      }

      slot.moveSlugs
        .filter(Boolean)
        .forEach((moveSlug) => lines.push(`- ${formatResourceName(moveSlug)}`))

      return lines.join('\n')
    })
    .filter(Boolean)

  return blocks.join('\n\n')
}
