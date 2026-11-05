import { LitElement, html, css, type TemplateResult } from 'lit'
import { property, state } from 'lit/decorators.js'

/* ───────── Simple Canvas Chart Base ───────── */

export class DisplacerChart extends LitElement {
  static styles = css`
    :host { display: block; position: relative; }
    canvas { width: 100%; height: 100%; display: block; }
    .empty { display: flex; align-items: center; justify-content: center; height: 100%; color: var(--ds-fg-muted, #7c6f64); font-size: 0.8rem; }
  `
  @property({ type: Array }) data: number[] = []
  @property({ type: String }) color = 'var(--ds-primary, #b16286)'
  @property({ type: String }) fillColor = 'rgba(177,98,134,0.1)'
  @property({ type: String }) type: 'line' | 'bar' = 'line'
  @property({ type: Number }) height = 120
  @state() private canvasWidth = 0

  render(): TemplateResult {
    if (!this.data.length) return html`<div class="empty">No data</div>`
    return html`<canvas></canvas>`
  }

  firstUpdated() {
    const canvas = this.shadowRoot!.querySelector('canvas') as HTMLCanvasElement
    const observer = new ResizeObserver(() => {
      const rect = this.getBoundingClientRect()
      canvas.width = rect.width * devicePixelRatio
      canvas.height = this.height * devicePixelRatio
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${this.height}px`
      this._draw(canvas)
    })
    observer.observe(this)
  }

  private _draw(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width; const h = canvas.height
    const dpr = devicePixelRatio
    ctx.clearRect(0, 0, w, h)

    const pad = 4 * dpr
    const drawW = w - pad * 2
    const drawH = h - pad * 2
    const max = Math.max(...this.data, 1)
    const min = Math.min(...this.data, 0)
    const range = max - min || 1

    // Resolve color
    const color = getComputedStyle(this).getPropertyValue('--ds-primary').trim() || '#b16286'

    if (this.type === 'bar') {
      const barW = drawW / this.data.length
      this.data.forEach((v, i) => {
        const x = pad + i * barW
        const barH = ((v - min) / range) * drawH
        ctx.fillStyle = color
        ctx.globalAlpha = 0.7
        ctx.fillRect(x, h - pad - barH, barW - 1, barH)
        ctx.globalAlpha = 1
      })
    } else {
      // Line chart
      ctx.beginPath()
      this.data.forEach((v, i) => {
        const x = pad + (i / (this.data.length - 1)) * drawW
        const y = h - pad - ((v - min) / range) * drawH
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      })
      ctx.strokeStyle = color
      ctx.lineWidth = 2 * dpr
      ctx.stroke()

      // Fill area
      const last = this.data.length - 1
      ctx.lineTo(pad + drawW, h - pad)
      ctx.lineTo(pad, h - pad)
      ctx.closePath()
      ctx.fillStyle = this.fillColor
      ctx.fill()
    }
  }
}
customElements.define('ds-chart', DisplacerChart)

/* ───────── Gauge ───────── */

export class DisplacerGauge extends LitElement {
  static styles = css`
    :host { display: inline-block; }
    .gauge { position: relative; width: var(--size, 80px); height: var(--size, 80px); }
    svg { transform: rotate(-90deg); }
    .label { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .value { font-size: 1.25rem; font-weight: 700; line-height: 1; }
    .title { font-size: 0.6rem; color: var(--ds-fg-muted, #7c6f64); text-transform: uppercase; letter-spacing: 0.05em; }
  `
  @property({ type: Number }) value = 0
  @property({ type: Number }) max = 100
  @property({ type: String }) label = ''
  @property({ type: String }) color = ''
  @property({ type: Number }) size = 80

  render(): TemplateResult {
    const pct = Math.min(100, Math.max(0, (this.value / this.max) * 100))
    const r = 30; const circ = 2 * Math.PI * r; const offset = circ - (pct / 100) * circ
    const strokeColor = this.color || 'var(--ds-primary, #b16286)'
    return html`
      <div class="gauge" style="--size: ${this.size}px">
        <svg width="${this.size}" height="${this.size}" viewBox="0 0 70 70">
          <circle cx="35" cy="35" r="${r}" fill="none" stroke="var(--ds-bg-surface-alt, #d5c4a1)" stroke-width="4"/>
          <circle cx="35" cy="35" r="${r}" fill="none" stroke="${strokeColor}" stroke-width="4"
            stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round"
            style="transition: stroke-dashoffset 0.5s ease"/>
        </svg>
        <div class="label"><span class="value">${Math.round(pct)}%</span>${this.label ? html`<span class="title">${this.label}</span>` : ''}</div>
      </div>`
  }
}
customElements.define('ds-gauge', DisplacerGauge)

/* ───────── Sparkline ───────── */

export class DisplacerSparkline extends LitElement {
  static styles = css`
    :host { display: inline-block; vertical-align: middle; }
    canvas { display: block; }
  `
  @property({ type: Array }) data: number[] = []
  @property({ type: Number }) width = 60
  @property({ type: Number }) height = 20

  firstUpdated() {
    const canvas = this.shadowRoot!.querySelector('canvas') as HTMLCanvasElement
    canvas.width = this.width * devicePixelRatio
    canvas.height = this.height * devicePixelRatio
    canvas.style.width = `${this.width}px`
    canvas.style.height = `${this.height}px`
    const ctx = canvas.getContext('2d')
    if (!ctx || !this.data.length) return
    const w = canvas.width; const h = canvas.height; const dpr = devicePixelRatio
    const max = Math.max(...this.data, 1); const min = Math.min(...this.data, 0); const range = max - min || 1
    const color = getComputedStyle(this).getPropertyValue('--ds-primary').trim() || '#b16286'
    ctx.beginPath()
    this.data.forEach((v, i) => {
      const x = (i / (this.data.length - 1)) * w
      const y = h - ((v - min) / range) * h
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.strokeStyle = color; ctx.lineWidth = 1.5 * dpr; ctx.stroke()
  }

  render(): TemplateResult {
    return html`<canvas></canvas>`
  }
}
customElements.define('ds-sparkline', DisplacerSparkline)

/* ───────── Edge Gauge (diverging, center-target) ─────────
   A linear gauge for metrics whose ideal is a
   CENTER target between two failure regimes — edge-of-chaos λ (ordered↔edge↔chaotic), temperature
   vs setpoint, error vs tolerance. Value mark slides across a track with a fixed center marker. */

export class DisplacerEdgeGauge extends LitElement {
  static styles = css`
    :host { display: block; }
    .track { position: relative; height: 14px; border-radius: 7px;
      background: linear-gradient(90deg,
        var(--ds-info, #458588) 0%, var(--ds-bg-surface-alt, #d5c4a1) 50%, var(--ds-error, #cc241d) 100%);
      opacity: 0.9; }
    .zero { position: absolute; left: 50%; top: -3px; bottom: -3px; width: 2px;
      background: var(--ds-success, #689d6a); opacity: 0.85; }
    .mark { position: absolute; top: 50%; width: 12px; height: 12px; border-radius: 50%;
      background: var(--ds-fg-inverse, #fbf1c7); border: 2px solid var(--ds-fg-default, #3c3836);
      transform: translate(-50%, -50%); transition: left 0.4s ease; }
    .labels { display: flex; justify-content: space-between; margin-top: 3px;
      font-size: 0.62rem; color: var(--ds-fg-muted, #7c6f64);
      text-transform: uppercase; letter-spacing: 0.05em; }
    .value { text-align: center; font-size: 0.8rem; font-weight: 700; margin-top: 2px;
      color: var(--ds-fg-default, #3c3836); font-variant-numeric: tabular-nums; }
  `
  @property({ type: Number }) value = 0
  @property({ type: Number }) min = -1
  @property({ type: Number }) max = 1
  @property({ type: Number }) center = 0
  @property({ type: String }) labelLow = 'low'
  @property({ type: String }) labelCenter = 'target'
  @property({ type: String }) labelHigh = 'high'
  @property({ type: Boolean }) showValue = false
  @property({ type: Number }) decimals = 3

  render(): TemplateResult {
    const span = (this.max - this.min) || 1
    const pct = Math.min(100, Math.max(0, ((this.value - this.min) / span) * 100))
    const cpct = Math.min(100, Math.max(0, ((this.center - this.min) / span) * 100))
    return html`
      <div class="track">
        <div class="zero" style="left:${cpct}%"></div>
        <div class="mark" style="left:${pct}%"></div>
      </div>
      <div class="labels"><span>${this.labelLow}</span><span>${this.labelCenter}</span><span>${this.labelHigh}</span></div>
      ${this.showValue ? html`<div class="value">${this.value.toFixed(this.decimals)}</div>` : ''}`
  }
}
customElements.define('ds-edge-gauge', DisplacerEdgeGauge)
