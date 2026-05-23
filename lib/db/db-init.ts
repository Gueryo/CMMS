// Database initialization - creates tables if they don't exist
// This file uses mysql2 directly without Prisma for Railway deployment
import mysql from 'mysql2/promise'
import fs from 'fs'
import path from 'path'

const DB_INIT_TIMEOUT = 30000 // 30 seconds

async function executeSchema(): Promise<void> {
  const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL

  if (!dbUrl) {
    console.warn('[DB-INIT] No database URL provided - skipping schema initialization')
    return
  }

  const connection = await mysql.createConnection(dbUrl)

  try {
    // Read schema file
    const schemaPath = path.join(process.cwd(), 'lib', 'db', 'schema.sql')
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8')

    // Split schema into individual statements and execute them
    const statements = schemaSql
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt && !stmt.startsWith('--'))

    console.log(`[DB-INIT] Executing ${statements.length} schema statements...`)

    for (const statement of statements) {
      try {
        await connection.execute(statement)
      } catch (error: any) {
        // Ignore "already exists" errors
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log(`[DB-INIT] Table already exists (skipping): ${statement.substring(0, 50)}...`)
        } else {
          throw error
        }
      }
    }

    console.log('[DB-INIT] ✓ Database schema initialized successfully')
  } finally {
    await connection.end()
  }
}

export async function initializeDatabase() {
  console.log('[DB-INIT] Starting database initialization without Prisma...')

  try {
    await Promise.race([
      executeSchema(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database initialization timeout')), DB_INIT_TIMEOUT)
      ),
    ])
  } catch (error) {
    console.error('[DB-INIT] Database initialization error:', error)
    // Don't throw - allow app to continue even if DB init fails
    // The actual DB operations will fail with proper error messages
  }
}
