'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { createTranslator, DEFAULT_LOCALE, detectLocale, getMessages, LOCALE_STORAGE_KEY, resolveLocale } from '../../lib/i18n'

const LanguageContext = createContext(null)

function applyLocale(locale) {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.lang = locale
  document.documentElement.dataset.locale = locale
}

function readInitialLocale(defaultLocale) {
  if (typeof window !== 'undefined') {
    const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY)

    if (storedLocale) {
      return resolveLocale(storedLocale)
    }
  }

  if (typeof document !== 'undefined') {
    const documentLocale = document.documentElement.dataset.locale || document.documentElement.lang

    if (documentLocale) {
      return resolveLocale(documentLocale)
    }
  }

  return resolveLocale(defaultLocale)
}

export function LanguageProvider({ children, defaultLocale = DEFAULT_LOCALE }) {
  const [locale, setLocaleState] = useState(() => readInitialLocale(defaultLocale))

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    const nextLocale = resolveLocale(storedLocale || detectLocale(window.navigator.language))

    setLocaleState(nextLocale)
    applyLocale(nextLocale)
  }, [defaultLocale])

  function setLocale(nextLocale) {
    const resolvedLocale = resolveLocale(nextLocale)

    setLocaleState(resolvedLocale)
    applyLocale(resolvedLocale)

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, resolvedLocale)
    }
  }

  const value = useMemo(() => {
    return {
      locale,
      setLocale,
      messages: getMessages(locale),
      t: createTranslator(locale),
      isEnglish: locale === 'en',
      isSpanish: locale === 'es',
    }
  }, [locale])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useI18n() {
  const context = useContext(LanguageContext)

  if (!context) {
    throw new Error('useI18n debe usarse dentro de LanguageProvider')
  }

  return context
}
