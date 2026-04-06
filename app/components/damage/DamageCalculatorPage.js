'use client'

import Image from 'next/image'

import { useDamageCalculator } from '../../hooks/useDamageCalculator'
import pageStyles from '../../page.module.css'
import SiteHeader from '../home/SiteHeader'
import DamageBattlefieldPanel from './DamageBattlefieldPanel'
import DamageSidePanel from './DamageSidePanel'
import styles from './DamageCalculatorPage.module.css'

function formatRolls(rolls) {
  if (!rolls?.length) {
    return ''
  }

  return rolls.slice(0, 16).join(', ')
}

function MoveListCard({ title, pokemon, results, selectedMove, onSelectMove }) {
  return (
    <article className={styles.moveResultsCard}>
      <div className={styles.moveResultsHeader}>
        <div>
          <p className={styles.kicker}>{title}</p>
          <h3>{pokemon?.name ?? 'Sin Pokemon'}</h3>
        </div>

        {pokemon ? (
          <div className={styles.moveResultsVisual}>
            <Image src={pokemon.thumb} alt={pokemon.name} width={64} height={64} loading="lazy" />
          </div>
        ) : null}
      </div>

      <div className={styles.moveResultsList}>
        {results.length ? (
          results.map((result) => {
            const isActive = selectedMove.side === title.toLowerCase() && selectedMove.slot === result.slot

            return (
              <button
                key={`${title}-${result.slot}-${result.moveSlug}`}
                type="button"
                className={[styles.moveResultRow, isActive ? styles.moveResultRowActive : null].filter(Boolean).join(' ')}
                onClick={() => onSelectMove(title.toLowerCase(), result.slot)}
              >
                <div className={styles.moveResultCopy}>
                  <strong>{result.moveName}</strong>
                  <small>
                    {result.typeLabel}
                    {result.categoryLabel ? ` | ${result.categoryLabel}` : ''}
                  </small>
                </div>

                <div className={styles.moveResultMetrics}>
                  <strong>{result.minPercent}% - {result.maxPercent}%</strong>
                  <small>{result.koText || result.rangeLabel}</small>
                </div>
              </button>
            )
          })
        ) : (
          <p className={styles.emptyState}>Configura movimientos en este lado para ver rangos de dano.</p>
        )}
      </div>
    </article>
  )
}

