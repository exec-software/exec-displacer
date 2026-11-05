import { LitElement, html, css, type TemplateResult } from 'lit'
import { property } from 'lit/decorators.js'

export type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen'

export class DisplacerDialog extends LitElement {
  static styles = css`
    :host { display: contents; }
    .backdrop {
      position: fixed; inset: 0; z-index: 1000;
      background: rgba(0,0,0,0.6);
      display: flex; align-items: center; justify-content: center;
      opacity: 0; visibility: hidden;
      transition: opacity 0.2s ease, visibility 0.2s ease;
      backdrop-filter: blur(2px);
    }
    .backdrop.open { opacity: 1; visibility: visible; }
    .dialog {
      background: var(--ds-bg-raised, #f9f5d7);
      border: 1.5px solid var(--ds-border, #bdae93);
      border-radius: 12px;
      box-shadow: 0 16px 48px rgba(0,0,0,0.15);
      display: flex; flex-direction: column;
      max-height: 80vh;
      transform: scale(0.95); transition: transform 0.2s ease;
      font-family: 'Inter', system-ui, sans-serif;
    }
    .backdrop.open .dialog { transform: scale(1); }
    .dialog-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px; border-bottom: 1.5px solid var(--ds-border, #bdae93);
    }
    .dialog-title { font-weight: 600; font-size: 1rem; }
    .dialog-close {
      width: 28px; height: 28px; border: none; background: transparent;
      cursor: pointer; border-radius: 6px; font-size: 1rem;
      display: flex; align-items: center; justify-content: center;
      color: var(--ds-fg-muted, #7c6f64); transition: all 0.15s;
    }
    .dialog-close:hover { background: rgba(177,98,134,0.1); color: var(--ds-primary, #b16286); }
    .dialog-body { padding: 20px; overflow-y: auto; flex: 1; font-size: 0.875rem; line-height: 1.5;
      scrollbar-width: thin; scrollbar-color: var(--ds-border, #bdae93) transparent; }
    .dialog-body::-webkit-scrollbar { width: 8px; }
    .dialog-body::-webkit-scrollbar-track { background: transparent; }
    .dialog-body::-webkit-scrollbar-thumb { background: var(--ds-border, #bdae93); border-radius: 4px; }
    .dialog-body::-webkit-scrollbar-thumb:hover { background: var(--ds-primary, #b16286); }
    .dialog-footer {
      display: flex; justify-content: flex-end; gap: 8px;
      padding: 12px 20px; border-top: 1.5px solid var(--ds-border, #bdae93);
    }
    .size-sm { width: 360px; } .size-md { width: 480px; } .size-lg { width: 640px; } .size-xl { width: 800px; }
    .size-fullscreen { width: 100vw; height: 100vh; max-height: 100vh; border-radius: 0; }
  `

  @property({ type: String }) size: DialogSize = 'md'
  @property({ type: Boolean }) open = false
  @property({ type: String }) title = 'Dialog'

  render(): TemplateResult {
    return html`
      <div class="backdrop ${this.open ? 'open' : ''}" @click="${this._onBackdropClick}">
        <div class="dialog size-${this.size}" @click="${(e: Event) => e.stopPropagation()}">
          <div class="dialog-header">
            <span class="dialog-title">${this.title}</span>
            <button class="dialog-close" @click="${this._close}" aria-label="Close dialog">✕</button>
          </div>
          <div class="dialog-body"><slot></slot></div>
          <div class="dialog-footer"><slot name="footer"></slot></div>
        </div>
      </div>
    `
  }

  private _close() { this.open = false; this.dispatchEvent(new CustomEvent('close')) }
  private _onBackdropClick(e: Event) {
    const target = e.target as HTMLElement
    if (target.classList.contains('backdrop')) this._close()
  }
}

customElements.define('ds-dialog', DisplacerDialog)
