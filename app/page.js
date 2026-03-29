const navItems = ['Inicio', 'Pokedex', 'Tipos']

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
            <a key={item} href={`#${item.toLowerCase()}`}>
              {item}
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
      </main>
    </>
  )
}
