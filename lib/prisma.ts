import { PrismaClient } from '@prisma/client'
import { initializeDatabase } from './db-init'

const globalForPrisma = globalThis as unknown as { 
  prisma: PrismaClient
  dbInitialized: boolean
  dbInitPromise?: Promise<void>
}

// Initialize Prisma Client
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Initialize database tables on first connection
if (!globalForPrisma.dbInitialized && !globalForPrisma.dbInitPromise) {
  globalForPrisma.dbInitPromise = initializeDatabase()
    .then(() => {
      globalForPrisma.dbInitialized = true
      globalForPrisma.dbInitPromise = undefined
    })
    .catch((error) => {
      console.error('[PRISMA] Database initialization error:', error)
      globalForPrisma.dbInitPromise = undefined
    })
}

// Export a function to wait for initialization
export async function waitForDbInit() {
  if (globalForPrisma.dbInitPromise) {
    await globalForPrisma.dbInitPromise
  }
}
