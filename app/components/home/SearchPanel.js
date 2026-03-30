import { quickSuggestions } from '../../lib/pokemon'
import MicIcon from '../icons/MicIcon'
import SearchIcon from '../icons/SearchIcon'
import styles from './PokedexHub.module.css'

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
    <div className={`${styles.searchPanel} ${styles.hubSearch}`} id="buscar">
      <label className={styles.searchBar} htmlFor="pokemon-search">
        <input
          ref={searchInputRef}
          id="pokemon-search"
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar Pokemon por nombre, numero o tipo ya cargado"
        />

        <div className={styles.searchActions}>
          <button type="button" onClick={onRandomSuggestion} aria-label="Sugerencia aleatoria">
            <MicIcon />
          </button>
          <button type="button" onClick={onSearch} aria-label="Buscar Pokemon">
            <SearchIcon />
          </button>
        </div>
      </label>

      <div className={styles.searchSuggestions} aria-label="Sugerencias">
        {quickSuggestions.map((suggestion) => (
          <button key={suggestion} type="button" onClick={() => onSuggestionClick(suggestion)}>
            {suggestion}
          </button>
        ))}
      </div>

      {loadError ? <p className={styles.helperText}>{loadError}</p> : null}
      {isCatalogLoading ? <p className={styles.helperText}>Cargando catalogo desde la API interna...</p> : null}
      {isPageLoading && !isCatalogLoading ? (
        <p className={styles.helperText}>Cargando stats y tipos desde tu backend...</p>
      ) : null}
    </div>
  )
}
