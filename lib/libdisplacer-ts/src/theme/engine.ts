/**
 * Displacer Theme Engine
 *
 * A theme is a named bundle containing colors, fonts, audio cues,
 * and optional WebGL shader backgrounds. Inspired by Chrome themes.
 */

export interface ThemeColors {
  page: string; surface: string; surfaceAlt: string; raised: string
  fg: string; fgMuted: string; fgSubtle: string
  border: string; borderMuted: string
  primary: string; primaryHover: string
  accent: string; accentHover: string
  semanticInfo: string; semanticSuccess: string; semanticWarning: string; semanticError: string
  jewels: { amethyst: string; sapphire: string; emerald: string; ruby: string; topaz: string; citrine: string; quartz: string }
}

export interface ThemeFonts {
  display?: string; heading?: string; body?: string; mono?: string; accent?: string
  imports?: string[]
}

export interface ThemeAudio {
  hover?: string; click?: string; success?: string; error?: string; notification?: string
}

export interface ThemeShaders {
  background?: string; vertex?: string
  uniforms?: Record<string, number | number[]>
}

export interface ThemeManifest {
  id: string; name: string; version: string
  author?: string; description?: string
  colors: ThemeColors
  fonts?: ThemeFonts
  audio?: ThemeAudio
  shaders?: ThemeShaders
}

/** Apply a theme to the document root */
export function applyTheme(theme: ThemeManifest): void {
  const root = document.documentElement
  const c = theme.colors
  const props: Record<string, string> = {
    '--ds-bg-page': c.page, '--ds-bg-surface': c.surface, '--ds-bg-surface-alt': c.surfaceAlt, '--ds-bg-raised': c.raised,
    '--ds-fg-default': c.fg, '--ds-fg-muted': c.fgMuted, '--ds-fg-subtle': c.fgSubtle,
    '--ds-border': c.border, '--ds-border-muted': c.borderMuted,
    '--ds-primary': c.primary, '--ds-primary-hover': c.primaryHover,
    '--ds-accent': c.accent, '--ds-accent-hover': c.accentHover,
    '--ds-info': c.semanticInfo, '--ds-success': c.semanticSuccess, '--ds-warning': c.semanticWarning, '--ds-error': c.semanticError,
  }
  for (const [key, val] of Object.entries(props)) root.style.setProperty(key, val)

  if (theme.fonts?.imports) {
    for (const url of theme.fonts.imports) {
      if (!document.querySelector(`link[href="${url}"]`)) {
        const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = url
        document.head.appendChild(link)
      }
    }
  }
  if (theme.fonts) {
    for (const [key, val] of Object.entries(theme.fonts)) {
      if (key !== 'imports' && val) root.style.setProperty(`--ds-font-${key}`, val)
    }
  }
  root.dataset.dsTheme = theme.id
  localStorage.setItem('ds-active-theme', theme.id)
}

export function getActiveThemeId(): string | null {
  return localStorage.getItem('ds-active-theme')
}

export function playAudio(_name: string): void {
  // Audio playback placeholder — future implementation
}

export class ThemeRegistry {
  private themes = new Map<string, ThemeManifest>()
  register(theme: ThemeManifest): void { this.themes.set(theme.id, theme) }
  get(id: string): ThemeManifest | undefined { return this.themes.get(id) }
  getAll(): ThemeManifest[] { return Array.from(this.themes.values()) }
  apply(id: string): boolean { const t = this.themes.get(id); if (!t) return false; applyTheme(t); return true }
}

export const themeRegistry = new ThemeRegistry()
