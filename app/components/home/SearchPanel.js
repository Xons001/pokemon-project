import { quickSuggestions } from '../../lib/pokemon'
import { useI18n } from '../i18n/LanguageProvider'
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
  const { t } = useI18n()

  return (
    <div className={`${styles.searchPanel} ${styles.hubSearch}`} id="buscar">
      <label className={styles.searchBar} htmlFor="pokemon-search">
        <input
          ref={searchInputRef}
          id="pokemon-search"
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('home.search.placeholder')}
        />

        <div className={styles.searchActions}>
          <button
            type="button"
            onClick={onVoiceSearch}
            aria-label={isVoiceSearchListening ? t('home.search.stopVoiceSearch') : t('home.search.startVoiceSearch')}
            title={isVoiceSearchSupported ? t('home.search.voiceSearchTitle') : t('home.search.voiceSearchUnavailableTitle')}
            className={isVoiceSearchListening ? styles.searchActionActive : undefined}
            disabled={!isVoiceSearchSupported}
          >
            <MicIcon />
          </button>
          <button type="button" onClick={onSearch} aria-label={t('home.search.searchButton')}>
            <SearchIcon />
          </button>
        </div>
      </label>

      <div className={styles.searchSuggestions} aria-label={t('home.search.suggestionsAriaLabel')}>
        {quickSuggestions.map((suggestion) => (
          <button key={suggestion} type="button" onClick={() => onSuggestionClick(suggestion)}>
            {suggestion}
          </button>
        ))}
      </div>

      {loadError ? <p className={styles.helperText}>{loadError}</p> : null}
      {voiceSearchMessage ? <p className={styles.helperText}>{voiceSearchMessage}</p> : null}
      {isCatalogLoading ? <p className={styles.helperText}>{t('home.search.loadingCatalog')}</p> : null}
      {isPageLoading && !isCatalogLoading ? (
        <p className={styles.helperText}>{t('home.search.loadingDetails')}</p>
      ) : null}
    </div>
  )
}
