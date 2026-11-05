import { LitElement, html, css, type TemplateResult } from 'lit'
import { property } from 'lit/decorators.js'

/**
 * ds-float-window — a floating, draggable, resizable window that persists its geometry.
 *
 * Panels pop out into floating
 * windows that stay on top across views — the wide-monitor research workflow (keep live charts beside a chat).
 *
 *   <ds-float-window title="Phase Portrait" persist-key="attractor" x="80" y="90" width="420" height="320">
 *     ...any content...
 *   </ds-float-window>
 *
 * Attributes: title · x · y · width · height · persist-key (localStorage geometry) · closable
 * Events: ds-close (✕), ds-geometry (after drag/resize: {x,y,width,height})
 */
export class DisplacerFloatWindow extends LitElement {
  static styles = css`
    :host { position: fixed; z-index: 60; display: flex; flex-direction: column;
      min-width: 220px; min-height: 140px;
      background: var(--ds-bg-raised, #f9f5d7);
      border: 1.5px solid var(--ds-border, #bdae93); border-radius: 10px;
      box-shadow: 0 18px 50px rgba(60, 56, 54, 0.30); overflow: hidden;
      font-family: 'Inter', system-ui, sans-serif; }
    .bar { display: flex; align-items: center; gap: 8px; padding: 6px 10px; cursor: move; user-select: none;
      background: var(--ds-bg-surface, #ebdbb2); border-bottom: 1px solid var(--ds-border-muted, #d5c4a1);
      color: var(--ds-fg-default, #3c3836); font-weight: 600; font-size: 0.8rem; }
    .bar .t { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .bar button { background: none; border: 0; color: var(--ds-fg-muted, #7c6f64); cursor: pointer;
      font-size: 13px; padding: 2px 5px; border-radius: 4px; }
    .bar button:hover { color: var(--ds-fg-default, #3c3836); background: rgba(60, 56, 54, 0.08); }
    .body { flex: 1; overflow: auto; padding: 10px 12px; }
    .rz { position: absolute; right: 0; bottom: 0; width: 16px; height: 16px; cursor: nwse-resize;
      background: linear-gradient(135deg, transparent 50%, var(--ds-fg-subtle, #a89984) 50%,
        var(--ds-fg-subtle, #a89984) 60%, transparent 60%); }
  `

  @property({ type: String }) override title = 'Window'
  @property({ type: Number }) x = 80
  @property({ type: Number }) y = 80
  @property({ type: Number }) width = 420
  @property({ type: Number }) height = 320
  @property({ type: String, attribute: 'persist-key' }) persistKey = ''
  @property({ type: Boolean }) closable = true

  override connectedCallback(): void {
    super.connectedCallback()
    if (this.persistKey) {
      try {
        const s = JSON.parse(localStorage.getItem(`ds-float:${this.persistKey}`) || 'null')
        if (s) { this.x = s.x; this.y = s.y; this.width = s.width; this.height = s.height }
      } catch { /* fresh */ }
    }
    this.applyGeometry()
  }

  private applyGeometry(): void {
    this.style.left = `${this.x}px`; this.style.top = `${this.y}px`
    this.style.width = `${this.width}px`; this.style.height = `${this.height}px`
  }

  private save(): void {
    if (this.persistKey) {
      try {
        localStorage.setItem(`ds-float:${this.persistKey}`,
          JSON.stringify({ x: this.x, y: this.y, width: this.width, height: this.height }))
      } catch { /* full */ }
    }
    this.dispatchEvent(new CustomEvent('ds-geometry',
      { detail: { x: this.x, y: this.y, width: this.width, height: this.height } }))
  }

  private drag(e: PointerEvent, resize: boolean): void {
    const target = e.currentTarget as HTMLElement
    if ((e.target as HTMLElement).tagName === 'BUTTON') return
    e.preventDefault(); target.setPointerCapture(e.pointerId)
    const sx = e.clientX, sy = e.clientY
    const ox = this.x, oy = this.y, ow = this.width, oh = this.height
    const move = (ev: PointerEvent): void => {
      if (resize) { this.width = Math.max(220, ow + ev.clientX - sx); this.height = Math.max(140, oh + ev.clientY - sy) }
      else { this.x = Math.max(0, ox + ev.clientX - sx); this.y = Math.max(0, oy + ev.clientY - sy) }
      this.applyGeometry()
    }
    const up = (ev: PointerEvent): void => {
      target.releasePointerCapture(ev.pointerId)
      target.removeEventListener('pointermove', move); target.removeEventListener('pointerup', up)
      this.save()
    }
    target.addEventListener('pointermove', move); target.addEventListener('pointerup', up)
  }

  render(): TemplateResult {
    return html`
      <div class="bar" @pointerdown="${(e: PointerEvent) => this.drag(e, false)}">
        <span class="t">${this.title}</span>
        ${this.closable ? html`<button title="close" @click="${() => this.dispatchEvent(new CustomEvent('ds-close'))}">✕</button>` : ''}
      </div>
      <div class="body"><slot></slot></div>
      <div class="rz" @pointerdown="${(e: PointerEvent) => this.drag(e, true)}"></div>
    `
  }
}

customElements.define('ds-float-window', DisplacerFloatWindow)
