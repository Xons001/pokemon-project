'use client'

import { useEffect, useState } from 'react'

import { fetchMetaTeamDetail, fetchMetaTeams } from '../../lib/api'
import { useI18n } from '../i18n/LanguageProvider'
import styles from './MetaTeams.module.css'

function formatMembers(members) {
  return (members ?? []).map((member) => member.pokemonName).filter(Boolean).join(' / ')
}

function getSourceLabel(url) {
  if (!url) {
    return ''
  }

  if (url.includes('x.com') || url.includes('twitter.com')) {
    return 'X/Twitter'
  }

  if (url.includes('play.limitlesstcg.com')) {
    return 'Limitless'
  }

  return 'Fuente'
}

export default function MetaTeams({ onImportTeamText }) {
  const { t } = useI18n()
  const [teamsResult, setTeamsResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTeamId, setActiveTeamId] = useState('')
  const [expandedTeam, setExpandedTeam] = useState(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [copyStatusId, setCopyStatusId] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadTeams() {
      setIsLoading(true)
      setError('')
      setActiveTeamId('')
      setExpandedTeam(null)

      try {
        const result = await fetchMetaTeams({
          limit: 8,
        })

        if (!cancelled) {
          setTeamsResult(result)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : t('team.metaTeams.error'))
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadTeams()

    return () => {
      cancelled = true
    }
  }, [t])

  async function handleToggleTeam(teamId) {
    if (activeTeamId === teamId) {
      setActiveTeamId('')
      setExpandedTeam(null)
      return
    }

    setActiveTeamId(teamId)
    setExpandedTeam(null)
    setIsDetailLoading(true)

    try {
      const detail = await fetchMetaTeamDetail(teamId)
      setExpandedTeam(detail)
    } catch (detailError) {
      setError(detailError instanceof Error ? detailError.message : t('team.metaTeams.detailError'))
    } finally {
      setIsDetailLoading(false)
    }
  }

  async function handleCopyPaste(rawPaste, teamId) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(rawPaste)
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = rawPaste
        textArea.style.position = 'fixed'
        textArea.style.opacity = '0'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }

      setCopyStatusId(teamId)
      window.setTimeout(() => setCopyStatusId((currentId) => (currentId === teamId ? '' : currentId)), 1600)
    } catch (copyError) {
      setError(copyError instanceof Error ? copyError.message : t('team.metaTeams.copyError'))
    }
  }

  const teams = teamsResult?.items ?? []

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>{t('team.metaTeams.kicker')}</p>
          <h3>{t('team.metaTeams.title')}</h3>
        </div>
        <span className={styles.countBadge}>{isLoading ? t('team.metaTeams.loading') : teams.length}</span>
      </div>

      <p className={styles.helper}>
        {t('team.metaTeams.helper')}
      </p>

      {teamsResult?.summary?.latestDate ? (
        <p className={styles.sourceMeta}>{t('team.metaTeams.sourceFreshness', { date: teamsResult.summary.latestDate })}</p>
      ) : null}

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.list}>
        {teams.map((team) => {
          const isActive = activeTeamId === team.id
          const activeDetail = isActive && expandedTeam?.id === team.id ? expandedTeam : null

          return (
            <article key={team.id} className={[styles.card, isActive ? styles.cardActive : null].filter(Boolean).join(' ')}>
              <button type="button" className={styles.cardButton} aria-expanded={isActive} onClick={() => handleToggleTeam(team.id)}>
                <span className={styles.cardTop}>
                  <strong>{team.player}</strong>
                  <small>{team.date ?? t('team.metaTeams.noDate')}</small>
                </span>
                <span className={styles.members}>{formatMembers(team.members)}</span>
                <span className={styles.metaLine}>
                  {team.tournament ?? t('team.metaTeams.unknownTournament')}
                  {team.rentalCode ? ` - ${team.rentalCode}` : ''}
                </span>
                <span className={styles.inspectAction}>
                  {isActive ? t('team.metaTeams.collapseTeam') : t('team.metaTeams.expandTeam')}
                </span>
              </button>

              {isActive ? (
                <div className={styles.detail}>
                  {isDetailLoading ? <p>{t('team.metaTeams.loadingDetail')}</p> : null}
                  {activeDetail?.rawPaste ? (
                    <>
                      <pre className={styles.paste}>{activeDetail.rawPaste}</pre>
                      <div className={styles.detailActions}>
                        <button type="button" className={styles.importButton} onClick={() => onImportTeamText(activeDetail.rawPaste)}>
                          {t('team.metaTeams.importTeam')}
                        </button>
                        <button type="button" className={styles.secondaryButton} onClick={() => handleCopyPaste(activeDetail.rawPaste, team.id)}>
                          {copyStatusId === team.id ? t('team.metaTeams.copied') : t('team.metaTeams.copyPaste')}
                        </button>
                        {activeDetail.pokepasteUrl ? (
                          <a className={styles.secondaryLink} href={activeDetail.pokepasteUrl} target="_blank" rel="noreferrer">
                            {t('team.metaTeams.openPaste')}
                          </a>
                        ) : null}
                        {activeDetail.sourceUrl ? (
                          <a className={styles.secondaryLink} href={activeDetail.sourceUrl} target="_blank" rel="noreferrer">
                            {getSourceLabel(activeDetail.sourceUrl)}
                          </a>
                        ) : null}
                      </div>
                    </>
                  ) : !isDetailLoading ? (
                    <p>{t('team.metaTeams.noPaste')}</p>
                  ) : null}
                </div>
              ) : null}
            </article>
          )
        })}

        {!isLoading && !teams.length ? <p className={styles.empty}>{t('team.metaTeams.empty')}</p> : null}
      </div>
    </section>
  )
}
