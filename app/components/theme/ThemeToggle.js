'use client'

import { useI18n } from '../i18n/LanguageProvider'
import { useTheme } from './ThemeProvider'
import styles from './ThemeToggle.module.css'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { t } = useI18n()

  return (
    <div className={styles.themeToggle} role="group" aria-label={t('theme.groupLabel')}>
      <button
        type="button"
        className={[styles.themeButton, theme === 'light' ? styles.themeButtonActive : null].filter(Boolean).join(' ')}
        onClick={() => setTheme('light')}
        aria-pressed={theme === 'light'}
        title={t('theme.lightTitle')}
      >
        <span className={[styles.themeIcon, styles.themeIconSun].join(' ')} aria-hidden="true" />
        <span className={styles.themeLabel}>{t('theme.lightLabel')}</span>
      </button>

      <button
        type="button"
        className={[styles.themeButton, theme === 'dark' ? styles.themeButtonActive : null].filter(Boolean).join(' ')}
        onClick={() => setTheme('dark')}
        aria-pressed={theme === 'dark'}
        title={t('theme.darkTitle')}
      >
        <span className={[styles.themeIcon, styles.themeIconMoon].join(' ')} aria-hidden="true" />
        <span className={styles.themeLabel}>{t('theme.darkLabel')}</span>
      </button>
    </div>
  )
}
