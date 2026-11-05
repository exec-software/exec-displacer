/**
 * Displacer i18n — lightweight localization system
 *
 * Usage:
 *   import { t, setLocale, locale } from './i18n'
 *   t('common.save') // → "Save" (in active locale)
 *   setLocale('de')  // → switches to German
 */

type Translations = Record<string, string>
type LocaleCode = string

const registry = new Map<LocaleCode, Translations>()
let currentLocale = 'en'
let fallbackLocale = 'en'

export function registerLocale(code: LocaleCode, translations: Translations): void {
  registry.set(code, translations)
}

export function setLocale(code: LocaleCode): void {
  if (registry.has(code)) {
    currentLocale = code
    document.documentElement.lang = code
    localStorage.setItem('ds-locale', code)
    window.dispatchEvent(new CustomEvent('locale-changed', { detail: { locale: code } }))
  }
}

export function getLocale(): string {
  return currentLocale
}

export function getAvailableLocales(): LocaleCode[] {
  return Array.from(registry.keys())
}

export function t(key: string, params?: Record<string, string | number>): string {
  const trans = registry.get(currentLocale)
  const fallback = registry.get(fallbackLocale)
  let val = trans?.[key] || fallback?.[key] || key
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      val = val.replace(`{${k}}`, String(v))
    }
  }
  return val
}

// Auto-detect browser locale
export function detectLocale(): string {
  const saved = localStorage.getItem('ds-locale')
  if (saved && registry.has(saved)) return saved
  const browser = navigator.language.split('-')[0]
  if (registry.has(browser)) return browser
  return 'en'
}
