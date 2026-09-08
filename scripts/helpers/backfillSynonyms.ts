/**
 * backfillSynonyms.ts
 *
 * Helper script to backfill synonyms onto existing puzzles.
 * Works with either src/puzzles.ts or any generated puzzle JSON file (e.g. puzzles_test.json).
 *
 * Usage:
 *   # Backfill src/puzzles.ts (dry-run preview):
 *   npx tsx scripts/helpers/backfillSynonyms.ts --dry-run
 *
 *   # Backfill src/puzzles.ts (write in place):
 *   npx tsx scripts/helpers/backfillSynonyms.ts --target=src/puzzles.ts
 *
 *   # Backfill a specific JSON puzzle file:
 *   npx tsx scripts/helpers/backfillSynonyms.ts --file=puzzles_test.json --out=puzzles_test.json
 *
 * Flags:
 *   --target=<path>  Target TypeScript puzzle source file (default: src/puzzles.ts)
 *   --file=<path>    Target JSON puzzle file
 *   --out=<path>     Output file path (default: overwrite target/file)
 *   --force          Re-fetch synonyms even if puzzle already has synonyms
 *   --limit=<num>    Limit number of puzzles to process
 *   --delay=<ms>     Delay between API requests in ms (default: 150)
 *   --dry-run        Preview backfilled synonyms without writing to disk
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { fetchSynonymsForWord } from './generatePuzzles'

export interface BackfillOptions {
  force?: boolean
  limit?: number
  delayMs?: number
  maxSynonyms?: number
  onProgress?: (index: number, total: number, word: string, synonymsCount: number) => void
}

export async function backfillPuzzleArray<T extends { word: string; synonyms?: string[] }>(
  puzzles: T[],
  options: BackfillOptions = {}
): Promise<{ puzzles: T[]; updatedCount: number; skippedCount: number }> {
  const {
    force = false,
    limit = puzzles.length,
    delayMs = 150,
    maxSynonyms = 8,
    onProgress
  } = options

  let updatedCount = 0
  let skippedCount = 0
  const total = Math.min(puzzles.length, limit)

  for (let i = 0; i < total; i++) {
    const puzzle = puzzles[i]
    if (!force && Array.isArray(puzzle.synonyms) && puzzle.synonyms.length > 0) {
      skippedCount++
      if (onProgress) onProgress(i + 1, total, puzzle.word, puzzle.synonyms.length)
      continue
    }

    const syns = await fetchSynonymsForWord(puzzle.word, maxSynonyms)
    puzzle.synonyms = syns
    updatedCount++

    if (onProgress) onProgress(i + 1, total, puzzle.word, syns.length)

    if (i < total - 1 && delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  return { puzzles, updatedCount, skippedCount }
}

export function updatePuzzlesTsContent(source: string, updatedPuzzles: any[]): string {
  const marker = 'export const PUZZLES: DailyPuzzle[] = '
  const startIdx = source.indexOf(marker)
  if (startIdx === -1) {
    throw new Error('Could not find "export const PUZZLES: DailyPuzzle[] = " in source file')
  }

  const afterMarker = startIdx + marker.length
  let depth = 0
  let endIdx = -1

  for (let i = afterMarker; i < source.length; i++) {
    if (source[i] === '[') {
      depth++
    } else if (source[i] === ']') {
      depth--
      if (depth === 0) {
        endIdx = i + 1
        break
      }
    }
  }

  if (endIdx === -1) {
    throw new Error('Could not parse closing bracket for PUZZLES array in source file')
  }

  const formattedJson = JSON.stringify(updatedPuzzles, null, 2)
  return source.slice(0, afterMarker) + formattedJson + source.slice(endIdx)
}

async function main() {
  const args = process.argv.slice(2)
  const fileArg = args.find(a => a.startsWith('--file='))
  const targetArg = args.find(a => a.startsWith('--target='))
  const outArg = args.find(a => a.startsWith('--out='))
  const limitArg = args.find(a => a.startsWith('--limit='))
  const delayArg = args.find(a => a.startsWith('--delay='))
  const force = args.includes('--force')
  const dryRun = args.includes('--dry-run')

  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined
  const delayMs = delayArg ? parseInt(delayArg.split('=')[1], 10) : 150

  const jsonFilePath = fileArg ? fileArg.split('=')[1] : null
  const targetFilePath = targetArg ? targetArg.split('=')[1] : (jsonFilePath ? null : 'src/puzzles.ts')
  const outPath = outArg ? outArg.split('=')[1] : null

  if (jsonFilePath) {
    const fullPath = resolve(process.cwd(), jsonFilePath)
    console.log(`\nBackfilling synonyms for JSON file: ${jsonFilePath}${dryRun ? ' (DRY RUN)' : ''}`)
    const raw = readFileSync(fullPath, 'utf-8')
    const puzzles = JSON.parse(raw) as any[]

    const { puzzles: updated, updatedCount, skippedCount } = await backfillPuzzleArray(puzzles, {
      force,
      limit,
      delayMs,
      onProgress: (idx, total, word, count) => {
        process.stdout.write(`\r[${idx}/${total}] ${word.padEnd(16)} → ${count} synonyms`)
      }
    })

    console.log(`\n\nFinished: ${updatedCount} updated, ${skippedCount} skipped.`)

    if (!dryRun) {
      const destination = outPath ? resolve(process.cwd(), outPath) : fullPath
      writeFileSync(destination, JSON.stringify(updated, null, 2))
      console.log(`Saved to ${destination}`)
    } else {
      console.log('Dry run enabled: no changes written.')
    }
  } else if (targetFilePath) {
    const fullPath = resolve(process.cwd(), targetFilePath)
    console.log(`\nBackfilling synonyms for TypeScript file: ${targetFilePath}${dryRun ? ' (DRY RUN)' : ''}`)
    const source = readFileSync(fullPath, 'utf-8')

    // Dynamically import the puzzles module to read current PUZZLES
    const puzzlesModule = await import(fullPath)
    const puzzles = JSON.parse(JSON.stringify(puzzlesModule.PUZZLES)) as any[]

    const { puzzles: updated, updatedCount, skippedCount } = await backfillPuzzleArray(puzzles, {
      force,
      limit,
      delayMs,
      onProgress: (idx, total, word, count) => {
        process.stdout.write(`\r[${idx}/${total}] ${word.padEnd(16)} → ${count} synonyms`)
      }
    })

    console.log(`\n\nFinished: ${updatedCount} updated, ${skippedCount} skipped.`)

    const newSource = updatePuzzlesTsContent(source, updated)

    if (!dryRun) {
      const destination = outPath ? resolve(process.cwd(), outPath) : fullPath
      writeFileSync(destination, newSource)
      console.log(`Saved to ${destination}`)
    } else {
      console.log('Dry run enabled: no changes written.')
    }
  } else {
    console.error('Error: Please specify either --file=<path.json> or --target=<path.ts>')
    process.exit(1)
  }
}

if (process.argv[1]?.endsWith('backfillSynonyms.ts')) {
  main().catch(console.error)
}
