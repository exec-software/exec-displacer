import { LitElement, html, css, type TemplateResult } from 'lit'
import { property, state } from 'lit/decorators.js'

/* ───────── Utility ───────── */
function hexToRgba(hex: string, alpha: number): string {
  const m = hex.match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i)
  if (!m) return `rgba(177,98,134,${alpha})`
  return `rgba(${parseInt(m[1],16)},${parseInt(m[2],16)},${parseInt(m[3],16)},${alpha})`
}

/* ───────── Canvas Mixin — shared drawing context ───────── */
function setupCanvas(el: HTMLElement, canvas: HTMLCanvasElement, height: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number, dpr: number) => void) {
  const obs = new ResizeObserver(() => {
    const rect = el.getBoundingClientRect()
    const dpr = devicePixelRatio
    canvas.width = rect.width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${height}px`
    const ctx = canvas.getContext('2d')
    if (ctx) { ctx.scale(dpr, dpr); draw(ctx, rect.width, height, dpr) }
  })
  obs.observe(el)
}

/* ───────── Bar Chart (grouped + stacked) ───────── */

export class DisplacerBarChart extends LitElement {
  static styles = css`:host{display:block}canvas{width:100%;display:block}`

  @property({ type: Array }) series: { label: string; values: number[]; color?: string }[] = []
  @property({ type: Array }) labels: string[] = []
  @property({ type: String }) mode: 'grouped' | 'stacked' = 'grouped'
  @property({ type: Number }) height = 200
  @property({ type: String }) color = 'var(--ds-primary, #b16286)'

  firstUpdated() {
    const canvas = this.shadowRoot!.querySelector('canvas')!
    setupCanvas(this, canvas, this.height, (ctx, w, h) => {
      const pad = { t: 20, r: 16, b: 32, l: 40 }
      const cw = w - pad.l - pad.r
      const ch = h - pad.t - pad.b
      const series = this.series.length ? this.series : [{ label: '', values: [0], color: this.color }]
      const n = Math.max(series[0]?.values.length || 1, this.labels.length || 1)
      const groupW = cw / n
      const barW = series.length > 1 ? groupW * 0.6 / series.length : groupW * 0.6
      const maxVal = this.mode === 'stacked'
        ? Math.max(...series[0].values.map((_, i) => series.reduce((s, ser) => s + (ser.values[i] || 0), 0)), 1)
        : Math.max(...series.flatMap(s => s.values), 1)

      // Grid lines
      ctx.strokeStyle = '#d5c4a1'; ctx.lineWidth = 0.5
      for (let i = 0; i <= 4; i++) {
        const y = pad.t + (ch / 4) * i
        ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke()
        ctx.fillStyle = '#7c6f64'; ctx.font = '10px Inter'; ctx.textAlign = 'right'
        ctx.fillText(((maxVal / 4) * (4 - i)).toFixed(0), pad.l - 6, y + 3)
      }

      // Bars
      series.forEach((ser, si) => {
        const color = ser.color || this.color
        ser.values.forEach((v, vi) => {
          const x = pad.l + vi * groupW + (groupW * 0.2)
          const bw = barW * 0.85
          const barH = (v / maxVal) * ch
          if (this.mode === 'stacked' && si > 0) {
            const base = series.slice(0, si).reduce((s, ss) => s + (ss.values[vi] || 0), 0)
            const baseH = (base / maxVal) * ch
            ctx.fillStyle = color
            ctx.fillRect(x + si * barW, pad.t + ch - baseH - barH, bw, barH)
          } else {
            ctx.fillStyle = color
            ctx.fillRect(x + si * barW, pad.t + ch - barH, bw, barH)
          }
        })
      })

      // Labels
      const lbls = this.labels.length ? this.labels : series[0]?.values.map((_, i) => `${i}`) || []
      ctx.fillStyle = '#7c6f64'; ctx.font = '10px Inter'; ctx.textAlign = 'center'
      lbls.forEach((l, i) => ctx.fillText(l, pad.l + i * groupW + groupW / 2, h - 8))
    })
  }

  render(): TemplateResult {
    return html`<canvas></canvas>`
  }
}
customElements.define('ds-bar-chart', DisplacerBarChart)

/* ───────── Scatter Plot ───────── */

export class DisplacerScatterPlot extends LitElement {
  static styles = css`:host{display:block}canvas{width:100%;display:block}`

  @property({ type: Array }) data: { x: number; y: number; r?: number; color?: string }[] = []
  @property({ type: Number }) height = 200
  @property({ type: String }) color = 'var(--ds-primary, #b16286)'

  firstUpdated() {
    const canvas = this.shadowRoot!.querySelector('canvas')!
    setupCanvas(this, canvas, this.height, (ctx, w, h) => {
      const pad = { t: 20, r: 16, b: 32, l: 40 }
      const cw = w - pad.l - pad.r; const ch = h - pad.t - pad.b
      const pts = this.data.length ? this.data : [{ x: 0, y: 0 }]
      const maxX = Math.max(...pts.map(p => p.x), 1)
      const maxY = Math.max(...pts.map(p => p.y), 1)

      // Grid
      ctx.strokeStyle = '#d5c4a1'; ctx.lineWidth = 0.5
      for (let i = 0; i <= 4; i++) {
        const y = pad.t + (ch / 4) * i
        ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke()
        ctx.fillStyle = '#7c6f64'; ctx.font = '10px Inter'; ctx.textAlign = 'right'
        ctx.fillText(((maxY / 4) * (4 - i)).toFixed(1), pad.l - 6, y + 3)
      }
      for (let i = 0; i <= 4; i++) {
        const x = pad.l + (cw / 4) * i
        ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, h - pad.b); ctx.stroke()
        ctx.fillStyle = '#7c6f64'; ctx.font = '10px Inter'; ctx.textAlign = 'center'
        ctx.fillText(((maxX / 4) * i).toFixed(1), x, h - 8)
      }

      // Points
      pts.forEach(p => {
        const cx = pad.l + (p.x / maxX) * cw
        const cy = pad.t + ch - (p.y / maxY) * ch
        const r = p.r || 4
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.fillStyle = p.color || this.color
        ctx.fill()
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1
        ctx.stroke()
      })
    })
  }

  render(): TemplateResult {
    return html`<canvas></canvas>`
  }
}
customElements.define('ds-scatter', DisplacerScatterPlot)

/* ───────── Heatmap ───────── */

export class DisplacerHeatmap extends LitElement {
  static styles = css`:host{display:block}canvas{width:100%;display:block}`

  @property({ type: Array }) data: number[][] = []
  @property({ type: Array }) xLabels: string[] = []
  @property({ type: Array }) yLabels: string[] = []
  @property({ type: Number }) height = 180

  firstUpdated() {
    const canvas = this.shadowRoot!.querySelector('canvas')!
    setupCanvas(this, canvas, this.height, (ctx, w, h) => {
      const data = this.data.length ? this.data : [[0]]
      const rows = data.length; const cols = data[0].length
      const cellW = (w - 32) / cols; const cellH = (h - 32) / rows
      const maxVal = Math.max(...data.flat(), 1)

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const v = data[r][c]
          const intensity = v / maxVal
          // Gradient from cool (blue/sapphire) to hot (ruby/citrine)
          const rv = Math.round(69 + intensity * (204 - 69))
          const gv = Math.round(133 + intensity * (36 - 133))
          const bv = Math.round(134 - intensity * (134 - 29))
          ctx.fillStyle = `rgb(${rv},${Math.max(gv, 0)},${Math.max(bv, 0)})`
          ctx.fillRect(16 + c * cellW, 16 + r * cellH, cellW - 1, cellH - 1)
        }
      }

      ctx.fillStyle = '#7c6f64'; ctx.font = '9px Inter'; ctx.textAlign = 'center'
      this.xLabels.forEach((l, i) => ctx.fillText(l, 16 + i * cellW + cellW / 2, h - 4))
      ctx.textAlign = 'right'
      this.yLabels.forEach((l, i) => ctx.fillText(l, 12, 16 + i * cellH + cellH / 2 + 3))
    })
  }

  render(): TemplateResult {
    return html`<canvas></canvas>`
  }
}
customElements.define('ds-heatmap', DisplacerHeatmap)

/* ───────── Realtime Stream Chart ───────── */

export class DisplacerStreamChart extends LitElement {
  static styles = css`:host{display:block;position:relative;height:120px}canvas{width:100%;height:100%;display:block}`

  @property({ type: Number }) maxPoints = 80
  @property({ type: Number }) min = 0
  @property({ type: Number }) max = 100
  @property({ type: String }) color = 'var(--ds-primary, #b16286)'
  @property({ type: String }) fillColor = 'rgba(177,98,134,0.08)'
  @property({ type: Number }) interval = 500

  private _data: number[] = []
  private _timer = 0

  connectedCallback() {
    super.connectedCallback()
    // Pre-fill with noise
    for (let i = 0; i < this.maxPoints; i++) this._data.push(this.min + Math.random() * (this.max - this.min) * 0.5)
  }

  firstUpdated() {
    const canvas = this.shadowRoot!.querySelector('canvas')!
    const draw = () => {
      const rect = this.getBoundingClientRect()
      const dpr = devicePixelRatio
      canvas.width = rect.width * dpr; canvas.height = rect.height * dpr
      canvas.style.width = `${rect.width}px`; canvas.style.height = `${rect.height}px`
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.scale(dpr, dpr)
      const w = rect.width; const h = rect.height
      ctx.clearRect(0, 0, w, h)

      const range = this.max - this.min || 1
      const color = getComputedStyle(this).getPropertyValue('--ds-primary').trim() || '#b16286'
      const fillC = this.fillColor

      // Grid
      ctx.strokeStyle = '#d5c4a1'; ctx.lineWidth = 0.5
      for (let i = 0; i <= 3; i++) {
        const y = (h / 3) * i; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
      }

      // Line
      ctx.beginPath()
      this._data.forEach((v, i) => {
        const x = (i / (this.maxPoints - 1)) * w
        const y = h - ((v - this.min) / range) * h
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      })
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke()

      // Fill
      const last = this._data.length - 1
      ctx.lineTo((last / (this.maxPoints - 1)) * w, h)
      ctx.lineTo(0, h); ctx.closePath()
      ctx.fillStyle = fillC; ctx.fill()
    }

    this._timer = window.setInterval(() => {
      this._data.push(this.min + Math.random() * (this.max - this.min))
      if (this._data.length > this.maxPoints) this._data.shift()
      draw()
    }, this.interval)

    draw()
    const obs = new ResizeObserver(() => draw())
    obs.observe(this)
  }

  disconnectedCallback() { super.disconnectedCallback(); clearInterval(this._timer) }

  render(): TemplateResult {
    return html`<canvas></canvas>`
  }
}
customElements.define('ds-stream-chart', DisplacerStreamChart)
