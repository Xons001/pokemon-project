'use client'

import { useEffect, useMemo, useState } from 'react'

import { useI18n } from '../components/i18n/LanguageProvider'
import {
  fetchPokemonDetail,
  fetchPokemonMoves,
  fetchTeamBuilderBootstrap,
} from '../lib/api'
import {
  createCatalogPokemon,
  formatResourceName,
  translateType,
} from '../lib/pokemon'
import {
  TEAM_STORAGE_KEY,
  TEAM_STAT_KEYS,
  createDefaultTeam,
  createTeamSlot,
  calculateBattleStat,
  getEffortValueTotal,
  getPokemonDefensiveMultiplier,
  getSingleTypeMultiplier,
  sanitizeStoredTeam,
  toCompetitiveResourceId,
} from '../lib/team-builder'
import { importTeamFromShowdownText } from '../lib/team-io'

export const BATTLE_ANALYSIS_OPPONENT_STORAGE_KEY = 'pokemon-project-battle-opponent-v1'

const UTILITY_MOVE_DEFINITIONS = {
  encore: { key: 'lock', label: 'Otra vez (Encore)', score: 9 },
  trickroom: { key: 'speedControl', label: 'Espacio raro (Trick Room)', score: 10 },
  tailwind: { key: 'speedControl', label: 'Viento afin (Tailwind)', score: 9 },
  icywind: { key: 'speedControl', label: 'Viento hielo (Icy Wind)', score: 5 },
  electroweb: { key: 'speedControl', label: 'Electrotela (Electroweb)', score: 5 },
  thunderwave: { key: 'status', label: 'Onda trueno (Thunder Wave)', score: 6 },
  willowisp: { key: 'status', label: 'Fuego fatuo (Will-O-Wisp)', score: 6 },
  toxic: { key: 'status', label: 'Toxico (Toxic)', score: 5 },
  spore: { key: 'status', label: 'Espora (Spore)', score: 8 },
  yawn: { key: 'status', label: 'Bostezo (Yawn)', score: 6 },
  leechseed: { key: 'chip', label: 'Drenadoras (Leech Seed)', score: 5 },
  stealthrock: { key: 'hazard', label: 'Trampa rocas (Stealth Rock)', score: 7 },
  spikes: { key: 'hazard', label: 'Puas (Spikes)', score: 6 },
  toxicspikes: { key: 'hazard', label: 'Puas toxicas (Toxic Spikes)', score: 6 },
  stickyweb: { key: 'hazard', label: 'Red viscosa (Sticky Web)', score: 8 },
  taunt: { key: 'deny', label: 'Mofa (Taunt)', score: 6 },
  haze: { key: 'deny', label: 'Niebla (Haze)', score: 5 },
  fakeout: { key: 'tempo', label: 'Sorpresa (Fake Out)', score: 5 },
  protect: { key: 'tempo', label: 'Proteccion (Protect)', score: 2 },
  wideguard: { key: 'tempo', label: 'Vastaguardia (Wide Guard)', score: 5 },
}

const PRIORITY_MOVE_DEFINITIONS = {
  fakeout: { label: 'Sorpresa (Fake Out)', priority: 3, score: 8 },
  extremespeed: { label: 'Velocidad extrema (Extreme Speed)', priority: 2, score: 6 },
  suckerpunch: { label: 'Golpe bajo (Sucker Punch)', priority: 1, score: 5 },
  bulletpunch: { label: 'Puno bala (Bullet Punch)', priority: 1, score: 4 },
  machpunch: { label: 'Ultrapuno (Mach Punch)', priority: 1, score: 4 },
  aquajet: { label: 'Acua jet (Aqua Jet)', priority: 1, score: 4 },
  shadowsneak: { label: 'Sombra vil (Shadow Sneak)', priority: 1, score: 4 },
  quickattack: { label: 'Ataque rapido (Quick Attack)', priority: 1, score: 3 },
  firstimpression: { label: 'Escaramuza (First Impression)', priority: 2, score: 5 },
}

const FIELD_SYNERGY_ITEMS = {
  'charizardite-y': { key: 'sun', label: 'Mega Y activa sol', score: 12 },
}

const FIELD_SYNERGY_ABILITIES = {
  drought: { key: 'sun', label: 'Sequia (Drought) activa sol', score: 12 },
  drizzle: { key: 'rain', label: 'Llovizna (Drizzle) activa lluvia', score: 12 },
  sandstream: { key: 'sand', label: 'Chorro arena (Sand Stream) activa arena', score: 10 },
  snowwarning: { key: 'snow', label: 'Nevada (Snow Warning) activa nieve', score: 8 },
}

const FIELD_BOOSTED_MOVES = {
  sun: {
    types: new Set(['fire']),
    moves: new Set(['heatwave', 'flamethrower', 'fireblast', 'overheat', 'eruption']),
  },
  rain: {
    types: new Set(['water']),
    moves: new Set(['surf', 'hydropump', 'muddywater', 'waterfall', 'liquidation']),
  },
}

const CONTACT_PUNISH_ABILITIES = {
  static: { key: 'contactPunish', label: 'Elec. estatica (Static)', score: 4 },
  flamebody: { key: 'contactPunish', label: 'Cuerpo llama (Flame Body)', score: 4 },
  poisonpoint: { key: 'contactPunish', label: 'Punto toxico (Poison Point)', score: 3 },
  effectspore: { key: 'contactPunish', label: 'Efecto espora (Effect Spore)', score: 4 },
  roughskin: { key: 'chip', label: 'Piel tosca (Rough Skin)', score: 4 },
  ironbarbs: { key: 'chip', label: 'Punta acero (Iron Barbs)', score: 4 },
  toxicdebris: { key: 'hazard', label: 'Debris toxicos (Toxic Debris)', score: 5 },
}

