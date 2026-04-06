'use client'

import Image from 'next/image'

import { useI18n } from '../i18n/LanguageProvider'
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

function MoveListCard({ sideKey, title, pokemon, results, selectedMove, onSelectMove, t }) {
  return (
    <article className={styles.moveResultsCard}>
      <div className={styles.moveResultsHeader}>
        <div>
          <p className={styles.kicker}>{title}</p>
          <h3>{pokemon?.name ?? t('damagePage.noPokemon')}</h3>
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
            const isActive = selectedMove.side === sideKey && selectedMove.slot === result.slot

            return (
              <button
                key={`${title}-${result.slot}-${result.moveSlug}`}
                type="button"
                className={[styles.moveResultRow, isActive ? styles.moveResultRowActive : null].filter(Boolean).join(' ')}
                onClick={() => onSelectMove(sideKey, result.slot)}
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
          <p className={styles.emptyState}>{t('damagePage.moveListEmpty')}</p>
        )}
      </div>
    </article>
  )
}

export default function DamageCalculatorPage() {
  const { t } = useI18n()
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
                <p className={styles.kicker}>{t('damagePage.scopeKicker')}</p>
              </div>

              <h2>{t('damagePage.title')}</h2>
              <p>{t('damagePage.description')}</p>
            </div>

            <div className={styles.heroStats}>
              <div className={styles.heroStatCard}>
                <span>{t('damagePage.stats.format')}</span>
                <strong>{calculator.activeFormat?.headline ?? t('damagePage.stats.loading')}</strong>
                <small>{calculator.activeFormat?.name ?? t('damagePage.stats.waiting')}</small>
              </div>
              <div className={styles.heroStatCard}>
                <span>{t('damagePage.stats.mode')}</span>
                <strong>{calculator.activeFormat?.battleModeLabel ?? t('damage.battleMode.singles')}</strong>
                <small>{t('damagePage.stats.localScope')}</small>
              </div>
              <div className={styles.heroStatCard}>
                <span>{t('damagePage.stats.state')}</span>
                <strong>{calculator.isCalculating ? t('damagePage.stats.calculating') : selectedCalculation ? t('damagePage.stats.ready') : t('damagePage.stats.configure')}</strong>
                <small>{calculator.calculationError ? t('damagePage.stats.checkSet') : t('damagePage.stats.synced')}</small>
              </div>
            </div>
          </section>

          <section className={styles.overviewGrid}>
            <MoveListCard
              sideKey="attacker"
              title={t('damagePage.attacker')}
              pokemon={calculator.attackerPokemon}
              results={attackerResults}
              selectedMove={calculator.state.selectedMove}
              onSelectMove={calculator.selectMove}
              t={t}
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
                  <strong>{calculator.attackerPokemon?.name ?? t('damagePage.attacker')}</strong>
                  <small>{calculator.attackerPokemon?.types?.join(' / ') ?? t('damagePage.noData')}</small>
                </div>

                <div className={styles.summaryCenter}>
                  <span className={styles.summaryModeBadge}>{calculator.activeFormat?.battleModeLabel ?? t('damage.battleMode.singles')}</span>
                  <strong>{t('damagePage.versus')}</strong>
                  <small>{calculator.activeFormat?.headline ?? t('damagePage.title')}</small>
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
                  <strong>{calculator.defenderPokemon?.name ?? t('damagePage.defender')}</strong>
                  <small>{calculator.defenderPokemon?.types?.join(' / ') ?? t('damagePage.noData')}</small>
                </div>
              </div>

              {selectedCalculation ? (
                <div className={styles.summaryDetails}>
                  <p className={styles.summaryMoveTitle}>
                    {t('damagePage.usesMove', {
                      source: selectedMoveSourcePokemon?.name ?? t('damagePage.attacker'),
                      move: selectedCalculation.moveName,
                      target: selectedMoveTargetPokemon?.name ?? t('damagePage.defender'),
                    }).split(selectedCalculation.moveName)[0]}
                    <strong>{selectedCalculation.moveName}</strong>
                    {t('damagePage.usesMove', {
                      source: selectedMoveSourcePokemon?.name ?? t('damagePage.attacker'),
                      move: selectedCalculation.moveName,
                      target: selectedMoveTargetPokemon?.name ?? t('damagePage.defender'),
                    }).split(selectedCalculation.moveName)[1] ?? ''}
                  </p>
                  <p className={styles.summaryDescription}>{selectedCalculation.fullDescription}</p>
                  <div className={styles.summaryMetrics}>
                    <span className={styles.summaryMetricPrimary}>{selectedCalculation.rangeLabel}</span>
                    <span className={styles.summaryMetricSecondary}>{selectedCalculation.koText || t('damagePage.summaryKoFallback')}</span>
                  </div>
                  {selectedCalculation.rolls.length ? (
                    <p className={styles.summaryRolls}>
                      {t('damagePage.possibleDamage', { rolls: formatRolls(selectedCalculation.rolls) })}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className={styles.emptyState}>{t('damagePage.selectMoveToCalculate')}</p>
              )}
            </article>

            <MoveListCard
              sideKey="defender"
              title={t('damagePage.defender')}
              pokemon={calculator.defenderPokemon}
              results={defenderResults}
              selectedMove={calculator.state.selectedMove}
              onSelectMove={calculator.selectMove}
              t={t}
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
