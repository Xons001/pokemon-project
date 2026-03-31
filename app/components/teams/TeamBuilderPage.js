'use client'

import SiteHeader from '../home/SiteHeader'
import { useTeamBuilder } from '../../hooks/useTeamBuilder'
import pageStyles from '../../page.module.css'
import TeamAnalysis from './TeamAnalysis'
import TeamWorkspace from './TeamWorkspace'
import styles from './TeamBuilderPage.module.css'

export default function TeamBuilderPage() {
  const teamBuilder = useTeamBuilder()
  const filledSlots = teamBuilder.activeTeam.slots.filter((slot) => slot.pokemonSlug).length
  const configuredMoves = teamBuilder.activeTeam.slots.reduce(
    (total, slot) => total + slot.moveSlugs.filter(Boolean).length,
    0
  )

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
              <span>Formato</span>
              <strong>{teamBuilder.activeTeam.formatKey.toUpperCase()}</strong>
            </div>
            <div className={styles.statCard}>
              <span>Huecos ocupados</span>
              <strong>{filledSlots}/6</strong>
            </div>
            <div className={styles.statCard}>
              <span>Moveset</span>
              <strong>{configuredMoves}/24</strong>
            </div>
          </div>
        </section>

        <section className={styles.layout}>
          <TeamWorkspace
            activeTeam={teamBuilder.activeTeam}
            catalogCount={teamBuilder.catalogCount}
            isCatalogLoading={teamBuilder.isCatalogLoading}
            isMovesLoading={teamBuilder.isMovesLoading}
            isPokemonLoading={teamBuilder.isPokemonLoading}
            notice={teamBuilder.notice}
            onAddPokemon={teamBuilder.addPokemonToTeam}
            onAssignEffortValue={teamBuilder.assignEffortValue}
            onAssignIndividualValue={teamBuilder.assignIndividualValue}
            onAssignAbilityToSlot={teamBuilder.assignAbilityToSlot}
            onAssignMoveToSlot={teamBuilder.assignMoveToSlot}
            onClearTeam={teamBuilder.clearTeam}
            onClearMovesFromSlot={teamBuilder.clearMovesFromSlot}
            onRemovePokemon={teamBuilder.removePokemonFromTeam}
            onResetStatSpread={teamBuilder.resetStatSpread}
            onRenameTeam={teamBuilder.renameTeam}
            onSelectSlot={teamBuilder.selectSlot}
            searchQuery={teamBuilder.searchQuery}
            searchResults={teamBuilder.searchResults}
            selectedPokemonDetail={teamBuilder.selectedPokemonDetail}
            selectedPokemonMoves={teamBuilder.selectedPokemonMoves}
            selectedSlot={teamBuilder.selectedSlot}
            selectedSlotIndex={teamBuilder.selectedSlotIndex}
            setSearchQuery={teamBuilder.setSearchQuery}
            teamMembers={teamBuilder.teamMembers}
          />

          <TeamAnalysis
            competitiveFormats={teamBuilder.competitiveFormats}
            isFormatsLoading={teamBuilder.isFormatsLoading}
            isTypeChartLoading={teamBuilder.isTypeChartLoading}
            isValidationDirty={teamBuilder.isValidationDirty}
            isValidationLoading={teamBuilder.isValidationLoading}
            teamMembers={teamBuilder.teamMembers}
            teamSummary={teamBuilder.teamSummary}
            typeAnalysis={teamBuilder.typeAnalysis}
            typeChartReady={teamBuilder.typeChartReady}
            validationError={teamBuilder.validationError}
            validationResult={teamBuilder.validationResult}
            selectedFormatKey={teamBuilder.activeTeam.formatKey}
            onSetFormatKey={teamBuilder.setFormatKey}
            onValidateTeam={teamBuilder.runValidation}
          />
        </section>

        {teamBuilder.loadError ? <p className={styles.errorBanner}>{teamBuilder.loadError}</p> : null}
      </main>
    </>
  )
}
