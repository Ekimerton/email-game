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
    id: 'october-6-2026',
    title: 'New styles & customizable colors in user preferences!',
    date: 'October 6, 2026',
    paragraphs: [
      'Hello again! Over the past week, I’ve spent some time reworking the styles to make the UI feel cleaner and sharper in your inbox. Getting interactive emails to render consistently is always a puzzle in itself, but I’ve been dialing in the colors and overall look so the email is easier on the eyes.',
      'I’ve also been actively working on a mascot for Inboxed, similar to the parrot in Hexcodle! I want to give the game a little more personality and charm, but I haven’t landed anywhere with it yet.',
      'In the meantime, I’ve added a fun customization: you can now pick your own color combinations in your user preferences! You can check our the palettes and change yours anytime using the preferences link at the bottom of today’s email.',
      'If you run into any quirks or have thoughts on the new colors, feel free to drop them in the <a href="https://forms.gle/o3rAMb56i7cL1T1n8" target="_blank" rel="noopener noreferrer">feedback form</a>.<br><br>Thanks again for following along,<br><br>Ekim'
    ]
  },
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
