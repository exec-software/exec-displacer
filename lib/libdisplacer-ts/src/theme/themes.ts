import { ThemeManifest } from './index'

export const neuLight: ThemeManifest = {
  id: 'neu-light',
  name: 'Displacer Neu',
  version: '1.0.0',
  author: 'Execute Software',
  description: 'Light neumorphism with soft raised surfaces, subtle edges, and a parchment glow',
  colors: {
    page: '#e9e4d8', surface: '#ede8dc', surfaceAlt: '#ddd6c6', raised: '#f4f0e6',
    fg: '#5a5448', fgMuted: '#8b8272', fgSubtle: '#a89f8e',
    border: '#cfc7b6', borderMuted: '#ddd6c6',
    primary: '#b16286', primaryHover: '#9d6075',
    accent: '#d65d0e', accentHover: '#c04f08',
    semanticInfo: '#458588', semanticSuccess: '#689d6a', semanticWarning: '#d79921', semanticError: '#cc241d',
    jewels: { amethyst: '#b16286', sapphire: '#458588', emerald: '#689d6a', ruby: '#cc241d', topaz: '#d79921', citrine: '#d65d0e', quartz: '#a89f8e' },
  },
  fonts: {
    display: '"Averia Serif Libre", Georgia, serif',
    heading: '"Averia Serif Libre", Georgia, serif',
    body: '"Inter", system-ui, sans-serif',
    mono: '"JetBrains Mono", monospace',
    imports: ['https://fonts.googleapis.com/css2?family=Averia+Serif+Libre:wght@400;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap'],
  },
}

export const displacerLight: ThemeManifest = {
  id: 'displacer-light',
  name: 'Displacer Light',
  version: '1.0.0',
  author: 'Execute Software',
  description: 'Default Displacer light theme — warm parchment tones with amethyst & citrine accents',
  colors: {
    page: '#fbf1c7', surface: '#ebdbb2', surfaceAlt: '#d5c4a1', raised: '#f9f5d7',
    fg: '#3c3836', fgMuted: '#7c6f64', fgSubtle: '#a89984',
    border: '#bdae93', borderMuted: '#d5c4a1',
    primary: '#b16286', primaryHover: '#9d6075',
    accent: '#d65d0e', accentHover: '#c04f08',
    semanticInfo: '#458588', semanticSuccess: '#689d6a', semanticWarning: '#d79921', semanticError: '#cc241d',
    jewels: { amethyst: '#b16286', sapphire: '#458588', emerald: '#689d6a', ruby: '#cc241d', topaz: '#d79921', citrine: '#d65d0e', quartz: '#a89984' },
  },
  fonts: {
    display: '"Averia Serif Libre", Georgia, serif',
    heading: '"Averia Serif Libre", Georgia, serif',
    body: '"Inter", system-ui, sans-serif',
    mono: '"JetBrains Mono", monospace',
    imports: ['https://fonts.googleapis.com/css2?family=Averia+Serif+Libre:wght@400;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap'],
  },
}

export const displacerDark: ThemeManifest = {
  id: 'displacer-dark',
  name: 'Displacer Dark',
  version: '1.0.0',
  author: 'Execute Software',
  description: 'Deep charcoal with glowing amethyst — the dark side of Displacer',
  colors: {
    page: '#1d2021', surface: '#282828', surfaceAlt: '#3c3836', raised: '#32302f',
    fg: '#ebdbb2', fgMuted: '#a89984', fgSubtle: '#7c6f64',
    border: '#504945', borderMuted: '#3c3836',
    primary: '#b16286', primaryHover: '#c47a9a',
    accent: '#d65d0e', accentHover: '#e06a15',
    semanticInfo: '#83a598', semanticSuccess: '#8ec07c', semanticWarning: '#fabd2f', semanticError: '#fb4934',
    jewels: { amethyst: '#b16286', sapphire: '#83a598', emerald: '#8ec07c', ruby: '#fb4934', topaz: '#fabd2f', citrine: '#fe8019', quartz: '#a89984' },
  },
  fonts: {
    display: '"Averia Serif Libre", Georgia, serif',
    heading: '"Averia Serif Libre", Georgia, serif',
    body: '"Inter", system-ui, sans-serif',
    mono: '"JetBrains Mono", monospace',
    imports: ['https://fonts.googleapis.com/css2?family=Averia+Serif+Libre:wght@400;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap'],
  },
}

