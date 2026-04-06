const DATABASE_UNAVAILABLE_ERROR_CODES = new Set(['P1001', 'P1002', 'P1017'])

const DATABASE_UNAVAILABLE_PATTERNS = [
  "can't reach database server",
  'cant reach database server',
  'exceeded the data transfer quota',
  'data transfer quota',
  'prismaclientinitializationerror',
  'connection terminated unexpectedly',
  'server closed the connection unexpectedly',
  'timed out fetching a new connection',
]

function normalizeErrorText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function isDatabaseUnavailableError(error: unknown) {
  if (!error) {
    return false
  }

  const code =
    typeof error === 'object' && error !== null && 'code' in error ? String((error as { code?: unknown }).code ?? '') : ''

  if (DATABASE_UNAVAILABLE_ERROR_CODES.has(code.toUpperCase())) {
    return true
  }

  const message =
    error instanceof Error
      ? `${error.name} ${error.message}`
      : typeof error === 'string'
        ? error
        : JSON.stringify(error)

  const normalizedMessage = normalizeErrorText(message)

  return DATABASE_UNAVAILABLE_PATTERNS.some((pattern) => normalizedMessage.includes(pattern))
}
