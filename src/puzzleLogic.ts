import { PUZZLES, DailyPuzzle } from './puzzles'

export { PUZZLES, DailyPuzzle }

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

export function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return hash
}
