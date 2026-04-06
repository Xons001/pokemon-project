'use client'

import { useI18n } from './LanguageProvider'
import styles from './LanguageToggle.module.css'

export default function LanguageToggle() {
  const { locale, messages, setLocale, t } = useI18n()

  return (
    <div className={styles.languageToggle} role="group" aria-label={t('locale.groupLabel')}>
      <button
        type="button"
        className={[styles.languageButton, locale === 'es' ? styles.languageButtonActive : null].filter(Boolean).join(' ')}
        onClick={() => setLocale('es')}
        aria-pressed={locale === 'es'}
        title={t('locale.spanishTitle')}
      >
        <span className={styles.languageCode}>{t('locale.spanishLabel')}</span>
        <span className={styles.languageLabel}>{messages.languageName}</span>
      </button>

      <button
        type="button"
        className={[styles.languageButton, locale === 'en' ? styles.languageButtonActive : null].filter(Boolean).join(' ')}
        onClick={() => setLocale('en')}
        aria-pressed={locale === 'en'}
        title={t('locale.englishTitle')}
      >
        <span className={styles.languageCode}>{t('locale.englishLabel')}</span>
        <span className={styles.languageLabel}>{messages.englishLanguageName}</span>
      </button>
    </div>
  )
}
