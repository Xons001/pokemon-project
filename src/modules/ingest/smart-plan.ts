import { getAppEnv } from '@/src/lib/env'
import { getPrismaClient } from '@/src/lib/prisma'
import { getIngestCheckpointMap, type IngestCheckpointSource } from '@/src/modules/ingest/checkpoints'
import { ShowdownClient } from '@/src/modules/ingest/showdown/client'
import { getActiveMetaFormatKeys, isActiveMetaFormat } from '@/src/modules/showdown/format-scope'
import type { IngestStepName } from '@/src/modules/ingest/types'

export type SyncDecision = {
  source: IngestCheckpointSource
  shouldRun: boolean
  reason: string
  steps: IngestStepName[]
}

export type SmartIngestPlan = {
  generatedAt: string
  env: {
    environmentName: string
    showdownDataBaseUrl: string
    smogonStatsBaseUrl: string
    smogonStatsMonthOverride: string | null
    showdownUsageTargetFormats: string[]
    metaRefreshProfile: 'full' | 'lean'
    allowedMetaFormats: string[]
  }
  latestUsageMonthInDb: string | null
  recommendedSteps: IngestStepName[]
  decisions: SyncDecision[]
}

function getLatestDate(dates: Array<Date | null>): Date | null {
  const validDates = dates.filter((value): value is Date => value instanceof Date)

  if (!validDates.length) {
    return null
  }

  return validDates.reduce((latest, current) => (current > latest ? current : latest))
}

function toVersion(date: Date | null): string | null {
  return date ? date.toISOString() : null
}

function stringifyDate(date: Date | null): string {
  return date ? date.toISOString() : 'n/a'
}

async function inspectRemoteSources(targetStatsMonth: string | null) {
  const env = getAppEnv()
  const client = new ShowdownClient(env.showdownDataBaseUrl, env.smogonStatsBaseUrl)
  const activeFormatKeys = getActiveMetaFormatKeys()
  const [dataEntries, setEntries, latestRemoteStatsMonth] = await Promise.all([
    client.listDataDirectoryEntries(''),
    client.listDataDirectoryEntries('sets/'),
    targetStatsMonth ? Promise.resolve(targetStatsMonth) : client.getLatestStatsMonth(),
  ])

  const dataByName = new Map(dataEntries.map((entry) => [entry.name, entry]))
  const latestFormatsUpdatedAt = getLatestDate([
    dataByName.get('formats.js')?.lastModified ?? null,
    dataByName.get('formats-data.js')?.lastModified ?? null,
  ])
  const latestLearnsetsUpdatedAt = dataByName.get('learnsets.json')?.lastModified ?? null
  const latestSampleSetsUpdatedAt = getLatestDate(
    setEntries
      .filter((entry) => entry.name.endsWith('.json'))
      .filter((entry) => isActiveMetaFormat(entry.name.replace(/\.json$/, '')))
      .map((entry) => entry.lastModified)
  )

  return {
    latestRemoteStatsMonth,
    sources: [
      {
        key: 'showdown-format-bundle',
        type: 'showdown-data',
        description: 'Formats y tiers exportados desde Pokemon Showdown.',
        cadence: 'cada 12h',
        version: toVersion(latestFormatsUpdatedAt),
        observedAt: latestFormatsUpdatedAt,
        metadata: {
          files: ['formats.js', 'formats-data.js'],
          upstreamUpdatedAt: stringifyDate(latestFormatsUpdatedAt),
          selectedFormats: activeFormatKeys,
        },
      },
      {
        key: 'showdown-learnsets',
        type: 'showdown-data',
        description: 'Learnsets competitivos exportados por Pokemon Showdown.',
        cadence: 'cada 12h',
        version: toVersion(latestLearnsetsUpdatedAt),
        observedAt: latestLearnsetsUpdatedAt,
        metadata: {
          files: ['learnsets.json'],
          upstreamUpdatedAt: stringifyDate(latestLearnsetsUpdatedAt),
          selectedFormats: activeFormatKeys,
        },
      },
      {
        key: 'showdown-sample-sets',
        type: 'showdown-data',
        description: 'Sample sets publicados por Pokemon Showdown.',
        cadence: 'cada 12h',
        version: toVersion(latestSampleSetsUpdatedAt),
        observedAt: latestSampleSetsUpdatedAt,
        metadata: {
          directory: 'sets/',
          upstreamUpdatedAt: stringifyDate(latestSampleSetsUpdatedAt),
          selectedFormats: activeFormatKeys,
        },
      },
      {
        key: 'smogon-usage-monthly',
        type: 'smogon-stats',
        description: 'Snapshots mensuales de usage desde Smogon Stats.',
        cadence: 'mensual',
        version: latestRemoteStatsMonth,
        observedAt: new Date(),
        metadata: {
          targetMonth: latestRemoteStatsMonth,
          selectedFormats: env.showdownUsageTargetFormats.length ? env.showdownUsageTargetFormats : activeFormatKeys,
        },
      },
    ] satisfies IngestCheckpointSource[],
  }
}

