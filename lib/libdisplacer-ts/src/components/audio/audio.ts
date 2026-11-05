/**
 * Displacer — Audio controls
 *
 * Interactive primitives for audio / DSP tooling: a rotary knob, a linear
 * fader, a level meter, and an XY pad. These fill the gap the base component
 * set left for plugin-style UIs (mixers, synths, amp sims).
 *
 * Conventions (shared with the rest of Displacer):
 *   - Colours come from the `--ds-*` design tokens with sane fallbacks.
 *   - Interactive controls dispatch `ds-input` on every change, with
 *     `detail: { value }` (or `{ x, y }` for the XY pad), bubbling and
 *     composed so hosts can listen from the light DOM.
 */

import { LitElement, html, svg, css, type TemplateResult } from 'lit'
import { property } from 'lit/decorators.js'

export type AudioSize = 'sm' | 'md' | 'lg'
export type Orientation = 'vertical' | 'horizontal'

const SIZE_PX: Record<AudioSize, number> = { sm: 44, md: 60, lg: 80 }

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}

function quantize(v: number, min: number, max: number, step: number): number {
  if (step <= 0) return clamp(v, min, max)
  const snapped = min + Math.round((v - min) / step) * step
  return clamp(snapped, min, max)
}

/* ------------------------------------------------------------------ *
 * ds-knob — rotary control (drag vertically to change)
 * ------------------------------------------------------------------ */
export class DisplacerKnob extends LitElement {
  static styles = css`
    :host { display: inline-flex; flex-direction: column; align-items: center; gap: 4px;
      font-family: var(--ds-font-body, 'Inter', system-ui, sans-serif); user-select: none; }
    .dial { cursor: ns-resize; touch-action: none; display: block; }
    :host([disabled]) .dial { cursor: not-allowed; opacity: 0.45; }
    .track { stroke: var(--ds-border, #504945); }
    .fill  { stroke: var(--ds-primary, #b16286); }
    .pointer { stroke: var(--ds-fg-default, #ebdbb2); }
    .label { font-size: 0.72rem; color: var(--ds-fg-muted, #a89984); letter-spacing: .3px; }
    .value { font-size: 0.78rem; color: var(--ds-primary, #b16286);
      font-variant-numeric: tabular-nums; }
  `

  @property({ type: Number }) value = 0
  @property({ type: Number }) min = 0
  @property({ type: Number }) max = 1
  @property({ type: Number }) step = 0.001
  @property({ type: String }) label = ''
  @property({ type: String }) unit = ''
  @property({ type: String }) size: AudioSize = 'md'
  @property({ type: Boolean, reflect: true }) disabled = false

  private _dragging = false
  private _startY = 0
  private _startVal = 0

  private get _norm(): number {
    return this.max === this.min ? 0 : (this.value - this.min) / (this.max - this.min)
  }

  private _onDown(e: PointerEvent) {
    if (this.disabled) return
    this._dragging = true
    this._startY = e.clientY
    this._startVal = this.value
    ;(e.currentTarget as SVGElement).setPointerCapture(e.pointerId)
  }
  private _onMove(e: PointerEvent) {
    if (!this._dragging) return
    const span = this.max - this.min
    const dv = ((this._startY - e.clientY) / 160) * span
    const next = quantize(this._startVal + dv, this.min, this.max, this.step)
    if (next !== this.value) {
      this.value = next
      this.dispatchEvent(new CustomEvent('ds-input',
        { detail: { value: next }, bubbles: true, composed: true }))
    }
  }
  private _onUp() { this._dragging = false }

  private _fmt(): string {
    const v = this.value
    const digits = Math.abs(this.step) < 0.01 ? 2 : Math.abs(this.step) < 1 ? 2 : 0
    return (Number.isInteger(this.step) ? Math.round(v) : Number(v.toFixed(digits))) + (this.unit ? ' ' + this.unit : '')
  }

  render(): TemplateResult {
    const px = SIZE_PX[this.size]
    const c = px / 2, r = c - 6
    const a0 = -135, a1 = 135
    const ang = a0 + (a1 - a0) * this._norm
    const rad = (d: number) => (d - 90) * Math.PI / 180
    const pt = (d: number, rr: number) => `${c + rr * Math.cos(rad(d))},${c + rr * Math.sin(rad(d))}`
    const arc = (from: number, to: number) => {
      const large = Math.abs(to - from) > 180 ? 1 : 0
      return `M ${pt(from, r)} A ${r} ${r} 0 ${large} 1 ${pt(to, r)}`
    }
    return html`
      <svg class="dial" width="${px}" height="${px}" viewBox="0 0 ${px} ${px}"
           @pointerdown="${this._onDown}" @pointermove="${this._onMove}"
           @pointerup="${this._onUp}" @pointercancel="${this._onUp}">
        ${svg`
          <path class="track" d="${arc(a0, a1)}" fill="none" stroke-width="4" stroke-linecap="round"/>
          <path class="fill"  d="${arc(a0, ang)}" fill="none" stroke-width="4" stroke-linecap="round"/>
          <line class="pointer" x1="${c}" y1="${c}" x2="${pt(ang, r - 3).split(',')[0]}"
                y2="${pt(ang, r - 3).split(',')[1]}" stroke-width="2" stroke-linecap="round"/>
        `}
      </svg>
      ${this.label ? html`<span class="label">${this.label}</span>` : ''}
      <span class="value">${this._fmt()}</span>
    `
  }
}
customElements.define('ds-knob', DisplacerKnob)

