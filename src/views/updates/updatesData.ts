export interface PatchNoteSection {
  heading: string
  body?: string
  bullets?: string[]
}

export interface PatchNote {
  id: string
  title: string
  date: string
  tag?: string
  tagColor?: string
  summary?: string
  paragraphs?: string[]
  sections?: PatchNoteSection[]
}

export const UPDATES: PatchNote[] = [
  {
    id: 'first-update',
    title: 'First update & where Inboxed is headed',
    date: 'September 2026',
    paragraphs: [
      'Hello! Thank you for playing Inboxed. Expanding on the brief note from the Hexcodle update modal, I wanted to share a bit more about why I built this game and where it’s headed.',
      'I discovered interactive email capabilities about six months ago, and the gears immediately started turning. Usually, I come up with an idea and work backwards to find the tech. Here, the tech itself felt so powerful that I worked forward from it until I had a working prototype, <a href="https://www.youtube.com/watch?v=EZll3dJ2AjY" target="_blank" rel="noopener noreferrer">much to the chagrin of Steve Jobs</a>.',
      'Inboxed is currently in beta, meaning both the visuals and gameplay are still very fluid. If you run into any bugs or friction, please let me know through the <a href="https://forms.gle/o3rAMb56i7cL1T1n8" target="_blank" rel="noopener noreferrer">feedback form</a>. I’ll be rolling out updates over the coming weeks, sharing notes here, and keeping the in-email banner updated. I’ve also asked Hannah to help with a more thematic visual overhaul (because, as you can tell, I\'m an engineer first and a designer second!).',
      'Thanks again for following along,<br><br>Ekim'
    ]
  }
]

export const LATEST_UPDATE = UPDATES[0]
