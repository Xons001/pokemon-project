import { navItems } from '../../lib/pokemon'

export default function SiteHeader() {
  return (
    <header className="site-header">
      <a className="site-logo" href="/" aria-label="Pokemon Project home">
        <span className="pokeball-mark" aria-hidden="true" />
        <div>
          <span className="site-logo-kicker">Pokemon Universe</span>
          <h1>Pokemon Project</h1>
        </div>
      </a>

      <nav className="site-nav" aria-label="Navegacion principal">
        {navItems.map((item) => (
          <a key={item.label} href={item.href}>
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  )
}
