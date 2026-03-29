'use client'

import SiteHeader from '../home/SiteHeader'
import { useTeamBuilder } from '../../hooks/useTeamBuilder'
import pageStyles from '../../page.module.css'
import TeamAnalysis from './TeamAnalysis'
import TeamWorkspace from './TeamWorkspace'
import styles from './TeamBuilderPage.module.css'

export default function TeamBuilderPage() {
  const teamBuilder = useTeamBuilder()

  return (
    <>
      <SiteHeader />

      <main className={pageStyles.pageShell}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <h2>Pokemon Teams Lab</h2>
            <p className={styles.lead}>
              Monta un unico equipo de seis Pokemon y revisa con claridad que tipos rivales lo castigan mas y cuales
              tiene mejor cubiertos.
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
              <strong>Tipos arriba</strong>
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
            searchQuery={teamBuilder.searchQuery}
            searchResults={teamBuilder.searchResults}
            selectedSlotIndex={teamBuilder.selectedSlotIndex}
            setSearchQuery={teamBuilder.setSearchQuery}
            teamMembers={teamBuilder.teamMembers}
          />

          <TeamAnalysis
            isTypeChartLoading={teamBuilder.isTypeChartLoading}
            teamMembers={teamBuilder.teamMembers}
            teamSummary={teamBuilder.teamSummary}
            typeAnalysis={teamBuilder.typeAnalysis}
            typeChartReady={teamBuilder.typeChartReady}
          />
        </section>

        {teamBuilder.loadError ? <p className={styles.errorBanner}>{teamBuilder.loadError}</p> : null}
      </main>
    </>
  )
}
