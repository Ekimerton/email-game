#!/usr/bin/env tsx
/**
 * unsubscribeUser.ts
 *
 * Unsubscribes (or purges) a user from the Inboxed daily puzzle email subscriber list.
 *
 * Usage:
 *   npx tsx scripts/helpers/unsubscribeUser.ts <email> [options]
 *   npm run unsubscribe -- <email> [options]
 *
 * Options:
 *   --email, -e       User email address (required)
 *   --purge, --delete Completely remove from list instead of setting status: 'unsubscribed'
 *   --remote, --prod  Target remote production worker
 *   --local, --dev    Target local dev server (default)
 *   --url=<url>       Target custom worker URL
 *   --help, -h        Show help message
 */

import 'dotenv/config'

function printHelp() {
  console.log(`
📬 Inboxed - Unsubscribe User Helper

Unsubscribes a user or purges them from the daily puzzle subscriber list.

Usage:
  npx tsx scripts/helpers/unsubscribeUser.ts <email> [options]
  npm run unsubscribe -- <email> [options]

Arguments:
  email              User email address (e.g. ekim0252@gmail.com)

Options:
  -e, --email=<str>  User email address
  -p, --purge        Completely remove user from subscribers list
  --remote, --prod   Target remote production worker
  --local, --dev     Target local dev server (default)
  --url=<custom_url> Target specific server URL
  -h, --help         Show this help message

Examples:
  npx tsx scripts/helpers/unsubscribeUser.ts ekim0252@gmail.com
  npx tsx scripts/helpers/unsubscribeUser.ts ekim0252@gmail.com --purge
  npx tsx scripts/helpers/unsubscribeUser.ts ekim0252@gmail.com --remote
`)
}

function parseArgs(args: string[]) {
  if (args.includes('--help') || args.includes('-h')) {
    printHelp()
    process.exit(0)
  }

  let email: string | undefined
  const isRemote = args.includes('--remote') || args.includes('--prod') || args.includes('--production')
  const isLocal = args.includes('--local') || args.includes('--dev')
  const purge = args.includes('--purge') || args.includes('--delete') || args.includes('-p')
  let customUrl: string | undefined

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg.startsWith('--email=')) {
      email = arg.split('=')[1]
    } else if (arg === '--email' || arg === '-e') {
      email = args[++i]
    } else if (arg.startsWith('--url=')) {
      customUrl = arg.split('=')[1]
    } else if (!arg.startsWith('-') && arg.includes('@')) {
      email = arg
    }
  }

  return { email, isRemote, isLocal, purge, customUrl }
}

async function unsubscribeViaApi(
  targetBaseUrl: string,
  email: string,
  purge: boolean,
  adminSecret?: string
) {
  const url = new URL('/api/admin/unsubscribe', targetBaseUrl)
  url.searchParams.set('email', email)
  if (purge) url.searchParams.set('purge', 'true')

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (adminSecret) {
    headers['Authorization'] = `Bearer ${adminSecret}`
  }

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, purge }),
  })

  const json = (await res.json().catch(() => ({}))) as any
  if (!res.ok) {
    throw new Error(json.error || `Server responded with status ${res.status}`)
  }
  return json
}

async function main() {
  const rawArgs = process.argv.slice(2)
  const { email, isRemote, purge, customUrl } = parseArgs(rawArgs)

  if (!email || !email.includes('@')) {
    console.error('❌ Error: A valid email address is required.\n')
    printHelp()
    process.exit(1)
  }

  const cleanEmail = email.toLowerCase().trim()
  const prodUrl = (process.env.PUBLIC_HTTPS_URL || 'https://inboxed.fun').replace(/\/$/, '')
  const localUrl = 'http://localhost:8787'
  const targetBaseUrl = customUrl || (isRemote ? prodUrl : localUrl)
  const adminSecret = process.env.ADMIN_SECRET

  console.log(`\n📬 Unsubscribing User: ${cleanEmail}`)
  console.log(`Mode:    ${purge ? 'Purge (remove completely)' : 'Status: unsubscribed'}`)
  console.log(`Target:  ${targetBaseUrl} ${isRemote ? '(production)' : '(local)'}\n`)

  let success = false

  try {
    const result = await unsubscribeViaApi(targetBaseUrl, cleanEmail, purge, adminSecret)
    console.log(`✅ Success via API: ${result.email}`)
    console.log(`   Status:             ${result.status}`)
    if (result.activeCount !== undefined) {
      console.log(`   Active Subscribers: ${result.activeCount} (Total: ${result.totalSubscribers})`)
    }
    success = true
  } catch (apiErr: any) {
    if (!isRemote && !customUrl) {
      // Local server not running — perform in-process
      console.log(`ℹ️  Local server not responding at ${localUrl}. Running in-process...`)
      try {
        const { unsubscribeUser } = await import('../../src/index')
        const result = await unsubscribeUser(undefined, cleanEmail, purge)
        console.log(`✅ Success in-process: ${result.email}`)
        console.log(`   Status:             ${result.status}`)
        console.log(`   Active Subscribers: ${result.activeCount} (Total: ${result.totalSubscribers})`)
        success = true
      } catch (inProcessErr: any) {
        console.error(`❌ In-process execution failed:`, inProcessErr)
      }
    } else {
      console.error(`❌ Failed on ${targetBaseUrl}:`, apiErr.message)
    }
  }

  if (success) {
    console.log(`\n🎉 User ${cleanEmail} has been unsubscribed. You can now test the signup flow fresh!\n`)
  } else {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
