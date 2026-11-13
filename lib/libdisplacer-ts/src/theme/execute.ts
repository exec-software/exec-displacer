import type { ThemeManifest } from './engine'
import { colors } from '../tokens/colors'

const palette = colors.execute

/** Execute's public-facing identity, based on executesoftware.com. */
export const execute: ThemeManifest = {
  id: 'execute',
  name: 'Execute',
  version: '1.0.0',
  author: 'Execute Software',
  description: 'Technical near-black surfaces, lime signal accents, and modern grotesk typography from the Execute website.',
  colors: {
    page: palette.bg.page, surface: palette.bg.surface,
    surfaceAlt: palette.bg['surface-alt'], raised: palette.bg.raised,
    fg: palette.fg.default, fgMuted: palette.fg.muted, fgSubtle: palette.fg.subtle,
    fgInverse: palette.fg.inverse,
    border: palette.border.default, borderMuted: palette.border.muted,
    primary: palette.primary.default, primaryHover: palette.primary.hover,
    accent: palette.accent.default, accentHover: palette.accent.hover,
    semanticInfo: palette.semantic.info, semanticSuccess: palette.semantic.success,
    semanticWarning: palette.semantic.warning, semanticError: palette.semantic.error,
    jewels: palette.jewel,
  },
  fonts: {
    display: '"Space Grotesk", Arial, sans-serif',
    heading: '"Space Grotesk", Arial, sans-serif',
    body: '"Space Grotesk", Arial, sans-serif',
    control: '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
    mono: '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
    imports: ['https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Space+Grotesk:wght@400;500&display=swap'],
  },
  shape: { buttonRadius: '9999px', controlRadius: '0px', cardRadius: '0px', borderWidth: '1px' },
}
