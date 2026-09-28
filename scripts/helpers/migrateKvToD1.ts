#!/usr/bin/env tsx
/**
 * migrateKvToD1.ts
 *
 * Exports all existing keys and values from Cloudflare KV (remote or local)
 * and imports them into Cloudflare D1's kv_store table using direct batch commands.
 *
 * Usage:
 *   npx tsx scripts/helpers/migrateKvToD1.ts --remote
 *   npx tsx scripts/helpers/migrateKvToD1.ts --local
 */

import { execSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'

function escapeSqlString(str: string): string {
  return str.replace(/'/g, "''")
}

async function main() {
  const isRemote = process.argv.includes('--remote') || !process.argv.includes('--local')
  const flag = isRemote ? '--remote' : '--local'
  const targetName = isRemote ? 'remote production' : 'local development'

  console.log(`\n🚀 Starting KV -> D1 Migration (${targetName})`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)

  const tempSqlFile = path.resolve(process.cwd(), '.d1_kv_migration_temp.sql')
  let statements: string[] = []

  if (fs.existsSync(tempSqlFile)) {
    console.log(`📂 Reusing cached statements from ${tempSqlFile}...`)
    const content = fs.readFileSync(tempSqlFile, 'utf8')
    statements = content.split('\n').filter(s => s.trim().length > 0)
    console.log(`Loaded ${statements.length} statements from cache.`)
  } else {
    // 1. List all keys from KV
    console.log(`📋 Listing keys from GAME_STATE_KV ${flag}...`)
    const listCmd = `npx wrangler kv key list --binding GAME_STATE_KV ${flag}`
    const rawKeys = execSync(listCmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 })
    const keyEntries = JSON.parse(rawKeys) as Array<{ name: string }>
    console.log(`Found ${keyEntries.length} keys in KV.`)

    if (keyEntries.length === 0) {
      console.log(`No keys to migrate. Exiting.`)
      return
    }

    // 2. Fetch value for each key
    console.log(`📥 Fetching values from KV...`)
    const now = new Date().toISOString()
    let fetched = 0
    for (const entry of keyEntries) {
      const key = entry.name
      try {
        const getCmd = `npx wrangler kv key get --binding GAME_STATE_KV ${flag} "${key}"`
        const val = execSync(getCmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 })
        
        const safeKey = escapeSqlString(key)
        const safeVal = escapeSqlString(val)
        statements.push(
          `INSERT INTO kv_store (key, value, updated_at) VALUES ('${safeKey}', '${safeVal}', '${now}') ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`
        )
        fetched++
        if (fetched % 20 === 0 || fetched === keyEntries.length) {
          process.stdout.write(`  Fetched ${fetched}/${keyEntries.length} keys...\r`)
        }
      } catch (err: any) {
        console.warn(`\n⚠️  Failed to fetch key "${key}":`, err.message)
      }
    }
    console.log(`\n✅ Successfully fetched ${statements.length} keys from KV.`)
    fs.writeFileSync(tempSqlFile, statements.join('\n'), 'utf8')
  }

  // 3. Execute in batches of 15 statements using --command via spawnSync
  const { spawnSync } = await import('node:child_process')
  const BATCH_SIZE = 15
  const totalBatches = Math.ceil(statements.length / BATCH_SIZE)
  console.log(`📤 Executing ${statements.length} statements across ${totalBatches} batches into D1...`)

  for (let i = 0; i < statements.length; i += BATCH_SIZE) {
    const batch = statements.slice(i, i + BATCH_SIZE)
    const batchIndex = Math.floor(i / BATCH_SIZE) + 1
    const combinedSql = batch.join(' ')

    const result = spawnSync('npx', ['wrangler', 'd1', 'execute', 'inboxed-db', flag, `--command=${combinedSql}`, '-y'], {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024
    })

    if (result.status !== 0) {
      console.warn(`\n⚠️ Batch ${batchIndex} failed:`, result.stderr || result.stdout)
      // Retry one by one
      for (const singleStmt of batch) {
        const singleRes = spawnSync('npx', ['wrangler', 'd1', 'execute', 'inboxed-db', flag, `--command=${singleStmt}`, '-y'], {
          encoding: 'utf8'
        })
        if (singleRes.status !== 0) {
          console.error(`  ❌ Failed statement: ${singleStmt.substring(0, 80)}...`)
        }
      }
    } else {
      process.stdout.write(`  Executed batch ${batchIndex}/${totalBatches} (${Math.min(i + BATCH_SIZE, statements.length)}/${statements.length} keys)...\r`)
    }
  }

  // 4. Verify count
  console.log(`\n\n🔍 Verifying row count in D1 kv_store...`)
  const verifyCmd = `npx wrangler d1 execute inboxed-db ${flag} --command="SELECT count(*) as count FROM kv_store;"`
  const verifyOutput = execSync(verifyCmd, { encoding: 'utf8' })
  console.log(verifyOutput)

  // 5. Cleanup cache
  try {
    fs.unlinkSync(tempSqlFile)
  } catch {}

  console.log(`🎉 KV -> D1 Migration Completed Successfully!\n`)
}

main().catch((err) => {
  console.error('Fatal migration error:', err)
  process.exit(1)
})
