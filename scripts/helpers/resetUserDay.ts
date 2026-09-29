#!/usr/bin/env tsx
/**
 * resetUserDay.ts
 *
 * Resets a user's game save state, domain leaderboard score,
 * and played-dates history for a specific puzzle number (or date).
 *
 * Usage:
 *   npx tsx scripts/helpers/resetUserDay.ts <email> [puzzle]
 *   npx tsx scripts/helpers/resetUserDay.ts alice@company.com 1
 *   npx tsx scripts/helpers/resetUserDay.ts alice@company.com #1 --remote
 *   npx tsx scripts/helpers/resetUserDay.ts --email=alice@company.com --puzzle=1
 *   npm run reset-user-day -- alice@company.com 1
 *
 * Options:
 *   --email, -e       User email address (required)
 *   --puzzle, -p      Target puzzle number (e.g. 1, 43, #1, defaults to today's puzzle)
 *   --date, -d        Target puzzle date in YYYY-MM-DD (legacy / backward compatibility)
 *   --remote, --prod  Reset state on the remote/production worker
 *   --local, --dev    Reset state on local dev server (default)
 *   --url=<url>       Target a custom worker endpoint URL
 *   --direct-kv       Also run wrangler kv key delete directly
 *   --help, -h        Show help message
 */

import 'dotenv/config'
import { execSync } from 'node:child_process'
import { getDailyPuzzle, getDateForPuzzleId } from '../../src/game'