const ABILITY_LABELS = {
  drought: 'Sequia (Drought)',
  drizzle: 'Llovizna (Drizzle)',
  sandstream: 'Chorro arena (Sand Stream)',
  snowwarning: 'Nevada (Snow Warning)',
  static: 'Elec. estatica (Static)',
  flamebody: 'Cuerpo llama (Flame Body)',
  poisonpoint: 'Punto toxico (Poison Point)',
  effectspore: 'Efecto espora (Effect Spore)',
  roughskin: 'Piel tosca (Rough Skin)',
  ironbarbs: 'Punta acero (Iron Barbs)',
  toxicdebris: 'Debris toxicos (Toxic Debris)',
}

function buildEmptyOpponentTeam(formatKey, locale) {
  return {
    ...createDefaultTeam(formatKey, locale),
    name: 'Equipo rival',
  }
}

function getNumericStat(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0
}

function buildBattleStats(pokemon, slot) {
  const stats = {}

  TEAM_STAT_KEYS.forEach((statKey) => {
    stats[statKey] = calculateBattleStat({
      base: getNumericStat(pokemon?.[statKey]),
      ev: getNumericStat(slot?.evs?.[statKey]),
      iv: Number.isFinite(Number(slot?.ivs?.[statKey])) ? Number(slot.ivs[statKey]) : 31,
      level: 50,
      natureKey: slot?.natureKey,
      statKey,
    })
  })

  return stats
}

function getInvestmentProfile(slot, battleStats) {
  const evEntries = TEAM_STAT_KEYS.map((statKey) => ({
    statKey,
    value: getNumericStat(slot?.evs?.[statKey]),
  }))
    .filter((entry) => entry.value > 0)
    .sort((left, right) => right.value - left.value)
  const topStats = evEntries.slice(0, 2).map((entry) => entry.statKey)
  const speedInvestment = getNumericStat(slot?.evs?.speed)
  const attackInvestment = getNumericStat(slot?.evs?.attack)
  const specialAttackInvestment = getNumericStat(slot?.evs?.specialAttack)
  const defenseInvestment = getNumericStat(slot?.evs?.defense) + getNumericStat(slot?.evs?.specialDefense) + getNumericStat(slot?.evs?.hp)
  const style =
    speedInvestment >= 20
      ? 'orientado a velocidad'
      : defenseInvestment >= attackInvestment + specialAttackInvestment
        ? 'orientado a aguante'
        : attackInvestment >= specialAttackInvestment
          ? 'ofensivo fisico'
          : specialAttackInvestment > 0
            ? 'ofensivo especial'
            : 'sin inversion clara'

  return {
    totalEvs: getEffortValueTotal(slot?.evs),
    speedInvestment,
    topStats,
    style,
    effectiveSpeed: battleStats.speed,
  }
}

function getCatalogPokemonBySlug(catalog, slug, locale) {
  if (!slug) {
    return null
  }

  const entry = catalog.find((item) => item.slug === slug)
  return entry ? createCatalogPokemon(entry, locale) : null
}

function buildTeamMembers(team, catalog, locale) {
  return team.slots.map((slot) => getCatalogPokemonBySlug(catalog, slot?.pokemonSlug, locale))
}

function buildAbilityLookup(detailCatalog) {
  const lookup = new Map()

  Object.values(detailCatalog).forEach((detail) => {
    ;(detail?.abilities ?? []).forEach((ability) => {
      const abilityId = normalizeMoveId(ability.slug)

      if (abilityId) {
        lookup.set(abilityId, ability)
      }
    })
  })

  return lookup
}

function normalizeMoveId(value) {
  return toCompetitiveResourceId(value)
}

function formatLocalizedResource(label, localizedLabel) {
  if (localizedLabel && localizedLabel !== label) {
    return `${localizedLabel} (${label})`
  }

  return label
}

function getMoveLabel(moveSlug, moveEntry) {
  if (moveEntry?.move) {
    return formatLocalizedResource(moveEntry.move, moveEntry.localizedMove)
  }

  return formatResourceName(moveSlug)
}

function getAbilityLabel(abilitySlug, abilityLookup = new Map()) {
  const abilityId = normalizeMoveId(abilitySlug)

  if (!abilityId) {
    return 'Pasiva pendiente'
  }

  const ability = abilityLookup.get(abilityId)

  if (ability?.label) {
    return formatLocalizedResource(ability.label, ability.localizedLabel)
  }

  return ABILITY_LABELS[abilityId] ?? formatResourceName(abilitySlug)
}

