export interface DailyPuzzle {
  id: string
  date: string
  word: string
  category: string
  definitions: string[]
}

export const PUZZLES: DailyPuzzle[] = [
  {
    id: "1",
    date: "2026-08-01",
    word: "CURRENT",
    category: "Multi-meaning Noun & Adjective",
    definitions: [
      "Belonging to the present time; happening or being used now.",
      "A body of water or air moving in a definite direction through a surrounding body.",
      "A flow of electricity through a conductor or circuit.",
      "The general tendency, movement, or course of events or thoughts."
    ]
  },
  {
    id: "2",
    date: "2026-08-02",
    word: "SPRING",
    category: "Multi-meaning Noun & Verb",
    definitions: [
      "The season of the year between winter and summer when vegetation begins to grow.",
      "A elastic metal coil or device that recovers its shape after being compressed or stretched.",
      "A natural stream of water issuing from the ground.",
      "To move, jump, or leap rapidly and suddenly upward or forward.",
      "To originate or arise from a specific source."
    ]
  },
  {
    id: "3",
    date: "2026-08-03",
    word: "LIGHT",
    category: "Multi-meaning Noun, Adjective & Verb",
    definitions: [
      "The natural agent that stimulates sight and makes things visible.",
      "Having a considerable or sufficient amount of natural brightness.",
      "Of little weight; not heavy.",
      "To ignite or cause something to begin burning.",
      "Gentle or delicate in motion or touch."
    ]
  },
  {
    id: "4",
    date: "2026-08-04",
    word: "CHARGE",
    category: "Multi-meaning Noun & Verb",
    definitions: [
      "To demand an amount as a price from someone for a service or goods.",
      "To rush forward in a sudden, violent attack or movement.",
      "The property of matter that experiences a force when placed in an electromagnetic field.",
      "To store electrical energy in a battery or device.",
      "An official accusation of a crime or offense."
    ]
  },
  {
    id: "5",
    date: "2026-08-05",
    word: "STRIKE",
    category: "Multi-meaning Noun & Verb",
    definitions: [
      "To hit forcibly and deliberately with one's hand or a weapon.",
      "A refusal to work organized by a body of employees as a form of protest.",
      "A sudden discovery or attainment of something valuable like oil or gold.",
      "In baseball, a pitch that is missed or judged to be through the strike zone.",
      "To ignite a match by rubbing it against a rough surface."
    ]
  },
  {
    id: "6",
    date: "2026-08-06",
    word: "BARK",
    category: "Multi-meaning Noun & Verb",
    definitions: [
      "The tough, protective outer sheath of the trunk and branches of a tree.",
      "The sharp, abrupt sound made by a dog or certain other wild animals.",
      "To utter words sharply, commandingly, or aggressively.",
      "A small sailing ship or vessel from historical times."
    ]
  },
  {
    id: "7",
    date: "2026-08-07",
    word: "BANK",
    category: "Multi-meaning Noun & Verb",
    definitions: [
      "A financial institution licensed to receive deposits and make loans.",
      "The land alongside or sloping down to a river or body of water.",
      "A row or tier of similar objects like switches, keys, or elevators.",
      "To tilt an aircraft laterally when making a turn."
    ]
  }
]

export function getDailyPuzzle(dateStr?: string): DailyPuzzle {
  const targetDate = dateStr || new Date().toISOString().split('T')[0]
  const puzzle = PUZZLES.find(p => p.date === targetDate)
  
  if (puzzle) return puzzle

  // Fallback dynamic generator if date beyond predefined list
  const idx = Math.abs(hashCode(targetDate)) % PUZZLES.length
  return {
    ...PUZZLES[idx],
    date: targetDate
  }
}

export function formatPrettyDate(dateStr: string): string {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const year = Number(parts[0])
  const month = Number(parts[1])
  const day = Number(parts[2])
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  if (!year || !month || !day || month < 1 || month > 12) return dateStr
  return `${months[month - 1]} ${day}, ${year}`
}

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return hash
}

