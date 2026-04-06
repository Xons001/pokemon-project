'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { THEME_STORAGE_KEY } from '../../lib/theme'

const ThemeContext = createContext(null)

function resolveTheme(value) {
  return value === 'dark' ? 'dark' : 'light'
}

function applyTheme(theme) {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
}

export function ThemeProvider({ children, defaultTheme = 'light' }) {
  const [theme, setThemeState] = useState(defaultTheme)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    const nextTheme = resolveTheme(storedTheme || document.documentElement.dataset.theme || defaultTheme)

    setThemeState(nextTheme)
    applyTheme(nextTheme)
  }, [defaultTheme])

  function setTheme(nextTheme) {
    const resolvedTheme = resolveTheme(nextTheme)

    setThemeState(resolvedTheme)
    applyTheme(resolvedTheme)

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, resolvedTheme)
    }
  }

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        isDark: theme === 'dark',
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider')
  }

  return context
}
