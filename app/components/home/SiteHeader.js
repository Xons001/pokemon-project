import Link from 'next/link'
import styles from './SiteHeader.module.css'

const navItems = [
  { label: 'Pokedex', href: '/pokedex' },
  { label: 'Equipos', href: '/equipos' },
]

export default function SiteHeader() {

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
        {navItems.map((item) => (
          <Link key={item.label} href={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