export const codexFlat: ThemeManifest = {
  id: 'codex-flat',
  name: 'Codex Flat',
  version: '1.0.0',
  author: 'Execute + Displacer',
  description: 'Flat dark interface inspired by ChatGPT / Codex with restrained borders and teal primary accents.',
  colors: {
    page: '#0d1117',
    surface: '#111827',
    surfaceAlt: '#1a2233',
    raised: '#202736',
    fg: '#e5e7eb',
    fgMuted: '#9ca3af',
    fgSubtle: '#6b7280',
    border: '#273041',
    borderMuted: '#1f2937',
    primary: '#10a37f',
    primaryHover: '#0f9675',
    accent: '#10a37f',
    accentHover: '#0f8f6f',
    semanticInfo: '#60a5fa',
    semanticSuccess: '#22c55e',
    semanticWarning: '#f59e0b',
    semanticError: '#ef4444',
    jewels: {
      amethyst: '#a855f7',
      sapphire: '#60a5fa',
      emerald: '#22c55e',
      ruby: '#ef4444',
      topaz: '#f59e0b',
      citrine: '#f97316',
      quartz: '#9ca3af',
    },
  },
  fonts: {
    display: '"Inter", system-ui, sans-serif',
    heading: '"Inter", system-ui, sans-serif',
    body: '"Inter", system-ui, sans-serif',
    mono: '"JetBrains Mono", monospace',
    imports: ['https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap'],
  },
}

export const darkArcana: ThemeManifest = {
  id: 'dark-arcana',
  name: 'Dark Arcana',
  version: '1.0.0',
  description: 'Mystical dark theme — deep indigo with sapphire and amethyst magic',
  colors: {
    page: '#0d0d1a', surface: '#16162a', surfaceAlt: '#1e1e3a', raised: '#1a1a32',
    fg: '#e0d0f0', fgMuted: '#9080b0', fgSubtle: '#605080',
    border: '#2a2a4a', borderMuted: '#1e1e3a',
    primary: '#b16286', primaryHover: '#c47a9a',
    accent: '#6366f1', accentHover: '#818cf8',
    semanticInfo: '#458588', semanticSuccess: '#689d6a', semanticWarning: '#d79921', semanticError: '#ef4444',
    jewels: { amethyst: '#b16286', sapphire: '#6366f1', emerald: '#689d6a', ruby: '#ef4444', topaz: '#d79921', citrine: '#f59e0b', quartz: '#9080b0' },
  },
}

export const parchment: ThemeManifest = {
  id: 'parchment',
  name: 'Parchment',
  version: '1.0.0',
  description: 'Aged parchment — sepia tones, amber accents, like an ancient tome',
  colors: {
    page: '#f5e6c8', surface: '#e8d5a8', surfaceAlt: '#d4c08a', raised: '#faefd8',
    fg: '#4a3728', fgMuted: '#8b7355', fgSubtle: '#b8a080',
    border: '#c4a87a', borderMuted: '#dcc8a0',
    primary: '#b16286', primaryHover: '#9d6075',
    accent: '#c87d2e', accentHover: '#b06a20',
    semanticInfo: '#457588', semanticSuccess: '#588d6a', semanticWarning: '#b88921', semanticError: '#ac241d',
    jewels: { amethyst: '#b16286', sapphire: '#457588', emerald: '#588d6a', ruby: '#ac241d', topaz: '#b88921', citrine: '#c87d2e', quartz: '#b8a080' },
  },
}

