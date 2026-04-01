import SiteHeader from '../../components/home/SiteHeader'
import pageStyles from '../../page.module.css'
import { notFound } from 'next/navigation'

import { getPrismaClient } from '@/src/lib/prisma'
import { listIngestCheckpoints } from '@/src/modules/ingest/checkpoints'
import { buildSmartIngestPlan } from '@/src/modules/ingest/smart-plan'
import {
  getMetaRefreshEnvironmentName,
  getMetaRefreshRecommendedDagId,
  isMetaRefreshUiEnabled,
  META_REFRESH_DAG_FILE,
  META_REFRESH_LOCAL_UI_URL,
} from '@/src/modules/ops/meta-refresh'

import styles from './page.module.css'

export const dynamic = 'force-dynamic'

function formatDate(value) {
  if (!value) {
    return 'Sin dato'
  }

  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatStatusBadge(shouldRun) {
  return shouldRun ? styles.statusRun : styles.statusSkip
}

export default async function MetaRefreshPage() {
  if (!isMetaRefreshUiEnabled()) {
    notFound()
  }

  const prisma = getPrismaClient()
  const [plan, checkpoints] = await Promise.all([
    buildSmartIngestPlan(),
    listIngestCheckpoints(prisma),
  ])
  const environmentName = getMetaRefreshEnvironmentName()
  const dagId = getMetaRefreshRecommendedDagId()

  return (
    <>
      <SiteHeader />

      <main className={pageStyles.pageShell}>
        <section className={styles.hero}>
          <div>
            <p className={styles.kicker}>Ops</p>
            <h2>Meta Refresh</h2>
            <p className={styles.lead}>
              Aqui puedes ver el plan inteligente de refresco, los checkpoints persistidos y la ubicacion exacta del DAG
              de Airflow.
            </p>
          </div>

          <div className={styles.heroActions}>
            <a className={styles.primaryLink} href="/api/ops/meta-refresh/status" target="_blank" rel="noreferrer">
              Ver JSON
            </a>
            <code className={styles.command}>npm run ingest:smart -- --apply</code>
          </div>
        </section>

        <section className={styles.grid}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.kicker}>DAG</p>
                <h3>Airflow</h3>
              </div>
              <span className={[styles.badge, plan.recommendedSteps.length ? styles.badgeWarn : styles.badgeOk].join(' ')}>
                {plan.recommendedSteps.length ? `${plan.recommendedSteps.length} pasos pendientes` : 'Sin trabajo pendiente'}
              </span>
            </div>

            <div className={styles.infoList}>
              <div>
                <span>Dag id</span>
                <strong>{dagId}</strong>
              </div>
              <div>
                <span>Ruta del DAG</span>
                <strong>{META_REFRESH_DAG_FILE}</strong>
              </div>
              <div>
                <span>Entorno actual</span>
                <strong>{environmentName}</strong>
              </div>
              <div>
                <span>UI esperada</span>
                <strong>{META_REFRESH_LOCAL_UI_URL}</strong>
              </div>
              <div>
                <span>Ultimo usage local</span>
                <strong>{plan.latestUsageMonthInDb ?? 'Sin snapshots'}</strong>
              </div>
            </div>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.kicker}>Plan</p>
                <h3>Dry Run</h3>
              </div>
              <span className={[styles.badge, styles.badgeNeutral].join(' ')}>{formatDate(plan.generatedAt)}</span>
            </div>

            <div className={styles.stepWrap}>
              {plan.recommendedSteps.length ? (
                plan.recommendedSteps.map((step) => (
                  <span key={step} className={[styles.badge, styles.badgeWarn].join(' ')}>
                    {step}
                  </span>
                ))
              ) : (
                <span className={[styles.badge, styles.badgeOk].join(' ')}>No hay pasos por ejecutar</span>
              )}
            </div>

            <p className={styles.helpText}>
              Este bloque es el mismo criterio que usara la automatizacion. Si aqui no aparecen pasos, el DAG tampoco
              deberia hacer trabajo real.
            </p>
          </article>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.kicker}>Fuentes</p>
              <h3>Decision por origen</h3>
            </div>
          </div>

          <div className={styles.decisionList}>
            {plan.decisions.map((decision) => (
              <article key={decision.source.key} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <strong>{decision.source.key}</strong>
                    <p>{decision.source.description}</p>
                  </div>
                  <span className={[styles.badge, formatStatusBadge(decision.shouldRun)].join(' ')}>
                    {decision.shouldRun ? 'Run' : 'Skip'}
                  </span>
                </div>

                <div className={styles.miniGrid}>
                  <div>
                    <span>Cadencia</span>
                    <strong>{decision.source.cadence}</strong>
                  </div>
                  <div>
                    <span>Version observada</span>
                    <strong>{decision.source.version ?? 'Sin dato'}</strong>
                  </div>
                </div>

                <p className={styles.reason}>{decision.reason}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.kicker}>Checkpoints</p>
              <h3>Estado persistido</h3>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Fuente</th>
                  <th>Cadencia</th>
                  <th>Observado</th>
                  <th>Aplicado</th>
                  <th>Ultima observacion</th>
                  <th>Ultima aplicacion</th>
                </tr>
              </thead>
              <tbody>
                {checkpoints.length ? (
                  checkpoints.map((checkpoint) => (
                    <tr key={checkpoint.id}>
                      <td>{checkpoint.sourceKey}</td>
                      <td>{checkpoint.cadence ?? 'Sin dato'}</td>
                      <td>{checkpoint.lastObservedVersion ?? 'Sin dato'}</td>
                      <td>{checkpoint.lastAppliedVersion ?? 'Sin dato'}</td>
                      <td>{formatDate(checkpoint.lastObservedAt)}</td>
                      <td>{formatDate(checkpoint.lastAppliedAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6}>Todavia no hay checkpoints guardados. Ejecuta `npm run ingest:smart -- --apply` una vez.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.kicker}>Como verlo</p>
              <h3>Donde ver el DAG</h3>
            </div>
          </div>

          <div className={styles.card}>
            <p className={styles.reason}>
              El archivo del DAG esta en <code>{META_REFRESH_DAG_FILE}</code>. En local veras <code>{dagId}</code>. Si
              configuras varios targets en cloud, Airflow generara un DAG por entorno y esta pantalla seguira mostrando la
              logica del entorno actual.
            </p>
          </div>
        </section>
      </main>
    </>
  )
}
