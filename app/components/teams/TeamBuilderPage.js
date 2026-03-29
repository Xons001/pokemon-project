'use client'

import PokemonCardSection from '../home/PokemonCardSection'
import SiteHeader from '../home/SiteHeader'
import { useTeamBuilder } from '../../hooks/useTeamBuilder'
import pageStyles from '../../page.module.css'
import TeamAnalysis from './TeamAnalysis'
import TeamTemplatesPanel from './TeamTemplatesPanel'
import TeamWorkspace from './TeamWorkspace'
import styles from './TeamBuilderPage.module.css'

export default function TeamBuilderPage() {
  const teamBuilder = useTeamBuilder()
  const leaderPokemon =
    teamBuilder.teamMembers[teamBuilder.activeTemplate?.leaderSlot ?? 0] ??
    teamBuilder.teamMembers.find(Boolean) ??
    null

  return (
    <>
      <SiteHeader />

      <main className={pageStyles.pageShell}>
        <section className={styles.hero}>
          <div>
            <p className={styles.kicker}>Pokemon Teams Lab</p>
            <h2>Guarda cinco plantillas y descubre como encajan sus tipos.</h2>
            <p className={styles.lead}>
              Construye equipos de seis Pokemon, marca un lider, guarda varias composiciones y compara que plantilla
              queda mas equilibrada frente a las debilidades del metajuego.
            </p>
          </div>

          <div className={styles.heroStats}>
            <div className={styles.statCard}>
              <span>Plantillas</span>
              <strong>5</strong>
            </div>
            <div className={styles.statCard}>
              <span>Huecos por equipo</span>
              <strong>6</strong>
            </div>
            <div className={styles.statCard}>
              <span>Analisis</span>
              <strong>Tipos reales</strong>
            </div>
          </div>
        </section>

        <section className={styles.layout}>
          <TeamTemplatesPanel
            activeTemplateId={teamBuilder.activeTemplate?.id}
            strongestTemplate={teamBuilder.strongestTemplate}
            templateSummaries={teamBuilder.templateSummaries}
            onSelectTemplate={teamBuilder.selectTemplate}
          />

          <TeamWorkspace
            activeTemplate={teamBuilder.activeTemplate}
            catalogCount={teamBuilder.catalogCount}
            isCatalogLoading={teamBuilder.isCatalogLoading}
            isPokemonLoading={teamBuilder.isPokemonLoading}
            notice={teamBuilder.notice}
            onAddPokemon={teamBuilder.addPokemonToTeam}
            onClearActiveTemplate={teamBuilder.clearActiveTemplate}
            onRemovePokemon={teamBuilder.removePokemonFromTeam}
            onRenameActiveTemplate={teamBuilder.renameActiveTemplate}
            onSelectSlot={teamBuilder.selectSlot}
            onSetLeaderSlot={teamBuilder.setLeaderSlot}
            searchQuery={teamBuilder.searchQuery}
            searchResults={teamBuilder.searchResults}
            selectedSlotIndex={teamBuilder.selectedSlotIndex}
            setSearchQuery={teamBuilder.setSearchQuery}
            teamMembers={teamBuilder.teamMembers}
          />

          <TeamAnalysis
            activeTemplate={teamBuilder.activeTemplate}
            activeTemplateSummary={teamBuilder.activeTemplateSummary}
            isTypeChartLoading={teamBuilder.isTypeChartLoading}
            rankedResistances={teamBuilder.rankedResistances}
            rankedWeaknesses={teamBuilder.rankedWeaknesses}
            strongestTemplate={teamBuilder.strongestTemplate}
            teamMembers={teamBuilder.teamMembers}
            templateSummaries={teamBuilder.templateSummaries}
            typeAnalysis={teamBuilder.typeAnalysis}
            typeChartReady={teamBuilder.typeChartReady}
          />
        </section>

        {leaderPokemon ? <PokemonCardSection pokemon={leaderPokemon} /> : null}

        {teamBuilder.loadError ? <p className={styles.errorBanner}>{teamBuilder.loadError}</p> : null}
      </main>
    </>
  )
}
