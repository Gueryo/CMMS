#!/usr/bin/env node
/**
 * Database initialization script for Railway
 * Run this before starting the application
 * Usage: node scripts/init-db.js
 */

const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')

const DB_INIT_TIMEOUT = 30000

async function initDatabase() {
  console.log('[INIT-DB] ========== Database Initialization Script ==========')

  const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL

  if (!dbUrl) {
    console.error('[INIT-DB] ERROR: No MYSQL_URL or DATABASE_URL environment variable found')
    console.error('[INIT-DB] Please ensure your Railway database environment variables are set')
    process.exit(1)
  }

  console.log('[INIT-DB] Connecting to database...')

  let connection
  try {
    connection = await Promise.race([
      mysql.createConnection(dbUrl),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      ),
    ])
    console.log('[INIT-DB] ✓ Connected to database')
  } catch (error) {
    console.error('[INIT-DB] ✗ Failed to connect to database:', error.message)
    process.exit(1)
  }

  try {
    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'lib', 'db', 'schema.sql')

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`)
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf-8')
    console.log('[INIT-DB] Loaded schema.sql')

    // Split schema into individual statements
    const statements = schemaSql
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt && !stmt.startsWith('--'))

    console.log(`[INIT-DB] Executing ${statements.length} schema statements...`)

    let successCount = 0
    let skipCount = 0
    let errorCount = 0

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      const tableName = statement.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1] || 'unknown'

      try {
        await Promise.race([
          connection.execute(statement),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Statement timeout')), DB_INIT_TIMEOUT)
          ),
        ])
        console.log(`[INIT-DB] ✓ [${i + 1}/${statements.length}] ${tableName}`)
        successCount++
      } catch (error) {
        // Ignore "already exists" errors
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log(`[INIT-DB] ⊘ [${i + 1}/${statements.length}] ${tableName} (already exists)`)
          skipCount++
        } else {
          console.error(`[INIT-DB] ✗ [${i + 1}/${statements.length}] ${tableName}: ${error.message}`)
          errorCount++
        }
      }
    }

    console.log('[INIT-DB] ========== Summary ==========')
    console.log(`[INIT-DB] ✓ Created: ${successCount} tables`)
    console.log(`[INIT-DB] ⊘ Skipped: ${skipCount} tables (already exist)`)
    console.log(`[INIT-DB] ✗ Errors: ${errorCount}`)

    if (errorCount > 0) {
      console.warn('[INIT-DB] Some tables failed to create, but initialization will continue')
    }

    console.log('[INIT-DB] ✓ Database initialization completed successfully')
  } catch (error) {
    console.error('[INIT-DB] Failed to initialize database:', error.message)
    process.exit(1)
  } finally {
    try {
      await connection.end()
    } catch (e) {
      // Ignore errors on connection close
    }
  }
}

// Run initialization
initDatabase().catch((error) => {
  console.error('[INIT-DB] Fatal error:', error)
  process.exit(1)
})
