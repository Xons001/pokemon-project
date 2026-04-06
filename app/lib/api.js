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

export function fetchPokemonCatalog(query = '', options = {}) {
  const searchParams = new URLSearchParams()

  if (query) {
    searchParams.set('query', query)
  }

  if (options.scope) {
    searchParams.set('scope', options.scope)
  }

  if (options.formatKey) {
    searchParams.set('formatKey', options.formatKey)
  }

  if (Number.isFinite(Number(options.page))) {
    searchParams.set('page', String(Math.max(1, Math.round(Number(options.page)))))
  }

  if (Number.isFinite(Number(options.pageSize))) {
    searchParams.set('pageSize', String(Math.max(1, Math.round(Number(options.pageSize)))))
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

export function fetchItemCatalog(options = {}) {
  const searchParams = new URLSearchParams()

  if (options.formatKey) {
    searchParams.set('formatKey', options.formatKey)
  }

  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : ''
  return requestJson(`/api/team/items${suffix}`)
}

export function validateTeamBuild(payload) {
  return sendJson('/api/team/validate', 'POST', payload)
}

export function fetchTeamSuggestions(payload) {
  return sendJson('/api/team/suggestions', 'POST', payload)
}

export function calculateDamage(payload) {
  return sendJson('/api/damage/calculate', 'POST', payload)
}
