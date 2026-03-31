import type { Prisma, PrismaClient } from '@prisma/client'

export type IngestCheckpointSource = {
  key: string
  type: string
  description: string
  cadence: string
  version: string | null
  observedAt: Date | null
  metadata?: Prisma.InputJsonValue
}

export async function getIngestCheckpointMap(
  prisma: PrismaClient,
  sourceKeys: string[]
) {
  const checkpoints = await prisma.ingestSourceCheckpoint.findMany({
    where: {
      sourceKey: {
        in: sourceKeys,
      },
    },
  })

  return new Map(checkpoints.map((checkpoint) => [checkpoint.sourceKey, checkpoint]))
}

export async function listIngestCheckpoints(prisma: PrismaClient) {
  return prisma.ingestSourceCheckpoint.findMany({
    orderBy: [
      {
        sourceType: 'asc',
      },
      {
        sourceKey: 'asc',
      },
    ],
  })
}

export async function recordObservedCheckpoints(
  prisma: PrismaClient,
  sources: IngestCheckpointSource[]
) {
  await prisma.$transaction(
    sources.map((source) =>
      prisma.ingestSourceCheckpoint.upsert({
        where: {
          sourceKey: source.key,
        },
        create: {
          sourceKey: source.key,
          sourceType: source.type,
          description: source.description,
          cadence: source.cadence,
          lastObservedVersion: source.version,
          lastObservedAt: source.observedAt,
          metadata: source.metadata,
        },
        update: {
          sourceType: source.type,
          description: source.description,
          cadence: source.cadence,
          lastObservedVersion: source.version,
          lastObservedAt: source.observedAt,
          metadata: source.metadata,
        },
      })
    )
  )
}

export async function recordAppliedCheckpoints(
  prisma: PrismaClient,
  sources: IngestCheckpointSource[]
) {
  await prisma.$transaction(
    sources.map((source) =>
      prisma.ingestSourceCheckpoint.upsert({
        where: {
          sourceKey: source.key,
        },
        create: {
          sourceKey: source.key,
          sourceType: source.type,
          description: source.description,
          cadence: source.cadence,
          lastObservedVersion: source.version,
          lastObservedAt: source.observedAt,
          lastAppliedVersion: source.version,
          lastAppliedAt: source.observedAt ?? new Date(),
          metadata: source.metadata,
        },
        update: {
          sourceType: source.type,
          description: source.description,
          cadence: source.cadence,
          lastObservedVersion: source.version,
          lastObservedAt: source.observedAt,
          lastAppliedVersion: source.version,
          lastAppliedAt: source.observedAt ?? new Date(),
          metadata: source.metadata,
        },
      })
    )
  )
}
