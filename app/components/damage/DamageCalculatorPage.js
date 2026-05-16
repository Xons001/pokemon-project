'use client'

import { useBattleAnalysis } from '../../hooks/useBattleAnalysis'
import pageStyles from '../../page.module.css'
import SiteHeader from '../home/SiteHeader'
import PokemonImage from '../teams/PokemonImage'
import styles from './DamageCalculatorPage.module.css'

function TeamStrip({ title, members, emptyText }) {
  return (
    <section className={styles.teamStrip}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.kicker}>{title}</p>
          <h3>{members.filter(Boolean).length}/6</h3>
        </div>
      </div>

      <div className={styles.teamMiniGrid}>
        {members.map((pokemon, index) => (
          <div key={`${title}-${pokemon?.slug ?? 'empty'}-${index}`} className={styles.teamMiniSlot}>
            {pokemon ? (
              <>
                <PokemonImage src={pokemon.thumb} alt={pokemon.name} width={46} height={46} />
                <span>{pokemon.name}</span>
              </>
            ) : (
              <span className={styles.teamMiniEmpty}>{emptyText}</span>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

function OpponentBuilder({ analysis }) {
  return (
    <section className={styles.panel}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.kicker}>Equipo rival</p>
          <h3>Seleccion manual</h3>
        </div>

        <button type="button" className={styles.secondaryButton} onClick={analysis.clearOpponentTeam}>
          Limpiar
        </button>
      </div>

      <label className={styles.searchField}>
        <span>Buscar Pokemon Champions</span>
        <input
          type="search"
          value={analysis.searchQuery}
          onChange={(event) => analysis.setSearchQuery(event.target.value)}
          placeholder="Dragapult, water, intimidate..."
        />
      </label>

      <div className={styles.opponentSlots}>
        {analysis.analysis.opponentMembers.map((pokemon, index) => {
          const isSelected = index === analysis.selectedOpponentSlot

          return (
            <button
              key={`opponent-slot-${index}`}
              type="button"
              className={[styles.opponentSlot, isSelected ? styles.opponentSlotActive : null].filter(Boolean).join(' ')}
              onClick={() => analysis.setSelectedOpponentSlot(index)}
            >
              {pokemon ? (
                <>
                  <PokemonImage src={pokemon.thumb} alt={pokemon.name} width={42} height={42} />
                  <span>{pokemon.name}</span>
                </>
              ) : (
                <span>Hueco {index + 1}</span>
              )}
            </button>
          )
        })}
      </div>

      <div className={styles.catalogGrid}>
        {analysis.pokemonOptions.map((pokemon) => (
          <button
            key={pokemon.slug}
            type="button"
            className={styles.catalogButton}
            onClick={() => analysis.setOpponentPokemon(analysis.selectedOpponentSlot, pokemon.slug)}
          >
            <PokemonImage src={pokemon.thumb} alt={pokemon.name} width={42} height={42} />
            <span>
              <strong>{pokemon.name}</strong>
              <small>{pokemon.types.join(' / ') || pokemon.id}</small>
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

function ImportPanel({ analysis }) {
  return (
    <section className={styles.panel}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.kicker}>Importar rival</p>
          <h3>Showdown / Pokepaste</h3>
        </div>
      </div>

      <textarea
        className={styles.importTextarea}
        value={analysis.opponentImportText}
        onChange={(event) => analysis.setOpponentImportText(event.target.value)}
        placeholder="Flutter Mane @ Booster Energy&#10;Ability: Protosynthesis&#10;Timid Nature&#10;- Moonblast"
        spellCheck="false"
      />

      <div className={styles.buttonRow}>
        <button type="button" className={styles.primaryButton} onClick={analysis.importOpponentFromText}>
          Importar como rival
        </button>
        <button type="button" className={styles.secondaryButton} onClick={analysis.refreshOwnTeamFromStorage}>
          Recargar mi equipo
        </button>
      </div>

      {analysis.opponentImportMessage ? <p className={styles.inlineNotice}>{analysis.opponentImportMessage}</p> : null}
    </section>
  )
}

function BringFourPanel({ analysis }) {
  const plan = analysis.analysis.bringFourPlan
  const leadPlan = plan.leadPlan

  function renderLeadSlot(item, side, tools) {
    if (!item) {
      return (
        <article className={styles.leadSlotCard}>
          <span className={styles.leadSide}>{side}</span>
          <p className={styles.emptyState}>Completa la seleccion para definir este lead.</p>
        </article>
      )
    }

    return (
      <article className={styles.leadSlotCard}>
        <span className={styles.leadSide}>{side}</span>
        <div className={styles.bringFourHeader}>
          <span className={styles.bringFourIndex}>{side === 'Izquierda' ? '1' : '2'}</span>
          <PokemonImage src={item.entry.pokemon.thumb} alt={item.entry.pokemon.name} width={52} height={52} />
          <div>
            <strong>{item.entry.pokemon.name}</strong>
            <small>{item.entry.pokemon.types.join(' / ')} | Vel real {item.entry.battleStats?.speed ?? item.entry.pokemon.speed}</small>
          </div>
        </div>
        <p className={styles.leadReason}>
          Pasiva: {item.entry.moveProfile.passiveLabel}
          {item.entry.battleStats ? ` | ${item.entry.battleStats.attack}/${item.entry.battleStats.defense}/${item.entry.battleStats.specialAttack}/${item.entry.battleStats.specialDefense}/${item.entry.battleStats.speed}` : ''}
          {tools.length ? ` | Clave: ${tools.slice(0, 3).join(', ')}` : ''}
        </p>
      </article>
    )
  }

  return (
    <section className={styles.panel}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.kicker}>Seleccion de combate</p>
          <h3>Cuatro recomendados</h3>
        </div>
        <span className={styles.badge}>{plan.selected.length}/4</span>
      </div>

      <p className={styles.panelHint}>{plan.summary}</p>

      <div className={styles.openingPair}>
        {renderLeadSlot(leadPlan.left, 'Izquierda', leadPlan.leftTools)}
        {renderLeadSlot(leadPlan.right, 'Derecha', leadPlan.rightTools)}
      </div>

      <p className={styles.speedNote}>{leadPlan.speedNote}</p>
      <p className={styles.speedNote}>{leadPlan.speedMode}</p>

      <div className={styles.bringFourList}>
        {plan.selected.length ? (
          plan.selected.map((item, index) => {
            const utilityLabels = [
              ...item.entry.moveProfile.utilityMoves.map((move) => move.label),
              item.entry.moveProfile.abilityUtility?.label,
            ].filter(Boolean)

            return (
              <article key={item.entry.pokemon.slug} className={styles.bringFourCard}>
                <div className={styles.bringFourHeader}>
                  <span className={styles.bringFourIndex}>{index + 1}</span>
                  <PokemonImage src={item.entry.pokemon.thumb} alt={item.entry.pokemon.name} width={52} height={52} />
                  <div>
                    <strong>{item.entry.pokemon.name}</strong>
                    <small>{item.entry.pokemon.types.join(' / ')}</small>
                  </div>
                </div>

                <div className={styles.compactCardMeta}>
                  <span>{item.entry.moveProfile.passiveLabel}</span>
                  <span>{item.entry.investmentProfile?.style ?? 'sin inversion clara'}</span>
                  <span>Vel {item.entry.battleStats?.speed ?? item.entry.pokemon.speed}</span>
                  {utilityLabels.slice(0, 2).map((label) => (
                    <span key={`${item.entry.pokemon.slug}-${label}`}>{label}</span>
                  ))}
                  {item.entry.moveProfile.fieldBoostedMoves.slice(0, 1).map((move) => (
                    <span key={`${item.entry.pokemon.slug}-${move.moveSlug}`}>{move.label}</span>
                  ))}
                </div>

                <p className={styles.compactCoverage}>
                  {item.covers.length
                    ? `Cubre: ${item.covers.slice(0, 3).map((cover) => cover.opponent.name).join(', ')}`
                    : 'Sin cobertura clara contra los seis rivales.'}
                </p>
              </article>
            )
          })
        ) : (
          <p className={styles.emptyState}>Selecciona tus seis y los seis rivales para generar la propuesta de cuatro.</p>
        )}
      </div>

      {plan.uncoveredThreats.length ? (
        <p className={styles.inlineNotice}>Amenazas menos cubiertas por estos cuatro: {plan.uncoveredThreats.join(', ')}.</p>
      ) : null}
    </section>
  )
}

function RivalAttackPlan({ analysis }) {
  const profiles = analysis.analysis.bringFourPlan.attackProfiles

  return (
    <section className={styles.panel}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.kicker}>Como nos atacan</p>
          <h3>Lectura rival</h3>
        </div>
      </div>

      <div className={styles.attackPlanList}>
        {profiles.length ? (
          profiles.map((profile) => (
            <article key={profile.opponent.slug} className={styles.attackPlanCard}>
              <div className={styles.attackPlanHeader}>
                <PokemonImage src={profile.opponent.thumb} alt={profile.opponent.name} width={44} height={44} />
                <div>
                  <strong>{profile.opponent.name}</strong>
                  <small>{profile.threatLabel} | {profile.likelyStyle} | {profile.speedBand}</small>
                </div>
              </div>

              <div className={styles.typeStack}>
                {profile.stabTypes.map((type) => (
                  <span key={`${profile.opponent.slug}-${type.typeKey}`}>{type.label}</span>
                ))}
              </div>

              {[...profile.possiblePriorityMoves, ...profile.possibleUtilityMoves].length ? (
                <div className={styles.controlPreview}>
                  <span>Opciones que puede traer</span>
                  <div>
                    {[...profile.possiblePriorityMoves, ...profile.possibleUtilityMoves].slice(0, 5).map((move) => (
                      <strong key={`${profile.opponent.slug}-${move.moveSlug}`}>{move.label}</strong>
                    ))}
                  </div>
                </div>
              ) : null}

              <p className={styles.panelHint}>
                {profile.vulnerableTargets.length
                  ? `Puede castigar a ${profile.vulnerableTargets.map((target) => `${target.pokemonName} ${analysis.formatMultiplier(target.multiplier)}`).join(', ')}.`
                  : 'No detecta un castigo por STAB especialmente claro contra tu equipo.'}
              </p>
            </article>
          ))
        ) : (
          <p className={styles.emptyState}>Cuando selecciones rivales, aqui aparecera como pueden atacarte y que debes respetar.</p>
        )}
      </div>
    </section>
  )
}

function OpponentPredictionPanel({ analysis }) {
  const plan = analysis.analysis.bringFourPlan.opponentSelectionPlan

  function renderOpponentSlot(profile, index, label) {
    if (!profile) {
      return null
    }

    const tools = [...profile.possiblePriorityMoves, ...profile.possibleUtilityMoves].slice(0, 3)

    return (
      <article key={`${label}-${profile.opponent.slug}`} className={styles.predictionCard}>
        <span className={styles.leadSide}>{label} {index + 1}</span>
        <div className={styles.attackPlanHeader}>
          <PokemonImage src={profile.opponent.thumb} alt={profile.opponent.name} width={44} height={44} />
          <div>
            <strong>{profile.opponent.name}</strong>
            <small>{profile.threatLabel} | Vel base {profile.opponent.speed}</small>
          </div>
        </div>
        {tools.length ? (
          <div className={styles.compactCardMeta}>
            {tools.map((tool) => (
              <span key={`${profile.opponent.slug}-${tool.moveSlug}`}>{tool.label}</span>
            ))}
          </div>
        ) : null}
      </article>
    )
  }

  return (
    <section className={styles.panel}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.kicker}>Prediccion rival</p>
          <h3>Sus cuatro probables</h3>
        </div>
        <span className={styles.badge}>{plan.selected.length}/4</span>
      </div>

      <div className={styles.predictionGrid}>
        {plan.leads.map((profile, index) => renderOpponentSlot(profile, index, 'Lead'))}
        {plan.bench.map((profile, index) => renderOpponentSlot(profile, index, 'Banco'))}
      </div>

      {plan.notes.length ? (
        <div className={styles.noteStack}>
          {plan.notes.map((note) => (
            <p key={note} className={styles.speedNote}>{note}</p>
          ))}
        </div>
      ) : (
        <p className={styles.emptyState}>Selecciona rivales para predecir que cuatro puede sacar el contrario.</p>
      )}
    </section>
  )
}

function TeamToolsPanel({ analysis }) {
  const membersWithTools = analysis.analysis.bringFourPlan.selected.map((item) => item.entry)

  return (
    <section className={styles.panel}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.kicker}>Pasivas y recursos</p>
          <h3>Tu plan activo</h3>
        </div>
      </div>

      <div className={styles.toolsList}>
        {membersWithTools.length ? (
          membersWithTools.map((entry) => (
            <article key={`tools-${entry.pokemon.slug}`} className={styles.toolsCard}>
              <strong>{entry.pokemon.name}</strong>
              <small>Pasiva: {entry.moveProfile.passiveLabel}</small>
              <small>
                Stats reales: HP {entry.battleStats?.hp} / Atk {entry.battleStats?.attack} / Def {entry.battleStats?.defense} / SpA {entry.battleStats?.specialAttack} / SpD {entry.battleStats?.specialDefense} / Spe {entry.battleStats?.speed}
              </small>
              <small>EVs: {entry.investmentProfile?.style ?? 'sin inversion clara'} ({entry.investmentProfile?.totalEvs ?? 0}/66)</small>
              <div className={styles.metaSprites}>
                {entry.moveProfile.fieldSynergy ? <span>{entry.moveProfile.fieldSynergy.label}</span> : null}
                {entry.moveProfile.selectedMoves.map((move) => (
                  <span key={`${entry.pokemon.slug}-tool-${move.moveSlug}`}>{move.label}</span>
                ))}
              </div>
            </article>
          ))
        ) : (
          <p className={styles.emptyState}>Todavia no hay cuatro recomendados para listar recursos.</p>
        )}
      </div>
    </section>
  )
}

function AnswerCard({ plan, analysis }) {
  const bestAnswer = plan.bestAnswer
  const bestAnswerUtility = bestAnswer
    ? [
        ...bestAnswer.utilityMoves.map((move) => move.label),
        bestAnswer.abilityUtility?.label,
      ].filter(Boolean)
    : []

  return (
    <article className={styles.answerCard}>
      <div className={styles.answerHeader}>
        <div className={styles.answerPokemon}>
          <PokemonImage src={plan.opponent.thumb} alt={plan.opponent.name} width={58} height={58} />
          <div>
            <p className={styles.kicker}>{plan.threatLabel}</p>
            <h3>{plan.opponent.name}</h3>
            <small>{plan.opponent.types.join(' / ')}</small>
          </div>
        </div>
        <span className={styles.threatScore}>{Math.round(plan.threatScore)}</span>
      </div>

      {bestAnswer ? (
        <div className={styles.bestAnswer}>
          <div>
            <span>Mejor respuesta</span>
            <strong>{bestAnswer.pokemonName}</strong>
            <small>{bestAnswer.label}</small>
          </div>
          <PokemonImage src={bestAnswer.pokemon.thumb} alt={bestAnswer.pokemonName} width={54} height={54} />
        </div>
      ) : (
        <p className={styles.emptyState}>No hay suficientes datos de tu equipo para recomendar respuesta.</p>
      )}

      <div className={styles.answerMetrics}>
        {plan.answers.map((answer) => (
          <div key={`${plan.opponent.slug}-${answer.pokemonSlug}`} className={styles.metricRow}>
            <strong>{answer.pokemonName}</strong>
            <span>{analysis.formatMultiplier(answer.pressureMultiplier)} ofensivo</span>
            <span>{analysis.formatMultiplier(answer.worstIncoming)} recibido</span>
            <small>
              {answer.pressureMoveName
                ? `${answer.pressureMoveName} (${analysis.formatType(answer.pressureType)})`
                : analysis.formatType(answer.pressureType)}
            </small>
          </div>
        ))}
      </div>

      {bestAnswer?.moves?.length ? (
        <div className={styles.movePreview}>
          <span>Moveset usado para leer el matchup</span>
          <div>
            {bestAnswer.moves.map((move) => (
              <strong key={`${bestAnswer.pokemonSlug}-${move.moveSlug}`}>{move.label}</strong>
            ))}
          </div>
        </div>
      ) : null}

      {bestAnswerUtility.length ? (
        <div className={styles.controlPreview}>
          <span>Control tactico</span>
          <div>
            {bestAnswerUtility.map((label) => (
              <strong key={`${bestAnswer.pokemonSlug}-${label}`}>{label}</strong>
            ))}
          </div>
        </div>
      ) : null}

      <p className={styles.playHint}>
        {bestAnswer
          ? `${bestAnswer.pokemonName}: ${bestAnswer.bestIncoming === 0 ? 'inmunidad disponible' : `peor entrada ${analysis.formatMultiplier(bestAnswer.worstIncoming)}`}; presion ${analysis.formatMultiplier(bestAnswer.pressureMultiplier)} con ${bestAnswer.pressureMoveName ?? analysis.formatMoveOrType(bestAnswer.pressureType)}${bestAnswer.canFlipSpeed ? '; puede girar la velocidad' : ''}.`
          : 'Completa tu equipo o el rival para generar una lectura.'}
      </p>
    </article>
  )
}

function AnalysisPanel({ analysis }) {
  return (
    <section className={styles.analysisGrid}>
      <article className={styles.summaryCard}>
        <p className={styles.kicker}>Plan de combate</p>
        <h3>{analysis.analysis.summary.highThreats ? 'Hay amenazas que respetar' : 'Partida controlable'}</h3>
        <div className={styles.summaryStats}>
          <span>{analysis.analysis.summary.ownCount}/6 tuyos</span>
          <span>{analysis.analysis.summary.opponentCount}/6 rivales</span>
          <span>{analysis.analysis.summary.answeredThreats} cubiertos</span>
        </div>
      </article>

      <article className={styles.summaryCard}>
        <p className={styles.kicker}>Leads sugeridos</p>
        <div className={styles.leadList}>
          {analysis.analysis.leadCandidates.length ? (
            analysis.analysis.leadCandidates.map((lead) => (
              <span key={lead.pokemon.slug} className={styles.leadChip}>
                {lead.pokemon.name}
                <small>presion media x{lead.averagePressure.toFixed(1)}</small>
                {lead.utilityMoves.length ? <small>{lead.utilityMoves.map((move) => move.label).join(' / ')}</small> : null}
              </span>
            ))
          ) : (
            <span>Completa equipos para estimar leads.</span>
          )}
        </div>
      </article>

      <article className={styles.summaryCard}>
        <p className={styles.kicker}>Lectura rival</p>
        <div className={styles.typeStack}>
          {analysis.analysis.opponentTypeStack.length ? (
            analysis.analysis.opponentTypeStack.map((entry) => (
              <span key={entry.typeKey}>
                {entry.label} x{entry.count}
              </span>
            ))
          ) : (
            <span>Sin composicion rival todavia.</span>
          )}
        </div>
      </article>
    </section>
  )
}

export default function DamageCalculatorPage() {
  const analysis = useBattleAnalysis()

  return (
    <>
      <SiteHeader />

      <main className={pageStyles.pageShell}>
        <div className={styles.calculatorShell}>
          <section className={styles.hero}>
            <div className={styles.heroCopy}>
              <p className={styles.kicker}>Preparacion de combate</p>
              <h2>Analisis de equipos</h2>
              <p>
                Cruza tu equipo guardado con los seis rivales posibles para decidir que cuatro Pokemon sacar, que pasivas aprovechar y que amenazas
                debes respetar durante el combate.
              </p>
            </div>

            <div className={styles.heroStats}>
              <div className={styles.heroStatCard}>
                <span>Formato</span>
                <strong>{analysis.activeFormat?.key?.toUpperCase() ?? 'Meta'}</strong>
                <small>{analysis.activeFormat?.name ?? 'Scope competitivo activo'}</small>
              </div>
              <div className={styles.heroStatCard}>
                <span>Datos</span>
                <strong>{analysis.isLoading ? 'Cargando' : 'Listo'}</strong>
                <small>Local o Vercel segun entorno</small>
              </div>
              <div className={styles.heroStatCard}>
                <span>Rival</span>
                <strong>{analysis.analysis.summary.opponentCount}/6</strong>
                <small>Seleccionados para analizar</small>
              </div>
            </div>
          </section>

          <div className={styles.compactTeamsGrid}>
            <TeamStrip title="Mi equipo guardado" members={analysis.analysis.ownMembers} emptyText="Libre" />
            <TeamStrip title="Equipo rival" members={analysis.analysis.opponentMembers} emptyText="Rival" />
          </div>

          <AnalysisPanel analysis={analysis} />

          <section className={styles.workspaceGrid}>
            <div className={styles.leftColumn}>
              <div className={styles.opponentPrepGrid}>
                <OpponentBuilder analysis={analysis} />
                <TeamToolsPanel analysis={analysis} />
              </div>
              <ImportPanel analysis={analysis} />
            </div>

            <div className={styles.rightColumn}>
              <OpponentPredictionPanel analysis={analysis} />
            </div>
          </section>

          <section className={styles.strategyCompareGrid}>
            <BringFourPanel analysis={analysis} />
            <RivalAttackPlan analysis={analysis} />
          </section>

          <section className={styles.answersGrid}>
            {analysis.analysis.opponentPlans.length ? (
              analysis.analysis.opponentPlans.map((plan) => (
                <AnswerCard key={plan.opponent.slug} plan={plan} analysis={analysis} />
              ))
            ) : (
              <p className={styles.emptyState}>Selecciona o importa el equipo rival para ver respuestas y plan de juego.</p>
            )}
          </section>

          {analysis.loadError ? <p className={styles.errorBanner}>{analysis.loadError}</p> : null}
        </div>
      </main>
    </>
  )
}
