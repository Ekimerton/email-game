export interface DailyPuzzle {
  id: string
  date: string
  word: string
  definitions: string[]
}

export const PUZZLES: DailyPuzzle[] = [
  {
    id: "1",
    date: "2026-08-17",
    word: "WOUND",
    definitions: [
      "To blow air through a wind instrument or horn to make a sound.",
      "To hurt or injure (someone) by cutting, piercing, or tearing the skin.",
      "An injury to a person by which the skin is divided or its continuity broken.",
      "A hurt to a person's feelings, reputation, prospects, etc.",
      "An injury, such as a cut, stab, or tear, to a (usually external) part of the body."
    ]
  },
  {
    id: "2",
    date: "2026-08-18",
    word: "RESUME",
    definitions: [
      "A summary or account of education and employment experiences and qualifications, a curriculum vitae (often for presentation to a potential future employer when applying for a job).",
      "A summary or synopsis.",
      "To start (something) again that has been stopped or paused from the point at which it was stopped or paused; continue, carry on.",
      "To summarise.",
      "To take back possession of (something)."
    ]
  },
  {
    id: "3",
    date: "2026-08-19",
    word: "STILL",
    definitions: [
      "Not moving; calm.",
      "A steep hill or ascent.",
      "A resident of the Falkland Islands.",
      "A photograph, as opposed to movie footage.",
      "A period of calm or silence."
    ]
  },
  {
    id: "4",
    date: "2026-08-20",
    word: "OFFSHORE",
    definitions: [
      "Located in the sea away from the coast.",
      "To use foreign labor to substitute for local labor.",
      "Something or someone in, from, or associated with another country.",
      "An island, outcrop, or other land away from shore.",
      "An area or portion of sea away from the shore."
    ]
  },
  {
    id: "5",
    date: "2026-08-21",
    word: "GAIN",
    definitions: [
      "To have or receive advantage or profit; to acquire gain; to grow rich; to advance in interest, health, or happiness; to make progress.",
      "To acquire possession of.",
      "The factor by which a signal is multiplied.",
      "What is gained.",
      "The act of gaining; acquisition."
    ]
  },
  {
    id: "6",
    date: "2026-08-22",
    word: "SPELL",
    definitions: [
      "To read (something) as though letter by letter; to peruse slowly or with effort.",
      "To put under the influence of a spell; to affect by a spell; to bewitch; to fascinate; to charm.",
      "Speech, discourse.",
      "A magical effect or influence induced by an incantation or formula.",
      "Words or a formula supposed to have magical powers."
    ]
  },
  {
    id: "7",
    date: "2026-08-23",
    word: "BLOODY",
    definitions: [
      "Used as an intensifier.",
      "Characterised by bloodshed.",
      "Covered in blood.",
      "To demonstrably harm the cause of an opponent.",
      "To draw blood from one's opponent in a fight."
    ]
  },
  {
    id: "8",
    date: "2026-08-24",
    word: "PARAGRAPH",
    definitions: [
      "To sort text into paragraphs.",
      "An offset of 16 bytes in Intel memory architectures.",
      "A mark or note set in the margin to call attention to something in the text, such as a change of subject.",
      "A passage in text that is about a different subject from the preceding text, marked by commencing on a new line, the first line sometimes being indented."
    ]
  },
  {
    id: "9",
    date: "2026-08-25",
    word: "TRUSTEE",
    definitions: [
      "To attach (a debtor's wages, credits, or property in the hands of a third person) in the interest of the creditor.",
      "To commit (property) to the care of a trustee.",
      "A person in whose hands the effects of another are attached in a trustee process.",
      "A person to whom property is legally committed in trust, to be applied either for the benefit of specified individuals, or for public uses."
    ]
  },
  {
    id: "10",
    date: "2026-08-26",
    word: "SILENT",
    definitions: [
      "Keeping at rest; inactive; calm; undisturbed.",
      "Not speaking; indisposed to talk; speechless; mute; taciturn.",
      "Free from sound or noise; absolutely still; perfectly quiet.",
      "A silent movie.",
      "That which is silent; a time of silence."
    ]
  },
  {
    id: "11",
    date: "2026-08-27",
    word: "CORK",
    definitions: [
      "An aerialist maneuver involving a rotation where the rider goes heels over head, with the board overhead.",
      "To position one's drift net just outside of another person's net, thereby intercepting and catching all the fish that would have gone into that person's net.",
      "To injure through a blow; to induce a haematoma.",
      "The dead protective tissue between the bark and cambium in woody plants.",
      "A bottle stopper made from cork or any other material."
    ]
  },
  {
    id: "12",
    date: "2026-08-28",
    word: "DAWN",
    definitions: [
      "To begin to brighten with daylight.",
      "The earliest phase of something.",
      "The time when the sun rises.",
      "The morning twilight period immediately before sunrise."
    ]
  },
  {
    id: "13",
    date: "2026-08-29",
    word: "VENTURE",
    definitions: [
      "To dare to engage in; to attempt without any certainty of success.",
      "To risk or offer.",
      "The thing risked; especially, something sent to sea in trade.",
      "An event that is not, or cannot be, foreseen.",
      "A risky or daring undertaking or journey."
    ]
  },
  {
    id: "14",
    date: "2026-08-30",
    word: "SEARCH",
    definitions: [
      "To look for, seek.",
      "To look in a place for something.",
      "The act of searching in general.",
      "An attempt to find something."
    ]
  }
]

export function getTodayDateString(timeZone: string = 'America/New_York'): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  return formatter.format(new Date())
}

export function getDailyPuzzle(dateStr?: string): DailyPuzzle {
  const targetDate = dateStr || getTodayDateString('America/New_York')
  const puzzle = PUZZLES.find(p => p.date === targetDate)

  if (puzzle) return puzzle

  // Fallback: cycle through puzzles if date beyond predefined list
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
