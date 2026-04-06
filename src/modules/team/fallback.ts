import type { CompetitiveFormatOptionDto, TeamItemOptionDto } from './queries'

const FALLBACK_COMPETITIVE_FORMATS: CompetitiveFormatOptionDto[] = [
  {
    key: 'gen9vgc2026regi',
    name: '[Gen 9] VGC 2026 Reg I',
    section: 'S/V Doubles',
    gameType: 'doubles',
  },
  {
    key: 'gen9bssregi',
    name: '[Gen 9] BSS Reg I',
    section: 'S/V Singles',
    gameType: null,
  },
]

export function listFallbackCompetitiveFormats(): CompetitiveFormatOptionDto[] {
  return FALLBACK_COMPETITIVE_FORMATS.map((format) => ({ ...format }))
}

export function resolveFallbackCompetitiveFormat(requestedFormatKey?: string | null): CompetitiveFormatOptionDto {
  const normalizedRequestedKey = requestedFormatKey?.trim().toLowerCase() ?? ''

  return (
    FALLBACK_COMPETITIVE_FORMATS.find((format) => format.key.toLowerCase() === normalizedRequestedKey) ??
    FALLBACK_COMPETITIVE_FORMATS[0]
  )
}

export function listFallbackItemOptions(): TeamItemOptionDto[] {
  return []
}