function buildMoveProfile(slot, moveCatalog, abilityLookup) {
  const moveLookup = new Map((moveCatalog ?? []).map((move) => [move.moveSlug, move]))
  const selectedMoves = (slot?.moveSlugs ?? [])
    .filter(Boolean)
    .map((moveSlug) => {
      const entry = moveLookup.get(moveSlug) ?? null
      const utility = UTILITY_MOVE_DEFINITIONS[normalizeMoveId(moveSlug)] ?? null
      const priority = PRIORITY_MOVE_DEFINITIONS[normalizeMoveId(moveSlug)] ?? null

      return {
        moveSlug,
        label: getMoveLabel(moveSlug, entry),
        typeKey: entry?.typeKey ?? null,
        categoryKey: entry?.categoryKey ?? null,
        power: Number(entry?.power) || 0,
        utility,
        priority,
      }
    })
  const damagingMoves = selectedMoves.filter((move) => move.typeKey && move.categoryKey !== 'status')
  const utilityMoves = selectedMoves.filter((move) => move.utility).map((move) => ({
    ...move.utility,
    moveSlug: move.moveSlug,
    moveName: move.label,
  }))
  const abilityUtility = CONTACT_PUNISH_ABILITIES[normalizeMoveId(slot?.abilitySlug)] ?? null
  const passiveLabel = getAbilityLabel(slot?.abilitySlug, abilityLookup)
  const fieldSynergy =
    FIELD_SYNERGY_ITEMS[normalizeMoveId(slot?.itemSlug)] ??
    FIELD_SYNERGY_ABILITIES[normalizeMoveId(slot?.abilitySlug)] ??
    null
  const priorityMoves = selectedMoves.filter((move) => move.priority).map((move) => ({
    ...move.priority,
    moveSlug: move.moveSlug,
    moveName: move.label,
  }))
  const fieldBoostedMoves = fieldSynergy
    ? selectedMoves
        .filter((move) => {
          const boost = FIELD_BOOSTED_MOVES[fieldSynergy.key]
          return boost && (boost.types.has(move.typeKey) || boost.moves.has(normalizeMoveId(move.moveSlug)))
        })
        .map((move) => ({
          moveSlug: move.moveSlug,
          moveName: move.label,
          label: `${fieldSynergy.label} + ${move.label}`,
        }))
    : []

  return {
    selectedMoves,
    damagingMoves,
    utilityMoves,
    abilityUtility,
    fieldSynergy,
    fieldBoostedMoves,
    priorityMoves,
    passiveLabel,
    utilityScore:
      utilityMoves.reduce((total, move) => total + move.score, 0) +
      priorityMoves.reduce((total, move) => total + move.score, 0) +
      (abilityUtility?.score ?? 0) +
      (fieldSynergy?.score ?? 0),
  }
}

function buildPossibleMoveProfile(moveCatalog) {
  const possibleUtilityMoves = []
  const possiblePriorityMoves = []

  ;(moveCatalog ?? []).forEach((move) => {
    const moveId = normalizeMoveId(move.moveSlug)
    const utility = UTILITY_MOVE_DEFINITIONS[moveId]
    const priority = PRIORITY_MOVE_DEFINITIONS[moveId]

    if (utility) {
      possibleUtilityMoves.push({
        ...utility,
        moveSlug: move.moveSlug,
        moveName: getMoveLabel(move.moveSlug, move),
      })
    }

    if (priority) {
      possiblePriorityMoves.push({
        ...priority,
        moveSlug: move.moveSlug,
        moveName: getMoveLabel(move.moveSlug, move),
      })
    }
  })

  return {
    possibleUtilityMoves: possibleUtilityMoves
      .sort((left, right) => right.score - left.score)
      .slice(0, 5),
    possiblePriorityMoves: possiblePriorityMoves
      .sort((left, right) => right.score - left.score)
      .slice(0, 4),
  }
}

function getBestMovePressure(moves, fallbackTypes, defenderPokemon, typeChart) {
  const pressureSources = moves?.length
    ? moves.map((move) => ({
        typeKey: move.typeKey,
        moveName: move.label,
        moveSlug: move.moveSlug,
        power: move.power,
      }))
    : (fallbackTypes ?? []).map((typeKey) => ({
        typeKey,
        moveName: translateType(typeKey),
        moveSlug: typeKey,
        power: 80,
      }))

  if (!pressureSources.length || !defenderPokemon?.typeKeys?.length) {
    return {
      multiplier: 1,
      typeKey: null,
      moveName: null,
      moveSlug: null,
    }
  }

  return pressureSources
    .map((source) => ({
      ...source,
      multiplier: defenderPokemon.typeKeys.reduce((value, defendingType) => {
        return value * getSingleTypeMultiplier(source.typeKey, defendingType, typeChart)
      }, 1),
    }))
    .sort((left, right) => right.multiplier - left.multiplier || right.power - left.power)[0]
}

function scoreAnswer({ ownPokemon, ownSlot, moveProfile, opponentPokemon, typeChart }) {
  if (!ownPokemon || !opponentPokemon) {
    return null
  }

  const incomingMultipliers = opponentPokemon.typeKeys.map((typeKey) => ({
    typeKey,
    multiplier: getPokemonDefensiveMultiplier(ownPokemon, typeKey, typeChart) ?? 1,
  }))
  const worstIncoming = incomingMultipliers.length
    ? Math.max(...incomingMultipliers.map((entry) => entry.multiplier))
    : 1
  const bestIncoming = incomingMultipliers.length
    ? Math.min(...incomingMultipliers.map((entry) => entry.multiplier))
    : 1
  const bestPressure = getBestMovePressure(moveProfile.damagingMoves, ownPokemon.typeKeys, opponentPokemon, typeChart)
  const ownBattleStats = buildBattleStats(ownPokemon, ownSlot)
  const investmentProfile = getInvestmentProfile(ownSlot, ownBattleStats)
  const speedDelta = investmentProfile.effectiveSpeed - getNumericStat(opponentPokemon.speed)
  const bulk = ownBattleStats.hp + ownBattleStats.defense + ownBattleStats.specialDefense
  const hasSpeedControl = moveProfile.utilityMoves.some((move) => move.key === 'speedControl')
  const hasStatusControl = moveProfile.utilityMoves.some((move) => ['status', 'lock', 'deny'].includes(move.key))
  const canFlipSpeed = speedDelta < 0 && hasSpeedControl
  const score =
    bestPressure.multiplier * 24 -
    worstIncoming * 18 +
    (bestIncoming === 0 ? 18 : 0) +
    (speedDelta > 0 ? 8 : 0) +
    (canFlipSpeed ? 9 : 0) +
    (hasStatusControl ? 5 : 0) +
    Math.min(moveProfile.priorityMoves.reduce((total, move) => total + move.score, 0), 10) +
    Math.min(moveProfile.fieldBoostedMoves.length * 7, 12) +
    Math.min(moveProfile.utilityScore / 2, 12) +
    Math.min(bulk / 80, 6)

  return {
    pokemon: ownPokemon,
    slot: ownSlot,
    battleStats: ownBattleStats,
    investmentProfile,
    moves: moveProfile.selectedMoves,
    utilityMoves: moveProfile.utilityMoves,
    abilityUtility: moveProfile.abilityUtility,
    fieldSynergy: moveProfile.fieldSynergy,
    fieldBoostedMoves: moveProfile.fieldBoostedMoves,
    priorityMoves: moveProfile.priorityMoves,
    passiveLabel: moveProfile.passiveLabel,
    label: getAnswerLabel({
      bestIncoming,
      pressureMultiplier: bestPressure.multiplier,
      speedDelta,
      worstIncoming,
    }),
    pokemonSlug: ownPokemon.slug,
    pokemonName: ownPokemon.name,
    score,
    speedDelta,
    bestIncoming,
    worstIncoming,
    pressureMultiplier: bestPressure.multiplier,
    pressureType: bestPressure.typeKey,
    pressureMoveName: bestPressure.moveName,
    pressureMoveSlug: bestPressure.moveSlug,
    incomingMultipliers,
    canFlipSpeed,
  }
}

