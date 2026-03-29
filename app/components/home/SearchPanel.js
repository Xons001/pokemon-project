import { quickSuggestions } from '../../lib/pokemon'
import MicIcon from '../icons/MicIcon'
import SearchIcon from '../icons/SearchIcon'

export default function SearchPanel({
  query,
  setQuery,
  isCatalogLoading,
  isPageLoading,
  loadError,
  onRandomSuggestion,
  onSearch,
  onSuggestionClick,
  searchInputRef,
}) {
  return (
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
          <button type="button" onClick={onRandomSuggestion} aria-label="Sugerencia aleatoria">
            <MicIcon />
          </button>
          <button type="button" onClick={onSearch} aria-label="Buscar Pokemon">
            <SearchIcon />
          </button>
        </div>
      </label>

      <div className="search-suggestions" aria-label="Sugerencias">
        {quickSuggestions.map((suggestion) => (
          <button key={suggestion} type="button" onClick={() => onSuggestionClick(suggestion)}>
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
  )
}
