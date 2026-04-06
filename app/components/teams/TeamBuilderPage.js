'use client'

import { useI18n } from '../i18n/LanguageProvider'
import SiteHeader from '../home/SiteHeader'
import { useTeamBuilder } from '../../hooks/useTeamBuilder'
import pageStyles from '../../page.module.css'
import TeamAnalysis from './TeamAnalysis'
import TeamSuggestions from './TeamSuggestions'
import TeamValidator from './TeamValidator'
import TeamWorkspace from './TeamWorkspace'
import styles from './TeamBuilderPage.module.css'

export default function TeamBuilderPage() {
  const { t } = useI18n()
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
            <h2>{t('team.page.title')}</h2>
            <p className={styles.lead}>{t('team.page.description')}</p>
          </div>

          <div className={styles.heroStats}>
            <div className={[styles.statCard, styles.formatStatCard].join(' ')}>
              <span>{t('team.page.stats.format')}</span>
              <strong className={styles.formatValue}>{teamBuilder.activeTeam.formatKey.toUpperCase()}</strong>
            </div>
            <div className={[styles.statCard, styles.compactStatCard].join(' ')}>
              <span>{t('team.page.stats.occupiedSlots')}</span>
              <strong>{filledSlots}/6</strong>
            </div>
            <div className={[styles.statCard, styles.compactStatCard].join(' ')}>
              <span>{t('team.page.stats.moveset')}</span>
              <strong>{configuredMoves}/24</strong>
            </div>
          </div>
        </section>

        <section className={styles.layout}>
          <TeamWorkspace
            activeTeam={teamBuilder.activeTeam}
            catalogCount={teamBuilder.catalogCount}
            isCatalogLoading={teamBuilder.isCatalogLoading}
            itemCatalog={teamBuilder.itemCatalog}
            isItemsLoading={teamBuilder.isItemsLoading}
            isMovesLoading={teamBuilder.isMovesLoading}
            isPokemonLoading={teamBuilder.isPokemonLoading}
            notice={teamBuilder.notice}
            onAddPokemon={teamBuilder.addPokemonToTeam}
            onAssignEffortValue={teamBuilder.assignEffortValue}
            onAssignIndividualValue={teamBuilder.assignIndividualValue}
            onAssignAbilityToSlot={teamBuilder.assignAbilityToSlot}
            onAssignItemToSlot={teamBuilder.assignItemToSlot}
            onAssignNatureToSlot={teamBuilder.assignNatureToSlot}
            onAssignMoveToSlot={teamBuilder.assignMoveToSlot}
            onSetSearchPage={teamBuilder.setSearchPage}
            onClearTeam={teamBuilder.clearTeam}
            onClearMovesFromSlot={teamBuilder.clearMovesFromSlot}
            onGenerateTeamExportText={teamBuilder.generateTeamExportText}
            onImportTeamText={teamBuilder.importTeamFromText}
            onRemovePokemon={teamBuilder.removePokemonFromTeam}
            onResetStatSpread={teamBuilder.resetStatSpread}
            onRenameTeam={teamBuilder.renameTeam}
            searchPage={teamBuilder.searchPage}
            onSelectSlot={teamBuilder.selectSlot}
            searchQuery={teamBuilder.searchQuery}
            searchResults={teamBuilder.searchResults}
            searchResultsSummary={teamBuilder.searchResultsSummary}
            selectedPokemonDetail={teamBuilder.selectedPokemonDetail}
            selectedPokemonMoves={teamBuilder.selectedPokemonMoves}
            selectedSlot={teamBuilder.selectedSlot}
            selectedSlotIndex={teamBuilder.selectedSlotIndex}
            setSearchQuery={teamBuilder.setSearchQuery}
            teamMembers={teamBuilder.teamMembers}
          />

          <div className={styles.metaGrid}>
            <TeamValidator
              competitiveFormats={teamBuilder.competitiveFormats}
              isFormatsLoading={teamBuilder.isFormatsLoading}
              isValidationDirty={teamBuilder.isValidationDirty}
              isValidationLoading={teamBuilder.isValidationLoading}
              onSetFormatKey={teamBuilder.setFormatKey}
              onValidateTeam={teamBuilder.runValidation}
              selectedFormatKey={teamBuilder.activeTeam.formatKey}
              validationError={teamBuilder.validationError}
              validationResult={teamBuilder.validationResult}
            />

            <TeamSuggestions
              isSuggestionsLoading={teamBuilder.isSuggestionsLoading}
              onAddPokemon={teamBuilder.addPokemonToTeam}
              selectedSlotIndex={teamBuilder.selectedSlotIndex}
              suggestionsError={teamBuilder.suggestionsError}
              suggestionsResult={teamBuilder.suggestionsResult}
            />
          </div>

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
