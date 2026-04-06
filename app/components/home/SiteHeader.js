import Link from 'next/link'

import { isMetaRefreshUiEnabled } from '@/src/modules/ops/meta-refresh'

import styles from './SiteHeader.module.css'
import ThemeToggle from '../theme/ThemeToggle'

const navItems = [
  { label: 'Pokedex', href: '/pokedex' },
  { label: 'Equipos', href: '/equipos' },
  { label: 'Calculadora', href: '/calculadora-dano' },
]

export default function SiteHeader() {
  const resolvedNavItems = isMetaRefreshUiEnabled()
    ? [...navItems, { label: 'Ops', href: '/ops/meta-refresh' }]
    : navItems

  return (
    <header className={styles.siteHeader}>
      <Link className={styles.siteLogo} href="/" aria-label="Pokemon Project home">
        <span className={styles.pokeballMark} aria-hidden="true" />
        <div>
          <span className={styles.siteLogoKicker}>Pokemon Universe</span>
          <h1>Pokemon Project</h1>
        </div>
      </Link>

      <nav className={styles.siteNav} aria-label="Navegacion principal">
        {resolvedNavItems.map((item) => (
          <Link key={item.label} href={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className={styles.headerActions}>
        <ThemeToggle />
      </div>
    </header>
  )
}
