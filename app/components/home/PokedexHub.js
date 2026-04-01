import GalleryToolbar from './GalleryToolbar'
import PokemonDetail from './PokemonDetail'
import PokemonGallery from './PokemonGallery'
import SearchPanel from './SearchPanel'
import styles from './PokedexHub.module.css'

const paletteClassMap = {
  water: styles.pokedexHubWater,
  grass: styles.pokedexHubGrass,
  fire: styles.pokedexHubFire,
  ghost: styles.pokedexHubGhost,
  electric: styles.pokedexHubElectric,
  earth: styles.pokedexHubEarth,
  psychic: styles.pokedexHubPsychic,
  ice: styles.pokedexHubIce,
  dark: styles.pokedexHubDark,
  dragon: styles.pokedexHubDragon,
  steel: styles.pokedexHubSteel,
  neutral: styles.pokedexHubNeutral,
}

export default function PokedexHub({
  currentPage,
  displayedPokemon,
  filteredCount,
  isCatalogLoading,
  isPageLoading,
  isVoiceSearchListening,
  isVoiceSearchSupported,
  loadError,
  onFocusSearch,
  onNextPage,
  onPreviousPage,
  onSearch,
  onSelectPokemon,
  onSuggestionClick,
  onViewCard,
  onVoiceSearch,
  pokedexRef,
  query,
  searchInputRef,
  selectedPokemon,
  setQuery,
  totalPages,
  catalogCount,
  voiceSearchMessage,
}) {
  const sectionClassName = [styles.pokedexHub, paletteClassMap[selectedPokemon.palette] || styles.pokedexHubNeutral]
    .filter(Boolean)
    .join(' ')

  return (
    <section className={sectionClassName} id="inicio">
      <div className={styles.hubHeading}>
        <div>
          <h2>Pokedex interactiva</h2>
        </div>
        <span className={styles.hubBadge}>{catalogCount} Pokemon</span>
      </div>

      <SearchPanel
        query={query}
        setQuery={setQuery}
        isCatalogLoading={isCatalogLoading}
        isPageLoading={isPageLoading}
        isVoiceSearchListening={isVoiceSearchListening}
        isVoiceSearchSupported={isVoiceSearchSupported}
        loadError={loadError}
        onSearch={onSearch}
        onSuggestionClick={onSuggestionClick}
        onVoiceSearch={onVoiceSearch}
        searchInputRef={searchInputRef}
        voiceSearchMessage={voiceSearchMessage}
      />

      <GalleryToolbar
        filteredCount={filteredCount}
        query={query}
        currentPage={currentPage}
        totalPages={totalPages}
        onPreviousPage={onPreviousPage}
        onNextPage={onNextPage}
      />

      <PokemonGallery
        displayedPokemon={displayedPokemon}
        selectedPokemon={selectedPokemon}
        onSelectPokemon={onSelectPokemon}
        pokedexRef={pokedexRef}
      />

      <PokemonDetail pokemon={selectedPokemon} onViewCard={onViewCard} onFocusSearch={onFocusSearch} />
    </section>
  )
}
