import { LitElement, html, css, type TemplateResult } from 'lit'
import { property } from 'lit/decorators.js'

/**
 * ds-phase-portrait — a delay-embedded phase portrait of any numeric series: plots s(t) vs s(t−τ), colored by
 * recency. Reveals the geometry in a time series — fixed points, limit cycles,
 * drift, chaos — where a plain line chart shows only wiggles. Ideal for academic/telemetry dashboards.
 *
 *   const p = document.querySelector('ds-phase-portrait')
 *   p.series = myNumbers            // number[], oldest → newest
 *
 * Attributes: tau (delay, default 4) · variant "well" (dark plot-field, default) | "parchment" · trail (line on/off)
 */
export class DisplacerPhasePortrait extends LitElement {
  static styles = css`
    :host { display: block; }
    canvas { display: block; width: 100%; height: 100%; border-radius: 8px;
      border: 1.5px solid var(--ds-border, #bdae93); }
    .well { background: radial-gradient(70% 70% at 50% 46%, #32302f, #1d2021); }
    .parchment { background: radial-gradient(70% 70% at 50% 46%, var(--ds-bg-raised, #f9f5d7), var(--ds-bg-surface-alt, #d5c4a1)); }
    .lbl { font: 500 10px 'JetBrains Mono', monospace; color: var(--ds-fg-muted, #7c6f64); margin-top: 4px; }
  `

  @property({ type: Number }) tau = 4
  @property({ type: String }) variant: 'well' | 'parchment' = 'well'
  @property({ type: Boolean }) trail = true
  @property({ attribute: false }) series: number[] = []

  override updated(): void { this.draw() }

  private draw(): void {
    const cv = this.renderRoot.querySelector('canvas') as HTMLCanvasElement | null
    if (!cv) return
    const dpr = window.devicePixelRatio || 1
    const W = cv.clientWidth * dpr, H = cv.clientHeight * dpr
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H }
    const c = cv.getContext('2d')
    if (!c) return
    c.clearRect(0, 0, W, H)
    const s = this.series, tau = Math.max(1, this.tau)
    if (!s || s.length <= tau + 1) return
    let lo = Infinity, hi = -Infinity
    for (const v of s) { if (v < lo) lo = v; if (v > hi) hi = v }
    if (hi - lo < 1e-9) { lo -= 0.5; hi += 0.5 }
    const pad = 10 * dpr
    const X = (v: number): number => pad + (W - 2 * pad) * (v - lo) / (hi - lo)
    const Y = (v: number): number => H - pad - (H - 2 * pad) * (v - lo) / (hi - lo)
    const dark = this.variant === 'well'
    if (this.trail) {
      c.strokeStyle = dark ? 'rgba(212, 190, 152, 0.28)' : 'rgba(60, 56, 54, 0.22)'
      c.lineWidth = dpr
      c.beginPath()
      for (let t = tau; t < s.length; t++) {
        const x = X(s[t]), y = Y(s[t - tau])
        if (t === tau) c.moveTo(x, y); else c.lineTo(x, y)
      }
      c.stroke()
    }
    // dots colored by recency: jewel amethyst→sapphire sweep (dark) / ink-fading (parchment)
    for (let t = tau; t < s.length; t++) {
      const f = t / s.length
      c.fillStyle = dark
        ? `rgba(${Math.round(177 + (69 - 177) * f)}, ${Math.round(98 + (133 - 98) * f)}, ${Math.round(134 + (136 - 134) * f)}, ${0.25 + 0.65 * f})`
        : `rgba(60, 56, 54, ${0.10 + 0.75 * f})`
      c.beginPath()
      c.arc(X(s[t]), Y(s[t - tau]), (1.4 + 1.2 * f) * dpr, 0, 6.2832)
      c.fill()
    }
  }

  render(): TemplateResult {
    return html`
      <canvas class="${this.variant}"></canvas>
      <div class="lbl">phase portrait · s(t) vs s(t−${this.tau}) · n=${this.series?.length ?? 0}</div>
    `
  }
}

customElements.define('ds-phase-portrait', DisplacerPhasePortrait)