function getAnswerLabel(answer) {
  if (!answer) {
    return 'Sin respuesta clara'
  }

  if (answer.bestIncoming === 0 && answer.pressureMultiplier >= 2) {
    return 'Entrada fuerte y amenaza directa'
  }

  if (answer.worstIncoming <= 0.5) {
    return 'Cambio defensivo comodo'
  }

  if (answer.pressureMultiplier >= 2 && answer.speedDelta > 0) {
    return 'Presiona y supera en velocidad'
  }

  if (answer.pressureMultiplier >= 2) {
    return 'Buen castigo ofensivo'
  }

  if (answer.worstIncoming <= 1) {
    return 'Respuesta estable'
  }

  return 'Usar con cuidado'
}

function getThreatLabel(threatScore) {
  if (threatScore >= 42) {
    return 'Amenaza alta'
  }

  if (threatScore >= 24) {
    return 'Amenaza media'
  }

  return 'Controlable'
}

function buildOpponentInsights(opponentPokemon, ownEntries, typeChart) {
  const defensiveAnswers = ownEntries
    .map((entry) => {
      const worstIncoming = opponentPokemon.typeKeys.length
        ? Math.max(
            ...opponentPokemon.typeKeys.map((typeKey) => getPokemonDefensiveMultiplier(entry.pokemon, typeKey, typeChart) ?? 1)
          )
        : 1
      return {
        pokemon: entry.pokemon,
        worstIncoming,
      }
    })
    .filter((entry) => entry.worstIncoming <= 0.5)
  const offensivePressure = ownEntries.map((entry) => {
    return getBestMovePressure(entry.moveProfile.damagingMoves, entry.pokemon.typeKeys, opponentPokemon, typeChart).multiplier
  })
  const bestPressure = offensivePressure.length ? Math.max(...offensivePressure) : 1
  const fastestOwnSpeed = ownEntries.reduce((value, entry) => Math.max(value, getNumericStat(entry.pokemon.speed)), 0)
  const speedThreat = getNumericStat(opponentPokemon.speed) > fastestOwnSpeed ? 12 : 0
  const threatScore =
    getNumericStat(opponentPokemon.attack) / 12 +
    getNumericStat(opponentPokemon.specialAttack) / 12 +
    getNumericStat(opponentPokemon.speed) / 14 +
    speedThreat -
    defensiveAnswers.length * 6 -
    (bestPressure >= 2 ? 5 : 0) -
    Math.min(ownEntries.reduce((total, entry) => total + entry.moveProfile.utilityScore, 0) / 8, 8)

  return {
    defensiveAnswers,
    bestPressure,
    threatScore,
    threatLabel: getThreatLabel(threatScore),
  }
}

function getOpponentAttackProfile(opponentPokemon, ownEntries, typeChart, locale, possibleMoveProfile) {
  const stabTypes = opponentPokemon.typeKeys.map((typeKey) => ({
    typeKey,
    label: translateType(typeKey, locale),
  }))
  const vulnerableTargets = ownEntries
    .map((entry) => {
      const worstMultiplier = opponentPokemon.typeKeys.length
        ? Math.max(
            ...opponentPokemon.typeKeys.map((typeKey) => getPokemonDefensiveMultiplier(entry.pokemon, typeKey, typeChart) ?? 1)
          )
        : 1

      return {
        pokemonName: entry.pokemon.name,
        multiplier: worstMultiplier,
      }
    })
    .filter((entry) => entry.multiplier > 1)
    .sort((left, right) => right.multiplier - left.multiplier)

  return {
    stabTypes,
    likelyStyle:
      getNumericStat(opponentPokemon.attack) >= getNumericStat(opponentPokemon.specialAttack) + 15
        ? 'presion fisica'
        : getNumericStat(opponentPokemon.specialAttack) >= getNumericStat(opponentPokemon.attack) + 15
          ? 'presion especial'
          : 'presion mixta',
    speedBand:
      getNumericStat(opponentPokemon.speed) >= 110
        ? 'muy rapido'
        : getNumericStat(opponentPokemon.speed) >= 85
          ? 'velocidad media/alta'
          : 'lento o de bulky trade',
    possibleUtilityMoves: possibleMoveProfile.possibleUtilityMoves,
    possiblePriorityMoves: possibleMoveProfile.possiblePriorityMoves,
    vulnerableTargets: vulnerableTargets.slice(0, 3),
  }
}

