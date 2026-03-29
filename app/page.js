'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'

const PAGE_SIZE = 12
const INITIAL_SELECTED_SLUG = 'charizard'

const navItems = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Buscar', href: '#buscar' },
  { label: 'Equipo', href: '#equipo' },
  { label: 'Ficha', href: '#ficha' },
]

const quickSuggestions = ['Charizard', 'Pikachu', 'Gengar', 'Eevee']

const pokemonCardStats = [
  { label: 'Poder', image: '/pokemon-card/fuego.png', key: 'attack' },
  { label: 'Resistencia', image: '/pokemon-card/castillo.png', key: 'defense' },
  { label: 'Bonus', image: '/pokemon-card/cofre.png', key: 'bonus' },
]

const socialLinks = ['FB', 'X', 'IG']

const typeLabels = {
  bug: 'Bicho',
  dark: 'Siniestro',
  dragon: 'Dragon',
  electric: 'Electrico',
  fairy: 'Hada',
  fighting: 'Lucha',
  fire: 'Fuego',
  flying: 'Volador',
  ghost: 'Fantasma',
  grass: 'Planta',
  ground: 'Tierra',
  ice: 'Hielo',
  normal: 'Normal',
  poison: 'Veneno',
  psychic: 'Psiquico',
  rock: 'Roca',
  steel: 'Acero',
  water: 'Agua',
}

const typePaletteMap = {
  bug: 'grass',
  dark: 'dark',
  dragon: 'dragon',
  electric: 'electric',
  fairy: 'psychic',
  fighting: 'earth',
  fire: 'fire',
  flying: 'dragon',
  ghost: 'ghost',
  grass: 'grass',
  ground: 'earth',
  ice: 'ice',
  normal: 'neutral',
  poison: 'ghost',
  psychic: 'psychic',
  rock: 'earth',
  steel: 'steel',
  water: 'water',
}

function formatName(value) {
  return value
    .split('-')
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ')
}

function translateType(value) {
  return typeLabels[value] ?? formatName(value)
}

function formatAbility(value) {
  return value
    .split('-')
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ')
}

function formatDexNumber(id) {
  return `#${String(id).padStart(4, '0')}`
}

function getStat(stats, name) {
  return stats.find((item) => item.stat.name === name)?.base_stat ?? 0
}

function getPalette(typeName) {
  return typePaletteMap[typeName] ?? 'neutral'
}

function buildRole(attack, defense, speed) {
  if (speed >= attack && speed >= defense) {
    return 'Velocidad punta'
  }

  if (defense >= attack && defense >= speed) {
    return 'Muro defensivo'
  }

  return 'Presion ofensiva'
}

function buildDescription(name, types, role, attack, speed) {
  const typeText = types.length > 1 ? `${types[0]} / ${types[1]}` : types[0]
  return `${name} combina ${typeText} con un perfil de ${role.toLowerCase()} y un pico de ataque ${attack} frente a velocidad ${speed}.`
}

function createCatalogEntry(entry) {
  const urlParts = entry.url.split('/').filter(Boolean)
  const id = Number(urlParts[urlParts.length - 1])

  return {
    id,
    slug: entry.name,
    label: formatName(entry.name),
    url: entry.url,
  }
}

function createPlaceholderPokemon(entry) {
  return {
    id: formatDexNumber(entry.id),
    slug: entry.slug,
    name: entry.label,
    image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${entry.id}.png`,
    thumb: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${entry.id}.png`,
    type: 'Cargando',
    types: [],
    hp: '--',
    attack: '--',
    defense: '--',
    specialAttack: '--',
    specialDefense: '--',
    speed: '--',
    bonus: 'Cargando',
    description: 'Estamos trayendo los datos oficiales desde PokeAPI.',
    role: 'Sincronizando',
    palette: 'neutral',
    height: '--',
    weight: '--',
  }
}

