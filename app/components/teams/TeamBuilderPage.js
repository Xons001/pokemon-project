'use client'

import PokemonCardSection from '../home/PokemonCardSection'
import SiteHeader from '../home/SiteHeader'
import { useTeamBuilder } from '../../hooks/useTeamBuilder'
import pageStyles from '../../page.module.css'
import TeamAnalysis from './TeamAnalysis'
import TeamWorkspace from './TeamWorkspace'
import styles from './TeamBuilderPage.module.css'

export default function TeamBuilderPage() {
  const teamBuilder = useTeamBuilder()
  const leaderPokemon = teamBuilder.leaderPokemon

  return (
    <>
      <SiteHeader />

      <main className={pageStyles.pageShell}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <h2>Pokemon Teams Lab</h2>
            <p className={styles.lead}>
              Construye un unico equipo de seis Pokemon, define un lider y revisa en una sola tabla que tipos rivales
              lo presionan mas y cuales quedan mejor cubiertos.
            </p>
          </div>

          <div className={styles.heroStats}>
            <div className={styles.statCard}>
              <span>Equipo guardado</span>
              <strong>1</strong>
            </div>
            <div className={styles.statCard}>
              <span>Huecos</span>
              <strong>6</strong>
            </div>
            <div className={styles.statCard}>
              <span>Tabla</span>
              <strong>x4 / x2 / x1/2</strong>
            </div>
          </div>
        </section>

        <section className={styles.layout}>
          <TeamWorkspace
            activeTeam={teamBuilder.activeTeam}
            catalogCount={teamBuilder.catalogCount}
            isCatalogLoading={teamBuilder.isCatalogLoading}
            isPokemonLoading={teamBuilder.isPokemonLoading}
            notice={teamBuilder.notice}
            onAddPokemon={teamBuilder.addPokemonToTeam}
            onClearTeam={teamBuilder.clearTeam}
            onRemovePokemon={teamBuilder.removePokemonFromTeam}
            onRenameTeam={teamBuilder.renameTeam}
            onSelectSlot={teamBuilder.selectSlot}
            onSetLeaderSlot={teamBuilder.setLeaderSlot}
            searchQuery={teamBuilder.searchQuery}
            searchResults={teamBuilder.searchResults}
            selectedSlotIndex={teamBuilder.selectedSlotIndex}
            setSearchQuery={teamBuilder.setSearchQuery}
            teamMembers={teamBuilder.teamMembers}
          />

          <TeamAnalysis
            activeTeam={teamBuilder.activeTeam}
            isTypeChartLoading={teamBuilder.isTypeChartLoading}
            teamMembers={teamBuilder.teamMembers}
            teamSummary={teamBuilder.teamSummary}
            typeAnalysis={teamBuilder.typeAnalysis}
            typeChartReady={teamBuilder.typeChartReady}
          />
        </section>

        {leaderPokemon ? <PokemonCardSection pokemon={leaderPokemon} eyebrow="Lider del equipo" /> : null}

        {teamBuilder.loadError ? <p className={styles.errorBanner}>{teamBuilder.loadError}</p> : null}
      </main>
    </>
  )
}
