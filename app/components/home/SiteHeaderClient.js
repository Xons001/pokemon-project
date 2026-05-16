'use client'

import Link from 'next/link'

import { useI18n } from '../i18n/LanguageProvider'
import LanguageToggle from '../i18n/LanguageToggle'
import ThemeToggle from '../theme/ThemeToggle'
import styles from './SiteHeader.module.css'

const baseNavItems = [
  { key: 'teams', href: '/equipos' },
  { key: 'damageCalculator', href: '/calculadora-dano' },
]

export default function SiteHeaderClient({ showOps = false }) {
  const { t } = useI18n()
  const resolvedNavItems = showOps ? [...baseNavItems, { key: 'ops', href: '/ops/meta-refresh' }] : baseNavItems

  return (
    <header className={styles.siteHeader}>
      <Link className={styles.siteLogo} href="/" prefetch={false} aria-label={t('header.logoAriaLabel')}>
        <span className={styles.pokeballMark} aria-hidden="true" />
        <div>
          <span className={styles.siteLogoKicker}>{t('header.logoKicker')}</span>
          <h1>{'Pok\u00e9mon Project'}</h1>
        </div>
      </Link>

      <nav className={styles.siteNav} aria-label={t('header.navigationAriaLabel')}>
        {resolvedNavItems.map((item) => (
          <Link key={item.key} href={item.href} prefetch={false}>
            {t(`header.nav.${item.key}`)}
          </Link>
        ))}
      </nav>

      <div className={styles.headerActions}>
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </header>
  )
}
