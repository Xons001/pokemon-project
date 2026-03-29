import GalleryToolbar from './GalleryToolbar'
import PokemonDetail from './PokemonDetail'
import PokemonGallery from './PokemonGallery'
import SearchPanel from './SearchPanel'

export default function PokedexHub({
  currentPage,
  displayedPokemon,
  filteredCount,
  isCatalogLoading,
  isPageLoading,
  loadError,
  onFocusSearch,
  onNextPage,
  onPreviousPage,
  onRandomSuggestion,
  onSearch,
  onSelectPokemon,
  onSuggestionClick,
  onViewCard,
  pokedexRef,
  query,
  searchInputRef,
  selectedPokemon,
  setQuery,
  totalPages,
  catalogCount,
}) {
  return (
    <section className={`pokedex-hub pokedex-hub-${selectedPokemon.palette}`} id="inicio">
      <div className="hub-heading">
        <div>
          <h2>Pokedex interactiva</h2>
        </div>
        <span className="hub-badge">{catalogCount} Pokemon</span>
      </div>

      <SearchPanel
        query={query}
        setQuery={setQuery}
        isCatalogLoading={isCatalogLoading}
        isPageLoading={isPageLoading}
        loadError={loadError}
        onRandomSuggestion={onRandomSuggestion}
        onSearch={onSearch}
        onSuggestionClick={onSuggestionClick}
        searchInputRef={searchInputRef}
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
