'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import styles from './TeamSelectPicker.module.css'

export default function TeamSelectPicker({
  ariaLabel,
  clearLabel = 'Vaciar',
  disabled = false,
  emptyMessage = 'No hay opciones disponibles.',
  onChange,
  options,
  placeholderMeta = '',
  placeholderTitle = 'Selecciona una opcion',
  searchPlaceholder = 'Filtra opciones',
  value = '',
}) {
  const pickerRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const selectedOption = useMemo(() => {
    return options.find((option) => option.value === value) ?? null
  }, [options, value])

  const filteredOptions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    if (!normalizedQuery) {
      return options
    }

    return options.filter((option) => {
      const haystack = [option.label, option.meta, ...(option.keywords ?? [])].filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(normalizedQuery)
    })
  }, [options, searchQuery])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handlePointerDown(event) {
      const activePicker = pickerRef.current

      if (activePicker && !activePicker.contains(event.target)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  function togglePicker() {
    setSearchQuery('')
    setIsOpen((previous) => !previous)
  }

  function handleSelection(nextValue) {
    onChange(nextValue)
    setIsOpen(false)
    setSearchQuery('')
  }

  return (
    <div className={styles.picker} ref={pickerRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={togglePicker}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        disabled={disabled}
      >
        <span className={styles.triggerContent}>
          <strong className={styles.triggerTitle}>{selectedOption?.label ?? placeholderTitle}</strong>
          <span className={styles.triggerMeta}>
            {selectedOption?.meta ? (
              <span className={styles.metaChip}>{selectedOption.meta}</span>
            ) : placeholderMeta ? (
              <span className={styles.placeholderText}>{placeholderMeta}</span>
            ) : null}
          </span>
        </span>
        <span className={styles.chevron}>{isOpen ? '^' : 'v'}</span>
      </button>

      {isOpen ? (
        <div className={styles.popover}>
          <div className={styles.toolbar}>
            <input
              className={styles.searchInput}
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={searchPlaceholder}
              autoFocus
            />
            <button
              type="button"
              className={styles.clearButton}
              onClick={() => handleSelection('')}
              disabled={!value}
            >
              {clearLabel}
            </button>
          </div>

          <div className={styles.optionList} role="listbox" aria-label={ariaLabel}>
            {filteredOptions.length ? (
              filteredOptions.map((option) => {
                const isSelected = option.value === value

                return (
                  <button
                    key={option.value}
                    type="button"
                    className={[styles.option, isSelected ? styles.optionSelected : null].filter(Boolean).join(' ')}
                    onClick={() => handleSelection(option.value)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span className={styles.optionTop}>
                      <strong className={styles.optionTitle}>{option.label}</strong>
                      {option.meta ? <span className={styles.metaChip}>{option.meta}</span> : null}
                    </span>
                  </button>
                )
              })
            ) : (
              <p className={styles.emptyState}>{emptyMessage}</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
