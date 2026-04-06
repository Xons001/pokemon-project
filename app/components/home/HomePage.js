'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import ConfirmationSection from './ConfirmationSection'
import PokedexHub from './PokedexHub'
import SiteHeader from './SiteHeader'
import { useI18n } from '../i18n/LanguageProvider'
import { usePokemonCatalog } from '../../hooks/usePokemonCatalog'
import { createPlaceholderPokemon, INITIAL_SELECTED_ENTRY } from '../../lib/pokemon'
import pageStyles from '../../page.module.css'

function cleanTranscript(value) {
  return value.replace(/[.,;:!?]+$/g, '').trim()
}

export default function HomePage() {
  const { locale, t } = useI18n()
  const router = useRouter()
  const pokedexRef = useRef(null)
  const searchInputRef = useRef(null)
  const recognitionRef = useRef(null)
  const [isVoiceSearchSupported, setIsVoiceSearchSupported] = useState(false)
  const [isVoiceSearchListening, setIsVoiceSearchListening] = useState(false)
  const [voiceSearchMessage, setVoiceSearchMessage] = useState('')

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
  } = usePokemonCatalog()
  const activePokemon = selectedPokemon ?? createPlaceholderPokemon(INITIAL_SELECTED_ENTRY, locale)

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setIsVoiceSearchSupported(false)
      setVoiceSearchMessage(t('home.voiceSearch.unsupported'))
      return undefined
    }

    const recognition = new SpeechRecognition()
    recognition.lang = window.navigator.language || (locale === 'en' ? 'en-US' : 'es-ES')
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsVoiceSearchSupported(true)
      setIsVoiceSearchListening(true)
      setVoiceSearchMessage(t('home.voiceSearch.listening'))
    }

    recognition.onend = () => {
      setIsVoiceSearchListening(false)
    }

    recognition.onerror = (event) => {
      setIsVoiceSearchListening(false)

      if (event.error === 'no-speech') {
        setVoiceSearchMessage(t('home.voiceSearch.noSpeech'))
        return
      }

      if (event.error === 'audio-capture') {
        setVoiceSearchMessage(t('home.voiceSearch.noMicrophone'))
        return
      }

      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setVoiceSearchMessage(t('home.voiceSearch.permissionDenied'))
        return
      }

      setVoiceSearchMessage(t('home.voiceSearch.failed'))
    }

    recognition.onresult = (event) => {
      const transcript = cleanTranscript(event.results?.[0]?.[0]?.transcript ?? '')

      if (!transcript) {
        setVoiceSearchMessage(t('home.voiceSearch.empty'))
        return
      }

      setVoiceSearchMessage(t('home.voiceSearch.resultPrefix', { transcript }))
      setQuery(transcript)
      searchInputRef.current?.focus()
      pokedexRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    recognitionRef.current = recognition
    setIsVoiceSearchSupported(true)

    return () => {
      recognition.onstart = null
      recognition.onend = null
      recognition.onerror = null
      recognition.onresult = null
      recognition.stop()
      recognitionRef.current = null
    }
  }, [locale, setQuery, t])

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

  function handleVoiceSearch() {
    if (!recognitionRef.current || !isVoiceSearchSupported) {
      setVoiceSearchMessage(t('home.voiceSearch.unavailable'))
      return
    }

    if (isVoiceSearchListening) {
      recognitionRef.current.stop()
      return
    }

    try {
      setVoiceSearchMessage('')
      recognitionRef.current.start()
    } catch (error) {
      setVoiceSearchMessage(t('home.voiceSearch.startFailed'))
    }
  }

  function focusSearch() {
    const searchInput = searchInputRef.current

    if (!searchInput) {
      return
    }

    searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' })

    window.setTimeout(() => {
      searchInput.focus()
      searchInput.select()
    }, 180)
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
          isVoiceSearchListening={isVoiceSearchListening}
          isVoiceSearchSupported={isVoiceSearchSupported}
          loadError={loadError}
          onFocusSearch={focusSearch}
          onNextPage={goToNextPage}
          onPreviousPage={goToPreviousPage}
          onSearch={handleSearch}
          onSelectPokemon={selectPokemon}
          onSuggestionClick={handleSuggestionClick}
          onViewCard={goToTeams}
          onVoiceSearch={handleVoiceSearch}
          pokedexRef={pokedexRef}
          query={query}
          searchInputRef={searchInputRef}
          selectedPokemon={activePokemon}
          setQuery={setQuery}
          totalPages={totalPages}
          voiceSearchMessage={voiceSearchMessage}
        />

        <ConfirmationSection pokemon={activePokemon} onViewCard={goToTeams} onBackToList={scrollToList} />
      </main>
    </>
  )
}