/* ------------------------------------------------------------------ *
 * ds-fader — linear slider (custom track + thumb, pointer-driven)
 * ------------------------------------------------------------------ */
export class DisplacerFader extends LitElement {
  static styles = css`
    :host { display: inline-flex; font-family: var(--ds-font-body, 'Inter', system-ui, sans-serif);
      user-select: none; }
    .wrap { display: flex; gap: 8px; align-items: center; width: 100%; }
    .wrap.vertical { flex-direction: column; }
    .track { position: relative; background: var(--ds-border, #504945); border-radius: 999px;
      cursor: pointer; touch-action: none; }
    .wrap.horizontal .track { height: 5px; width: 100%; min-width: 80px; }
    .wrap.vertical .track { width: 5px; height: 120px; }
    .fill { position: absolute; background: var(--ds-primary, #b16286); border-radius: 999px; }
    .wrap.horizontal .fill { left: 0; top: 0; bottom: 0; }
    .wrap.vertical .fill { left: 0; right: 0; bottom: 0; }
    .thumb { position: absolute; width: 15px; height: 15px; border-radius: 50%;
      background: var(--ds-fg-default, #ebdbb2); box-shadow: 0 0 5px rgba(0,0,0,.4);
      transform: translate(-50%, -50%); }
    :host([disabled]) .track { cursor: not-allowed; opacity: 0.45; }
    .label { font-size: 0.72rem; color: var(--ds-fg-muted, #a89984); }
    .value { font-size: 0.72rem; color: var(--ds-primary, #b16286); font-variant-numeric: tabular-nums; }
  `

  @property({ type: Number }) value = 0
  @property({ type: Number }) min = 0
  @property({ type: Number }) max = 1
  @property({ type: Number }) step = 0.001
  @property({ type: String }) label = ''
  @property({ type: String }) unit = ''
  @property({ type: String }) orientation: Orientation = 'horizontal'
  @property({ type: Boolean, reflect: true }) disabled = false

  private get _norm(): number {
    return this.max === this.min ? 0 : clamp((this.value - this.min) / (this.max - this.min), 0, 1)
  }

  private _fromPointer(e: PointerEvent) {
    const track = this.renderRoot.querySelector('.track') as HTMLElement | null
    if (!track) return
    const rect = track.getBoundingClientRect()
    let n: number
    if (this.orientation === 'vertical') n = 1 - (e.clientY - rect.top) / rect.height
    else n = (e.clientX - rect.left) / rect.width
    const next = quantize(this.min + clamp(n, 0, 1) * (this.max - this.min), this.min, this.max, this.step)
    if (next !== this.value) {
      this.value = next
      this.dispatchEvent(new CustomEvent('ds-input',
        { detail: { value: next }, bubbles: true, composed: true }))
    }
  }
  private _dragging = false
  private _onDown(e: PointerEvent) {
    if (this.disabled) return
    this._dragging = true
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    this._fromPointer(e)
  }
  private _onMove(e: PointerEvent) { if (this._dragging) this._fromPointer(e) }
  private _onUp() { this._dragging = false }

  private _fmt(): string {
    const digits = Math.abs(this.step) < 0.01 ? 2 : Math.abs(this.step) < 1 ? 2 : 0
    return (Number.isInteger(this.step) ? Math.round(this.value) : Number(this.value.toFixed(digits)))
      + (this.unit ? ' ' + this.unit : '')
  }

  render(): TemplateResult {
    const n = this._norm
    const vertical = this.orientation === 'vertical'
    const fillStyle = vertical ? `height:${n * 100}%` : `width:${n * 100}%`
    const thumbStyle = vertical
      ? `left:50%; bottom:${n * 100}%; top:auto; transform:translate(-50%,50%)`
      : `left:${n * 100}%; top:50%`
    return html`
      <div class="wrap ${this.orientation}">
        ${this.label ? html`<span class="label">${this.label}</span>` : ''}
        <div class="track" @pointerdown="${this._onDown}" @pointermove="${this._onMove}"
             @pointerup="${this._onUp}" @pointercancel="${this._onUp}">
          <div class="fill" style="${fillStyle}"></div>
          <div class="thumb" style="${thumbStyle}"></div>
        </div>
        <span class="value">${this._fmt()}</span>
      </div>
    `
  }
}
customElements.define('ds-fader', DisplacerFader)

/* ------------------------------------------------------------------ *
 * ds-meter — level meter (display only), green -> amber -> red
 * ------------------------------------------------------------------ */
