import { LitElement, html, css, type TemplateResult } from 'lit'
import { property } from 'lit/decorators.js'

export type NavVariant = 'sidebar' | 'topbar' | 'tabs'

export class DisplacerNav extends LitElement {
  static styles = css`
    :host { display: block; }

    /* Sidebar variant */
    .nav-sidebar {
      background: var(--ds-bg-surface, #282828); color: var(--ds-fg-default, #ebdbb2);
      padding: 8px; border-radius: 8px;
      width: 220px;
    }
    .nav-sidebar .nav-item {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 12px; border-radius: 6px;
      font-size: 0.875rem; color: var(--ds-fg-muted, #a89984);
      cursor: pointer; transition: all 0.15s;
      text-decoration: none;
    }
    .nav-sidebar .nav-item:hover { background: rgba(177,98,134,0.15); color: var(--ds-fg-default, #ebdbb2); }
    .nav-sidebar .nav-item.active { background: rgba(177,98,134,0.2); color: var(--ds-primary, #b16286); font-weight: 600; }
    .nav-sidebar .nav-item .icon { width: 18px; height: 18px; flex-shrink: 0; }
    .nav-sidebar .nav-item .badge {
      margin-left: auto;
      background: rgba(214,93,14,0.2); color: var(--ds-accent, #d65d0e);
      font-size: 0.65rem; padding: 1px 6px; border-radius: 10px;
    }
    .nav-sidebar .nav-section {
      font-size: 0.65rem; color: var(--ds-fg-muted, #7c6f64); text-transform: uppercase;
      letter-spacing: 0.05em; padding: 12px 12px 4px;
    }
    .nav-sidebar .nav-divider { height: 1px; background: var(--ds-border, #504945); margin: 8px 12px; }

    /* Topbar variant */
    .nav-topbar {
      display: flex; gap: 4px; padding: 4px;
      background: var(--ds-bg-surface, #ebdbb2);
      border: 1.5px solid var(--ds-border, #bdae93);
      border-radius: 8px;
    }
    ::slotted(.nav-item) {
      padding: 6px 14px; border-radius: 6px;
      font-size: 0.8rem; color: var(--ds-fg-muted, #7c6f64);
      cursor: pointer; transition: all 0.15s;
      display: inline-flex; align-items: center;
    }
    ::slotted(.nav-item:hover) { background: var(--ds-primary-muted, rgba(177,98,134,0.08)); color: var(--ds-primary, #b16286); }
    ::slotted(.nav-item.active) { background: var(--ds-primary, #b16286); color: #fbf1c7; border-radius: 6px; }

    /* Tabs variant */
    .nav-tabs {
      display: flex; gap: 0; border-bottom: 1.5px solid var(--ds-border, #bdae93);
    }
    .nav-tabs ::slotted(.nav-item) {
      padding: 8px 16px; font-size: 0.8rem;
      color: var(--ds-fg-muted, #7c6f64); cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.15s; margin-bottom: -1.5px;
    }
    .nav-tabs ::slotted(.nav-item:hover) { color: var(--ds-fg-default, #3c3836); }
    .nav-tabs ::slotted(.nav-item.active) { color: var(--ds-primary, #b16286); border-bottom-color: var(--ds-primary, #b16286); font-weight: 600; }
  `

  @property({ type: String }) variant: NavVariant = 'sidebar'
  @property({ type: Boolean}) collapsed = false

  render(): TemplateResult {
    return html`
      <nav class="nav-${this.variant}">
        <slot></slot>
      </nav>
    `
  }
}

customElements.define('ds-nav', DisplacerNav)

