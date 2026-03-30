import vm from 'node:vm'

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

function parseDirectoryListing(html: string): string[] {
  return [...html.matchAll(/href="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((value) => value && value !== '../')
}

export class ShowdownClient {
  readonly dataBaseUrl: string
  readonly statsBaseUrl: string

  constructor(dataBaseUrl: string, statsBaseUrl: string) {
    this.dataBaseUrl = ensureTrailingSlash(dataBaseUrl)
    this.statsBaseUrl = ensureTrailingSlash(statsBaseUrl)
  }

  async fetchText(url: string): Promise<string> {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Showdown request failed (${response.status}) for ${url}`)
    }

    return response.text()
  }

  async fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Showdown request failed (${response.status}) for ${url}`)
    }

    return response.json() as Promise<T>
  }

  getDataUrl(path: string): string {
    return new URL(path.replace(/^\//, ''), this.dataBaseUrl).toString()
  }

  getStatsUrl(path: string): string {
    return new URL(path.replace(/^\//, ''), this.statsBaseUrl).toString()
  }

  async fetchDataJson<T>(path: string): Promise<T> {
    return this.fetchJson<T>(this.getDataUrl(path))
  }

  async fetchDataText(path: string): Promise<string> {
    return this.fetchText(this.getDataUrl(path))
  }

  async fetchExportedData<T>(path: string, exportKey: string): Promise<T> {
    const text = await this.fetchDataText(path)
    const sandbox: { exports: Record<string, unknown> } = {
      exports: {},
    }

    vm.runInNewContext(text, sandbox)
    return sandbox.exports[exportKey] as T
  }

  async listDataDirectory(path: string): Promise<string[]> {
    const html = await this.fetchDataText(path)
    return parseDirectoryListing(html)
  }

  async listStatsDirectory(path: string): Promise<string[]> {
    const html = await this.fetchText(this.getStatsUrl(path))
    return parseDirectoryListing(html)
  }

  async getLatestStatsMonth(): Promise<string | null> {
    const entries = await this.listStatsDirectory('')
    const months = entries
      .map((entry) => entry.replace(/\/$/, ''))
      .filter((entry) => /^\d{4}-\d{2}$/.test(entry))
      .sort()

    return months.length ? months[months.length - 1] : null
  }
}