function buildLeadPlan(selected, opponentPlans) {
  const openers = selected.slice(0, 2)
  const left = openers[0] ?? null
  const right = openers[1] ?? null
  const leftTools = left
    ? [
        left.entry.moveProfile.fieldSynergy?.label,
        ...left.entry.moveProfile.fieldBoostedMoves.map((move) => move.label),
        ...left.entry.moveProfile.priorityMoves.map((move) => move.label),
        ...left.entry.moveProfile.utilityMoves.map((move) => move.label),
      ].filter(Boolean)
    : []
  const rightTools = right
    ? [
        right.entry.moveProfile.fieldSynergy?.label,
        ...right.entry.moveProfile.fieldBoostedMoves.map((move) => move.label),
        ...right.entry.moveProfile.priorityMoves.map((move) => move.label),
        ...right.entry.moveProfile.utilityMoves.map((move) => move.label),
      ].filter(Boolean)
    : []
  const fastestOpponent = opponentPlans
    .map((plan) => plan.opponent)
    .sort((leftPokemon, rightPokemon) => getNumericStat(rightPokemon.speed) - getNumericStat(leftPokemon.speed))[0] ?? null
  const fastestOpener = openers
    .map((item) => ({
      name: item.entry.pokemon.name,
      speed: getNumericStat(item.entry.battleStats?.speed),
    }))
    .sort((leftPokemon, rightPokemon) => rightPokemon.speed - leftPokemon.speed)[0] ?? null
  const speedNote =
    fastestOpponent && fastestOpener
      ? fastestOpener.speed >= getNumericStat(fastestOpponent.speed)
        ? `${fastestOpener.name} alcanza ${fastestOpener.speed} de velocidad real y puede actuar antes que la mayor amenaza rapida detectada (${fastestOpponent.name}) por referencia base.`
        : `${fastestOpponent.name} parece mas rapido que tus leads incluso mirando la velocidad real del set; prioriza control de velocidad, proteccion o cambio seguro.`
      : 'Completa rivales y leads para estimar el primer turno.'
  const speedMode =
    openers.some((item) => item.entry.moveProfile.utilityMoves.some((move) => normalizeMoveId(move.moveSlug) === 'trickroom'))
      ? 'Plan lento: Espacio raro premia velocidades bajas.'
      : openers.some((item) => item.entry.moveProfile.utilityMoves.some((move) => normalizeMoveId(move.moveSlug) === 'tailwind'))
        ? 'Plan rapido: Viento afin premia invertir o preservar velocidad.'
        : 'Plan neutro: revisa si necesitas subir velocidad o jugar a bulk/control.'

  return {
    left,
    right,
    leftTools,
    rightTools,
    bench: selected.slice(2, 4),
    speedNote,
    speedMode,
  }
}

function buildOpponentSelectionPlan(attackProfiles) {
  const scored = attackProfiles
    .map((profile) => {
      const priorityScore = profile.possiblePriorityMoves.reduce((total, move) => total + move.score, 0)
      const utilityScore = profile.possibleUtilityMoves.reduce((total, move) => total + move.score, 0)
      const trickRoomScore = profile.possibleUtilityMoves.some((move) => normalizeMoveId(move.moveSlug) === 'trickroom') ? 14 : 0
      const speedScore = getNumericStat(profile.opponent.speed) >= 100 ? 8 : 0
      const pressureScore = profile.vulnerableTargets.reduce((total, target) => total + target.multiplier * 4, 0)
      const leadScore = profile.threatLabel === 'Amenaza alta' ? 12 : profile.threatLabel === 'Amenaza media' ? 7 : 3

      return {
        ...profile,
        score: leadScore + priorityScore + utilityScore + trickRoomScore + speedScore + pressureScore,
        leadScore: leadScore + priorityScore + trickRoomScore + speedScore,
      }
    })
    .sort((left, right) => right.score - left.score)
  const selected = scored.slice(0, 4)
  const leads = [...selected]
    .sort((left, right) => right.leadScore - left.leadScore)
    .slice(0, 2)
  const bench = selected.filter((profile) => !leads.some((lead) => lead.opponent.slug === profile.opponent.slug)).slice(0, 2)
  const trickRoomLead = leads.find((profile) => profile.possibleUtilityMoves.some((move) => normalizeMoveId(move.moveSlug) === 'trickroom'))
  const fakeOutLead = leads.find((profile) => profile.possiblePriorityMoves.some((move) => normalizeMoveId(move.moveSlug) === 'fakeout'))
  const notes = [
    trickRoomLead
      ? `${trickRoomLead.opponent.name} puede abrir para Espacio raro (Trick Room): si no quieres jugar lento, intenta tumbarlo, mofarlo o presionarlo antes de que coloque sala.`
      : null,
    fakeOutLead
      ? `${fakeOutLead.opponent.name} puede amenazar Sorpresa (Fake Out): protege la pieza clave o abre con algo que no dependa de actuar ese turno.`
      : null,
    leads.length === 2
      ? `Apertura rival probable: ${leads[0].opponent.name} a la izquierda y ${leads[1].opponent.name} a la derecha.`
      : null,
  ].filter(Boolean)

  return {
    selected,
    leads,
    bench,
    notes,
  }
}

