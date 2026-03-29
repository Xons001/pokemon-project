'use client'

import { useRef } from 'react'
import ConfirmationSection from './components/home/ConfirmationSection'
import PokedexHub from './components/home/PokedexHub'
import PokemonCardSection from './components/home/PokemonCardSection'
import PromoSection from './components/home/PromoSection'
import SiteHeader from './components/home/SiteHeader'
import { usePokemonCatalog } from './hooks/usePokemonCatalog'

export default function Home() {
  const pokedexRef = useRef(null)
  const cardRef = useRef(null)
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

  if (!selectedPokemon) {
    return null
  }

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

  function scrollToCard() {
    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function scrollToList() {
    pokedexRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function goToPreviousPage() {
    moveToPage(currentPage - 1)
    scrollToList()
  }

  function goToNextPage() {
    moveToPage(currentPage + 1)
    scrollToList()
  }

  return (
    <>
      <SiteHeader />

      <main className="page-shell">
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
          onViewCard={scrollToCard}
          pokedexRef={pokedexRef}
          query={query}
          searchInputRef={searchInputRef}
          selectedPokemon={selectedPokemon}
          setQuery={setQuery}
          totalPages={totalPages}
        />

        <ConfirmationSection pokemon={selectedPokemon} onViewCard={scrollToCard} onBackToList={scrollToList} />
        <PokemonCardSection pokemon={selectedPokemon} cardRef={cardRef} />
        <PromoSection pokemon={selectedPokemon} />
      </main>
    </>
  )
}
