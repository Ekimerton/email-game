/**
 * generatePuzzles.ts
 *
 * Fetches the MIT 10k word list, shuffles it with a seeded random, then
 * queries definitions until candidate puzzles are found.
 *
 * Filters applied:
 *   - Words must be >= MIN_WORD_LENGTH characters (default 4) and <= MAX_WORD_LENGTH (default 8)
 *   - Words that look like inflected forms are skipped
 *   - Words must have >= MIN_DEFINITIONS (default 4) distinct, non-redundant definitions
 *   - Stems, roots, substrings, and inflections of the target word are strictly prohibited from definition texts
 *   - Multi-sense & Part-of-Speech variety: definitions must span at least 2 parts of speech / distinct senses
 *   - Non-redundant clues: content-word stemmed Jaccard & overlap deduplication filters out similar definitions
 *
 * Usage:
 *   npx tsx scripts/generatePuzzles.ts --target=50 --seed=1337 --out=puzzles_generated.json
 */

import { writeFileSync } from 'fs'

const WORD_LIST_URL = 'https://www.mit.edu/~ecprice/wordlist.10000'
const DICT_API = 'https://api.dictionaryapi.dev/api/v2/entries/en'
const MIN_WORD_LENGTH = 4
const MAX_WORD_LENGTH = 8
const MIN_DEFINITIONS = 4
const MAX_DEFINITIONS = 5
const MIN_POS_VARIETY = 2
const RATE_LIMIT_MS = 120

const args = process.argv.slice(2)
const seedArg   = args.find(a => a.startsWith('--seed='))
const targetArg = args.find(a => a.startsWith('--target='))
const outArg    = args.find(a => a.startsWith('--out='))
const SEED      = seedArg   ? parseInt(seedArg.split('=')[1], 10)   : 1337
const TARGET    = targetArg ? parseInt(targetArg.split('=')[1], 10) : 50
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

// ── Inflection filter for target words ──────────────────────────────────────
const INFLECTION_SUFFIXES = ['ings', 'tion', 'tions', 'ness', 'nesses', 'ment', 'ments']
const INFLECTION_PATTERNS = [
  /^(.{4,})s$/,
  /^(.{4,})es$/,
  /^(.{4,})ies$/,
  /^(.{4,})ed$/,
  /^(.{4,})ing$/,
  /^(.{4,})ers$/,
  /^(.{4,})est$/,
  /^(.{4,})ly$/,
]

function looksInflected(word: string): boolean {
  if (INFLECTION_SUFFIXES.some(s => word.endsWith(s))) return true
  return INFLECTION_PATTERNS.some(p => p.test(word))
}

// ── Stem and Substring Extraction ───────────────────────────────────────────
const STRIP_SUFFIXES = [
  'ings', 'ing', 'tion', 'tions', 'sion', 'sions', 'ness', 'nesses', 'ment', 'ments',
  'able', 'ible', 'ities', 'ity', 'ers', 'er', 'est', 'ies', 'es', 'ed', 'ly', 'al',
  'ial', 'ical', 'ous', 'ious', 'ful', 'less', 'ish', 'ees', 'ee', 'ive', 'ate', 'ize', 'ise', 'en', 'y', 's'
]

export function getWordStemsAndVariants(word: string): Set<string> {
  const w = word.toLowerCase()
  const variants = new Set<string>([w])

  for (const suffix of STRIP_SUFFIXES) {
    if (w.endsWith(suffix) && w.length - suffix.length >= 3) {
      const stem = w.slice(0, w.length - suffix.length)
      variants.add(stem)
      if (stem.length >= 4 && stem[stem.length - 1] === stem[stem.length - 2]) {
        variants.add(stem.slice(0, -1))
      }
    }
  }

  // Handle common irregular/special stems & derivations
  if (w === 'bloody' || w === 'blood') { variants.add('blood'); variants.add('bleed'); variants.add('bloody') }
  if (w === 'silent' || w === 'silence') { variants.add('silent'); variants.add('silence'); variants.add('silen') }
  if (w === 'wound' || w === 'wind') { variants.add('wound'); variants.add('wind') }
  if (w === 'trustee' || w === 'trust') { variants.add('trust'); variants.add('trustee') }

  return variants
}

export function definitionMentionsWordOrStem(defText: string, word: string): boolean {
  const cleanDef = defText.toLowerCase()
  const target = word.toLowerCase()
  const stems = getWordStemsAndVariants(word)

  // 1. Direct regex match on any stem variant as whole word or prefix
  for (const stem of stems) {
    if (stem.length >= 3) {
      if (new RegExp(`\\b${stem}\\b`, 'i').test(cleanDef)) return true
      if (stem.length >= 4 && new RegExp(`\\b${stem}[a-z]*\\b`, 'i').test(cleanDef)) return true
    }
  }

  // 2. Token-level analysis
  const tokens = cleanDef.replace(/[^a-z0-9\s-]/g, ' ').split(/[\s-]+/).filter(Boolean)
  for (const token of tokens) {
    if (stems.has(token)) return true

    // Target is substring of token (e.g. token "paragraphs" contains "paragraph", "gaining" contains "gain")
    if (target.length >= 4 && token.includes(target)) return true

    // Token is substring of target (e.g. target "offshore" contains token "shore")
    if (token.length >= 4 && target.includes(token)) return true

    // Stems substring check
    for (const stem of stems) {
      if (stem.length >= 4 && token.includes(stem)) return true
    }
  }

  return false
}