export class DisplacerNavItem extends LitElement {
  static styles = css`
    :host { display: block; }
    .item {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 12px; border-radius: 6px;
      font-size: 0.875rem; cursor: pointer; transition: all 0.15s;
      color: inherit; text-decoration: none;
    }
    .item:hover { background: rgba(177,98,134,0.15); color: var(--ds-fg-default, #ebdbb2); }
    .item.active { background: rgba(177,98,134,0.2); color: var(--ds-primary, #b16286); font-weight: 600; }
    .item.disabled { opacity: 0.5; cursor: not-allowed; }
    .badge {
      margin-left: auto;
      background: rgba(214,93,14,0.2); color: var(--ds-accent, #d65d0e);
      font-size: 0.65rem; padding: 1px 6px; border-radius: 10px;
    }
  `
  @property({ type: Boolean }) active = false
  @property({ type: Boolean }) disabled = false
  @property({ type: String }) href = ''
  @property({ type: String }) badge = ''

  render(): TemplateResult {
    return html`
      <a class="item ${this.active ? 'active' : ''} ${this.disabled ? 'disabled' : ''}"
         ?href="${this.href}" tabindex="${this.disabled ? -1 : 0}">
        <slot name="icon"></slot>
        <span><slot></slot></span>
        ${this.badge ? html`<span class="badge">${this.badge}</span>` : ''}
      </a>
    `
  }
}

customElements.define('ds-nav-item', DisplacerNavItem)

/* ───────── Toggle Group (multi-on pill strip) ─────────
   A strip of independently-toggleable pills for
   feature/layer/compute engagement (each pill on/off, not radio). Emits `ds-toggle`
   {id, on, states} on every click. Optional `master` pill toggles all. */

export class DisplacerToggleGroup extends LitElement {
  static styles = css`
    :host { display: inline-flex; align-items: center; gap: 4px; flex-wrap: wrap; }
    button { background: var(--ds-bg-surface, #ebdbb2); border: 1px solid var(--ds-border, #bdae93);
      color: var(--ds-fg-muted, #7c6f64); font: inherit; font-size: 0.68rem; padding: 3px 9px;
      border-radius: 999px; cursor: pointer; display: inline-flex; align-items: center; gap: 5px;
      transition: border-color 0.15s, color 0.15s; }
    button .dot { width: 7px; height: 7px; border-radius: 50%;
      background: var(--ds-fg-subtle, #a89984); transition: background 0.2s; }
    button.on { border-color: var(--ds-primary, #b16286); color: var(--ds-primary, #b16286); }
    button.on .dot { background: var(--ds-success, #689d6a); }
    .label { font-size: 0.62rem; color: var(--ds-fg-subtle, #a89984);
      text-transform: uppercase; letter-spacing: 0.05em; margin: 0 2px; }
  `
  /** options: [{id, label, on}] — each independently toggleable */
  @property({ type: Array }) options: Array<{ id: string; label: string; on?: boolean }> = []
  @property({ type: String }) label = ''
  @property({ type: Boolean }) master = false

  private _toggle(id: string) {
    const o = this.options.find(x => x.id === id); if (!o) return
    o.on = !o.on
    this.requestUpdate()
    this.dispatchEvent(new CustomEvent('ds-toggle', {
      detail: { id, on: o.on, states: Object.fromEntries(this.options.map(x => [x.id, !!x.on])) },
      bubbles: true, composed: true }))
  }
  private _toggleAll() {
    const allOn = this.options.every(o => o.on)
    this.options.forEach(o => { o.on = !allOn })
    this.requestUpdate()
    this.dispatchEvent(new CustomEvent('ds-toggle', {
      detail: { id: '*', on: !allOn, states: Object.fromEntries(this.options.map(x => [x.id, !!x.on])) },
      bubbles: true, composed: true }))
  }

  render(): TemplateResult {
    return html`
      ${this.label ? html`<span class="label">${this.label}</span>` : ''}
      ${this.options.map(o => html`
        <button class="${o.on ? 'on' : ''}" @click=${() => this._toggle(o.id)}>
          <span class="dot"></span>${o.label}</button>`)}
      ${this.master ? html`<button class="${this.options.every(o => o.on) ? 'on' : ''}"
        @click=${() => this._toggleAll()}><span class="dot"></span>all</button>` : ''}`
  }
}
customElements.define('ds-toggle-group', DisplacerToggleGroup)
