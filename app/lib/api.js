async function requestJson(url) {
  const response = await fetch(url)
  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(payload?.error ?? `Request failed with status ${response.status}`)
  }

  return payload
}

async function sendJson(url, method, body) {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(payload?.error ?? `Request failed with status ${response.status}`)
  }

  return payload
}

export function fetchPokemonCatalog(query = '') {
  const searchParams = new URLSearchParams()

  if (query) {
    searchParams.set('query', query)
  }

  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : ''
  return requestJson(`/api/pokemon${suffix}`)
}

export function fetchPokemonDetail(slug) {
  return requestJson(`/api/pokemon/${encodeURIComponent(slug)}`)
}

export function fetchPokemonMoves(slug) {
  return requestJson(`/api/pokemon/${encodeURIComponent(slug)}/moves`)
}

export function fetchTypeChart() {
  return requestJson('/api/team/type-chart')
}

export function fetchCompetitiveFormats() {
  return requestJson('/api/team/formats')
}

export function validateTeamBuild(payload) {
  return sendJson('/api/team/validate', 'POST', payload)
}

export function fetchTeamSuggestions(payload) {
  return sendJson('/api/team/suggestions', 'POST', payload)
}