export class DisplacerMeter extends LitElement {
  static styles = css`
    :host { display: inline-block; font-family: var(--ds-font-body, 'Inter', system-ui, sans-serif); }
    .meter { position: relative; background: var(--ds-bg-surface-alt, #3c3836);
      border: 1px solid var(--ds-border, #504945); border-radius: 4px; overflow: hidden; }
    .meter.horizontal { width: 120px; height: 10px; }
    .meter.vertical { width: 10px; height: 120px; }
    .fill { position: absolute;
      background: linear-gradient(var(--grad-dir),
        var(--ds-success, #8ec07c) 0%,
        var(--ds-success, #8ec07c) 60%,
        var(--ds-warning, #fabd2f) 82%,
        var(--ds-error, #fb4934) 100%); }
    .meter.horizontal .fill { left: 0; top: 0; bottom: 0; --grad-dir: 90deg; }
    .meter.vertical .fill { left: 0; right: 0; bottom: 0; --grad-dir: 0deg; }
    .peak { position: absolute; background: var(--ds-fg-default, #ebdbb2); opacity: .9; }
    .meter.horizontal .peak { top: 0; bottom: 0; width: 2px; }
    .meter.vertical .peak { left: 0; right: 0; height: 2px; }
  `

  @property({ type: Number }) value = 0   // 0..1
  @property({ type: Number }) peak = -1    // 0..1, <0 hides
  @property({ type: String }) orientation: Orientation = 'vertical'

  render(): TemplateResult {
    const v = clamp(this.value, 0, 1) * 100
    const p = clamp(this.peak, 0, 1) * 100
    const vertical = this.orientation === 'vertical'
    const fillStyle = vertical ? `height:${v}%` : `width:${v}%`
    const peakStyle = vertical ? `bottom:${p}%` : `left:${p}%`
    return html`
      <div class="meter ${this.orientation}">
        <div class="fill" style="${fillStyle}"></div>
        ${this.peak >= 0 ? html`<div class="peak" style="${peakStyle}"></div>` : ''}
      </div>
    `
  }
}
customElements.define('ds-meter', DisplacerMeter)

/* ------------------------------------------------------------------ *
 * ds-xy-pad — 2D positioner, emits x,y in [0,1] (y up)
 * ------------------------------------------------------------------ */
export class DisplacerXYPad extends LitElement {
  static styles = css`
    :host { display: inline-block; font-family: var(--ds-font-body, 'Inter', system-ui, sans-serif); }
    .pad { position: relative; aspect-ratio: 1; width: var(--pad-size, 160px);
      background: radial-gradient(circle at 50% 50%, var(--ds-bg-surface, #282828), var(--ds-bg-page, #1d2021));
      border: 1px solid var(--ds-border, #504945); border-radius: 8px;
      cursor: crosshair; touch-action: none; overflow: hidden; }
    .grid { position: absolute; inset: 0; pointer-events: none; }
    .grid line { stroke: var(--ds-border-muted, #3c3836); }
    .handle { position: absolute; width: 16px; height: 16px; border-radius: 50%;
      background: var(--ds-accent, #d65d0e); box-shadow: 0 0 8px var(--ds-accent, #d65d0e);
      transform: translate(-50%, -50%); pointer-events: none; }
  `

  @property({ type: Number }) x = 0.5
  @property({ type: Number }) y = 0.5
  @property({ type: Boolean }) grid = true

  private _dragging = false
  private _emit(e: PointerEvent) {
    const pad = this.renderRoot.querySelector('.pad') as HTMLElement | null
    if (!pad) return
    const rect = pad.getBoundingClientRect()
    const nx = clamp((e.clientX - rect.left) / rect.width, 0, 1)
    const ny = clamp(1 - (e.clientY - rect.top) / rect.height, 0, 1)
    this.x = nx; this.y = ny
    this.dispatchEvent(new CustomEvent('ds-input',
      { detail: { x: nx, y: ny }, bubbles: true, composed: true }))
  }
  private _onDown(e: PointerEvent) {
    this._dragging = true
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    this._emit(e)
  }
  private _onMove(e: PointerEvent) { if (this._dragging) this._emit(e) }
  private _onUp() { this._dragging = false }

  render(): TemplateResult {
    const left = clamp(this.x, 0, 1) * 100
    const top = (1 - clamp(this.y, 0, 1)) * 100
    return html`
      <div class="pad" @pointerdown="${this._onDown}" @pointermove="${this._onMove}"
           @pointerup="${this._onUp}" @pointercancel="${this._onUp}">
        ${this.grid ? html`<svg class="grid" viewBox="0 0 100 100" preserveAspectRatio="none">
          ${svg`<line x1="50" y1="0" x2="50" y2="100" stroke-width="0.5"/>
                <line x1="0" y1="50" x2="100" y2="50" stroke-width="0.5"/>`}
        </svg>` : ''}
        <div class="handle" style="left:${left}%; top:${top}%"></div>
      </div>
    `
  }
}
customElements.define('ds-xy-pad', DisplacerXYPad)