// ── Content Word Similarity & Stemming Deduplication ────────────────────────
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren', 'as',
  'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can', 'cannot',
  'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had',
  'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if',
  'in', 'into', 'is', 'it', 'its', 'itself', 'let', 'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not',
  'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves',
  'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very',
  'was', 'wasn', 'we', 'were', 'weren', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why',
  'with', 'won', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves',
  // Common dictionary definition filler words
  'someone', 'something', 'act', 'action', 'state', 'manner', 'quality', 'type', 'kind', 'one', 'used',
  'make', 'made', 'giving', 'gives', 'cause', 'causing', 'person', 'place', 'thing', 'form', 'especially',
  'usually', 'often', 'pertaining', 'relating', 'characterized', 'become', 'becoming', 'having', 'like',
  'such', 'part', 'particular', 'specifically', 'means', 'referring', 'sense', 'general', 'etc', 'also'
])

function stemWord(w: string): string {
  let s = w.toLowerCase()
  for (const suf of ['ational', 'tion', 'sion', 'ing', 'ings', 'ed', 'ies', 'es', 'ers', 'er', 'est', 'ly', 'al', 'ity', 'ness', 'ful', 'less', 'ment', 'able', 'ible', 'ive', 'ize', 'ise', 's']) {
    if (s.endsWith(suf) && s.length - suf.length >= 3) {
      s = s.slice(0, -suf.length)
      break
    }
  }
  return s
}

export function extractContentWords(text: string): Set<string> {
  const rawWords = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
  const contentStems = new Set<string>()
  for (const w of rawWords) {
    if (w.length >= 3 && !STOP_WORDS.has(w)) {
      contentStems.add(stemWord(w))
    }
  }
  return contentStems
}

export function areDefinitionsTooSimilar(
  defA: string | { text: string; pos?: string },
  defB: string | { text: string; pos?: string }
): boolean {
  const textA = typeof defA === 'string' ? defA : defA?.text || ''
  const textB = typeof defB === 'string' ? defB : defB?.text || ''
  const posA = typeof defA === 'object' ? defA?.pos : undefined
  const posB = typeof defB === 'object' ? defB?.pos : undefined

  if (!textA || !textB) return false

  const setA = extractContentWords(textA)
  const setB = extractContentWords(textB)
  if (setA.size === 0 || setB.size === 0) return false

  let shared = 0
  for (const w of setA) {
    if (setB.has(w)) shared++
  }

  const unionSize = setA.size + setB.size - shared
  const jaccard = shared / unionSize
  const minOverlap = shared / Math.min(setA.size, setB.size)

  // Strictest checks:
  // 1. Same part of speech cannot share any key content stem
  if (posA && posB && posA === posB && shared >= 1) return true
  // 2. Any pair sharing 2 or more content stems
  if (shared >= 2) return true
  // 3. Significant overlap ratios
  if (jaccard > 0.20 || minOverlap > 0.28) return true
  // 4. Single shared stem in short definitions
  if (shared === 1 && Math.min(setA.size, setB.size) <= 5) return true

  return false
}

// ── Clean Definition Text ───────────────────────────────────────────────────
export function cleanDefinitionText(text: string): string {
  let cleaned = text.trim()

  // Remove trailing Wikipedia and Wiktionary artifacts e.g. "Wp.", "wp.", "(wp)", "[wp]"
  cleaned = cleaned.replace(/\s*(?:\.|\s)*\[?\bwp\b\]?\.?\s*$/i, '')
  cleaned = cleaned.replace(/\s*(?:\.|\s)*\[?wikipedia\]?\.?\s*$/i, '')

  // Remove leading parentheticals like "(transitive)", "(nautical)", "(slang)", "(figurative)"
  cleaned = cleaned.replace(/^\((?:transitive|intransitive|archaic|obsolete|slang|informal|formal|nautical|computing|rare|figurative|by extension|chiefly[^)]*)\)\s*/i, '')

  // Clean trailing punctuation and normalize spacing
  cleaned = cleaned.replace(/\s+/g, ' ').trim()

  // Capitalize first letter
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
  }

  // Ensure trailing period
  if (!cleaned.endsWith('.') && !cleaned.endsWith('!') && !cleaned.endsWith('?')) {
    cleaned += '.'
  }

  return cleaned
}

const INVALID_START_PATTERNS = [
  /^initialism of/i,
  /^acronym of/i,
  /^abbreviation of/i,
  /^short for/i,
  /^alternative (?:form|spelling|name) of/i,
  /^misspelling of/i,
  /^obsolete (?:form|spelling) of/i,
  /^eye dialect spelling of/i,
  /^surname/i,
  /^a (?:city|town|municipality|village|county|province|river|borough) in/i,
  /^an unincorporated community in/i,
  /^a (?:unisex|female|male) given name/i,
  /^the capital of/i,
]

