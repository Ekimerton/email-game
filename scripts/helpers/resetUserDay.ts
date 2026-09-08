#!/usr/bin/env tsx
/**
 * resetUserDay.ts
 *
 * Resets a user's game save state, domain leaderboard score,
 * and played-dates history for a specific date (defaults to today).
 *
 * Usage:
 *   npx tsx scripts/helpers/resetUserDay.ts <email> [date]
 *   npx tsx scripts/helpers/resetUserDay.ts --email=alice@company.com --date=2026-09-07
 *   npx tsx scripts/helpers/resetUserDay.ts alice@company.com --remote
 *   npm run reset-user-day -- alice@company.com
 *
 * Options:
 *   --email, -e       User email address (required)
 *   --date, -d        Target puzzle date in YYYY-MM-DD (defaults to today's puzzle)
 *   --remote, --prod  Reset state on the remote/production worker
 *   --local, --dev    Reset state on local dev server (default)
 *   --url=<url>       Target a custom worker endpoint URL
 *   --direct-kv       Also run wrangler kv key delete directly
 *   --help, -h        Show help message
 */

import 'dotenv/config'
import { execSync } from 'node:child_process'
import { getDailyPuzzle } from '../../src/puzzleLogic'

interface ResetResult {
  success: boolean
  email?: string
  date?: string
  message?: string
  error?: string
  details?: {
    gameStateDeleted?: boolean
    removedFromLeaderboard?: boolean
    removedFromPlayedDates?: boolean
  }
}

function printHelp() {
  console.log(`
🎮 Word Game - Reset User Day Helper

Resets a user's save state, clears their leaderboard entry for that day,
and removes the date from their played-dates record.

Usage:
  npx tsx scripts/helpers/resetUserDay.ts <email> [date] [options]
  npm run reset-user-day -- <email> [date] [options]

Arguments:
  email              User email address (e.g. alice@company.com)
  date               Optional date in YYYY-MM-DD format (defaults to today's puzzle date)

Options:
  -e, --email=<str>  User email address
  -d, --date=<str>   Date (YYYY-MM-DD)
  --remote, --prod   Target remote production worker (${process.env.PUBLIC_HTTPS_URL || 'https://email-game.teamify.workers.dev'})
  --local, --dev     Target local worker (http://localhost:8787, with in-process fallback)
  --url=<custom_url> Target a specific server URL
  --direct-kv        Also run 'wrangler kv key delete' directly
  -h, --help         Show this help message

Examples:
  npx tsx scripts/helpers/resetUserDay.ts alice@company.com
  npx tsx scripts/helpers/resetUserDay.ts alice@company.com 2026-09-07
  npx tsx scripts/helpers/resetUserDay.ts --email=alice@company.com --date=2026-09-07 --remote
`)
}

function parseArgs(args: string[]) {
  if (args.includes('--help') || args.includes('-h')) {
    printHelp()
    process.exit(0)
  }

  let email: string | undefined
  let date: string | undefined
  let isRemote = args.includes('--remote') || args.includes('--prod') || args.includes('--production')
  let isLocal = args.includes('--local') || args.includes('--dev')
  let directKv = args.includes('--direct-kv')
  let customUrl: string | undefined

  const positional: string[] = []

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg.startsWith('--email=')) {
      email = arg.split('=')[1]
    } else if (arg === '--email' || arg === '-e') {
      email = args[++i]
    } else if (arg.startsWith('--date=')) {
      date = arg.split('=')[1]
    } else if (arg === '--date' || arg === '-d') {
      date = args[++i]
    } else if (arg.startsWith('--url=')) {
      customUrl = arg.split('=')[1]
    } else if (!arg.startsWith('-')) {
      positional.push(arg)
    }
  }

  // Parse positionals if not set via flags
  if (!email && positional.length > 0 && positional[0].includes('@')) {
    email = positional[0]
    if (!date && positional.length > 1 && /^\d{4}-\d{2}-\d{2}$/.test(positional[1])) {
      date = positional[1]
    }
  } else if (!email && positional.length > 0) {
    email = positional[0]
  }

  if (!date && positional.length > 1 && /^\d{4}-\d{2}-\d{2}$/.test(positional[1])) {
    date = positional[1]
  }

  if (!date) {
    date = getDailyPuzzle().date
  }

  return { email, date, isRemote, isLocal, directKv, customUrl }
}

