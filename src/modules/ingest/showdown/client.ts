import vm from 'node:vm'

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

const directoryMonthMap: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
}

export type DirectoryEntry = {
  name: string
  lastModified: Date | null
}

function parseDirectoryListing(html: string): string[] {
  return [...html.matchAll(/href="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((value) => value && value !== '../')
}

function parseDirectoryEntries(html: string): DirectoryEntry[] {
  const modernMatches = [...html.matchAll(/<a class="row" href="\.\/([^"]+)">[\s\S]*?<small class="filemtime">(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})<\/small>/g)]

  if (modernMatches.length) {
    return modernMatches.map((match) => ({
      name: match[1],
      lastModified: new Date(
        Date.UTC(
          Number(match[2]),
          Number(match[3]) - 1,
          Number(match[4]),
          Number(match[5]),
          Number(match[6]),
          Number(match[7])
        )
      ),
    }))
  }

  return [...html.matchAll(/<a href="([^"]+)">[^<]+<\/a>\s+(\d{2})-([A-Za-z]{3})-(\d{4})\s+(\d{2}):(\d{2})/g)]
    .map((match) => {
      const monthIndex = directoryMonthMap[match[3]]

      return {
        name: match[1],
        lastModified:
          typeof monthIndex === 'number'
            ? new Date(Date.UTC(Number(match[4]), monthIndex, Number(match[2]), Number(match[5]), Number(match[6])))
            : null,
      }
    })
    .filter((entry) => entry.name && entry.name !== '../')
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

  async listDataDirectoryEntries(path: string): Promise<DirectoryEntry[]> {
    const html = await this.fetchDataText(path)
    return parseDirectoryEntries(html)
  }

  async listStatsDirectory(path: string): Promise<string[]> {
    const html = await this.fetchText(this.getStatsUrl(path))
    return parseDirectoryListing(html)
  }

  async listStatsDirectoryEntries(path: string): Promise<DirectoryEntry[]> {
    const html = await this.fetchText(this.getStatsUrl(path))
    return parseDirectoryEntries(html)
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
