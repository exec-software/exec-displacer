import { LitElement, html, css, type TemplateResult } from 'lit'
import { property, state } from 'lit/decorators.js'

export class DisplacerToolWindow extends LitElement {
  static styles = css`
    :host { display: flex; flex-direction: column; background: var(--ds-bg-surface, #ebdbb2); border: 1.5px solid var(--ds-border, #bdae93); border-radius: 8px; overflow: hidden; font-family: 'Inter', system-ui, sans-serif; }
    .titlebar {
      display: flex; align-items: center; gap: 8px; padding: 6px 10px;
      background: var(--ds-bg-surface-alt, #d5c4a1); border-bottom: 1.5px solid var(--ds-border, #bdae93);
      cursor: grab; user-select: none;
    }
    .titlebar:active { cursor: grabbing; }
    .titlebar .icon { font-size: 0.9rem; }
    .titlebar .label { font-size: 0.8rem; font-weight: 600; flex: 1; }
    .titlebar .btn {
      background: none; border: none; cursor: pointer; padding: 2px 6px; border-radius: 4px;
      font-size: 0.75rem; color: var(--ds-fg-muted, #7c6f64); display: flex; align-items: center;
    }
    .titlebar .btn:hover { background: rgba(177,98,134,0.1); color: var(--ds-primary, #b16286); }
    .titlebar .btn.close:hover { background: rgba(204,36,29,0.1); color: #cc241d; }
    .body { flex: 1; overflow: auto; padding: 12px; }
    .statusbar {
      display: flex; align-items: center; gap: 12px; padding: 3px 10px;
      background: var(--ds-bg-surface-alt, #d5c4a1); border-top: 1.5px solid var(--ds-border, #bdae93);
      font-size: 0.65rem; color: var(--ds-fg-muted, #7c6f64); min-height: 24px;
    }
  `
  @property({ type: String }) label = ''
  @property({ type: String }) icon = ''
  @property({ type: Boolean }) closable = false
  @property({ type: Boolean }) collapsible = false
  @state() private collapsed = false

  render(): TemplateResult {
    return html`
      <div class="titlebar">
        ${this.icon ? html`<span class="icon">${this.icon}</span>` : ''}
        <span class="label">${this.label}</span>
        <slot name="actions"></slot>
        ${this.collapsible ? html`<button class="btn" @click="${() => { this.collapsed = !this.collapsed; this.dispatchEvent(new CustomEvent(this.collapsed ? 'collapse' : 'expand')) }}">${this.collapsed ? '▸' : '▾'}</button>` : ''}
        ${this.closable ? html`<button class="btn close" @click="${() => this.dispatchEvent(new CustomEvent('close'))}">✕</button>` : ''}
      </div>
      ${!this.collapsed ? html`<div class="body"><slot></slot></div>` : ''}
      <slot name="statusbar"><div class="statusbar"><slot name="status"><slot></slot></div>
    `
  }
}
customElements.define('ds-tool-window', DisplacerToolWindow)
