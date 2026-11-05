import { LitElement, html, css, type TemplateResult } from 'lit'
import { property } from 'lit/decorators.js'

export interface ModelOption {
  id: string
  loaded: boolean
  size?: string
  quant?: string
  /**
   * The model is currently being brought up. Local weights are routinely tens of
   * gigabytes, so a swap can take minutes — without this the selector looks frozen
   * and users click again, queueing a second load.
   */
  loading?: boolean
  /** Load failed; surfaced in-place so the reason isn't lost to a toast. */
  error?: string
}

export class DisplacerModelSelector extends LitElement {
  static styles = css`
    :host { display: inline-flex; align-items: center; gap: 8px; font-family: var(--ds-font, inherit); }
    .current {
      display: flex; align-items: center; gap: 6px; padding: 4px 10px;
      border-radius: 8px; cursor: pointer; font-size: 0.75rem;
      background: var(--ds-bg-surface, #282828); color: var(--ds-fg-default, #ebdbb2);
      border: 1px solid var(--ds-border, #504945); white-space: nowrap;
      user-select: none; transition: border-color .15s;
    }
    .current:hover { border-color: var(--ds-primary, #b16286); }
    .current .dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
    .current .dot.loaded { background: var(--ds-success, #689d6a); }
    .current .dot.unloaded { background: var(--ds-fg-subtle, #7c6f64); }
    .current .dot.loading, .dropdown .opt .o-dot.loading {
      background: var(--ds-warning, #d79921);
      animation: ds-ms-pulse 1s ease-in-out infinite;
    }
    .current .dot.error, .dropdown .opt .o-dot.error { background: var(--ds-danger, #cc241d); }
    @keyframes ds-ms-pulse { 0%,100% { opacity: 1 } 50% { opacity: .25 } }
    @media (prefers-reduced-motion: reduce) {
      .current .dot.loading, .dropdown .opt .o-dot.loading { animation: none; opacity: .6 }
    }
    .dropdown .opt.busy { opacity: .7; cursor: progress; }
    .dropdown .opt .o-err { margin-left: auto; font-size: 0.6rem; color: var(--ds-danger, #cc241d); }
    .current .chevron { font-size: 0.6rem; color: var(--ds-fg-muted, #a89984); margin-left: 4px; }
    .dropdown {
      display: none; position: absolute; top: 100%; left: 0; min-width: 220px;
      background: var(--ds-bg-surface, #282828); border: 1px solid var(--ds-border, #504945);
      border-radius: 8px; margin-top: 4px; z-index: 50; overflow: hidden;
      box-shadow: 0 8px 24px rgba(0,0,0,.3);
    }
    .dropdown.open { display: block; }
    .wrapper { position: relative; }
    .dropdown .opt {
      padding: 8px 12px; cursor: pointer; font-size: 0.75rem; color: var(--ds-fg-default, #ebdbb2);
      display: flex; align-items: center; gap: 8px; transition: background .1s;
    }
    .dropdown .opt:hover { background: var(--ds-bg-input, #32302f); }
    .dropdown .opt.active { color: var(--ds-primary, #b16286); font-weight: 600; }
    .dropdown .opt .o-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
    .dropdown .opt .o-dot.loaded { background: var(--ds-success, #689d6a); }
    .dropdown .opt .o-dot.unloaded { background: var(--ds-fg-subtle, #7c6f64); }
    .dropdown .opt .o-meta { margin-left: auto; font-size: 0.65rem; color: var(--ds-fg-muted, #a89984); }
    .dropdown .section { font-size: 0.6rem; text-transform: uppercase; letter-spacing: .5px; color: var(--ds-fg-subtle, #7c6f64); padding: 8px 12px 2px; }
    .load-mode {
      display: flex; gap: 4px; padding: 4px 8px 8px; border-top: 1px solid var(--ds-border, #504945); margin-top: 4px;
    }
    .load-mode button {
      flex: 1; padding: 4px 8px; border-radius: 6px; border: 1px solid var(--ds-border, #504945);
      background: none; color: var(--ds-fg-muted, #a89984); cursor: pointer;
      font-size: 0.65rem; font-family: inherit;
    }
    .load-mode button.active { background: var(--ds-primary, #b16286); color: var(--ds-bg, #1d2021); border-color: var(--ds-primary, #b16286); }
  `

