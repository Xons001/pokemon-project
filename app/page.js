const navItems = ['Inicio', 'Pokedex', 'Tipos']

export default function Home() {
  return (
    <>
      <header className="site-header">
        <a className="site-logo" href="/" aria-label="Pokemon Project home">
          <span className="pokeball-mark" aria-hidden="true" />
          <div>
            <span className="site-logo-kicker">Punto 0 + 1</span>
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
          <p className="eyebrow">Curso HTML CSS adaptado a Next.js</p>
          <h2>Arrancamos con la base de flexbox y un menu basico responsive.</h2>
          <p className="hero-copy">
            El punto 0 nos sirve para practicar estructura, reset y distribucion
            con flex. El punto 1 lo convertimos en el encabezado inicial de la
            app Pokemon.
          </p>
        </section>

        <section className="theory-section" id="pokedex">
          <div className="section-copy">
            <p className="section-label">Punto 0</p>
            <h3>Teoria: contenedor flex y dos bloques</h3>
            <p>
              Aqui dejamos representada la idea principal del ejercicio de
              teoria: un contenedor flexible con dos elementos dentro.
            </p>
          </div>

          <div className="theory-strip" aria-label="Demostracion de flexbox">
            <article className="theory-card theory-card-red">
              <span>Caja uno</span>
            </article>
            <article className="theory-card theory-card-yellow">
              <span>Caja dos</span>
            </article>
          </div>
        </section>

        <section className="notes-section" id="tipos">
          <div className="section-copy">
            <p className="section-label">Punto 1</p>
            <h3>Menu basico</h3>
            <p>
              El header superior ya aplica el mismo planteamiento del curso:
              logo a la izquierda, navegacion a la derecha y version apilada en
              pantallas pequenas.
            </p>
          </div>

          <div className="notes-card">
            <p>Proximo paso sugerido</p>
            <strong>Seguir con el bloque 2 y separar el menu en componentes.</strong>
          </div>
        </section>
      </main>
    </>
  )
}
