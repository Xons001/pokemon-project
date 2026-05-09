import { formatName } from '@/src/modules/pokemon/format'
import { toShowdownId } from '@/src/modules/showdown/id'

const VGENC_TOP_TEAMS_URL = 'https://vgenc.net/static/top-teams-data.json'

type VgencTeamMember = {
  n?: string
  i?: string
}

type VgencTeam = {
  i?: string
  id?: string
  p?: string
  t?: string
  r?: string
  d?: string
  pp?: string
  ppf?: number
  rc?: string
  src?: string
  m?: VgencTeamMember[]
}

export type MetaTeamListInput = {
  pokemon?: string | null
  fullPasteOnly?: boolean | null
  limit?: number | null
}

function normalizeLimit(value: unknown) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return 24
  }

  return Math.min(Math.max(Math.round(parsed), 1), 100)
}

function mapTeam(team: VgencTeam) {
  const members = (team.m ?? []).map((member) => ({
    pokemonName: formatName(member.n ?? ''),
    showdownPokemonId: toShowdownId(member.n ?? ''),
    itemName: member.i ? formatName(member.i) : null,
    showdownItemId: member.i ? toShowdownId(member.i) : null,
  }))

  return {
    id: team.id ?? team.i ?? '',
    sourceEntryId: team.i ?? null,
    player: team.p ?? 'Unknown',
    tournament: team.t && team.t !== '-' ? team.t : null,
    placement: team.r && team.r !== '-' ? team.r : null,
    date: team.d ?? null,
    pokepasteUrl: team.pp ?? null,
    hasFullPaste: Boolean(team.ppf && team.pp),
    rentalCode: team.rc || null,
    sourceUrl: team.src || null,
    members,
  }
}

function parseTeamDate(value: string | null | undefined) {
  if (!value) {
    return 0
  }

  const parsed = Date.parse(value.replace(/^(\d{1,2}) ([A-Za-z]{3}) (\d{4})$/, '$2 $1, $3'))
  return Number.isFinite(parsed) ? parsed : 0
}

async function fetchTopTeams() {
  const response = await fetch(VGENC_TOP_TEAMS_URL, {
    next: {
      revalidate: 60 * 60,
    },
    signal: AbortSignal.timeout(30_000),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch VGenC top teams: ${response.status}`)
  }

  return (await response.json()) as VgencTeam[]
}

export async function listChampionsMetaTeams(input: MetaTeamListInput = {}) {
  const limit = normalizeLimit(input.limit)
  const pokemonFilter = toShowdownId(input.pokemon ?? '')
  const teams = await fetchTopTeams()
  const filteredTeams = teams
    .filter((team) => (input.fullPasteOnly === false ? true : Boolean(team.ppf && team.pp)))
    .filter((team) => {
      if (!pokemonFilter) {
        return true
      }

      return (team.m ?? []).some((member) => toShowdownId(member.n ?? '') === pokemonFilter)
    })
    .sort((leftTeam, rightTeam) => parseTeamDate(rightTeam.d) - parseTeamDate(leftTeam.d))
    .slice(0, limit)
    .map(mapTeam)
  const latestDate = teams
    .map((team) => ({ label: team.d ?? null, timestamp: parseTeamDate(team.d) }))
    .sort((leftDate, rightDate) => rightDate.timestamp - leftDate.timestamp)[0]?.label

  return {
    source: {
      key: 'vgenc-top-teams',
      url: VGENC_TOP_TEAMS_URL,
      label: 'VGenC Top Teams',
    },
    summary: {
      totalSourceTeams: teams.length,
      returnedTeams: filteredTeams.length,
      fullPasteOnly: input.fullPasteOnly !== false,
      pokemonFilter: pokemonFilter || null,
      latestDate: latestDate ?? null,
    },
    items: filteredTeams,
  }
}

function getRawPokepasteUrl(url: string) {
  return url.endsWith('/raw') ? url : `${url.replace(/\/$/, '')}/raw`
}

export async function getChampionsMetaTeam(id: string) {
  const teams = await fetchTopTeams()
  const sourceTeam = teams.find((team) => team.id === id || team.i === id)

  if (!sourceTeam) {
    return null
  }

  const team = mapTeam(sourceTeam)
  let rawPaste: string | null = null

  if (team.pokepasteUrl) {
    const response = await fetch(getRawPokepasteUrl(team.pokepasteUrl), {
      next: {
        revalidate: 60 * 60,
      },
      signal: AbortSignal.timeout(30_000),
    })

    if (response.ok) {
      rawPaste = await response.text()
    }
  }

  return {
    ...team,
    rawPaste,
  }
}
