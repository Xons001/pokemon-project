'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import ConfirmationSection from './ConfirmationSection'
import PokedexHub from './PokedexHub'
import SiteHeader from './SiteHeader'
import { usePokemonCatalog } from '../../hooks/usePokemonCatalog'
import { createPlaceholderPokemon, INITIAL_SELECTED_ENTRY } from '../../lib/pokemon'
import pageStyles from '../../page.module.css'

export default function HomePage() {
  const router = useRouter()
  const pokedexRef = useRef(null)
  const searchInputRef = useRef(null)

  const {
    catalogCount,
    currentPage,
    displayedPokemon,
    filteredCount,
    isCatalogLoading,
    isPageLoading,
    loadError,
    query,
    selectedPokemon,
    totalPages,
    setQuery,
    selectPokemon,
    moveToPage,
    searchFirstMatch,
    applySuggestion,
    pickRandomSuggestion,
  } = usePokemonCatalog()
  const activePokemon = selectedPokemon ?? createPlaceholderPokemon(INITIAL_SELECTED_ENTRY)

  function handleSearch() {
    const found = searchFirstMatch()
    if (found) {
      pokedexRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  function handleSuggestionClick(value) {
    applySuggestion(value)
    searchInputRef.current?.focus()
  }

  function handleRandomSuggestion() {
    pickRandomSuggestion()
    searchInputRef.current?.focus()
  }

  function focusSearch() {
    searchInputRef.current?.focus()
  }

  function goToTeams() {
    router.push('/equipos')
  }

  function scrollToList() {
    pokedexRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function goToPreviousPage() {
    moveToPage(currentPage - 1)
  }

  function goToNextPage() {
    moveToPage(currentPage + 1)
  }

  return (
    <>
      <SiteHeader />

      <main className={pageStyles.pageShell}>
        <PokedexHub
          catalogCount={catalogCount}
          currentPage={currentPage}
          displayedPokemon={displayedPokemon}
          filteredCount={filteredCount}
          isCatalogLoading={isCatalogLoading}
          isPageLoading={isPageLoading}
          loadError={loadError}
          onFocusSearch={focusSearch}
          onNextPage={goToNextPage}
          onPreviousPage={goToPreviousPage}
          onRandomSuggestion={handleRandomSuggestion}
          onSearch={handleSearch}
          onSelectPokemon={selectPokemon}
          onSuggestionClick={handleSuggestionClick}
          onViewCard={goToTeams}
          pokedexRef={pokedexRef}
          query={query}
          searchInputRef={searchInputRef}
          selectedPokemon={activePokemon}
          setQuery={setQuery}
          totalPages={totalPages}
        />

        <ConfirmationSection pokemon={activePokemon} onViewCard={goToTeams} onBackToList={scrollToList} />
      </main>
    </>
  )
}
