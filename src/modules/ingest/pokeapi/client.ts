export type NamedApiResource = {
  name: string
  url: string
}

type NamedApiResourceList = {
  count: number
  next: string | null
  previous: string | null
  results: NamedApiResource[]
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

export function extractNumericIdFromResourceUrl(resourceUrl: string): number {
  const match = resourceUrl.match(/\/(\d+)\/?$/)

  if (!match) {
    throw new Error(`Could not extract numeric id from resource URL: ${resourceUrl}`)
  }

  return Number(match[1])
}

export async function processInBatches<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>
): Promise<void> {
  const safeConcurrency = Math.max(1, concurrency)

  for (let start = 0; start < items.length; start += safeConcurrency) {
    const batch = items.slice(start, start + safeConcurrency)

    await Promise.all(
      batch.map((item, batchIndex) => worker(item, start + batchIndex))
    )
  }
}

export class PokeApiClient {
  readonly baseUrl: string
  readonly concurrency: number

  constructor(baseUrl: string, concurrency = 4) {
    this.baseUrl = ensureTrailingSlash(baseUrl)
    this.concurrency = Math.max(1, concurrency)
  }

  async getJson<T>(path: string): Promise<T> {
    const url = path.startsWith('http') ? path : new URL(path.replace(/^\//, ''), this.baseUrl).toString()
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`PokeAPI request failed (${response.status}) for ${url}`)
    }

    return response.json() as Promise<T>
  }

  async fetchByUrl<T>(url: string): Promise<T> {
    return this.getJson<T>(url)
  }

  async listResources(resource: string, limit?: number): Promise<NamedApiResource[]> {
    if (typeof limit === 'number' && limit > 0) {
      const response = await this.getJson<NamedApiResourceList>(`${resource}?limit=${limit}&offset=0`)
      return response.results
    }

    const countResponse = await this.getJson<NamedApiResourceList>(`${resource}?limit=1&offset=0`)
    const fullResponse = await this.getJson<NamedApiResourceList>(
      `${resource}?limit=${countResponse.count}&offset=0`
    )

    return fullResponse.results
  }
}