function buildBringFourPlan(ownEntries, opponentPlans, typeChart, locale, opponentMoveCatalog) {
  const entryScores = ownEntries.map((entry) => {
    const threatAnswers = opponentPlans
      .map((plan) => {
        const answer = plan.fullAnswers.find((item) => item.pokemonSlug === entry.pokemon.slug)
        return answer
          ? {
              opponent: plan.opponent,
              threatLabel: plan.threatLabel,
              answer,
            }
          : null
      })
      .filter(Boolean)
    const covers = threatAnswers
      .filter((item) => item.answer.worstIncoming <= 1 || item.answer.pressureMultiplier >= 2)
      .sort((left, right) => right.answer.score - left.answer.score)
    const struggles = threatAnswers
      .filter((item) => item.answer.worstIncoming > 1 && item.answer.pressureMultiplier < 2)
      .sort((left, right) => right.answer.worstIncoming - left.answer.worstIncoming)
    const averageAnswerScore = threatAnswers.length
      ? threatAnswers.reduce((total, item) => total + item.answer.score, 0) / threatAnswers.length
      : 0
    const highThreatCoverage = covers.filter((item) => item.threatLabel === 'Amenaza alta').length
    const controlScore = entry.moveProfile.utilityScore
    const score = averageAnswerScore + covers.length * 9 + highThreatCoverage * 7 + Math.min(controlScore, 14) - struggles.length * 3

    return {
      entry,
      score,
      covers,
      struggles,
      averageAnswerScore,
      controlScore,
    }
  })
  const selected = entryScores
    .sort((left, right) => right.score - left.score)
    .slice(0, 4)
  const selectedNames = new Set(selected.map((item) => item.entry.pokemon.slug))
  const uncoveredThreats = opponentPlans
    .filter((plan) => !plan.fullAnswers.some((answer) => selectedNames.has(answer.pokemonSlug) && (answer.worstIncoming <= 1 || answer.pressureMultiplier >= 2)))
    .map((plan) => plan.opponent.name)
  const attackProfiles = opponentPlans.map((plan) => ({
    opponent: plan.opponent,
    threatLabel: plan.threatLabel,
    ...getOpponentAttackProfile(
      plan.opponent,
      ownEntries,
      typeChart,
      locale,
      buildPossibleMoveProfile(opponentMoveCatalog[plan.opponent.slug] ?? [])
    ),
  }))

  return {
    selected,
    leadPlan: buildLeadPlan(selected, opponentPlans),
    opponentSelectionPlan: buildOpponentSelectionPlan(attackProfiles),
    uncoveredThreats,
    attackProfiles,
    summary:
      selected.length >= 4
        ? 'Saca estos cuatro si quieres maximizar respuestas defensivas, control de velocidad/estado y presion real por movimientos.'
        : 'Completa tu equipo para poder recomendar cuatro Pokemon de salida.',
  }
}

