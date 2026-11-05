import { LitElement, html, css, type TemplateResult } from 'lit'
import { property, state } from 'lit/decorators.js'

export type ToastVariant = 'info' | 'success' | 'warning' | 'error'
export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'

export class DisplacerToast extends LitElement {
  static styles = css`
    :host { display: block; }
    .toast {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 16px; border-radius: 8px;
      border: 1.5px solid;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 0.8rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      animation: slideIn 0.2s ease;
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .toast.info { background: rgba(69,133,134,0.1); border-color: #458588; color: var(--ds-fg-default, #3c3836); }
    .toast.success { background: rgba(104,157,106,0.1); border-color: #689d6a; color: var(--ds-fg-default, #3c3836); }
    .toast.warning { background: rgba(215,153,33,0.1); border-color: #d79921; color: var(--ds-fg-default, #3c3836); }
    .toast.error { background: rgba(204,36,29,0.1); border-color: #cc241d; color: #cc241d; }
    .icon { font-size: 1rem; flex-shrink: 0; }
    .msg { flex: 1; }
    .close {
      background: none; border: none; cursor: pointer;
      font-size: 0.8rem; color: inherit; opacity: 0.5; padding: 2px;
      border-radius: 4px; transition: opacity 0.15s;
    }
    .close:hover { opacity: 1; background: rgba(0,0,0,0.05); }
  `

  @property({ type: String }) variant: ToastVariant = 'info'
  @property({ type: String }) message = ''
  @property({ type: Number }) duration = 0
  @property({ type: Boolean }) closable = true
  @state() private visible = true

  private _iconMap: Record<ToastVariant, string> = {
    info: 'ℹ', success: '✓', warning: '⚠', error: '✕'
  }

  connectedCallback() {
    super.connectedCallback()
    if (this.duration > 0) {
      setTimeout(() => { this.visible = false; this.dispatchEvent(new CustomEvent('dismiss')) }, this.duration)
    }
  }

  render(): TemplateResult {
    if (!this.visible) return html``
    return html`
      <div class="toast ${this.variant}" role="alert">
        <span class="icon">${this._iconMap[this.variant]}</span>
        <span class="msg">${this.message}<slot></slot></span>
        ${this.closable ? html`<button class="close" @click="${() => { this.visible = false; this.dispatchEvent(new CustomEvent('dismiss')) }}">✕</button>` : ''}
      </div>`
  }
}
customElements.define('ds-toast', DisplacerToast)
