import Image from 'next/image'

const navItems = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Pokedex', href: '#pokedex' },
  { label: 'Tipos', href: '#tipos' },
  { label: 'Buscar', href: '#buscar' },
]

const stackedPokemon = [
  { name: 'Blastoise', image: '/pokemon/blastoise.png' },
  { name: 'Bulbasaur', image: '/pokemon/bulbasaur.png' },
  { name: 'Charizard', image: '/pokemon/charizard.png' },
  { name: 'Gengar', image: '/pokemon/gengar.png' },
  { name: 'Squirtle', image: '/pokemon/squirtle.png' },
]

const pokemonCardStats = [
  { label: 'Poder', image: '/pokemon-card/fuego.png' },
  { label: 'Resistencia', image: '/pokemon-card/castillo.png' },
  { label: 'Bonus', image: '/pokemon-card/cofre.png' },
]

const socialLinks = ['FB', 'X', 'IG']

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M16 16L21 21" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M7 11a5 5 0 0 0 10 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 16v4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 20h6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export default function Home() {
  return (
    <>
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

      <main className="page-shell">
        <section className="hero" id="inicio">
          <div className="hero-copy-block">
            <p className="eyebrow">Pokedex Frontend</p>
            <h2>Explora criaturas, tipos y estadisticas en una sola vista.</h2>
            <p className="hero-copy">
              Empezamos construyendo la estructura base de la pagina: un header
              responsive y un cuerpo central dividido en dos bloques para el
              contenido principal y la parte visual.
            </p>

            <div className="hero-actions">
              <a className="primary-link" href="#pokedex">
                Ver Pokedex
              </a>
              <a className="secondary-link" href="#tipos">
                Ver Tipos
              </a>
            </div>

            <div className="hero-tags" aria-label="Categorias destacadas">
              <span>Fuego</span>
              <span>Agua</span>
              <span>Planta</span>
            </div>
          </div>

          <div className="hero-visual">
            <article className="featured-card" id="pokedex">
              <div className="featured-card-top">
                <span className="featured-chip">Destacado</span>
                <span className="featured-id">#006</span>
              </div>

              <div className="featured-orb" aria-hidden="true">
                <span className="featured-orb-core" />
              </div>

              <h3>Charizard</h3>
              <p>
                Una primera tarjeta visual para ir montando la zona principal
                del proyecto Pokemon.
              </p>

              <div className="featured-stats">
                <div>
                  <strong>Tipo</strong>
                  <span>Fuego</span>
                </div>
                <div>
                  <strong>Ataque</strong>
                  <span>84</span>
                </div>
                <div>
                  <strong>Velocidad</strong>
                  <span>100</span>
                </div>
              </div>
            </article>

            <article className="info-card" id="tipos">
              <p className="info-card-label">Base Layout</p>
              <strong>Header arriba, contenido en dos cajas.</strong>
              <p>
                A partir de aqui iremos refinando secciones, tarjetas e imagenes
                siguiendo el proyecto paso a paso.
              </p>
            </article>
          </div>
        </section>

        <section className="stacked-gallery-section">
          <div className="stacked-gallery-copy">
            <p className="eyebrow">Equipo destacado</p>
            <h2 className="section-title">Criaturas apiladas con interaccion al pasar el cursor.</h2>
            <p className="section-text">
              Seguimos construyendo la pagina con una franja visual de Pokemon
              superpuestos, inspirada en la idea de imagenes apiladas del curso
              pero integrada en el layout principal.
            </p>
          </div>

          <div className="stacked-gallery" aria-label="Galeria apilada de Pokemon">
            {stackedPokemon.map((pokemon) => (
              <article key={pokemon.name} className="stacked-item">
                <span className="stacked-name">{pokemon.name}</span>
                <Image
                  src={pokemon.image}
                  alt={pokemon.name}
                  width={170}
                  height={170}
                  className="stacked-image"
                />
              </article>
            ))}
          </div>
        </section>

        <section className="search-section" id="buscar">
          <div className="search-section-copy">
            <p className="eyebrow">Busqueda rapida</p>
            <h2 className="section-title">Una barra central para localizar Pokemon, tipos y movimientos.</h2>
            <p className="section-text">
              Este siguiente bloque adapta la barra de busqueda del curso para
              que forme parte de la Pokedex. De momento es una interfaz visual
              lista para evolucionar en proximos pasos.
            </p>
          </div>

          <div className="search-panel">
            <label className="search-bar" htmlFor="pokemon-search">
              <input
                id="pokemon-search"
                type="text"
                placeholder="Buscar Pokemon, tipo o habilidad"
              />

              <div className="search-actions" aria-hidden="true">
                <button type="button">
                  <MicIcon />
                </button>
                <button type="button">
                  <SearchIcon />
                </button>
              </div>
            </label>

            <div className="search-suggestions" aria-label="Sugerencias">
              <span>Pikachu</span>
              <span>Legendarios</span>
              <span>Fuego</span>
              <span>Starter</span>
            </div>
          </div>
        </section>

        <section className="confirmation-section">
          <div className="confirmation-shell">
            <div className="confirmation-content">
              <div className="confirmation-icon" aria-hidden="true">
                <span className="confirmation-icon-ball" />
              </div>

              <div className="confirmation-message">
                <p className="eyebrow">Registro completado</p>
                <h2 className="section-title">Charizard se ha anadido correctamente a tu equipo.</h2>
                <p className="section-text">
                  Este bloque adapta el componente de confirmacion del curso para
                  mostrar una accion completada dentro de la experiencia de la
                  Pokedex.
                </p>
              </div>
            </div>

            <div className="confirmation-actions">
              <button type="button" className="confirmation-primary">
                Ver ficha
              </button>
              <button type="button" className="confirmation-secondary">
                Volver a la lista
              </button>
            </div>
          </div>
        </section>

        <section className="pokemon-card-section">
          <div className="pokemon-card-copy">
            <p className="eyebrow">Carta destacada</p>
            <h2 className="section-title">Una card coleccionable para llevar la Pokedex a algo mas visual.</h2>
            <p className="section-text">
              Este bloque adapta la card de Pokemon del curso y la integra como
              una pieza fuerte de la landing. Ya empezamos a acercarnos mas a la
              estetica final del proyecto.
            </p>
          </div>

          <article className="showcase-card">
            <Image
              src="/pokemon-card/fondoencabezado.svg"
              alt="Fondo decorativo"
              width={640}
              height={220}
              className="showcase-card-header"
            />

            <div className="showcase-card-body">
              <div className="showcase-card-avatar">
                <Image
                  src="/pokemon/charizard.png"
                  alt="Charizard"
                  width={170}
                  height={170}
                  className="showcase-card-avatar-image"
                />
              </div>

              <h3 className="showcase-card-title">
                Charizard <span>#006</span>
              </h3>
              <p className="showcase-card-text">Coleccion especial de tipo fuego</p>
            </div>

            <div className="showcase-card-footer">
              {pokemonCardStats.map((item) => (
                <div key={item.label} className="showcase-card-stat">
                  <h4>{item.label}</h4>
                  <div className="showcase-card-stat-icon">
                    <Image src={item.image} alt={item.label} width={36} height={36} />
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="promo-section">
          <div className="promo-copy">
            <p className="promo-kicker">Landing destacada</p>
            <h2>Tu equipo Pokemon, listo para explorar nuevas regiones.</h2>
            <p>
              Este bloque toma la idea del landing page del curso y la lleva a
              una version Pokemon: mensaje grande, llamada a la accion y una
              imagen protagonista para cerrar la home con mas fuerza visual.
            </p>
            <a href="#buscar" className="promo-button">
              Comenzar exploracion
            </a>
          </div>

          <div className="promo-visual">
            <div className="promo-orbit" aria-hidden="true" />
            <Image
              src="/pokemon/charizard.png"
              alt="Charizard en vuelo"
              width={520}
              height={520}
              className="promo-image"
            />
          </div>

          <footer className="promo-footer">
            <p>Comparte tu Pokedex</p>
            <ul className="promo-socials" aria-label="Redes sociales">
              {socialLinks.map((item) => (
                <li key={item}>
                  <a href="/">{item}</a>
                </li>
              ))}
            </ul>
          </footer>
        </section>
      </main>
    </>
  )
}