interface ResetResult {
  success: boolean
  email?: string
  date?: string
  puzzleId?: string
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
🎮 Inboxed - Reset User Day Helper

Resets a user's save state, clears their leaderboard entry for that puzzle,
and removes the puzzle from their played-dates record.

Usage:
  npx tsx scripts/helpers/resetUserDay.ts <email> [puzzle] [options]
  npm run reset-user-day -- <email> [puzzle] [options]

Arguments:
  email              User email address (e.g. alice@company.com)
  puzzle             Optional puzzle number (e.g. 1, 43, #1) or date (YYYY-MM-DD, defaults to today's puzzle)

Options:
  -e, --email=<str>  User email address
  -p, --puzzle=<val> Puzzle number (e.g. 1, 43, #1)
  -d, --date=<str>   Date (YYYY-MM-DD)
  --remote, --prod   Target remote production worker (${process.env.PUBLIC_HTTPS_URL || 'https://inboxed.fun'})
  --local, --dev     Target local worker (http://localhost:8787, with in-process fallback)
  --url=<custom_url> Target a specific server URL
  --direct-kv        Also run 'wrangler kv key delete' directly
  -h, --help         Show this help message

Examples:
  npx tsx scripts/helpers/resetUserDay.ts alice@company.com
  npx tsx scripts/helpers/resetUserDay.ts alice@company.com 1
  npx tsx scripts/helpers/resetUserDay.ts alice@company.com #1 --remote
  npx tsx scripts/helpers/resetUserDay.ts --email=alice@company.com --puzzle=1 --remote
`)
}

function parseArgs(args: string[]) {
  if (args.includes('--help') || args.includes('-h')) {
    printHelp()
    process.exit(0)
  }

  let email: string | undefined
  let puzzle: string | undefined
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
    } else if (arg.startsWith('--puzzle=')) {
      puzzle = arg.split('=')[1]
    } else if (arg === '--puzzle' || arg === '-p') {
      puzzle = args[++i]
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
  } else if (!email && positional.length > 0) {
    email = positional[0]
  }

  // Second positional could be puzzle ID or date
  if (positional.length > 1) {
    const second = positional[1]
    if (/^\d{4}-\d{2}-\d{2}$/.test(second)) {
      date = date || second
    } else if (/^#?\d+$/.test(second)) {
      puzzle = puzzle || second
    }
  }

  // Determine target puzzle ID and date
  let targetPuzzleId = ''
  let targetDate = ''

  if (puzzle) {
    targetPuzzleId = String(puzzle).replace(/^#/, '').trim()
    targetDate = date || getDateForPuzzleId(targetPuzzleId, { isDev: false })
  } else if (date) {
    targetDate = date
    targetPuzzleId = getDailyPuzzle(date, { isDev: false }).id
  } else {
    const todayPuzzle = getDailyPuzzle()
    targetPuzzleId = todayPuzzle.id
    targetDate = todayPuzzle.date
  }

  return { email, puzzle: targetPuzzleId, date: targetDate, isRemote, isLocal, directKv, customUrl }
}

async function resetViaApi(
  targetBaseUrl: string,
  email: string,
  target: { puzzleId: string; dateStr: string },
  adminSecret?: string
): Promise<ResetResult> {
  const url = new URL('/api/admin/reset-user-day', targetBaseUrl)
  url.searchParams.set('email', email)
  url.searchParams.set('puzzle', target.puzzleId)
  url.searchParams.set('date', target.dateStr)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (adminSecret) {
    headers['Authorization'] = `Bearer ${adminSecret}`
  }

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, puzzle: target.puzzleId, date: target.dateStr }),
  })

  const json = (await res.json().catch(() => ({}))) as ResetResult
  if (!res.ok) {
    throw new Error(json.error || `Server responded with status ${res.status}`)
  }
  return json
}

async function resetDirectKv(email: string, puzzleId: string, date: string, isRemote: boolean) {
  const cleanEmail = email.toLowerCase().trim()
  const flag = isRemote ? '--remote' : '--local'
  const devDate = getDateForPuzzleId(puzzleId, { isDev: true })

  const stateKeys = Array.from(new Set([
    `game:${date}:${cleanEmail}`,
    `game:${date}:dev:${cleanEmail}`,
    ...(devDate ? [`game:${devDate}:${cleanEmail}`, `game:${devDate}:dev:${cleanEmail}`] : []),
  ]))

  for (const stateKey of stateKeys) {
    // Delete from D1
    const d1Cmd = `npx wrangler d1 execute inboxed-db ${flag} --command="DELETE FROM kv_store WHERE key = '${stateKey}';" -y`
    try {
      console.log(`🔧 Running Wrangler D1 delete: ${d1Cmd}`)
      execSync(d1Cmd, { stdio: 'pipe', encoding: 'utf8' })
      console.log(`  ✅ D1 row for "${stateKey}" deleted successfully.`)
    } catch (err: any) {
      console.warn(`  ⚠️ Wrangler D1 CLI output:\n${err.stderr || err.stdout || err.message}`)
    }

    // Delete from KV (backup)
    const kvCmd = `npx wrangler kv key delete --binding GAME_STATE_KV ${flag} "${stateKey}"`
    try {
      console.log(`🔧 Running Wrangler KV delete: ${kvCmd}`)
      const output = execSync(kvCmd, { stdio: 'pipe', encoding: 'utf8' })
      console.log(`  ✅ KV key "${stateKey}" deleted successfully via Wrangler.`)
      if (output.trim()) {
        console.log(`     ${output.trim()}`)
      }
    } catch (err: any) {
      const errorOutput = err.stderr || err.stdout || err.message
      console.warn(`  ⚠️ Wrangler KV CLI output:\n${errorOutput}`)
    }
  }

  // 2. Remove user from Domain Leaderboards in D1
  const domain = cleanEmail.split('@')[1]
  const stdPuzzle = getDailyPuzzle(date, { isDev: false })
  const devPuzzle = getDailyPuzzle(date, { isDev: true })

  const lbKeys = Array.from(new Set([
    ...(puzzleId ? [`leaderboard:${domain}:${puzzleId}`] : []),
    `leaderboard:${domain}:${stdPuzzle.id}`,
    `leaderboard:${domain}:${devPuzzle.id}`,
    `leaderboard:${domain}:${date}`,
    ...(devDate ? [`leaderboard:${domain}:${devDate}`] : [])
  ]))

  for (const lbKey of lbKeys) {
    try {
      const getCmd = `npx wrangler d1 execute inboxed-db ${flag} --command="SELECT value FROM kv_store WHERE key = '${lbKey}';" --json`
      const rawOut = execSync(getCmd, { stdio: 'pipe', encoding: 'utf8' })
      const parsed = JSON.parse(rawOut)
      const rows = parsed[0]?.results || []
      if (rows.length > 0 && rows[0]?.value) {
        const entries = JSON.parse(rows[0].value)
        if (Array.isArray(entries)) {
          const filtered = entries.filter((item: any) => item.email?.toLowerCase().trim() !== cleanEmail)
          if (filtered.length !== entries.length) {
            if (filtered.length === 0) {
              execSync(`npx wrangler d1 execute inboxed-db ${flag} --command="DELETE FROM kv_store WHERE key = '${lbKey}';" -y`, { stdio: 'pipe' })
            } else {
              const escapedJson = JSON.stringify(filtered).replace(/'/g, "''")
              execSync(`npx wrangler d1 execute inboxed-db ${flag} --command="UPDATE kv_store SET value = '${escapedJson}' WHERE key = '${lbKey}';" -y`, { stdio: 'pipe' })
            }
            console.log(`  ✅ Removed ${cleanEmail} from leaderboard "${lbKey}" in D1.`)
          }
        }
      }
    } catch (_) {}
  }

  // 3. Remove date/puzzle from user profile in D1
  try {
    const profKey = `user:profile:${cleanEmail}`
    const getCmd = `npx wrangler d1 execute inboxed-db ${flag} --command="SELECT value FROM kv_store WHERE key = '${profKey}';" --json`
    const rawOut = execSync(getCmd, { stdio: 'pipe', encoding: 'utf8' })
    const parsed = JSON.parse(rawOut)
    const rows = parsed[0]?.results || []
    if (rows.length > 0 && rows[0]?.value) {
      const profile = JSON.parse(rows[0].value)
      const datesToRemove = new Set([date, ...(devDate ? [devDate] : [])])
      const puzzlesToRemove = new Set([puzzleId, stdPuzzle.id, devPuzzle.id].filter(Boolean))
      let changed = false

      if (profile.playedDates && profile.playedDates.some((d: string) => datesToRemove.has(d))) {
        profile.playedDates = profile.playedDates.filter((d: string) => !datesToRemove.has(d))
        changed = true
      }
      if (profile.playedPuzzles && profile.playedPuzzles.some((p: string) => puzzlesToRemove.has(p))) {
        profile.playedPuzzles = profile.playedPuzzles.filter((p: string) => !puzzlesToRemove.has(p))
        changed = true
      }

      if (changed) {
        profile.daysPlayed = Math.max(
          profile.playedDates ? profile.playedDates.length : 0,
          profile.playedPuzzles ? profile.playedPuzzles.length : 0
        )
        const escapedJson = JSON.stringify(profile).replace(/'/g, "''")
        execSync(`npx wrangler d1 execute inboxed-db ${flag} --command="UPDATE kv_store SET value = '${escapedJson}' WHERE key = '${profKey}';" -y`, { stdio: 'pipe' })
        console.log(`  ✅ Updated ${profKey} in D1: removed played record.`)
      }
    }
  } catch (_) {}
}

async function main() {
  const rawArgs = process.argv.slice(2)
  const { email, puzzle: targetPuzzleId, date: targetDate, isRemote, directKv, customUrl } = parseArgs(rawArgs)

  if (!email || !email.includes('@')) {
    console.error('❌ Error: A valid email address is required.\n')
    printHelp()
    process.exit(1)
  }

  const cleanEmail = email.toLowerCase().trim()

  console.log(`\n🔄 Resetting User Day State`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`👤 User:    ${cleanEmail}`)
  console.log(`🧩 Puzzle:  #${targetPuzzleId} (${targetDate})`)

  const prodUrl = (process.env.PUBLIC_HTTPS_URL || 'https://inboxed.fun').replace(/\/$/, '')
  const localUrl = 'http://localhost:8787'
  const targetBaseUrl = customUrl || (isRemote ? prodUrl : localUrl)
  const adminSecret = process.env.ADMIN_SECRET

  console.log(`🌐 Target:  ${targetBaseUrl} ${isRemote ? '(production)' : '(local)'}\n`)

  let apiSuccess = false

  try {
    // 1. Try hitting the API endpoint (local dev server or remote worker)
    const result = await resetViaApi(targetBaseUrl, cleanEmail, { puzzleId: targetPuzzleId, dateStr: targetDate }, adminSecret)
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
        const result = await resetUserDayState(undefined, cleanEmail, targetPuzzleId)
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
    await resetDirectKv(cleanEmail, targetPuzzleId, targetDate, isRemote)
  }

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`🎉 Done! Next time ${cleanEmail} plays Puzzle #${targetPuzzleId} (${targetDate}), they will start fresh.\n`)
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
