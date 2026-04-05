import { toShowdownId } from '@/src/modules/showdown/id'

// Mirrors the formats currently kept in main/production until the project decides the next target metas.
export const ACTIVE_META_FORMAT_KEYS = ['gen9monotype', 'gen9ou', 'gen9uu'] as const

function uniqueMetaFormatKeys(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

export function normalizeMetaFormatKey(value: string) {
  return toShowdownId(value.replace(/^\.\//, '').trim())
}

export function getActiveMetaFormatKeys() {
  return uniqueMetaFormatKeys(ACTIVE_META_FORMAT_KEYS.map((value) => normalizeMetaFormatKey(value)))
}

export function hasActiveMetaFormatLimit() {
  return getActiveMetaFormatKeys().length > 0
}

export function isActiveMetaFormat(formatKey: string) {
  const activeFormatKeys = getActiveMetaFormatKeys()

  if (!activeFormatKeys.length) {
    return true
  }

  return activeFormatKeys.includes(normalizeMetaFormatKey(formatKey))
}

export function filterActiveMetaFormats<T extends string>(formatKeys: T[]) {
  if (!hasActiveMetaFormatLimit()) {
    return [...formatKeys]
  }

  return formatKeys.filter((formatKey) => isActiveMetaFormat(formatKey))
}
