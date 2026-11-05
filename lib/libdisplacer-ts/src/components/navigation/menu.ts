import { LitElement, html, css, type TemplateResult } from 'lit'
import { property, state } from 'lit/decorators.js'

/* ───────── Menu / Dropdown ───────── */

export class DisplacerMenu extends LitElement {
  static styles = css`
    :host { display: inline-block; position: relative; }
    .trigger { cursor: pointer; }
    .dropdown {
      position: absolute; top: 100%; left: 0; margin-top: 4px;
      min-width: 160px; z-index: 500;
      background: var(--ds-bg-raised, #f9f5d7);
      border: 1.5px solid var(--ds-border, #bdae93);
      border-radius: 8px; padding: 4px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.1);
      font-family: 'Inter', system-ui, sans-serif;
    }
    .dropdown.right { left: auto; right: 0; }
    :host { --ds-menu-open: 0; }
    .dropdown { display: none; }
    :host([open]) .dropdown { display: block; }
    @media (prefers-reduced-motion: no-preference) {
      .dropdown { animation: menuIn 0.12s ease; }
    }
    @keyframes menuIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
  `

  @property({ type: Boolean, reflect: true }) open = false
  @property({ type: String }) align: 'left' | 'right' = 'left'

  render(): TemplateResult {
    return html`
      <div class="trigger" @click="${() => { this.open = !this.open; if (this.open) this.dispatchEvent(new CustomEvent('open')); }}">
        <slot name="trigger"></slot>
      </div>
      <div class="dropdown ${this.align === 'right' ? 'right' : ''}" @click="${() => this.dispatchEvent(new CustomEvent('close'))}">
        <slot></slot>
      </div>`
  }

  connectedCallback() {
    super.connectedCallback()
    this._onOutside = (e: MouseEvent) => {
      if (this.open && !e.composedPath().includes(this)) { this.open = false }
    }
    document.addEventListener('click', this._onOutside as EventListener)
  }

  disconnectedCallback() { super.disconnectedCallback(); document.removeEventListener('click', this._onOutside as EventListener) }
  private _onOutside: ((e: MouseEvent) => void) | null = null
}
customElements.define('ds-menu', DisplacerMenu)

export class DisplacerMenuItem extends LitElement {
  static styles = css`
    :host { display: flex; }
    .item {
      flex: 1; display: flex; align-items: center; gap: 8px;
      padding: 6px 10px; border-radius: 6px; font-size: 0.8rem;
      cursor: pointer; transition: background 0.1s;
      font-family: 'Inter', system-ui, sans-serif;
      color: var(--ds-fg-default, #3c3836);
    }
    .item:hover { background: rgba(177,98,134,0.08); color: var(--ds-primary, #b16286); }
    .item.danger:hover { background: rgba(204,36,29,0.08); color: #cc241d; }
    .item .icon { width: 16px; text-align: center; flex-shrink: 0; }
    .item .shortcut { margin-left: auto; font-size: 0.65rem; color: var(--ds-fg-muted, #7c6f64); font-family: 'JetBrains Mono', monospace; }
    .divider { height: 1px; background: var(--ds-border-muted, #d5c4a1); margin: 4px 8px; }
  `
  @property({ type: Boolean }) danger = false
  @property({ type: String }) shortcut = ''

  render(): TemplateResult {
    return html`
      <div class="item ${this.danger ? 'danger' : ''}">
        <span class="icon"><slot name="icon"></slot></span>
        <slot></slot>
        ${this.shortcut ? html`<span class="shortcut">${this.shortcut}</span>` : ''}
      </div>`
  }
}
customElements.define('ds-menu-item', DisplacerMenuItem)

/* ───────── View (generic container with title bar) ───────── */

export class DisplacerView extends LitElement {
  static styles = css`
    :host { display: flex; flex-direction: column; width: 100%; height: 100%; overflow: hidden; }
    .title-bar {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 12px; min-height: 36px;
      background: var(--ds-bg-surface, #ebdbb2);
      border-bottom: 1.5px solid var(--ds-border, #bdae93);
      font-family: 'Inter', system-ui, sans-serif;
    }
    .title-bar .icon { font-size: 1rem; }
    .title-bar .label { font-weight: 600; font-size: 0.8rem; }
    .title-bar .actions { margin-left: auto; display: flex; gap: 4px; }
    .title-bar .btn {
      background: none; border: none; cursor: pointer; padding: 2px 6px;
      border-radius: 4px; font-size: 0.75rem; color: var(--ds-fg-muted, #7c6f64);
    }
    .title-bar .btn:hover { background: rgba(177,98,134,0.08); color: var(--ds-primary, #b16286); }
    .content { flex: 1; overflow: auto; padding: 12px; }
  `
  @property({ type: String }) label = ''
  @property({ type: String }) icon = ''

  render(): TemplateResult {
    return html`
      <div class="title-bar">
        ${this.icon ? html`<span class="icon">${this.icon}</span>` : ''}
        <span class="label">${this.label}</span>
        <div class="actions"><slot name="actions"></slot></div>
      </div>
      <div class="content"><slot></slot></div>`
  }
}
customElements.define('ds-view', DisplacerView)
