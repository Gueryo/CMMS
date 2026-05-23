import { PrismaClient } from '@prisma/client'
import { initializeDatabase } from './db-init'

// Check DATABASE_URL availability
console.log('[DB] ========== DATABASE CONNECTION ==========')
console.log('[DB] Initializing without Prisma migrations (Railway compatible)')
console.log('[DB] - DATABASE_URL:', process.env.DATABASE_URL ? '✓ Set' : '✗ Not set')
console.log('[DB] - MYSQL_URL:', process.env.MYSQL_URL ? '✓ Set' : '✗ Not set')

// Get the database URL from environment
const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL

if (!dbUrl) {
  console.error('[DB] ⚠️ WARNING: No database URL environment variable found!')
  console.error('[DB] Please ensure MYSQL_URL is set in your Railway environment')
}

// Log which URL is being used
if (dbUrl) {
  console.log('[DB] Database URL:', dbUrl.substring(0, 30) + '...')
}

const globalForDb = globalThis as unknown as { 
  prisma: PrismaClient
  dbInitialized: boolean
  dbInitPromise?: Promise<void>
}

// Initialize Prisma Client (still using for data operations)
// But schema is managed via schema.sql, not migrations
export const prisma =
  globalForDb.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForDb.prisma = prisma
}

// Initialize database schema on first connection
if (!globalForDb.dbInitialized && !globalForDb.dbInitPromise) {
  console.log('[DB] Starting schema initialization from schema.sql...')
  globalForDb.dbInitPromise = initializeDatabase()
    .then(() => {
      console.log('[DB] ✓ Schema initialization completed')
      globalForDb.dbInitialized = true
      globalForDb.dbInitPromise = undefined
    })
    .catch((error) => {
      console.error('[DB] Schema initialization failed:', error)
      globalForDb.dbInitPromise = undefined
      // Continue anyway - the app might work with partial schema
    })
}

// Export a function to wait for initialization
export async function waitForDbInit() {
  if (globalForDb.dbInitPromise) {
    await globalForDb.dbInitPromise
  }
}
