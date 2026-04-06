'use client'

import { useTheme } from './ThemeProvider'
import styles from './ThemeToggle.module.css'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className={styles.themeToggle} role="group" aria-label="Tema global">
      <button
        type="button"
        className={[styles.themeButton, theme === 'light' ? styles.themeButtonActive : null].filter(Boolean).join(' ')}
        onClick={() => setTheme('light')}
        aria-pressed={theme === 'light'}
        title="Modo claro"
      >
        <span className={[styles.themeIcon, styles.themeIconSun].join(' ')} aria-hidden="true" />
        <span className={styles.themeLabel}>Claro</span>
      </button>

      <button
        type="button"
        className={[styles.themeButton, theme === 'dark' ? styles.themeButtonActive : null].filter(Boolean).join(' ')}
        onClick={() => setTheme('dark')}
        aria-pressed={theme === 'dark'}
        title="Modo oscuro"
      >
        <span className={[styles.themeIcon, styles.themeIconMoon].join(' ')} aria-hidden="true" />
        <span className={styles.themeLabel}>Oscuro</span>
      </button>
    </div>
  )
}