async function resetViaApi(targetBaseUrl: string, email: string, date: string, adminSecret?: string): Promise<ResetResult> {
  const url = new URL('/api/admin/reset-user-day', targetBaseUrl)
  url.searchParams.set('email', email)
  url.searchParams.set('date', date)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (adminSecret) {
    headers['Authorization'] = `Bearer ${adminSecret}`
  }

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, date }),
  })

  const json = (await res.json().catch(() => ({}))) as ResetResult
  if (!res.ok) {
    throw new Error(json.error || `Server responded with status ${res.status}`)
  }
  return json
}

async function resetDirectKv(email: string, date: string, isRemote: boolean) {
  const cleanEmail = email.toLowerCase().trim()
  const stateKey = `game:${date}:${cleanEmail}`
  const flag = isRemote ? '--remote' : '--local'
  const cmd = `npx wrangler kv key delete --binding GAME_STATE_KV ${flag} "${stateKey}"`

  try {
    console.log(`🔧 Running Wrangler KV delete: ${cmd}`)
    const output = execSync(cmd, { stdio: 'pipe', encoding: 'utf8' })
    console.log(`  ✅ KV key "${stateKey}" deleted successfully via Wrangler.`)
    if (output.trim()) {
      console.log(`     ${output.trim()}`)
    }
  } catch (err: any) {
    const errorOutput = err.stderr || err.stdout || err.message
    console.warn(`  ⚠️ Wrangler KV CLI output:\n${errorOutput}`)
  }
}

async function main() {
  const rawArgs = process.argv.slice(2)
  const { email, date, isRemote, directKv, customUrl } = parseArgs(rawArgs)

  if (!email || !email.includes('@')) {
    console.error('❌ Error: A valid email address is required.\n')
    printHelp()
    process.exit(1)
  }

  const cleanEmail = email.toLowerCase().trim()
  const cleanDate = date!

  console.log(`\n🔄 Resetting User Day State`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`👤 User:  ${cleanEmail}`)
  console.log(`📅 Date:  ${cleanDate}`)

  const prodUrl = (process.env.PUBLIC_HTTPS_URL || 'https://email-game.teamify.workers.dev').replace(/\/$/, '')
  const localUrl = 'http://localhost:8787'
  const targetBaseUrl = customUrl || (isRemote ? prodUrl : localUrl)
  const adminSecret = process.env.ADMIN_SECRET

  console.log(`🌐 Target: ${targetBaseUrl} ${isRemote ? '(production)' : '(local)'}\n`)

  let apiSuccess = false

  try {
    // 1. Try hitting the API endpoint (local dev server or remote worker)
    const result = await resetViaApi(targetBaseUrl, cleanEmail, cleanDate, adminSecret)
    apiSuccess = true
    console.log(`✅ ${result.message || 'Save state reset successfully!'}`)
    if (result.details) {
      console.log(`   • Game state deleted:     ${result.details.gameStateDeleted ? 'Yes' : 'No'}`)
      console.log(`   • Removed from leaderboard: ${result.details.removedFromLeaderboard ? 'Yes' : 'Not on leaderboard'}`)
      console.log(`   • Removed from played list: ${result.details.removedFromPlayedDates ? 'Yes' : 'Not in played list'}`)
    }
  } catch (err: any) {
    if (!isRemote && !customUrl) {
      // Local dev server not running — perform reset in-process with Hono app
      console.log(`ℹ️  Local dev server not responding at ${localUrl}. Running reset in-process...`)
      try {
        const { resetUserDayState } = await import('../../src/index')
        const result = await resetUserDayState(undefined, cleanEmail, cleanDate)
        apiSuccess = true
        console.log(`✅ ${result.message}`)
        console.log(`   • Game state deleted:     ${result.details.gameStateDeleted ? 'Yes' : 'No'}`)
        console.log(`   • Removed from leaderboard: ${result.details.removedFromLeaderboard ? 'Yes' : 'Not on leaderboard'}`)
        console.log(`   • Removed from played list: ${result.details.removedFromPlayedDates ? 'Yes' : 'Not in played list'}`)
      } catch (inProcessErr: any) {
        console.error(`❌ In-process reset failed:`, inProcessErr)
      }
    } else {
      console.error(`❌ API reset failed on ${targetBaseUrl}:`, err.message)
    }
  }

  // 2. If --direct-kv was requested or if remote API was unreachable, also run direct wrangler kv delete
  if (directKv || (!apiSuccess && isRemote)) {
    console.log(`\n📦 Attempting direct Cloudflare KV deletion via Wrangler...`)
    await resetDirectKv(cleanEmail, cleanDate, isRemote)
  }

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`🎉 Done! Next time ${cleanEmail} plays puzzle ${cleanDate}, they will start fresh.\n`)
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
