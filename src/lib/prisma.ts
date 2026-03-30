import { PrismaClient } from '@prisma/client'

type GlobalWithPrisma = typeof globalThis & {
  __pokemonPrisma?: PrismaClient
}

export function getPrismaClient(): PrismaClient {
  const globalForPrisma = globalThis as GlobalWithPrisma

  if (!globalForPrisma.__pokemonPrisma) {
    globalForPrisma.__pokemonPrisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    })
  }

  return globalForPrisma.__pokemonPrisma
}
