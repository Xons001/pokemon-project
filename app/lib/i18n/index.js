import en from './en'
import es from './es'

export const LOCALE_STORAGE_KEY = 'pokemon-project-locale-v1'
export const DEFAULT_LOCALE = 'es'
export const SUPPORTED_LOCALES = ['es', 'en']

const dictionaries = {
  es,
  en,
}

const normalizedDictionaryCache = new Map()

const mojibakeReplacements = [
  ['Ã¡', '\u00e1'],
  ['Ã©', '\u00e9'],
  ['Ã­', '\u00ed'],
  ['Ã³', '\u00f3'],
  ['Ãº', '\u00fa'],
  ['Ã', '\u00c1'],
  ['Ã‰', '\u00c9'],
  ['Ã', '\u00cd'],
  ['Ã“', '\u00d3'],
  ['Ãš', '\u00da'],
  ['Ã±', '\u00f1'],
  ['Ã‘', '\u00d1'],
  ['Ã¼', '\u00fc'],
  ['Ãœ', '\u00dc'],
  ['Â¡', '\u00a1'],
  ['Â¿', '\u00bf'],
  ['Âº', '\u00ba'],
  ['Âª', '\u00aa'],
  ['â€™', '\u2019'],
  ['â€œ', '\u201c'],
  ['â€\u009d', '\u201d'],
  ['â€“', '\u2013'],
  ['â€”', '\u2014'],
  ['â€¦', '\u2026'],
]

export function repairTextEncoding(value) {
  if (typeof value !== 'string') {
    return value
  }

  return mojibakeReplacements.reduce((text, [broken, fixed]) => text.split(broken).join(fixed), value)
}

function normalizeMessages(value) {
  if (typeof value === 'string') {
    return repairTextEncoding(value)
  }

  if (Array.isArray(value)) {
    return value.map((entry) => normalizeMessages(entry))
  }

  if (!value || typeof value !== 'object') {
    return value
  }

  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, normalizeMessages(entry)]))
}

function getNestedValue(source, key) {
  return key.split('.').reduce((value, segment) => {
    if (value && typeof value === 'object' && segment in value) {
      return value[segment]
    }

    return undefined
  }, source)
}

function replaceMessageTokens(message, values = {}) {
  if (typeof message !== 'string') {
    return message
  }

  return message.replace(/\{(\w+)\}/g, (_, token) => String(values[token] ?? ''))
}

export function resolveLocale(value) {
  return value === 'en' ? 'en' : DEFAULT_LOCALE
}

export function detectLocale(input) {
  const normalized = String(input ?? '').trim().toLowerCase()

  if (normalized.startsWith('en')) {
    return 'en'
  }

  return DEFAULT_LOCALE
}

export function getMessages(locale = DEFAULT_LOCALE) {
  const resolvedLocale = resolveLocale(locale)

  if (!normalizedDictionaryCache.has(resolvedLocale)) {
    normalizedDictionaryCache.set(resolvedLocale, normalizeMessages(dictionaries[resolvedLocale]))
  }

  return normalizedDictionaryCache.get(resolvedLocale)
}

export function translate(locale, key, values) {
  const message = getNestedValue(getMessages(locale), key)

  if (typeof message === 'function') {
    return repairTextEncoding(message(values ?? {}))
  }

  if (typeof message === 'string') {
    return replaceMessageTokens(repairTextEncoding(message), values)
  }

  return message ?? key
}

export function createTranslator(locale = DEFAULT_LOCALE) {
  return (key, values) => translate(locale, key, values)
}