function analyzeMatchup({ ownTeam, opponentTeam, catalog, typeChart, locale, ownMoveCatalog, opponentMoveCatalog, ownDetailCatalog }) {
  const ownMembers = buildTeamMembers(ownTeam, catalog, locale)
  const opponentMembers = buildTeamMembers(opponentTeam, catalog, locale)
  const abilityLookup = buildAbilityLookup(ownDetailCatalog)
  const ownEntries = ownMembers
    .map((pokemon, index) => {
      if (!pokemon) {
        return null
      }

      const slot = ownTeam.slots[index]
      return {
        pokemon,
        slot,
        battleStats: buildBattleStats(pokemon, slot),
        moveProfile: buildMoveProfile(slot, ownMoveCatalog[pokemon.slug] ?? [], abilityLookup),
      }
    })
    .filter(Boolean)
  const filledOwn = ownEntries.map((entry) => entry.pokemon)
  const filledOpponent = opponentMembers.filter(Boolean)
  const opponentPlans = filledOpponent
    .map((opponentPokemon) => {
      const fullAnswers = ownEntries
        .map((entry) =>
          scoreAnswer({
            ownPokemon: entry.pokemon,
            ownSlot: entry.slot,
            moveProfile: entry.moveProfile,
            opponentPokemon,
            typeChart,
          })
        )
        .filter(Boolean)
        .sort((left, right) => right.score - left.score)
      const insights = buildOpponentInsights(opponentPokemon, ownEntries, typeChart)

      return {
        opponent: opponentPokemon,
        fullAnswers,
        answers: fullAnswers.slice(0, 3),
        bestAnswer: fullAnswers[0] ?? null,
        ...insights,
      }
    })
    .sort((left, right) => right.threatScore - left.threatScore)
  const leadCandidates = filledOwn
    .map((pokemon) => {
      const entry = ownEntries.find((item) => item.pokemon.slug === pokemon.slug)
      const averagePressure = filledOpponent.length
        ? filledOpponent.reduce((sum, opponentPokemon) => {
            return sum + getBestMovePressure(entry?.moveProfile.damagingMoves ?? [], pokemon.typeKeys, opponentPokemon, typeChart).multiplier
          }, 0) / filledOpponent.length
        : 1
      const badIncomingCount = filledOpponent.filter((opponentPokemon) => {
        const worstIncoming = opponentPokemon.typeKeys.length
          ? Math.max(
              ...opponentPokemon.typeKeys.map((typeKey) => getPokemonDefensiveMultiplier(pokemon, typeKey, typeChart) ?? 1)
            )
          : 1
        return worstIncoming > 1
      }).length
      const speedScore = getNumericStat(entry?.battleStats?.speed) / 18
      const leadUtilityScore = Math.min((entry?.moveProfile.utilityScore ?? 0) / 2, 10)

      return {
        pokemon,
        battleStats: entry?.battleStats ?? buildBattleStats(pokemon, {}),
        investmentProfile: getInvestmentProfile(entry?.slot, entry?.battleStats ?? buildBattleStats(pokemon, {})),
        score: averagePressure * 12 + speedScore + leadUtilityScore - badIncomingCount * 2,
        averagePressure,
        badIncomingCount,
        utilityMoves: entry?.moveProfile.utilityMoves ?? [],
      }
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
  const sharedWeaknesses = filledOpponent
    .flatMap((pokemon) => pokemon.typeKeys)
    .reduce((map, typeKey) => {
      map.set(typeKey, (map.get(typeKey) ?? 0) + 1)
      return map
    }, new Map())
  const opponentTypeStack = Array.from(sharedWeaknesses.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4)
    .map(([typeKey, count]) => ({
      typeKey,
      label: translateType(typeKey, locale),
      count,
    }))

  return {
    ownMembers,
    opponentMembers,
    opponentPlans,
    leadCandidates,
    bringFourPlan: buildBringFourPlan(ownEntries, opponentPlans, typeChart, locale, opponentMoveCatalog),
    opponentTypeStack,
    summary: {
      ownCount: filledOwn.length,
      opponentCount: filledOpponent.length,
      highThreats: opponentPlans.filter((entry) => entry.threatScore >= 42).length,
      answeredThreats: opponentPlans.filter((entry) => entry.bestAnswer?.worstIncoming <= 1).length,
    },
  }
}

export function useBattleAnalysis() {
  const { locale } = useI18n()
  const [catalog, setCatalog] = useState([])
  const [itemCatalog, setItemCatalog] = useState([])
  const [formats, setFormats] = useState([])
  const [typeChart, setTypeChart] = useState({})
  const [ownMoveCatalog, setOwnMoveCatalog] = useState({})
  const [opponentMoveCatalog, setOpponentMoveCatalog] = useState({})
  const [ownDetailCatalog, setOwnDetailCatalog] = useState({})
  const [ownTeam, setOwnTeam] = useState(() => createDefaultTeam(undefined, locale))
  const [opponentTeam, setOpponentTeam] = useState(() => buildEmptyOpponentTeam(undefined, locale))
  const [formatKey, setFormatKey] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [opponentImportText, setOpponentImportText] = useState('')
  const [opponentImportMessage, setOpponentImportMessage] = useState('')
  const [selectedOpponentSlot, setSelectedOpponentSlot] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const storedOwnTeam = window.localStorage.getItem(TEAM_STORAGE_KEY)
      const nextOwnTeam = storedOwnTeam ? sanitizeStoredTeam(JSON.parse(storedOwnTeam)) : createDefaultTeam(undefined, locale)
      setOwnTeam(nextOwnTeam)
      setFormatKey(nextOwnTeam.formatKey)

      const storedOpponentTeam = window.localStorage.getItem(BATTLE_ANALYSIS_OPPONENT_STORAGE_KEY)
      if (storedOpponentTeam) {
        setOpponentTeam(sanitizeStoredTeam(JSON.parse(storedOpponentTeam)))
      }
    } catch {
      setOwnTeam(createDefaultTeam(undefined, locale))
      setOpponentTeam(buildEmptyOpponentTeam(undefined, locale))
    }
  }, [locale])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(BATTLE_ANALYSIS_OPPONENT_STORAGE_KEY, JSON.stringify(opponentTeam))
  }, [opponentTeam])

  useEffect(() => {
    let cancelled = false

    async function loadBootstrap() {
      setIsLoading(true)

      try {
        const payload = await fetchTeamBuilderBootstrap({
          formatKey: formatKey || ownTeam.formatKey,
        })

        if (cancelled) {
          return
        }

        const nextFormatKey = payload?.resolvedFormatKey ?? ownTeam.formatKey
        setCatalog(Array.isArray(payload?.catalog?.items) ? payload.catalog.items : [])
        setItemCatalog(Array.isArray(payload?.items?.items) ? payload.items.items : [])
        setFormats(Array.isArray(payload?.formats?.items) ? payload.formats.items : [])
        setTypeChart(payload?.typeChart && typeof payload.typeChart === 'object' ? payload.typeChart : {})
        setFormatKey(nextFormatKey)
        setLoadError('')
      } catch {
        if (!cancelled) {
          setLoadError('No se pudieron cargar los datos competitivos para el analisis.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadBootstrap()

    return () => {
      cancelled = true
    }
  }, [formatKey, ownTeam.formatKey])

  useEffect(() => {
    const slugs = ownTeam.slots
      .map((slot) => slot.pokemonSlug)
      .filter(Boolean)
      .filter((slug, index, values) => values.indexOf(slug) === index)
      .filter((slug) => !ownMoveCatalog[slug])

    if (!slugs.length) {
      return
    }

    let cancelled = false

    async function loadOwnMoves() {
      try {
        const results = await Promise.all(
          slugs.map((slug) =>
            fetchPokemonMoves(slug)
              .then((payload) => [slug, Array.isArray(payload?.items) ? payload.items : []])
              .catch(() => [slug, []])
          )
        )

        if (cancelled) {
          return
        }

        setOwnMoveCatalog((previous) => ({
          ...previous,
          ...Object.fromEntries(results),
        }))
      } catch {
        if (!cancelled) {
          setOwnMoveCatalog((previous) => ({
            ...previous,
            ...Object.fromEntries(slugs.map((slug) => [slug, []])),
          }))
        }
      }
    }

    loadOwnMoves()

    return () => {
      cancelled = true
    }
  }, [ownMoveCatalog, ownTeam.slots])

  useEffect(() => {
    const slugs = ownTeam.slots
      .map((slot) => slot.pokemonSlug)
      .filter(Boolean)
      .filter((slug, index, values) => values.indexOf(slug) === index)
      .filter((slug) => !ownDetailCatalog[slug])

    if (!slugs.length) {
      return
    }

    let cancelled = false

    async function loadOwnDetails() {
      const results = await Promise.all(
        slugs.map((slug) =>
          fetchPokemonDetail(slug)
            .then((payload) => [slug, payload])
            .catch(() => [slug, null])
        )
      )

      if (cancelled) {
        return
      }

      setOwnDetailCatalog((previous) => ({
        ...previous,
        ...Object.fromEntries(results.filter(([, detail]) => detail)),
      }))
    }

    loadOwnDetails()

    return () => {
      cancelled = true
    }
  }, [ownDetailCatalog, ownTeam.slots])

  useEffect(() => {
    const slugs = opponentTeam.slots
      .map((slot) => slot.pokemonSlug)
      .filter(Boolean)
      .filter((slug, index, values) => values.indexOf(slug) === index)
      .filter((slug) => !opponentMoveCatalog[slug])

    if (!slugs.length) {
      return
    }

    let cancelled = false

    async function loadOpponentMoves() {
      const results = await Promise.all(
        slugs.map((slug) =>
          fetchPokemonMoves(slug)
            .then((payload) => [slug, Array.isArray(payload?.items) ? payload.items : []])
            .catch(() => [slug, []])
        )
      )

      if (cancelled) {
        return
      }

      setOpponentMoveCatalog((previous) => ({
        ...previous,
        ...Object.fromEntries(results),
      }))
    }

    loadOpponentMoves()

    return () => {
      cancelled = true
    }
  }, [opponentMoveCatalog, opponentTeam.slots])

  const activeFormat = useMemo(() => {
    return formats.find((format) => format.key === formatKey) ?? formats[0] ?? null
  }, [formatKey, formats])

  const pokemonOptions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    const filteredCatalog = normalizedQuery
      ? catalog.filter((entry) =>
          [entry.label, entry.slug, entry.primaryType, entry.secondaryType, entry.primaryAbility]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery)
        )
      : catalog

    return filteredCatalog.slice(0, 24).map((entry) => createCatalogPokemon(entry, locale))
  }, [catalog, locale, searchQuery])

  const analysis = useMemo(() => {
    return analyzeMatchup({
      ownTeam,
      opponentTeam,
      catalog,
      typeChart,
      locale,
      ownMoveCatalog,
      opponentMoveCatalog,
      ownDetailCatalog,
    })
  }, [catalog, locale, opponentMoveCatalog, opponentTeam, ownDetailCatalog, ownMoveCatalog, ownTeam, typeChart])

  function refreshOwnTeamFromStorage() {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const storedOwnTeam = window.localStorage.getItem(TEAM_STORAGE_KEY)
      const nextOwnTeam = storedOwnTeam ? sanitizeStoredTeam(JSON.parse(storedOwnTeam)) : createDefaultTeam(formatKey, locale)
      setOwnTeam(nextOwnTeam)
      setFormatKey(nextOwnTeam.formatKey)
    } catch {
      setOwnTeam(createDefaultTeam(formatKey, locale))
    }
  }

  function clearOpponentTeam() {
    setOpponentTeam(buildEmptyOpponentTeam(formatKey || ownTeam.formatKey, locale))
    setSelectedOpponentSlot(0)
    setOpponentImportMessage('Equipo rival limpiado.')
  }

  function setOpponentPokemon(slotIndex, pokemonSlug) {
    setOpponentTeam((previous) => {
      const nextSlots = [...previous.slots]
      nextSlots[slotIndex] = pokemonSlug ? createTeamSlot(pokemonSlug) : createTeamSlot(null)

      return sanitizeStoredTeam({
        ...previous,
        slots: nextSlots,
      })
    })
    setSelectedOpponentSlot(slotIndex)
  }

  function importOpponentFromText() {
    try {
      const importedTeam = importTeamFromShowdownText(opponentImportText, {
        catalog,
        itemCatalog,
        defaultFormatKey: formatKey || ownTeam.formatKey,
        teamName: 'Equipo rival importado',
      })
      const count = importedTeam.slots.filter((slot) => slot.pokemonSlug).length

      if (!count) {
        throw new Error('No se han detectado Pokemon validos en el texto.')
      }

      setOpponentTeam(importedTeam)
      setOpponentImportMessage(`Equipo rival importado con ${count} Pokemon.`)
    } catch (error) {
      setOpponentImportMessage(error instanceof Error ? error.message : 'No se pudo importar el equipo rival.')
    }
  }

  function formatType(typeKey) {
    return typeKey ? translateType(typeKey, locale) : 'Sin tipo'
  }

  function formatMultiplier(value) {
    if (value === 0) {
      return 'x0'
    }

    return `x${Number(value).toFixed(value % 1 === 0 ? 0 : 1)}`
  }

  function formatMoveOrType(value) {
    return value ? formatResourceName(value) : 'Cobertura'
  }

  return {
    activeFormat,
    analysis,
    clearOpponentTeam,
    formatMoveOrType,
    formatMultiplier,
    formatType,
    importOpponentFromText,
    isLoading,
    loadError,
    opponentImportMessage,
    opponentImportText,
    opponentTeam,
    ownTeam,
    pokemonOptions,
    refreshOwnTeamFromStorage,
    searchQuery,
    selectedOpponentSlot,
    setOpponentImportText,
    setOpponentPokemon,
    setSearchQuery,
    setSelectedOpponentSlot,
  }
}
