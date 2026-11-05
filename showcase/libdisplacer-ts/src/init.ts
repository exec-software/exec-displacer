import { themeRegistry, displacerLight, displacerDark, darkArcana, parchment, codexFlat } from "../../../lib/libdisplacer-ts/src/theme/index.ts"
import '../../../lib/libdisplacer-ts/src/components/index.ts'
import { setLocale, detectLocale } from '../../../lib/libdisplacer-ts/src/translations/index.ts'
import { mountOrchestratorChatDemo } from './chat-app'

themeRegistry.register(displacerLight)
themeRegistry.register(displacerDark)
themeRegistry.register(darkArcana)
themeRegistry.register(parchment)
themeRegistry.register(codexFlat)

const saved = localStorage.getItem("ds-active-theme")
const initialTheme = saved && themeRegistry.get(saved) ? saved : "codex-flat"
themeRegistry.apply(initialTheme)
const themeSelect = document.getElementById("theme-select") as HTMLSelectElement
if (themeSelect) themeSelect.value = initialTheme

// Restore locale
const locale = detectLocale()
setLocale(locale)
const localeSelect = document.getElementById('locale-select') as HTMLSelectElement
if (localeSelect) localeSelect.value = locale

document.getElementById("theme-toggle")?.addEventListener("click", () => {
  const sel = document.getElementById("theme-select") as HTMLSelectElement
  const themes = ["codex-flat", "displacer-dark", "displacer-light", "dark-arcana", "parchment"]
  const next = themes[(themes.indexOf(sel.value) + 1) % themes.length]
  sel.value = next
  themeRegistry.apply(next)
})

document.getElementById("theme-select")?.addEventListener("change", (e) => {
  themeRegistry.apply((e.target as HTMLSelectElement).value)
})

document.getElementById("locale-select")?.addEventListener("change", (e) => {
  setLocale((e.target as HTMLSelectElement).value)
  // Reload showcase to apply translations
  window.location.reload()
})

mountOrchestratorChatDemo()