  @property({ type: Array }) models: ModelOption[] = []
  @property({ type: String }) selected = ''
  @property({ type: String }) mode: 'swap' | 'multi' = 'swap'

  private _open = false

  connectedCallback() {
    super.connectedCallback()
    document.addEventListener('click', this._close)
  }
  disconnectedCallback() {
    super.disconnectedCallback()
    document.removeEventListener('click', this._close)
  }
  private _close = (e: Event) => {
    if (!this.contains(e.target as Node)) { this._open = false; this.requestUpdate() }
  }

  render(): TemplateResult {
    const current = this.models.find(m => m.id === this.selected)
    const loaded = this.models.filter(m => m.loaded && !m.loading)
    const unloaded = this.models.filter(m => !m.loaded && !m.loading)
    const loading = this.models.filter(m => m.loading)
    const dotClass = (m?: ModelOption) =>
      m?.loading ? 'loading' : m?.error ? 'error' : m?.loaded ? 'loaded' : 'unloaded'

    return html`
      <div class="wrapper">
        <div class="current" @click=${(e: Event) => { e.stopPropagation(); this._open = !this._open; this.requestUpdate(); }}>
          <span class="dot ${dotClass(current)}"></span>
          ${current?.id || 'No model'}${current?.loading ? ' — loading…' : ''}
          <span class="chevron">▾</span>
        </div>
        <div class="dropdown ${this._open ? 'open' : ''}">
          ${loading.length > 0 ? html`<div class="section">Loading</div>` : ''}
          ${loading.map(m => html`
            <div class="opt busy" aria-busy="true">
              <span class="o-dot loading"></span> ${m.id}
              <span class="o-meta">loading…</span>
            </div>
          `)}
          ${loaded.length > 0 ? html`<div class="section">Loaded (${loaded.length})</div>` : ''}
          ${loaded.map(m => html`
            <div class="opt ${m.id === this.selected ? 'active' : ''}" @click=${() => this._select(m.id)}>
              <span class="o-dot loaded"></span> ${m.id}
              ${m.size ? html`<span class="o-meta">${m.size}</span>` : ''}
            </div>
          `)}
          ${unloaded.length > 0 ? html`<div class="section">Available</div>` : ''}
          ${unloaded.map(m => html`
            <div class="opt" @click=${() => this._select(m.id)} title=${m.error ?? ''}>
              <span class="o-dot ${m.error ? 'error' : 'unloaded'}"></span> ${m.id}
              ${m.quant ? html`<span class="o-meta">${m.quant}</span>` : ''}
              ${m.size ? html`<span class="o-meta">${m.size}</span>` : ''}
              ${m.error ? html`<span class="o-err">failed</span>` : ''}
            </div>
          `)}
          <div class="load-mode">
            <button class="${this.mode === 'swap' ? 'active' : ''}" @click=${() => this._setMode('swap')}>Swap</button>
            <button class="${this.mode === 'multi' ? 'active' : ''}" @click=${() => this._setMode('multi')}>Multi</button>
          </div>
        </div>
      </div>
    `
  }

  private _select(id: string) {
    // Ignore clicks while any load is in flight. Loading a 30 GB model takes minutes,
    // and a second request mid-load either queues another swap or races the first.
    if (this.models.some(m => m.loading)) return
    if (id === this.selected) { this._open = false; this.requestUpdate(); return }
    this.selected = id
    this._open = false
    this.requestUpdate()
    this.dispatchEvent(new CustomEvent('model-change', { detail: { id, mode: this.mode }, bubbles: true, composed: true }))
  }

  private _setMode(mode: 'swap' | 'multi') {
    this.mode = mode
    this.requestUpdate()
  }
}

customElements.define('ds-model-selector', DisplacerModelSelector)

declare global {
  interface HTMLElementTagNameMap {
    'ds-model-selector': DisplacerModelSelector
  }
}
