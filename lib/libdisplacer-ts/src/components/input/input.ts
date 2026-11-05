import { LitElement, html, css, type TemplateResult } from 'lit'
import { property } from 'lit/decorators.js'

export type InputVariant = 'text' | 'search' | 'password'
export type InputSize = 'sm' | 'md' | 'lg' | 'xl'
export type InputStatus = 'default' | 'error' | 'success'

export class DisplacerInput extends LitElement {
  static styles = css`
    :host { display: inline-block; width: 100%; }
    .wrapper { display: flex; flex-direction: column; gap: 4px; }
    label {
      font-size: 0.8rem; font-weight: 500;
      color: var(--ds-fg-default, #3c3836);
    }
    .input-row { position: relative; display: flex; align-items: center; }
    .input-row .icon {
      position: absolute; left: 10px;
      width: 16px; height: 16px;
      color: var(--ds-fg-muted, #7c6f64);
      pointer-events: none;
    }
    input {
      width: 100%;
      font-family: 'Inter', system-ui, sans-serif;
      background: var(--ds-bg-surface, #ebdbb2);
      color: var(--ds-fg-default, #3c3836);
      border: 1.5px solid var(--ds-border, #bdae93);
      border-radius: 6px;
      outline: none;
      transition: all 0.15s ease;
    }
    input:focus { border-color: var(--ds-focus-ring, #b16286); box-shadow: 0 0 0 2px rgba(177,98,134,0.15); }
    input::placeholder { color: var(--ds-fg-muted, #7c6f64); opacity: 0.7; }
    .status-error input { border-color: #cc241d; }
    .status-error input:focus { box-shadow: 0 0 0 2px rgba(204,36,29,0.15); }
    .status-success input { border-color: #689d6a; }
    .hint { font-size: 0.75rem; color: var(--ds-fg-muted, #7c6f64); }
    .hint-error { color: #cc241d; }

    .size-sm input { height: 28px; padding: 0 10px; font-size: 0.75rem; }
    .size-md input { height: 36px; padding: 0 12px; font-size: 0.875rem; }
    .size-lg input { height: 44px; padding: 0 16px; font-size: 1rem; }
    .size-xl input { height: 52px; padding: 0 20px; font-size: 1.125rem; }
    .has-icon input { padding-left: 32px; }
  `

  @property({ type: String }) variant: InputVariant = 'text'
  @property({ type: String }) size: InputSize = 'md'
  @property({ type: String }) status: InputStatus = 'default'
  @property({ type: String }) label = ''
  @property({ type: String }) placeholder = ''
  @property({ type: String }) hint = ''
  @property({ type: String }) value = ''
  @property({ type: Boolean }) disabled = false

  private _onInput(e: Event) {
    this.value = (e.target as HTMLInputElement).value
    this.dispatchEvent(new CustomEvent('ds-input', { detail: { value: this.value } }))
  }

  private _onChange() {
    this.dispatchEvent(new CustomEvent('ds-change', { detail: { value: this.value } }))
  }

  render(): TemplateResult {
    const hasIcon = this.variant === 'search'
    return html`
      <div class="wrapper status-${this.status} size-${this.size}">
        ${this.label ? html`<label>${this.label}</label>` : ''}
        <div class="input-row">
          ${hasIcon ? html`<span class="icon">⌕</span>` : ''}
          <input
            class="${hasIcon ? 'has-icon' : ''}"
            type="${this.variant === 'password' ? 'password' : 'text'}"
            .value="${this.value}"
            placeholder="${this.placeholder}"
            ?disabled="${this.disabled}"
            @input="${this._onInput}"
            @change="${this._onChange}"
          />
        </div>
        ${this.hint ? html`<span class="hint ${this.status === 'error' ? 'hint-error' : ''}">${this.hint}</span>` : ''}
      </div>
    `
  }
}

customElements.define('ds-input', DisplacerInput)