function createPokemonDetails(data) {
  const hp = getStat(data.stats, 'hp')
  const attack = getStat(data.stats, 'attack')
  const defense = getStat(data.stats, 'defense')
  const specialAttack = getStat(data.stats, 'special-attack')
  const specialDefense = getStat(data.stats, 'special-defense')
  const speed = getStat(data.stats, 'speed')
  const types = data.types.map((entry) => translateType(entry.type.name))
  const primaryType = data.types[0]?.type.name ?? 'normal'
  const role = buildRole(attack, defense, speed)
  const name = formatName(data.name)
  const artwork =
    data.sprites.other?.['official-artwork']?.front_default ??
    data.sprites.other?.home?.front_default ??
    data.sprites.front_default ??
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${data.id}.png`

  return {
    id: formatDexNumber(data.id),
    slug: data.name,
    name,
    image: artwork,
    thumb: data.sprites.front_default ?? artwork,
    type: types[0] ?? 'Normal',
    types,
    hp,
    attack,
    defense,
    specialAttack,
    specialDefense,
    speed,
    bonus: formatAbility(data.abilities.find((entry) => !entry.is_hidden)?.ability?.name ?? 'Sin dato'),
    description: buildDescription(name, types, role, attack, speed),
    role,
    palette: getPalette(primaryType),
    height: Number((data.height / 10).toFixed(1)),
    weight: Number((data.weight / 10).toFixed(1)),
  }
}

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
  const [query, setQuery] = useState('')
  const [selectedSlug, setSelectedSlug] = useState(INITIAL_SELECTED_SLUG)
  const [currentPage, setCurrentPage] = useState(1)
  const [catalog, setCatalog] = useState([])
  const [pokemonCache, setPokemonCache] = useState({})
  const [isCatalogLoading, setIsCatalogLoading] = useState(true)
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [loadError, setLoadError] = useState('')

  const pokedexRef = useRef(null)
  const cardRef = useRef(null)
  const searchInputRef = useRef(null)
  const loadingSlugsRef = useRef(new Set())

  useEffect(() => {
    let isMounted = true

    async function loadCatalog() {
      try {
        const countResponse = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1&offset=0')
        if (!countResponse.ok) {
          throw new Error('No se pudo cargar el total de Pokemon')
        }

        const countData = await countResponse.json()
        const catalogResponse = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${countData.count}&offset=0`)
        if (!catalogResponse.ok) {
          throw new Error('No se pudo cargar el catalogo')
        }

        const catalogData = await catalogResponse.json()
        if (!isMounted) return

        setCatalog(catalogData.results.map(createCatalogEntry))
        setLoadError('')
      } catch (error) {
        if (!isMounted) return
        setLoadError('No se pudo cargar el catalogo completo desde PokeAPI.')
      } finally {
        if (isMounted) {
          setIsCatalogLoading(false)
        }
      }
    }

    loadCatalog()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredEntries = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return catalog

    return catalog.filter((entry) => {
      const cached = pokemonCache[entry.slug]
      const haystack = [
        entry.label,
        entry.slug,
        formatDexNumber(entry.id),
        cached?.type,
        cached?.bonus,
        ...(cached?.types ?? []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalized)
    })
  }, [catalog, pokemonCache, query])

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const pageStart = (safeCurrentPage - 1) * PAGE_SIZE
  const currentPageEntries = filteredEntries.slice(pageStart, pageStart + PAGE_SIZE)

  useEffect(() => {
    setCurrentPage(1)
  }, [query])

  useEffect(() => {
    if (!filteredEntries.length) return

    const exists = filteredEntries.some((entry) => entry.slug === selectedSlug)
    if (!exists) {
      setSelectedSlug(filteredEntries[0].slug)
    }
  }, [filteredEntries, selectedSlug])

  useEffect(() => {
    if (!catalog.length) return

    let cancelled = false
    const targetSlugs = Array.from(
      new Set([...currentPageEntries.map((entry) => entry.slug), selectedSlug].filter(Boolean))
    )
    const missingSlugs = targetSlugs.filter(
      (slug) => !pokemonCache[slug] && !loadingSlugsRef.current.has(slug)
    )

    if (!missingSlugs.length) {
      setIsPageLoading(false)
      return
    }

    setIsPageLoading(true)
    missingSlugs.forEach((slug) => loadingSlugsRef.current.add(slug))

    async function loadPagePokemon() {
      const results = await Promise.allSettled(
        missingSlugs.map(async (slug) => {
          const entry = catalog.find((item) => item.slug === slug)
          const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${entry?.id ?? slug}`)
          if (!response.ok) {
            throw new Error(`No se pudo cargar ${slug}`)
          }

          const data = await response.json()
          return createPokemonDetails(data)
        })
      )

      if (cancelled) return

      setPokemonCache((previous) => {
        const next = { ...previous }
        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            next[result.value.slug] = result.value
          }
        })
        return next
      })

      const failedCount = results.filter((result) => result.status === 'rejected').length
      if (failedCount && !cancelled) {
        setLoadError(`Algunos Pokemon no se pudieron cargar correctamente desde PokeAPI (${failedCount}).`)
      } else if (!cancelled) {
        setLoadError('')
      }

      missingSlugs.forEach((slug) => loadingSlugsRef.current.delete(slug))
      if (!cancelled) {
        setIsPageLoading(false)
      }
    }

    loadPagePokemon().catch(() => {
      missingSlugs.forEach((slug) => loadingSlugsRef.current.delete(slug))
      if (!cancelled) {
        setIsPageLoading(false)
        setLoadError('No se pudieron cargar los datos de algunos Pokemon desde PokeAPI.')
      }
    })

    return () => {
      cancelled = true
    }
  }, [catalog, currentPageEntries, pokemonCache, selectedSlug])

  const displayedPokemon = currentPageEntries.map((entry) => {
    return pokemonCache[entry.slug] ?? createPlaceholderPokemon(entry)
  })

  const selectedEntry =
    catalog.find((entry) => entry.slug === selectedSlug) ??
    filteredEntries[0] ??
    currentPageEntries[0]

  const selectedPokemon = selectedEntry
    ? pokemonCache[selectedEntry.slug] ?? createPlaceholderPokemon(selectedEntry)
    : null

  function selectPokemon(slug) {
    setSelectedSlug(slug)
  }

  function moveToPage(page) {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages))
    pokedexRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleSearch() {
    if (!filteredEntries.length) return

    const firstMatch = filteredEntries[0]
    setSelectedSlug(firstMatch.slug)
    setCurrentPage(Math.floor(filteredEntries.indexOf(firstMatch) / PAGE_SIZE) + 1)
    pokedexRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleSuggestionClick(value) {
    setQuery(value)
    searchInputRef.current?.focus()
  }

  function handleMicClick() {
    const next = quickSuggestions[Math.floor(Math.random() * quickSuggestions.length)]
    setQuery(next)
    searchInputRef.current?.focus()
  }

  if (!selectedPokemon) {
    return null
  }

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
        <section className={`pokedex-hub pokedex-hub-${selectedPokemon.palette}`} id="inicio">
          <div className="hub-heading">
            <div>
              <h2>Pokedex interactiva</h2>
            </div>
            <span className="hub-badge">{catalog.length || 0} Pokemon</span>
          </div>

          <div className="search-panel hub-search" id="buscar">
            <label className="search-bar" htmlFor="pokemon-search">
              <input
                ref={searchInputRef}
                id="pokemon-search"
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar Pokemon por nombre, numero o tipo ya cargado"
              />

              <div className="search-actions">
                <button type="button" onClick={handleMicClick} aria-label="Sugerencia aleatoria">
                  <MicIcon />
                </button>
                <button type="button" onClick={handleSearch} aria-label="Buscar Pokemon">
                  <SearchIcon />
                </button>
              </div>
            </label>

            <div className="search-suggestions" aria-label="Sugerencias">
              {quickSuggestions.map((suggestion) => (
                <button key={suggestion} type="button" onClick={() => handleSuggestionClick(suggestion)}>
                  {suggestion}
                </button>
              ))}
            </div>

            {loadError ? <p className="helper-text">{loadError}</p> : null}
            {isCatalogLoading ? <p className="helper-text">Cargando catalogo completo de PokeAPI...</p> : null}
            {isPageLoading && !isCatalogLoading ? (
              <p className="helper-text">Cargando stats y tipos desde el endpoint pokemon/{'{id}'}...</p>
            ) : null}
          </div>

          <div className="gallery-toolbar">
            <p className="gallery-count">
              {filteredEntries.length} resultados
              {query ? ` para "${query}"` : ''}
            </p>

            <div className="gallery-pagination">
              <button
                type="button"
                className="page-button"
                disabled={safeCurrentPage === 1}
                onClick={() => moveToPage(safeCurrentPage - 1)}
              >
                Anterior
              </button>
              <span className="page-indicator">
                Pagina {safeCurrentPage} de {totalPages}
              </span>
              <button
                type="button"
                className="page-button"
                disabled={safeCurrentPage === totalPages}
                onClick={() => moveToPage(safeCurrentPage + 1)}
              >
                Siguiente
              </button>
            </div>
          </div>

          <div className="gallery-strip" ref={pokedexRef} id="equipo" aria-label="Seleccion de Pokemon">
            {displayedPokemon.length ? (
              displayedPokemon.map((pokemon) => (
                <button
                  key={pokemon.slug}
                  type="button"
                  className={`gallery-pill ${selectedPokemon.slug === pokemon.slug ? 'gallery-pill-active' : ''}`}
                  onClick={() => selectPokemon(pokemon.slug)}
                >
                  <span className="gallery-pill-thumb">
                    <Image src={pokemon.thumb} alt={pokemon.name} width={88} height={88} loading="lazy" />
                  </span>
                  <span className="gallery-pill-copy">
                    <strong>{pokemon.name}</strong>
                    <small>{pokemon.id}</small>
                  </span>
                </button>
              ))
            ) : (
              <div className="empty-state">
                <strong>No hay resultados</strong>
                <p>Prueba con otro nombre o numero.</p>
              </div>
            )}
          </div>

          <article className="hub-detail">
            <div className={`hub-visual hub-visual-${selectedPokemon.palette}`}>
              <div className="hub-visual-top">
                <span className="featured-chip">Destacado</span>
                <span className="featured-id">{selectedPokemon.id}</span>
              </div>

              <div className="hub-visual-image-wrap">
                <Image
                  src={selectedPokemon.image}
                  alt={selectedPokemon.name}
                  width={360}
                  height={360}
                  className="hub-visual-image"
                  priority
                />
              </div>

              <div className="hub-type-list">
                {selectedPokemon.types.length ? (
                  selectedPokemon.types.map((type) => <span key={type}>{type}</span>)
                ) : (
                  <span>Cargando</span>
                )}
              </div>
            </div>

            <div className="hub-info">
              <p className="eyebrow">Pokemon activo</p>
              <h3>{selectedPokemon.name}</h3>
              <p className="hub-role">{selectedPokemon.role}</p>
              <p className="hub-description">{selectedPokemon.description}</p>

              <div className="hub-meta">
                <div>
                  <span>HP</span>
                  <strong>{selectedPokemon.hp}</strong>
                </div>
                <div>
                  <span>Ataque</span>
                  <strong>{selectedPokemon.attack}</strong>
                </div>
                <div>
                  <span>Velocidad</span>
                  <strong>{selectedPokemon.speed}</strong>
                </div>
                <div>
                  <span>Defensa</span>
                  <strong>{selectedPokemon.defense}</strong>
                </div>
                <div>
                  <span>Bonus</span>
                  <strong>{selectedPokemon.bonus}</strong>
                </div>
              </div>

              <div className="hub-details-grid">
                <div className="detail-box">
                  <span>Altura</span>
                  <strong>{selectedPokemon.height} m</strong>
                </div>
                <div className="detail-box">
                  <span>Peso</span>
                  <strong>{selectedPokemon.weight} kg</strong>
                </div>
                <div className="detail-box">
                  <span>Tipo principal</span>
                  <strong>{selectedPokemon.type}</strong>
                </div>
                <div className="detail-box">
                  <span>Id Pokedex</span>
                  <strong>{selectedPokemon.id}</strong>
                </div>
                <div className="detail-box">
                  <span>Ataque especial</span>
                  <strong>{selectedPokemon.specialAttack}</strong>
                </div>
                <div className="detail-box">
                  <span>Defensa especial</span>
                  <strong>{selectedPokemon.specialDefense}</strong>
                </div>
              </div>

              <div className="hub-actions">
                <button
                  type="button"
                  className="primary-link hub-button"
                  onClick={() => cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                >
                  Ver ficha
                </button>
                <button
                  type="button"
                  className="secondary-link hub-button"
                  onClick={() => searchInputRef.current?.focus()}
                >
                  Buscar otro
                </button>
              </div>
            </div>
          </article>
        </section>

        <section className="confirmation-section">
          <div className="confirmation-shell">
            <div className="confirmation-content">
              <div className="confirmation-icon" aria-hidden="true">
                <span className="confirmation-icon-ball" />
              </div>

              <div className="confirmation-message">
                <p className="eyebrow">Registro completado</p>
                <h2 className="section-title">{selectedPokemon.name} se ha anadido correctamente a tu equipo.</h2>
                <p className="section-text">La ficha, la carta y la landing inferior siguen al Pokemon seleccionado.</p>
              </div>
            </div>

            <div className="confirmation-actions">
              <button
                type="button"
                className="confirmation-primary"
                onClick={() => cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                Ver ficha
              </button>
              <button
                type="button"
                className="confirmation-secondary"
                onClick={() => pokedexRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                Volver a la lista
              </button>
            </div>
          </div>
        </section>

        <section className="pokemon-card-section" ref={cardRef} id="ficha">
          <div className="pokemon-card-copy">
            <p className="eyebrow">Carta destacada</p>
            <h2 className="section-title">{selectedPokemon.name}</h2>
            <p className="section-text">{selectedPokemon.description}</p>
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
                  src={selectedPokemon.image}
                  alt={selectedPokemon.name}
                  width={170}
                  height={170}
                  className="showcase-card-avatar-image"
                />
              </div>

              <h3 className="showcase-card-title">
                {selectedPokemon.name} <span>{selectedPokemon.id}</span>
              </h3>
              <p className="showcase-card-text">{selectedPokemon.type}</p>
            </div>

            <div className="showcase-card-footer">
              {pokemonCardStats.map((item) => (
                <div key={item.label} className="showcase-card-stat">
                  <h4>{item.label}</h4>
                  <div className="showcase-card-stat-icon">
                    <Image src={item.image} alt={item.label} width={36} height={36} />
                  </div>
                  <span className="showcase-card-stat-value">{selectedPokemon[item.key]}</span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className={`promo-section promo-section-${selectedPokemon.palette}`}>
          <div className="promo-copy">
            <p className="promo-kicker">Landing destacada</p>
            <h2>{selectedPokemon.name}, listo para liderar tu equipo.</h2>
            <p>{selectedPokemon.description}</p>
            <a href="#buscar" className="promo-button">
              Comenzar exploracion
            </a>
          </div>

          <div className="promo-visual">
            <div className="promo-orbit" aria-hidden="true" />
            <Image
              src={selectedPokemon.image}
              alt={`${selectedPokemon.name} destacado`}
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
