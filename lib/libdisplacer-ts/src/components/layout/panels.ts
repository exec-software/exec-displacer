import { LitElement, html, css, type TemplateResult } from 'lit'
import { property, state } from 'lit/decorators.js'

export class DisplacerTabs extends LitElement {
  static styles = css`
    :host { display: flex; flex-direction: column; width: 100%; }
    .tab-bar {
      display: flex; gap: 0; border-bottom: 1.5px solid var(--ds-border, #bdae93);
      overflow-x: auto; scrollbar-width: none;
    }
    .tab {
      padding: 8px 16px; font-size: 0.8rem; cursor: pointer; white-space: nowrap;
      color: var(--ds-fg-muted, #7c6f64); border-bottom: 2px solid transparent;
      transition: all 0.15s; font-family: 'Inter', system-ui, sans-serif;
      display: flex; align-items: center; gap: 6px;
    }
    .tab:hover { color: var(--ds-fg-default, #3c3836); background: rgba(177,98,134,0.04); }
    .tab.active { color: var(--ds-primary, #b16286); border-bottom-color: var(--ds-primary, #b16286); font-weight: 600; }
    .tab .close {
      width: 16px; height: 16px; border: none; background: none; cursor: pointer;
      font-size: 0.6rem; border-radius: 50%; display: flex; align-items: center; justify-content: center;
      color: var(--ds-fg-muted, #7c6f64); opacity: 0; padding: 0;
    }
    .tab:hover .close { opacity: 1; }
    .tab .close:hover { background: rgba(0,0,0,0.1); color: #cc241d; }
    .panel { padding: 16px 0; }
  `
  @property({ type: Number }) activeIndex = 0
  @property({ type: Array }) tabs: { label: string; closable?: boolean }[] = []
  @state() private panelSlot = ''

  render(): TemplateResult {
    return html`
      <div class="tab-bar">
        ${this.tabs.map((tab, i) => html`
          <div class="tab ${i === this.activeIndex ? 'active' : ''}" 
               @click="${() => { this.activeIndex = i; this.dispatchEvent(new CustomEvent('tab-change', {detail: {index: i}})) }}">
            ${tab.label}
            ${tab.closable ? html`<button class="close" @click="${(e: Event) => { e.stopPropagation(); this.dispatchEvent(new CustomEvent('tab-close', {detail: {index: i}})) }}">✕</button>` : ''}
          </div>`)}
      </div>
      <div class="panel"><slot></slot></div>`
  }
}
customElements.define('ds-tabs', DisplacerTabs)

/* ───────── Split Pane ───────── */

export class DisplacerSplitPane extends LitElement {
  static styles = css`
    :host { display: flex; width: 100%; height: 100%; }
    .pane { overflow: auto; }
    .divider {
      flex-shrink: 0; cursor: col-resize;
      background: var(--ds-border, #bdae93);
      transition: background 0.15s; position: relative;
    }
    .divider:hover, .divider:active { background: var(--ds-primary, #b16286); }
    .row { flex-direction: row; } .col { flex-direction: column; }
    .row .divider { width: 4px; cursor: col-resize; }
    .col .divider { height: 4px; cursor: row-resize; }
  `
  @property({ type: String }) direction: 'row' | 'col' = 'row'
  @property({ type: Number }) split = 50

  render(): TemplateResult {
    return html`
      <div class="${this.direction}" style="display:flex;width:100%;height:100%;">
        <div class="pane" style="flex:${this.split}"><slot name="first"></slot></div>
        <div class="divider" @mousedown="${this._startDrag}"></div>
        <div class="pane" style="flex:${100 - this.split}"><slot name="second"></slot></div>
      </div>`
  }

  private _startDrag(e: MouseEvent) {
    const start = e[this.direction === 'row' ? 'clientX' : 'clientY']
    const startSplit = this.split
    const onMove = (ev: MouseEvent) => {
      const delta = ev[this.direction === 'row' ? 'clientX' : 'clientY'] - start
      const parent = (this.shadowRoot!.querySelector('.divider')!.parentElement!)
      const total = parent[this.direction === 'row' ? 'offsetWidth' : 'offsetHeight']
      this.split = Math.max(10, Math.min(90, startSplit + (delta / total) * 100))
    }
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }
}
customElements.define('ds-split-pane', DisplacerSplitPane)

/* ───────── Album Art View ───────── */

export class DisplacerAlbumView extends LitElement {
  static styles = css`
    :host { display: block; width: 100%; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(var(--item-size, 120px), 1fr));
      gap: 8px;
    }
    .item {
      aspect-ratio: 1; border-radius: 8px; overflow: hidden;
      background: var(--ds-bg-surface-alt, #d5c4a1);
      border: 1.5px solid var(--ds-border, #bdae93);
      cursor: pointer; transition: transform 0.15s, box-shadow 0.15s;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      position: relative;
    }
    .item:hover { transform: scale(1.03); box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
    .item .art {
      width: 100%; height: 100%; object-fit: cover;
      display: flex; align-items: center; justify-content: center;
      font-size: 2rem;
    }
    .item .label {
      position: absolute; bottom: 0; left: 0; right: 0;
      padding: 4px 8px; font-size: 0.65rem; font-weight: 500;
      background: linear-gradient(transparent, rgba(0,0,0,0.6));
      color: #fff; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;
    }
  `
  @property({ type: Number }) itemSize = 120

  render(): TemplateResult {
    return html`<div class="grid" style="--item-size: ${this.itemSize}px"><slot></slot></div>`
  }
}
customElements.define('ds-album-view', DisplacerAlbumView)
