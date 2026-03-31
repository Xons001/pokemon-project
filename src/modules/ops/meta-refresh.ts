export const META_REFRESH_DAG_FAMILY = 'pokemon_meta_refresh'
export const META_REFRESH_DAG_FILE = 'ops/airflow/dags/pokemon_meta_refresh.py'
export const META_REFRESH_LOCAL_UI_URL = 'http://localhost:8080'
export const OPS_META_REFRESH_TOKEN_HEADER = 'x-ops-token'

function normalizeIdentifierSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function getMetaRefreshEnvironmentName() {
  return (
    process.env.POKEMON_PROJECT_ENV_NAME?.trim() ||
    process.env.VERCEL_TARGET_ENV?.trim() ||
    process.env.VERCEL_ENV?.trim() ||
    'local'
  )
}

export function getMetaRefreshRecommendedDagId() {
  const environment = normalizeIdentifierSegment(getMetaRefreshEnvironmentName())

  if (!environment || environment === 'local') {
    return META_REFRESH_DAG_FAMILY
  }

  return `${META_REFRESH_DAG_FAMILY}__${environment}`
}

export function getMetaRefreshOpsToken() {
  return process.env.OPS_META_REFRESH_TOKEN?.trim() || process.env.OPS_REFRESH_TOKEN?.trim() || ''
}

export function isMetaRefreshRequestAuthorized(request: Request) {
  const expectedToken = getMetaRefreshOpsToken()

  if (!expectedToken) {
    return true
  }

  return request.headers.get(OPS_META_REFRESH_TOKEN_HEADER) === expectedToken
}