export async function buildSmartIngestPlan(options: {
  force?: boolean
  smogonStatsMonthOverride?: string | null
} = {}): Promise<SmartIngestPlan> {
  const prisma = getPrismaClient()
  const env = getAppEnv()
  const usageSyncEnabled = env.metaRefreshProfile === 'full'
  const remoteInspection = await inspectRemoteSources(options.smogonStatsMonthOverride ?? env.smogonStatsMonth)
  const [
    latestUsageInDb,
    latestFormatRefresh,
    latestTierRefresh,
    latestLearnsetRefresh,
    latestSampleSetRefresh,
  ] = await Promise.all([
    prisma.usageStatMonthly.findFirst({
      orderBy: {
        month: 'desc',
      },
      select: {
        month: true,
      },
    }),
    prisma.competitiveFormat.findFirst({
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        updatedAt: true,
      },
    }),
    prisma.pokemonTierHistory.findFirst({
      orderBy: {
        capturedAt: 'desc',
      },
      select: {
        capturedAt: true,
      },
    }),
    prisma.competitiveLearnsetEntry.findFirst({
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        updatedAt: true,
      },
    }),
    prisma.sampleSet.findFirst({
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        updatedAt: true,
      },
    }),
  ])
  const checkpoints = await getIngestCheckpointMap(
    prisma,
    remoteInspection.sources.map((source) => source.key)
  )

  const usageTargetMonth = remoteInspection.latestRemoteStatsMonth
  const latestUsageMonthInDb = latestUsageInDb?.month ?? null
  const fallbackAppliedAtBySourceKey = {
    'showdown-format-bundle': getLatestDate([latestFormatRefresh?.updatedAt ?? null, latestTierRefresh?.capturedAt ?? null]),
    'showdown-learnsets': latestLearnsetRefresh?.updatedAt ?? null,
    'showdown-sample-sets': latestSampleSetRefresh?.updatedAt ?? null,
  } as const
  const fallbackAppliedVersionBySourceKey = {
    'showdown-format-bundle': toVersion(fallbackAppliedAtBySourceKey['showdown-format-bundle']),
    'showdown-learnsets': toVersion(fallbackAppliedAtBySourceKey['showdown-learnsets']),
    'showdown-sample-sets': toVersion(fallbackAppliedAtBySourceKey['showdown-sample-sets']),
  } as const

  const decisions: SyncDecision[] = remoteInspection.sources.map((source) => {
    if (source.key === 'smogon-usage-monthly' && !usageSyncEnabled) {
      return {
        source: {
          ...source,
          metadata: {
            ...((source.metadata as Record<string, unknown>) ?? {}),
            latestMonthInDb: latestUsageMonthInDb,
            selectedFormats: env.showdownUsageTargetFormats,
            profile: env.metaRefreshProfile,
          },
        },
        shouldRun: false,
        reason: `El perfil ${env.metaRefreshProfile} desactiva la ingesta mensual de usage para mantener la base ligera en este entorno.`,
        steps: [],
      }
    }

    const checkpoint = checkpoints.get(source.key)
    const fallbackAppliedAt =
      source.key in fallbackAppliedAtBySourceKey
        ? fallbackAppliedAtBySourceKey[source.key as keyof typeof fallbackAppliedAtBySourceKey]
        : null
    const lastAppliedAt = checkpoint?.lastAppliedAt ?? fallbackAppliedAt ?? null
    const lastAppliedVersion =
      checkpoint?.lastAppliedVersion ??
      (source.key in fallbackAppliedVersionBySourceKey
        ? fallbackAppliedVersionBySourceKey[source.key as keyof typeof fallbackAppliedVersionBySourceKey]
        : null)

    if (options.force) {
      const forcedSteps =
        source.key === 'showdown-format-bundle'
          ? (['showdown-format', 'showdown-tier'] satisfies IngestStepName[])
          : source.key === 'showdown-learnsets'
            ? (['showdown-learnset'] satisfies IngestStepName[])
            : source.key === 'showdown-sample-sets'
              ? (['showdown-sample-set'] satisfies IngestStepName[])
              : (['showdown-usage'] satisfies IngestStepName[])

      return {
        source,
        shouldRun: true,
        reason: 'Se ha solicitado --force, asi que se reingiere aunque no haya cambio detectado.',
        steps: [...forcedSteps],
      }
    }

    if (source.key === 'smogon-usage-monthly') {
      const shouldRun = Boolean(usageTargetMonth && usageTargetMonth !== latestUsageMonthInDb)

      return {
        source: {
          ...source,
          metadata: {
            ...((source.metadata as Record<string, unknown>) ?? {}),
            latestMonthInDb: latestUsageMonthInDb,
            selectedFormats: env.showdownUsageTargetFormats,
          },
        },
        shouldRun,
        reason: shouldRun
          ? `Hay un snapshot nuevo (${usageTargetMonth}) y la base sigue en ${latestUsageMonthInDb ?? 'sin datos'}${env.showdownUsageTargetFormats.length ? `. Se limitara a ${env.showdownUsageTargetFormats.join(', ')}.` : '.'}`
          : `La base ya esta alineada con el ultimo snapshot mensual disponible (${usageTargetMonth ?? 'sin dato remoto'}).`,
        steps: shouldRun ? ['showdown-usage'] : [],
      }
    }

    const shouldRun =
      source.observedAt instanceof Date && lastAppliedAt instanceof Date
        ? source.observedAt > lastAppliedAt
        : Boolean(source.version && source.version !== lastAppliedVersion)
    const steps =
      source.key === 'showdown-format-bundle'
        ? (['showdown-format', 'showdown-tier'] satisfies IngestStepName[])
        : source.key === 'showdown-learnsets'
          ? (['showdown-learnset'] satisfies IngestStepName[])
          : (['showdown-sample-set'] satisfies IngestStepName[])

    return {
      source,
      shouldRun,
      reason: shouldRun
        ? `La fuente remota (${source.version ?? 'n/a'}) es mas reciente que la ultima referencia aplicada o existente en base (${lastAppliedVersion ?? 'n/a'}).`
        : `No se detectan cambios porque la referencia local (${lastAppliedVersion ?? 'n/a'}) ya cubre lo publicado en upstream.`,
      steps: shouldRun ? [...steps] : [],
    }
  })

  return {
    generatedAt: new Date().toISOString(),
    env: {
      environmentName: env.environmentName,
      showdownDataBaseUrl: env.showdownDataBaseUrl,
      smogonStatsBaseUrl: env.smogonStatsBaseUrl,
      smogonStatsMonthOverride: env.smogonStatsMonth,
      showdownUsageTargetFormats: env.showdownUsageTargetFormats,
      metaRefreshProfile: env.metaRefreshProfile,
      allowedMetaFormats: getActiveMetaFormatKeys(),
    },
    latestUsageMonthInDb,
    recommendedSteps: Array.from(new Set(decisions.flatMap((decision) => decision.steps))),
    decisions,
  }
}

export function buildSmartIngestTextReport(plan: SmartIngestPlan) {
  const lines = [
    `[ingest-smart] generated at ${plan.generatedAt}`,
    `[ingest-smart] recommended steps: ${plan.recommendedSteps.length ? plan.recommendedSteps.join(', ') : 'none'}`,
  ]

  plan.decisions.forEach((decision) => {
    lines.push(`- ${decision.source.key}: ${decision.shouldRun ? 'run' : 'skip'} | ${decision.reason}`)
  })

  return lines.join('\n')
}