export function isInvalidDefinition(text: string): boolean {
  const t = text.trim()
  if (t.length < 12) return true
  return INVALID_START_PATTERNS.some(p => p.test(t))
}

// ── Types ───────────────────────────────────────────────────────────────────
export interface PuzzleCandidate {
  word: string
  definitions: { num: number; text: string; pos: string }[]
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ── Fetch & Parse Definitions from Dictionary API ───────────────────────────
async function getRawMeanings(word: string): Promise<{ text: string; pos: string }[] | null> {
  try {
    const res = await fetch(`${DICT_API}/${encodeURIComponent(word)}`)
    if (!res.ok) return null

    const data = await res.json() as any[]
    if (!Array.isArray(data) || data.length === 0) return null

    const rawDefs: { text: string; pos: string }[] = []
    for (const entry of data) {
      for (const meaning of entry.meanings ?? []) {
        const pos = (meaning.partOfSpeech as string || 'noun').toLowerCase()
        if (pos === 'proper noun' || pos === 'interjection' || pos === 'symbol') continue

        for (const def of meaning.definitions ?? []) {
          const text = def.definition?.trim()
          if (text && text.length >= 10 && text.length <= 220) {
            const cleaned = cleanDefinitionText(text)
            if (!isInvalidDefinition(cleaned) && !definitionMentionsWordOrStem(cleaned, word)) {
              rawDefs.push({ text: cleaned, pos })
            }
          }
        }
      }
    }

    return rawDefs.length > 0 ? rawDefs : null
  } catch {
    return null
  }
}

// ── Select Balanced, Diverse Definitions ────────────────────────────────────
export function selectDiverseDefinitions(
  rawDefs: { text: string; pos: string }[],
  word: string
): { text: string; pos: string }[] | null {
  // 1. Group by Part of Speech
  const byPos = new Map<string, { text: string; pos: string }[]>()
  for (const def of rawDefs) {
    if (!byPos.has(def.pos)) byPos.set(def.pos, [])
    byPos.get(def.pos)!.push(def)
  }

  if (byPos.size < MIN_POS_VARIETY) return null

  // 2. Select candidates across PoS, ensuring no mutual similarity
  const selected: { text: string; pos: string }[] = []
  const posKeys = Array.from(byPos.keys())
  let addedAny = true

  while (selected.length < MAX_DEFINITIONS && addedAny) {
    addedAny = false
    for (const pos of posKeys) {
      if (selected.length >= MAX_DEFINITIONS) break
      const defsInPos = byPos.get(pos) || []

      for (let i = 0; i < defsInPos.length; i++) {
        const candidate = defsInPos[i]
        const isDuplicate = selected.some(s => areDefinitionsTooSimilar(s, candidate))
        if (!isDuplicate) {
          selected.push(candidate)
          defsInPos.splice(i, 1)
          addedAny = true
          break
        }
      }
    }
  }

  if (selected.length < MIN_DEFINITIONS) return null

  const finalPosSet = new Set(selected.map(s => s.pos))
  if (finalPosSet.size < MIN_POS_VARIETY) return null

  // Reverse so that secondary / less common clues appear first and most primary clue appears last
  return [...selected].reverse()
}

// ── Main CLI Runner ─────────────────────────────────────────────────────────
async function main() {
  console.log(`Fetching MIT 10k word list... (seed=${SEED}, target=${TARGET})`)
  const wordListRes = await fetch(WORD_LIST_URL)
  const wordListText = await wordListRes.text()

  const rng = mulberry32(SEED)

  const words = shuffle(
    wordListText
      .split('\n')
      .map(w => w.trim().toLowerCase())
      .filter(w =>
        w.length >= MIN_WORD_LENGTH &&
        w.length <= MAX_WORD_LENGTH &&
        /^[a-z]+$/.test(w) &&
        !looksInflected(w)
      ),
    rng
  )

  console.log(`${words.length} eligible words after inflection & length filter. Scanning until ${TARGET} candidates found...\n`)

  const candidates: PuzzleCandidate[] = []
  let processed = 0

  for (const word of words) {
    if (candidates.length >= TARGET) break

    processed++
    process.stdout.write(
      `\r[scanned ${processed}] ${word.padEnd(20)} → ${candidates.length}/${TARGET} candidates`
    )

    const rawDefs = await getRawMeanings(word)
    await sleep(RATE_LIMIT_MS)

    if (!rawDefs || rawDefs.length < MIN_DEFINITIONS) continue

    const selectedDefs = selectDiverseDefinitions(rawDefs, word)
    if (!selectedDefs || selectedDefs.length < MIN_DEFINITIONS) continue

    candidates.push({
      word: word.toUpperCase(),
      definitions: selectedDefs.map((d, i) => ({ num: i + 1, text: d.text, pos: d.pos }))
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
    writeFileSync(OUT_FILE, JSON.stringify(candidates, null, 2))
    console.log(`\n\nSaved ${candidates.length} candidates to ${OUT_FILE}`)
  }
}

if (process.argv[1]?.endsWith('generatePuzzles.ts')) {
  main().catch(console.error)
}