export const displaced: ThemeManifest = {
  id: 'displaced',
  name: 'Displaced',
  version: '1.0.0',
  author: 'Execute Software',
  description: 'Light parchment content with a dark sidebar, amethyst & citrine accents',
  colors: {
    page: '#fbf1c7', surface: '#282828', surfaceAlt: '#3c3836', raised: '#f9f5d7',
    fg: '#3c3836', fgMuted: '#7c6f64', fgSubtle: '#a89984',
    border: '#504945', borderMuted: '#d5c4a1',
    primary: '#b16286', primaryHover: '#c47a9a',
    accent: '#d65d0e', accentHover: '#e06a15',
    semanticInfo: '#458588', semanticSuccess: '#689d6a', semanticWarning: '#d79921', semanticError: '#cc241d',
    jewels: { amethyst: '#b16286', sapphire: '#458588', emerald: '#689d6a', ruby: '#cc241d', topaz: '#d79921', citrine: '#d65d0e', quartz: '#a89984' },
  },
  fonts: {
    display: '"Averia Serif Libre", Georgia, serif',
    heading: '"Averia Serif Libre", Georgia, serif',
    body: '"Inter", system-ui, sans-serif',
    mono: '"JetBrains Mono", monospace',
    imports: ['https://fonts.googleapis.com/css2?family=Averia+Serif+Libre:wght@400;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap'],
  },
}

export const observatory: ThemeManifest = {
  id: 'observatory',
  name: 'Observatory',
  version: '1.0.0',
  author: 'Execute Software',
  description: 'Displacer parchment with sapphire accents for research dashboards; ' +
    'plot canvases render as dark-field figure wells on the parchment page (academic visualizer reporting).',
  colors: {
    page: '#fbf1c7', surface: '#ebdbb2', surfaceAlt: '#d5c4a1', raised: '#f9f5d7',
    fg: '#3c3836', fgMuted: '#7c6f64', fgSubtle: '#a89984',
    border: '#bdae93', borderMuted: '#d5c4a1',
    primary: '#b16286', primaryHover: '#9d6075',
    accent: '#458588', accentHover: '#3a7174',
    semanticInfo: '#458588', semanticSuccess: '#689d6a', semanticWarning: '#d79921', semanticError: '#cc241d',
    jewels: { amethyst: '#b16286', sapphire: '#458588', emerald: '#689d6a', ruby: '#cc241d', topaz: '#d79921', citrine: '#d65d0e', quartz: '#a89984' },
  },
  fonts: {
    display: '"Averia Serif Libre", Georgia, serif',
    heading: '"Averia Serif Libre", Georgia, serif',
    body: '"Inter", system-ui, sans-serif',
    mono: '"JetBrains Mono", monospace',
    imports: ['https://fonts.googleapis.com/css2?family=Averia+Serif+Libre:wght@400;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap'],
  },
}

export const clayLight: ThemeManifest = {
  id: 'clay-light',
  name: 'Clay Light',
  version: '1.0.0',
  author: 'Execute Software',
  description: "Clay's daylight counterpart \u2014 flat warm-white surfaces, the same orange primary and teal accent darkened for light tiers",
  colors: {
    page: '#f6f5f2', surface: '#fdfcf9', surfaceAlt: '#e9e7e2', raised: '#ffffff',
    fg: '#292723', fgMuted: '#615c55', fgSubtle: '#6b645b',
    border: '#d2cec6', borderMuted: '#e5e1da',
    primary: '#9d4211', primaryHover: '#84370e',
    accent: '#1e6a60', accentHover: '#195951',
    semanticInfo: '#3266a0', semanticSuccess: '#337146', semanticWarning: '#84600c', semanticError: '#b63838',
    jewels: { amethyst: '#9d4211', sapphire: '#376389', emerald: '#3a6845', ruby: '#a13b3b', topaz: '#745b21', citrine: '#1e6a60', quartz: '#625e5a' },
  },
}
