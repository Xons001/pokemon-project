'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

import { FALLBACK_POKEMON_IMAGE } from '../../lib/pokemon'

export default function PokemonImage({ src, alt, width, height, loading = 'lazy', className }) {
  const [currentSrc, setCurrentSrc] = useState(src || FALLBACK_POKEMON_IMAGE)

  useEffect(() => {
    setCurrentSrc(src || FALLBACK_POKEMON_IMAGE)
  }, [src])

  return (
    <Image
      src={currentSrc || FALLBACK_POKEMON_IMAGE}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      className={className}
      onError={() => {
        if (currentSrc !== FALLBACK_POKEMON_IMAGE) {
          setCurrentSrc(FALLBACK_POKEMON_IMAGE)
        }
      }}
    />
  )
}
