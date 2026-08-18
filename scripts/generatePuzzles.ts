/**
 * generatePuzzles.ts
 *
 * Fetches the MIT 10k word list, shuffles it with a seeded random, then
 * queries definitions until 100 puzzle candidates are found.
 *
 * Filters applied:
 *   - Words must be >= MIN_WORD_LENGTH characters
 *   - Words that look like inflected forms (plurals, -ed, -ing, -er, -est, -ly) are skipped
 *   - Words must have >= MIN_DEFINITIONS distinct definitions after dedup
 *   - Near-duplicate definitions (sharing >60% of words) are collapsed
 *   - Definitions must span at least 2 different parts of speech
 *
 * Usage:
 *   npx tsx scripts/generatePuzzles.ts
 *   npx tsx scripts/generatePuzzles.ts --seed=42
 *   npx tsx scripts/generatePuzzles.ts --target=50
 *   npx tsx scripts/generatePuzzles.ts --out=puzzles.json
 */

const WORD_LIST_URL = 'https://www.mit.edu/~ecprice/wordlist.10000'
const DICT_API = 'https://api.dictionaryapi.dev/api/v2/entries/en'
const MIN_WORD_LENGTH = 4
const MIN_DEFINITIONS = 4
const MAX_DEFINITIONS = 5
const MIN_POS_VARIETY = 2   // must span at least this many distinct parts of speech
const RATE_LIMIT_MS = 150   // ~6 req/sec to be polite

const args = process.argv.slice(2)
const seedArg   = args.find(a => a.startsWith('--seed='))
const targetArg = args.find(a => a.startsWith('--target='))
const outArg    = args.find(a => a.startsWith('--out='))
const SEED      = seedArg   ? parseInt(seedArg.split('=')[1])   : 1337
const TARGET    = targetArg ? parseInt(targetArg.split('=')[1]) : 100
const OUT_FILE  = outArg ? outArg.split('=')[1] : null

// ── Seeded pseudo-random (mulberry32) ────────────────────────────────────────
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── Inflection filter ─────────────────────────────────────────────────────────
const INFLECTION_SUFFIXES = ['ings', 'tion', 'tions', 'ness', 'nesses', 'ment', 'ments']
const INFLECTION_PATTERNS = [
  /^(.{4,})s$/,
  /^(.{4,})es$/,
  /^(.{4,})ies$/,
  /^(.{4,})ed$/,
  /^(.{4,})ing$/,
  /^(.{4,})er$/,
  /^(.{4,})est$/,
  /^(.{4,})ly$/,
]

function looksInflected(word: string): boolean {
  if (INFLECTION_SUFFIXES.some(s => word.endsWith(s))) return true
  return INFLECTION_PATTERNS.some(p => p.test(word))
}

// Returns true if a definition text mentions the puzzle word (or a stemmed variant)
function definitionMentionsWord(defText: string, word: string): boolean {
  const lower = defText.toLowerCase()
  const w = word.toLowerCase()
  // Build a small set of variants: the word itself + stripping common suffixes
  const variants = new Set([w])
  for (const suffix of ['ing', 'ed', 'er', 'ers', 'est', 'ly', 's', 'es', 'ies']) {
    if (w.endsWith(suffix) && w.length - suffix.length >= 3) {
      variants.add(w.slice(0, w.length - suffix.length))
    }
  }
  // Also add simple stem by stripping trailing vowel+consonant patterns
  // Check each variant as a whole word (word-boundary match)
  for (const v of variants) {
    if (new RegExp(`\\b${v}\\b`).test(lower)) return true
  }
  return false
}

// ── Dedup ─────────────────────────────────────────────────────────────────────
function similarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\W+/).filter(w => w.length > 3))
  const wordsB = new Set(b.toLowerCase().split(/\W+/).filter(w => w.length > 3))
  if (wordsA.size === 0 || wordsB.size === 0) return 0
  let shared = 0
  for (const w of wordsA) if (wordsB.has(w)) shared++
  return shared / Math.min(wordsA.size, wordsB.size)
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface PuzzleCandidate {
  word: string
  definitions: { num: number; text: string; pos: string }[]
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ── API call ──────────────────────────────────────────────────────────────────
async function getDefinitions(word: string): Promise<{ text: string; pos: string }[] | null> {
  try {
    const res = await fetch(`${DICT_API}/${encodeURIComponent(word)}`)
    if (!res.ok) return null

    const data = await res.json() as any[]
    if (!Array.isArray(data) || data.length === 0) return null

    const rawDefs: { text: string; pos: string }[] = []
    for (const entry of data) {
      for (const meaning of entry.meanings ?? []) {
        const pos = meaning.partOfSpeech as string
        for (const def of meaning.definitions ?? []) {
          const text = def.definition?.trim()
          if (text) rawDefs.push({ text, pos })
        }
      }
    }

    // Collapse near-duplicates (>60% word overlap)
    const deduped: { text: string; pos: string }[] = []
    for (const def of rawDefs) {
      if (!deduped.some(d => similarity(d.text, def.text) > 0.6)) {
        deduped.push(def)
      }
    }

    return deduped.length > 0 ? deduped : null
  } catch {
    return null
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Fetching MIT 10k word list... (seed=${SEED}, target=${TARGET})`)
  const wordListRes = await fetch(WORD_LIST_URL)
  const wordListText = await wordListRes.text()

  const rng = mulberry32(SEED)

  const words = shuffle(
    wordListText
      .split('\n')
      .map(w => w.trim().toLowerCase())
      .filter(w => w.length >= MIN_WORD_LENGTH && /^[a-z]+$/.test(w) && !looksInflected(w)),
    rng
  )

  console.log(`${words.length} eligible words after inflection filter. Scanning until ${TARGET} candidates found...\n`)

  const candidates: PuzzleCandidate[] = []
  let processed = 0

  for (const word of words) {
    if (candidates.length >= TARGET) break

    processed++
    process.stdout.write(
      `\r[scanned ${processed}] ${word.padEnd(20)} → ${candidates.length}/${TARGET} candidates`
    )

    const defs = await getDefinitions(word)
    await sleep(RATE_LIMIT_MS)

    if (!defs || defs.length < MIN_DEFINITIONS) continue

    // Drop any definition that contains the puzzle word itself
    const cleanDefs = defs.filter(d => !definitionMentionsWord(d.text, word))
    if (cleanDefs.length < MIN_DEFINITIONS) continue

    // Take top MAX_DEFINITIONS, then check PoS variety
    const topDefs = cleanDefs.slice(0, MAX_DEFINITIONS)
    const posSet = new Set(topDefs.map(d => d.pos))
    if (posSet.size < MIN_POS_VARIETY) continue

    // Reverse: most-obscure first → most-common last
    const reversed = [...topDefs].reverse()

    candidates.push({
      word: word.toUpperCase(),
      definitions: reversed.map((d, i) => ({ num: i + 1, text: d.text, pos: d.pos }))
    })
  }

  console.log(`\n\nDone! Scanned ${processed} words, found ${candidates.length} candidates.\n`)
  console.log('='.repeat(70))

  for (const c of candidates) {
    console.log(`\n${c.word}`)
    for (const d of c.definitions) {
      console.log(`  ${d.num}. [${d.pos}] ${d.text}`)
    }
  }

  if (OUT_FILE) {
    const { writeFileSync } = await import('fs')
    writeFileSync(OUT_FILE, JSON.stringify(candidates, null, 2))
    console.log(`\n\nSaved ${candidates.length} candidates to ${OUT_FILE}`)
  }
}

main().catch(console.error)
