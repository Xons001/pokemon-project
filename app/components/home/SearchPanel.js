import { quickSuggestions } from '../../lib/pokemon'
import MicIcon from '../icons/MicIcon'
import SearchIcon from '../icons/SearchIcon'
import styles from './PokedexHub.module.css'

export default function SearchPanel({
  query,
  setQuery,
  isCatalogLoading,
  isPageLoading,
  isVoiceSearchListening,
  isVoiceSearchSupported,
  loadError,
  onSearch,
  onSuggestionClick,
  onVoiceSearch,
  searchInputRef,
  voiceSearchMessage,
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
          placeholder="Buscar Pokemon por nombre, numero o tipo"
        />

        <div className={styles.searchActions}>
          <button
            type="button"
            onClick={onVoiceSearch}
            aria-label={isVoiceSearchListening ? 'Detener busqueda por voz' : 'Buscar Pokemon por voz'}
            title={isVoiceSearchSupported ? 'Buscar por voz' : 'Busqueda por voz no disponible en este navegador'}
            className={isVoiceSearchListening ? styles.searchActionActive : undefined}
            disabled={!isVoiceSearchSupported}
          >
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
      {voiceSearchMessage ? <p className={styles.helperText}>{voiceSearchMessage}</p> : null}
      {isCatalogLoading ? <p className={styles.helperText}>Cargando catalogo desde la API interna...</p> : null}
      {isPageLoading && !isCatalogLoading ? (
        <p className={styles.helperText}>Cargando stats y tipos desde tu backend...</p>
      ) : null}
    </div>
  )
}