export default function DamageCalculatorPage() {
  const calculator = useDamageCalculator()
  const selectedCalculation = calculator.calculationResult?.calculations.selected ?? null
  const attackerResults = calculator.calculationResult?.calculations.attackerMoves ?? []
  const defenderResults = calculator.calculationResult?.calculations.defenderMoves ?? []
  const selectedMoveSourcePokemon =
    calculator.state.selectedMove.side === 'attacker' ? calculator.attackerPokemon : calculator.defenderPokemon
  const selectedMoveTargetPokemon =
    calculator.state.selectedMove.side === 'attacker' ? calculator.defenderPokemon : calculator.attackerPokemon

  return (
    <>
      <SiteHeader />

      <main className={pageStyles.pageShell}>
        <div className={styles.calculatorShell}>
          <section className={styles.hero}>
            <div className={styles.heroCopy}>
              <div className={styles.heroTopline}>
                <p className={styles.kicker}>Pokemon Champions Scope</p>
              </div>

              <h2>Calculadora de dano local</h2>
              <p>
                Baseada en tus datos competitivos locales y alineada con el scope Champions actual del proyecto:
                Combate individual y Combate doble, con primer reglamento ranked preparado para Mega Evolution.
              </p>
            </div>

            <div className={styles.heroStats}>
              <div className={styles.heroStatCard}>
                <span>Formato</span>
                <strong>{calculator.activeFormat?.headline ?? 'Cargando...'}</strong>
                <small>{calculator.activeFormat?.name ?? 'Esperando API interna'}</small>
              </div>
              <div className={styles.heroStatCard}>
                <span>Modo</span>
                <strong>{calculator.activeFormat?.battleModeLabel ?? 'Combate individual'}</strong>
                <small>Scope competitivo local</small>
              </div>
              <div className={styles.heroStatCard}>
                <span>Estado</span>
                <strong>{calculator.isCalculating ? 'Calculando...' : selectedCalculation ? 'Listo' : 'Configura el duelo'}</strong>
                <small>{calculator.calculationError ? 'Revisa los datos del set' : 'Sincronizado en local'}</small>
              </div>
            </div>
          </section>

          <section className={styles.overviewGrid}>
            <MoveListCard
              title="Attacker"
              pokemon={calculator.attackerPokemon}
              results={attackerResults}
              selectedMove={calculator.state.selectedMove}
              onSelectMove={calculator.selectMove}
            />

            <article className={styles.summaryCard}>
              <div className={styles.summaryVersus}>
                <div className={styles.summarySide}>
                  {calculator.attackerPokemon ? (
                    <Image
                      src={calculator.attackerPokemon.thumb}
                      alt={calculator.attackerPokemon.name}
                      width={74}
                      height={74}
                      loading="lazy"
                    />
                  ) : null}
                  <strong>{calculator.attackerPokemon?.name ?? 'Atacante'}</strong>
                  <small>{calculator.attackerPokemon?.types?.join(' / ') ?? 'Sin datos'}</small>
                </div>

                <div className={styles.summaryCenter}>
                  <span className={styles.summaryModeBadge}>{calculator.activeFormat?.battleModeLabel ?? 'Combate individual'}</span>
                  <strong>VS</strong>
                  <small>{calculator.activeFormat?.headline ?? 'Damage Calculator'}</small>
                </div>

                <div className={styles.summarySide}>
                  {calculator.defenderPokemon ? (
                    <Image
                      src={calculator.defenderPokemon.thumb}
                      alt={calculator.defenderPokemon.name}
                      width={74}
                      height={74}
                      loading="lazy"
                    />
                  ) : null}
                  <strong>{calculator.defenderPokemon?.name ?? 'Defensor'}</strong>
                  <small>{calculator.defenderPokemon?.types?.join(' / ') ?? 'Sin datos'}</small>
                </div>
              </div>

              {selectedCalculation ? (
                <div className={styles.summaryDetails}>
                  <p className={styles.summaryMoveTitle}>
                    {selectedMoveSourcePokemon?.name ?? 'Atacante'} usa <strong>{selectedCalculation.moveName}</strong> sobre{' '}
                    {selectedMoveTargetPokemon?.name ?? 'Defensor'}
                  </p>
                  <p className={styles.summaryDescription}>{selectedCalculation.fullDescription}</p>
                  <div className={styles.summaryMetrics}>
                    <span className={styles.summaryMetricPrimary}>{selectedCalculation.rangeLabel}</span>
                    <span className={styles.summaryMetricSecondary}>{selectedCalculation.koText || 'Sin texto de KO adicional'}</span>
                  </div>
                  {selectedCalculation.rolls.length ? (
                    <p className={styles.summaryRolls}>
                      Posibles danos: {formatRolls(selectedCalculation.rolls)}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className={styles.emptyState}>
                  Selecciona movimientos en alguno de los dos lados para obtener el calculo detallado.
                </p>
              )}
            </article>

            <MoveListCard
              title="Defender"
              pokemon={calculator.defenderPokemon}
              results={defenderResults}
              selectedMove={calculator.state.selectedMove}
              onSelectMove={calculator.selectMove}
            />
          </section>

          <section className={styles.workspaceGrid}>
            <DamageSidePanel
              sideKey="attacker"
              sideState={calculator.state.attacker}
              pokemon={calculator.attackerPokemon}
              detail={calculator.attackerDetail}
              moveCatalog={calculator.attackerMoves}
              pokemonOptions={calculator.pokemonOptions}
              itemOptions={calculator.itemOptions}
              onSetPokemon={calculator.setSidePokemon}
              onSetValue={calculator.setSideValue}
              onSetMove={calculator.setSideMove}
              onSetStat={calculator.setSideStat}
              selectedMove={attackerResults}
            />

            <DamageBattlefieldPanel
              activeFormat={calculator.activeFormat}
              formats={calculator.competitiveFormats}
              field={calculator.state.field}
              selectedMove={calculator.state.selectedMove}
              onSetFormatKey={calculator.setFormatKey}
              onToggleFieldFlag={calculator.toggleFieldFlag}
              onSetFieldValue={calculator.setFieldValue}
              onToggleFieldSideFlag={calculator.toggleFieldSideFlag}
              onSetFieldSideValue={calculator.setFieldSideValue}
              onSetSelectedMoveOption={calculator.setSelectedMoveOption}
            />

            <DamageSidePanel
              sideKey="defender"
              sideState={calculator.state.defender}
              pokemon={calculator.defenderPokemon}
              detail={calculator.defenderDetail}
              moveCatalog={calculator.defenderMoves}
              pokemonOptions={calculator.pokemonOptions}
              itemOptions={calculator.itemOptions}
              onSetPokemon={calculator.setSidePokemon}
              onSetValue={calculator.setSideValue}
              onSetMove={calculator.setSideMove}
              onSetStat={calculator.setSideStat}
              selectedMove={defenderResults}
            />
          </section>

          {calculator.loadError ? <p className={styles.errorBanner}>{calculator.loadError}</p> : null}
          {calculator.calculationError ? <p className={styles.errorBanner}>{calculator.calculationError}</p> : null}
        </div>
      </main>
    </>
  )
}
