import { navItems } from '../../lib/pokemon'
import styles from './SiteHeader.module.css'

export default function SiteHeader() {
  return (
    <header className={styles.siteHeader}>
      <a className={styles.siteLogo} href="/" aria-label="Pokemon Project home">
        <span className={styles.pokeballMark} aria-hidden="true" />
        <div>
          <span className={styles.siteLogoKicker}>Pokemon Universe</span>
          <h1>Pokemon Project</h1>
        </div>
      </a>

      <nav className={styles.siteNav} aria-label="Navegacion principal">
        {navItems.map((item) => (
          <a key={item.label} href={item.href}>
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  )
}
