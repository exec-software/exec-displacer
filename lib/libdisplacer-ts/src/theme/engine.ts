/**
 * Displacer Theme Engine
 *
 * A theme is a named bundle containing colors, fonts, audio cues,
 * and optional WebGL shader backgrounds. Inspired by Chrome themes.
 */

export interface ThemeColors {
  page: string; surface: string; surfaceAlt: string; raised: string
  fg: string; fgMuted: string; fgSubtle: string
  /** Label color on primary/accent fills; omitted themes keep component defaults. */
  fgInverse?: string
  border: string; borderMuted: string
  primary: string; primaryHover: string
  accent: string; accentHover: string
  semanticInfo: string; semanticSuccess: string; semanticWarning: string; semanticError: string
  jewels: { amethyst: string; sapphire: string; emerald: string; ruby: string; topaz: string; citrine: string; quartz: string }
}

export interface ThemeFonts {
  display?: string; heading?: string; body?: string; mono?: string; accent?: string; control?: string
  imports?: string[]
}

/** Optional geometry consumed by the basic button, form and card components. */
export interface ThemeShape {
  buttonRadius?: string; controlRadius?: string; cardRadius?: string; borderWidth?: string
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
  shape?: ThemeShape
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
    '--ds-primary-muted': `color-mix(in srgb, ${c.primary} 14%, transparent)`,
    '--ds-accent': c.accent, '--ds-accent-hover': c.accentHover,
    '--ds-accent-muted': `color-mix(in srgb, ${c.accent} 8%, transparent)`,
    '--ds-info': c.semanticInfo, '--ds-success': c.semanticSuccess, '--ds-warning': c.semanticWarning, '--ds-error': c.semanticError,
  }
  for (const [key, val] of Object.entries(props)) root.style.setProperty(key, val)

  // Clear optional overrides when switching back to a theme that omits them.
  const optional: Record<string, string | undefined> = {
    '--ds-fg-inverse': c.fgInverse,
    '--ds-button-radius': theme.shape?.buttonRadius,
    '--ds-control-radius': theme.shape?.controlRadius,
    '--ds-card-radius': theme.shape?.cardRadius,
    '--ds-border-width': theme.shape?.borderWidth,
  }
  for (const [key, val] of Object.entries(optional)) {
    if (val) root.style.setProperty(key, val)
    else root.style.removeProperty(key)
  }
  root.style.setProperty('--ds-focus-ring', c.primary)

  if (theme.fonts?.imports) {
    for (const url of theme.fonts.imports) {
      if (!document.querySelector(`link[href="${url}"]`)) {
        const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = url
        document.head.appendChild(link)
      }
    }
  }
  for (const key of ['display', 'heading', 'body', 'mono', 'accent', 'control'] as const) {
    const value = theme.fonts?.[key]
    if (value) root.style.setProperty(`--ds-font-${key}`, value)
    else root.style.removeProperty(`--ds-font-${key}`)
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
